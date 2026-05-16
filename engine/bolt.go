package engine

import (
	"encoding/binary"
	"fmt"
	"path/filepath"
	"time"

	bolt "go.etcd.io/bbolt"
)

// BoltDB is the active bbolt database for binary collections. Self-contained
// single-file storage — no external service required.
var BoltDB *bolt.DB

// OpenBolt opens (or creates) the bbolt file at the given path.
// Call once at startup. Idempotent — subsequent calls return nil.
func OpenBolt(path string) error {
	if BoltDB != nil {
		return nil
	}
	absPath, _ := filepath.Abs(path)
	db, err := bolt.Open(absPath, 0600, &bolt.Options{Timeout: 5 * time.Second})
	if err != nil {
		return fmt.Errorf("bbolt open %s: %w", absPath, err)
	}
	BoltDB = db
	return nil
}

// CloseBolt closes the bbolt database. Safe to call when not open.
func CloseBolt() error {
	if BoltDB == nil {
		return nil
	}
	err := BoltDB.Close()
	BoltDB = nil
	return err
}

// ── Bucket naming ───────────────────────────────────────────────────────────

// mainBucketName returns the bucket name holding record blobs for a collection.
func mainBucketName(col string) []byte { return []byte(col) }

// indexBucketName returns the bucket name holding the secondary index on a
// specific field of a collection.
func indexBucketName(col, field string) []byte {
	return []byte(col + "__idx__" + field)
}

// lookupTablesBucketName holds serialized dynamic lookup tables per collection.
const lookupTablesBucket = "__binary_lookups__"

// ── Key / ID encoding ───────────────────────────────────────────────────────

// idToKey turns an auto-increment uint64 into an 8-byte big-endian key so
// records sort in insertion order.
func idToKey(id uint64) []byte {
	b := make([]byte, 8)
	binary.BigEndian.PutUint64(b, id)
	return b
}

// keyToID reverses idToKey.
func keyToID(k []byte) uint64 {
	if len(k) < 8 {
		return 0
	}
	return binary.BigEndian.Uint64(k)
}

// encodeIndexValue produces the byte representation used as the key inside an
// index bucket. Must match how values are coerced on insert.
//   - string/lookup fields → raw bytes of the string
//   - numeric fields (uint8/16/32/64) → 8 bytes big-endian so range scans work
//   - timestamp → 8 bytes big-endian Unix seconds
func encodeIndexValue(fieldType string, val interface{}) []byte {
	switch fieldType {
	case "uint8", "uint16", "uint32", "uint64":
		b := make([]byte, 8)
		binary.BigEndian.PutUint64(b, uint64(toInt(val)))
		return b
	case "timestamp":
		b := make([]byte, 8)
		binary.BigEndian.PutUint64(b, uint64(toTimestamp(val)))
		return b
	case "lookup", "lookup16":
		return []byte(fmt.Sprintf("%v", val))
	default:
		return []byte(fmt.Sprintf("%v", val))
	}
}

// ── ID list helpers (values stored inside index buckets) ────────────────────

// appendIDList appends id to an existing concatenated-uint64 list.
func appendIDList(existing []byte, id uint64) []byte {
	out := make([]byte, len(existing)+8)
	copy(out, existing)
	binary.BigEndian.PutUint64(out[len(existing):], id)
	return out
}

// parseIDList parses a concatenated-uint64 byte slice into a []uint64.
func parseIDList(b []byte) []uint64 {
	n := len(b) / 8
	ids := make([]uint64, n)
	for i := 0; i < n; i++ {
		ids[i] = binary.BigEndian.Uint64(b[i*8 : i*8+8])
	}
	return ids
}

// intersectIDs returns the intersection of two sorted-or-unsorted uint64 slices.
// For small lists (typical secondary-index hit counts) a map is fine.
func intersectIDs(a, b []uint64) []uint64 {
	if len(a) == 0 || len(b) == 0 {
		return nil
	}
	set := make(map[uint64]struct{}, len(a))
	for _, id := range a {
		set[id] = struct{}{}
	}
	out := make([]uint64, 0, len(b))
	for _, id := range b {
		if _, ok := set[id]; ok {
			out = append(out, id)
		}
	}
	return out
}
