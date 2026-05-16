package engine

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"time"

	bolt "go.etcd.io/bbolt"
)

const sessionCookieName = "cs_session"
const sessionBucket = "sessions"

// Session is stored in bbolt under the sessions bucket, keyed by session ID.
type Session struct {
	ID        string                 `json:"id"`
	Data      map[string]interface{} `json:"data"`
	ExpiresAt time.Time              `json:"expiresAt"`
}

func newSessionID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// GetSession reads the session from bbolt using the request cookie.
// Returns (nil, nil) when no cookie, no session, or session expired.
func GetSession(r *http.Request) (*Session, error) {
	if BoltDB == nil {
		return nil, nil
	}
	cookie, err := r.Cookie(sessionCookieName)
	if err != nil {
		return nil, nil
	}

	var sess *Session
	err = BoltDB.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(sessionBucket))
		if b == nil {
			return nil
		}
		raw := b.Get([]byte(cookie.Value))
		if raw == nil {
			return nil
		}
		var s Session
		if err := json.Unmarshal(raw, &s); err != nil {
			return err
		}
		if time.Now().After(s.ExpiresAt) {
			return nil // expired — treated as not found
		}
		sess = &s
		return nil
	})
	if err != nil {
		return nil, nil
	}
	return sess, nil
}

// CreateSession creates a new session in bbolt and sets the cookie.
func CreateSession(w http.ResponseWriter, data map[string]interface{}) (*Session, error) {
	if BoltDB == nil {
		return nil, nil
	}
	sess := &Session{
		ID:        newSessionID(),
		Data:      data,
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}
	raw, err := json.Marshal(sess)
	if err != nil {
		return nil, err
	}
	err = BoltDB.Update(func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte(sessionBucket))
		if err != nil {
			return err
		}
		return b.Put([]byte(sess.ID), raw)
	})
	if err != nil {
		return nil, err
	}

	GlobalFlight.Record("server", "session", DiagInfo, "session:create", sess.ID, sess.ID)

	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    sess.ID,
		HttpOnly: true,
		Path:     "/",
		MaxAge:   86400,
	})
	return sess, nil
}

// UpdateSession saves updated data back to an existing session.
func UpdateSession(sessID string, data map[string]interface{}) error {
	if BoltDB == nil {
		return nil
	}
	return BoltDB.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(sessionBucket))
		if b == nil {
			return nil
		}
		raw := b.Get([]byte(sessID))
		if raw == nil {
			return nil
		}
		var s Session
		if err := json.Unmarshal(raw, &s); err != nil {
			return err
		}
		s.Data = data
		newRaw, err := json.Marshal(&s)
		if err != nil {
			return err
		}
		if err := b.Put([]byte(sessID), newRaw); err != nil {
			return err
		}
		GlobalFlight.Record("server", "session", DiagInfo, "session:update", sessID, sessID)
		return nil
	})
}

// DestroySession deletes the session and clears the cookie.
func DestroySession(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(sessionCookieName)
	if err != nil {
		return
	}
	if BoltDB != nil {
		BoltDB.Update(func(tx *bolt.Tx) error {
			b := tx.Bucket([]byte(sessionBucket))
			if b == nil {
				return nil
			}
			return b.Delete([]byte(cookie.Value))
		})
	}
	GlobalFlight.Record("server", "session", DiagInfo, "session:destroy", cookie.Value, cookie.Value)

	http.SetCookie(w, &http.Cookie{
		Name:   sessionCookieName,
		Value:  "",
		MaxAge: -1,
		Path:   "/",
	})
}

// ClearAllSessions removes every session. Called on app exit.
func ClearAllSessions() {
	if BoltDB == nil {
		return
	}
	BoltDB.Update(func(tx *bolt.Tx) error {
		return tx.DeleteBucket([]byte(sessionBucket))
	})
}

// SweepExpiredSessions walks the session bucket and deletes any whose ExpiresAt
// is in the past. Called periodically (or at startup) — bbolt has no TTL.
func SweepExpiredSessions() int {
	if BoltDB == nil {
		return 0
	}
	var deleted int
	BoltDB.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(sessionBucket))
		if b == nil {
			return nil
		}
		var toDelete [][]byte
		now := time.Now()
		c := b.Cursor()
		for k, v := c.First(); k != nil; k, v = c.Next() {
			var s Session
			if err := json.Unmarshal(v, &s); err != nil {
				continue
			}
			if now.After(s.ExpiresAt) {
				cp := make([]byte, len(k))
				copy(cp, k)
				toDelete = append(toDelete, cp)
			}
		}
		for _, k := range toDelete {
			b.Delete(k)
			deleted++
		}
		return nil
	})
	return deleted
}
