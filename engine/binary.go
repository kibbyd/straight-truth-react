package engine

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	bolt "go.etcd.io/bbolt"
)

// ── Binary Schema Definition ────────────────────────────────────────────────

// BinarySchema defines how a collection's data is packed into binary.
// Loaded from JSON files in schemas/binary/*.json
type BinarySchema struct {
	Collection string        `json:"collection"`
	BinaryCol  string        `json:"binaryCollection"` // bucket name in bbolt
	Fields     []BinaryField `json:"fields"`
	// Runtime: built from schema at load time
	recordSize    int
	fieldIndex    map[string]int // field name → index in Fields
	indexFields   []string       // field names with index: true
	lookupMu      sync.RWMutex
	lookupTables  map[string][]string          // field name → [id]string
	reverseLookup map[string]map[string]uint32 // field name → string → id
}

// BinaryField defines a single field in the binary record.
type BinaryField struct {
	Name    string   `json:"name"`
	Type    string   `json:"type"`    // uint8, uint16, uint32, uint64, lookup, lookup16, timestamp
	Offset  int      `json:"offset"`  // byte offset in record (computed at load)
	Size    int      `json:"size"`    // byte size (computed from type)
	Values  []string `json:"values"`  // for lookup type: fixed value list
	Dynamic bool     `json:"dynamic"` // for lookup type: values built from data, not fixed
	Index   bool     `json:"index"`   // if true, a secondary bucket is maintained for this field
}

// ── Schema Registry ─────────────────────────────────────────────────────────

var (
	binarySchemas  = map[string]*BinarySchema{} // collection name → schema
	binarySchemaMu sync.RWMutex
)

// LoadBinarySchemas loads all binary schema definitions from a directory.
func LoadBinarySchemas(dir string) error {
	dirPath := strings.ReplaceAll(dir, "\\", "/")
	entries, err := ReadEmbedDir(dirPath)
	if err != nil {
		return nil // no schemas directory is fine
	}

	for _, entry := range entries {
		if entry.IsDir() || filepath.Ext(entry.Name()) != ".json" {
			continue
		}
		if entry.Name()[0] == '_' {
			continue // skip _example files
		}

		path := filepath.Join(dir, entry.Name())
		path = strings.ReplaceAll(path, "\\", "/")
		raw, err := ReadEmbedFile(path)
		if err != nil {
			return fmt.Errorf("reading %s: %w", path, err)
		}

		var schema BinarySchema
		if err := json.Unmarshal(raw, &schema); err != nil {
			return fmt.Errorf("parsing %s: %w", path, err)
		}

		schema.compile()

		// Restore dynamic lookup tables and ensure buckets exist
		if BoltDB != nil {
			schema.LoadLookupTables()
			schema.ensureBuckets()
		}

		binarySchemaMu.Lock()
		binarySchemas[schema.Collection] = &schema
		binarySchemaMu.Unlock()

		indexNote := ""
		if len(schema.indexFields) > 0 {
			indexNote = fmt.Sprintf(" indexed:[%s]", strings.Join(schema.indexFields, ","))
		}
		fmt.Printf("[binary] Loaded schema: %s → %s (%d fields, %d bytes/record%s)\n",
			schema.Collection, schema.BinaryCol, len(schema.Fields), schema.recordSize, indexNote)
	}

	return nil
}

// GetBinarySchema returns the binary schema for a collection, or nil.
func GetBinarySchema(collection string) *BinarySchema {
	binarySchemaMu.RLock()
	defer binarySchemaMu.RUnlock()
	return binarySchemas[collection]
}

// compile calculates offsets, sizes, and initializes lookup tables.
func (s *BinarySchema) compile() {
	s.fieldIndex = make(map[string]int)
	s.indexFields = nil
	s.lookupTables = make(map[string][]string)
	s.reverseLookup = make(map[string]map[string]uint32)

	offset := 0
	for i := range s.Fields {
		f := &s.Fields[i]
		s.fieldIndex[f.Name] = i
		if f.Index {
			s.indexFields = append(s.indexFields, f.Name)
		}
		f.Offset = offset

		switch f.Type {
		case "uint8", "lookup":
			f.Size = 1
		case "uint16", "lookup16":
			f.Size = 2
		case "uint32":
			f.Size = 4
		case "uint64", "timestamp":
			f.Size = 8
		default:
			f.Size = 4
		}

		// Initialize fixed lookup tables
		if (f.Type == "lookup" || f.Type == "lookup16") && len(f.Values) > 0 && !f.Dynamic {
			s.lookupTables[f.Name] = f.Values
			rev := make(map[string]uint32)
			for j, v := range f.Values {
				rev[v] = uint32(j)
			}
			s.reverseLookup[f.Name] = rev
		}

		offset += f.Size
	}
	s.recordSize = offset
}

// ── Encode / Decode ─────────────────────────────────────────────────────────

// Encode converts a map of field values into a binary record.
func (s *BinarySchema) Encode(doc map[string]interface{}) ([]byte, error) {
	buf := make([]byte, s.recordSize)

	for _, f := range s.Fields {
		val, exists := doc[f.Name]
		if !exists {
			continue
		}

		switch f.Type {
		case "uint8":
			buf[f.Offset] = toByte(val)
		case "uint16":
			binary.LittleEndian.PutUint16(buf[f.Offset:f.Offset+2], toUint16(val))
		case "uint32":
			binary.LittleEndian.PutUint32(buf[f.Offset:f.Offset+4], toUint32(val))
		case "uint64":
			binary.LittleEndian.PutUint64(buf[f.Offset:f.Offset+8], toUint64(val))
		case "timestamp":
			t := toTimestamp(val)
			binary.LittleEndian.PutUint64(buf[f.Offset:f.Offset+8], uint64(t))
		case "lookup":
			str := fmt.Sprintf("%v", val)
			id := s.lookupID(f.Name, str, f.Dynamic)
			buf[f.Offset] = byte(id)
		case "lookup16":
			str := fmt.Sprintf("%v", val)
			id := s.lookupID(f.Name, str, f.Dynamic)
			binary.LittleEndian.PutUint16(buf[f.Offset:f.Offset+2], uint16(id))
		}
	}

	return buf, nil
}

// Decode converts a binary record back into a map of field values.
func (s *BinarySchema) Decode(buf []byte) map[string]interface{} {
	doc := make(map[string]interface{}, len(s.Fields))

	for _, f := range s.Fields {
		if f.Offset+f.Size > len(buf) {
			continue
		}
		switch f.Type {
		case "uint8":
			doc[f.Name] = int(buf[f.Offset])
		case "uint16":
			doc[f.Name] = int(binary.LittleEndian.Uint16(buf[f.Offset : f.Offset+2]))
		case "uint32":
			doc[f.Name] = int(binary.LittleEndian.Uint32(buf[f.Offset : f.Offset+4]))
		case "uint64":
			doc[f.Name] = binary.LittleEndian.Uint64(buf[f.Offset : f.Offset+8])
		case "timestamp":
			ts := binary.LittleEndian.Uint64(buf[f.Offset : f.Offset+8])
			doc[f.Name] = time.Unix(int64(ts), 0).Format(time.RFC3339)
		case "lookup":
			id := int(buf[f.Offset])
			doc[f.Name] = s.lookupValue(f.Name, id)
		case "lookup16":
			id := int(binary.LittleEndian.Uint16(buf[f.Offset : f.Offset+2]))
			doc[f.Name] = s.lookupValue(f.Name, id)
		}
	}

	return doc
}

// ── Lookup Table Management ─────────────────────────────────────────────────

func (s *BinarySchema) lookupID(field, value string, dynamic bool) uint32 {
	s.lookupMu.RLock()
	if rev, ok := s.reverseLookup[field]; ok {
		if id, found := rev[value]; found {
			s.lookupMu.RUnlock()
			return id
		}
	}
	s.lookupMu.RUnlock()

	if !dynamic {
		return 0
	}

	s.lookupMu.Lock()
	defer s.lookupMu.Unlock()

	if rev, ok := s.reverseLookup[field]; ok {
		if id, found := rev[value]; found {
			return id
		}
	}

	if s.lookupTables[field] == nil {
		s.lookupTables[field] = []string{}
		s.reverseLookup[field] = make(map[string]uint32)
	}

	id := uint32(len(s.lookupTables[field]))
	s.lookupTables[field] = append(s.lookupTables[field], value)
	s.reverseLookup[field][value] = id
	return id
}

func (s *BinarySchema) lookupValue(field string, id int) string {
	s.lookupMu.RLock()
	defer s.lookupMu.RUnlock()
	table := s.lookupTables[field]
	if id >= 0 && id < len(table) {
		return table[id]
	}
	return fmt.Sprintf("?%d", id)
}

// ── bbolt Storage ───────────────────────────────────────────────────────────

// ensureBuckets creates the main + per-indexed-field buckets for the collection.
func (s *BinarySchema) ensureBuckets() error {
	if BoltDB == nil {
		return fmt.Errorf("bbolt not open")
	}
	return BoltDB.Update(func(tx *bolt.Tx) error {
		if _, err := tx.CreateBucketIfNotExists(mainBucketName(s.BinaryCol)); err != nil {
			return err
		}
		for _, f := range s.indexFields {
			if _, err := tx.CreateBucketIfNotExists(indexBucketName(s.BinaryCol, f)); err != nil {
				return err
			}
		}
		return nil
	})
}

// BinaryInsert encodes a single document and writes it into the bbolt store,
// updating any secondary indexes.
func (s *BinarySchema) BinaryInsert(doc map[string]interface{}) error {
	return s.BinaryInsertMany([]map[string]interface{}{doc})
}

// BinaryInsertMany writes a batch of documents in a single transaction.
// Much faster than N single inserts because bbolt commits once.
func (s *BinarySchema) BinaryInsertMany(docs []map[string]interface{}) error {
	if BoltDB == nil {
		return fmt.Errorf("bbolt not open")
	}
	if len(docs) == 0 {
		return nil
	}

	// Encode everything outside the txn (uses its own lock for dynamic lookups)
	type encoded struct {
		buf []byte
		doc map[string]interface{}
	}
	encs := make([]encoded, len(docs))
	for i, d := range docs {
		buf, err := s.Encode(d)
		if err != nil {
			return fmt.Errorf("encoding doc %d: %w", i, err)
		}
		encs[i] = encoded{buf: buf, doc: d}
	}

	return BoltDB.Update(func(tx *bolt.Tx) error {
		main, err := tx.CreateBucketIfNotExists(mainBucketName(s.BinaryCol))
		if err != nil {
			return err
		}

		// Pre-open index buckets
		idxBuckets := make(map[string]*bolt.Bucket, len(s.indexFields))
		for _, f := range s.indexFields {
			b, err := tx.CreateBucketIfNotExists(indexBucketName(s.BinaryCol, f))
			if err != nil {
				return err
			}
			idxBuckets[f] = b
		}

		for _, e := range encs {
			id, _ := main.NextSequence()
			key := idToKey(id)
			if err := main.Put(key, e.buf); err != nil {
				return err
			}
			for _, fieldName := range s.indexFields {
				ftype := s.Fields[s.fieldIndex[fieldName]].Type
				rawVal, ok := e.doc[fieldName]
				if !ok {
					continue
				}
				ikey := encodeIndexValue(ftype, rawVal)
				existing := idxBuckets[fieldName].Get(ikey)
				// Copy existing because bbolt buffers are tx-scoped
				cp := make([]byte, len(existing))
				copy(cp, existing)
				updated := appendIDList(cp, id)
				if err := idxBuckets[fieldName].Put(ikey, updated); err != nil {
					return err
				}
			}
		}
		return nil
	})
}

// BinaryFindAll returns every record, decoded.
func (s *BinarySchema) BinaryFindAll() ([]map[string]interface{}, error) {
	if BoltDB == nil {
		return nil, fmt.Errorf("bbolt not open")
	}
	var results []map[string]interface{}
	err := BoltDB.View(func(tx *bolt.Tx) error {
		b := tx.Bucket(mainBucketName(s.BinaryCol))
		if b == nil {
			return nil
		}
		c := b.Cursor()
		for k, v := c.First(); k != nil; k, v = c.Next() {
			doc := s.Decode(v)
			doc["_id"] = keyToID(k)
			results = append(results, doc)
		}
		return nil
	})
	return results, err
}

// BinaryFind returns records matching the given equality filter.
// Only equality on indexed fields is supported in this bbolt implementation.
// Non-indexed filter keys fall back to a full scan with Go-side filtering.
func (s *BinarySchema) BinaryFind(filter map[string]interface{}) ([]map[string]interface{}, error) {
	if BoltDB == nil {
		return nil, fmt.Errorf("bbolt not open")
	}
	if len(filter) == 0 {
		return s.BinaryFindAll()
	}

	// Split filter into indexed and non-indexed parts
	indexed := map[string]interface{}{}
	rest := map[string]interface{}{}
	indexedSet := map[string]bool{}
	for _, f := range s.indexFields {
		indexedSet[f] = true
	}
	for k, v := range filter {
		if indexedSet[k] {
			indexed[k] = v
		} else {
			rest[k] = v
		}
	}

	var results []map[string]interface{}
	err := BoltDB.View(func(tx *bolt.Tx) error {
		main := tx.Bucket(mainBucketName(s.BinaryCol))
		if main == nil {
			return nil
		}

		var candidateIDs []uint64
		haveCandidates := false

		// Use indexes to narrow candidates
		for fieldName, val := range indexed {
			ftype := s.Fields[s.fieldIndex[fieldName]].Type
			ikey := encodeIndexValue(ftype, val)
			idxBucket := tx.Bucket(indexBucketName(s.BinaryCol, fieldName))
			if idxBucket == nil {
				return nil
			}
			ids := parseIDList(idxBucket.Get(ikey))
			if !haveCandidates {
				candidateIDs = ids
				haveCandidates = true
			} else {
				candidateIDs = intersectIDs(candidateIDs, ids)
			}
			if len(candidateIDs) == 0 {
				return nil
			}
		}

		// If no indexed filters hit, fall back to full scan
		if !haveCandidates {
			c := main.Cursor()
			for k, v := c.First(); k != nil; k, v = c.Next() {
				doc := s.Decode(v)
				if matchesFilter(doc, rest) {
					doc["_id"] = keyToID(k)
					results = append(results, doc)
				}
			}
			return nil
		}

		// Fetch each candidate, decode, apply remaining filters
		for _, id := range candidateIDs {
			v := main.Get(idToKey(id))
			if v == nil {
				continue
			}
			doc := s.Decode(v)
			if len(rest) > 0 && !matchesFilter(doc, rest) {
				continue
			}
			doc["_id"] = id
			results = append(results, doc)
		}
		return nil
	})
	return results, err
}

// QueryOpts configures pagination and sorting for BinaryFindPage.
type QueryOpts struct {
	Page     int    // 0-based
	PageSize int    // default 20
	SortBy   string // indexed field name; empty = by _id (insertion order)
	SortDir  int    // 1 asc, -1 desc (default 1)
}

// BinaryFindPage returns a paginated, optionally-sorted subset of records.
// Pagination happens after filter + sort in Go (bbolt doesn't index-sort for us
// the way MongoDB does); fine for small/medium collections.
func (s *BinarySchema) BinaryFindPage(filter map[string]interface{}, opts QueryOpts) ([]map[string]interface{}, int64, error) {
	all, err := s.BinaryFind(filter)
	if err != nil {
		return nil, 0, err
	}
	total := int64(len(all))

	if opts.SortBy != "" {
		sort.SliceStable(all, func(i, j int) bool {
			a, b := all[i][opts.SortBy], all[j][opts.SortBy]
			less := compareAny(a, b) < 0
			if opts.SortDir == -1 {
				return !less
			}
			return less
		})
	}

	pageSize := opts.PageSize
	if pageSize <= 0 {
		pageSize = 20
	}
	page := opts.Page
	if page < 0 {
		page = 0
	}
	start := page * pageSize
	end := start + pageSize
	if start >= len(all) {
		return nil, total, nil
	}
	if end > len(all) {
		end = len(all)
	}
	return all[start:end], total, nil
}

// BinaryUpdate replaces the record at id and refreshes its index entries.
// For simplicity, index refresh re-reads the old record, removes its ID from
// every index entry, then re-adds with the new values.
func (s *BinarySchema) BinaryUpdate(id interface{}, doc map[string]interface{}) error {
	if BoltDB == nil {
		return fmt.Errorf("bbolt not open")
	}
	uid, ok := toUint64Strict(id)
	if !ok {
		return fmt.Errorf("invalid id type for bbolt: %T", id)
	}
	newBuf, err := s.Encode(doc)
	if err != nil {
		return err
	}
	return BoltDB.Update(func(tx *bolt.Tx) error {
		main := tx.Bucket(mainBucketName(s.BinaryCol))
		if main == nil {
			return fmt.Errorf("collection %s not found", s.BinaryCol)
		}
		oldBuf := main.Get(idToKey(uid))
		if oldBuf != nil {
			oldDoc := s.Decode(oldBuf)
			for _, f := range s.indexFields {
				ftype := s.Fields[s.fieldIndex[f]].Type
				oldVal, ok := oldDoc[f]
				if !ok {
					continue
				}
				idxB := tx.Bucket(indexBucketName(s.BinaryCol, f))
				if idxB == nil {
					continue
				}
				ikey := encodeIndexValue(ftype, oldVal)
				existing := idxB.Get(ikey)
				cp := make([]byte, len(existing))
				copy(cp, existing)
				ids := parseIDList(cp)
				filtered := make([]byte, 0, len(cp))
				for _, iid := range ids {
					if iid != uid {
						var b [8]byte
						binary.BigEndian.PutUint64(b[:], iid)
						filtered = append(filtered, b[:]...)
					}
				}
				if err := idxB.Put(ikey, filtered); err != nil {
					return err
				}
			}
		}
		if err := main.Put(idToKey(uid), newBuf); err != nil {
			return err
		}
		for _, f := range s.indexFields {
			ftype := s.Fields[s.fieldIndex[f]].Type
			newVal, ok := doc[f]
			if !ok {
				continue
			}
			idxB := tx.Bucket(indexBucketName(s.BinaryCol, f))
			if idxB == nil {
				continue
			}
			ikey := encodeIndexValue(ftype, newVal)
			existing := idxB.Get(ikey)
			cp := make([]byte, len(existing))
			copy(cp, existing)
			updated := appendIDList(cp, uid)
			if err := idxB.Put(ikey, updated); err != nil {
				return err
			}
		}
		return nil
	})
}

// BinaryDelete removes a record and its index entries.
func (s *BinarySchema) BinaryDelete(id interface{}) error {
	if BoltDB == nil {
		return fmt.Errorf("bbolt not open")
	}
	uid, ok := toUint64Strict(id)
	if !ok {
		return fmt.Errorf("invalid id type for bbolt: %T", id)
	}
	return BoltDB.Update(func(tx *bolt.Tx) error {
		main := tx.Bucket(mainBucketName(s.BinaryCol))
		if main == nil {
			return nil
		}
		oldBuf := main.Get(idToKey(uid))
		if oldBuf == nil {
			return nil
		}
		oldDoc := s.Decode(oldBuf)
		for _, f := range s.indexFields {
			ftype := s.Fields[s.fieldIndex[f]].Type
			oldVal, ok := oldDoc[f]
			if !ok {
				continue
			}
			idxB := tx.Bucket(indexBucketName(s.BinaryCol, f))
			if idxB == nil {
				continue
			}
			ikey := encodeIndexValue(ftype, oldVal)
			existing := idxB.Get(ikey)
			cp := make([]byte, len(existing))
			copy(cp, existing)
			ids := parseIDList(cp)
			filtered := make([]byte, 0, len(cp))
			for _, iid := range ids {
				if iid != uid {
					var b [8]byte
					binary.BigEndian.PutUint64(b[:], iid)
					filtered = append(filtered, b[:]...)
				}
			}
			if err := idxB.Put(ikey, filtered); err != nil {
				return err
			}
		}
		return main.Delete(idToKey(uid))
	})
}

// SaveLookupTables persists dynamic lookup tables to bbolt so they survive
// restarts. Stored as JSON under the collection name.
func (s *BinarySchema) SaveLookupTables() error {
	if BoltDB == nil {
		return fmt.Errorf("bbolt not open")
	}
	s.lookupMu.RLock()
	tables := make(map[string][]string, len(s.lookupTables))
	for k, v := range s.lookupTables {
		cp := make([]string, len(v))
		copy(cp, v)
		tables[k] = cp
	}
	s.lookupMu.RUnlock()

	raw, err := json.Marshal(tables)
	if err != nil {
		return err
	}
	return BoltDB.Update(func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte(lookupTablesBucket))
		if err != nil {
			return err
		}
		return b.Put([]byte(s.Collection), raw)
	})
}

// LoadLookupTables restores dynamic lookup tables from bbolt.
func (s *BinarySchema) LoadLookupTables() error {
	if BoltDB == nil {
		return nil
	}
	return BoltDB.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(lookupTablesBucket))
		if b == nil {
			return nil
		}
		raw := b.Get([]byte(s.Collection))
		if raw == nil {
			return nil
		}
		tables := map[string][]string{}
		if err := json.Unmarshal(raw, &tables); err != nil {
			return err
		}
		s.lookupMu.Lock()
		defer s.lookupMu.Unlock()
		for field, values := range tables {
			s.lookupTables[field] = values
			rev := make(map[string]uint32, len(values))
			for i, v := range values {
				rev[v] = uint32(i)
			}
			s.reverseLookup[field] = rev
		}
		return nil
	})
}

// ── Helpers ─────────────────────────────────────────────────────────────────

// matchesFilter returns true when every key in filter equals the corresponding
// value in doc. Equality only — no operator map support in this path.
func matchesFilter(doc map[string]interface{}, filter map[string]interface{}) bool {
	for k, v := range filter {
		dv, ok := doc[k]
		if !ok {
			return false
		}
		if fmt.Sprintf("%v", dv) != fmt.Sprintf("%v", v) {
			return false
		}
	}
	return true
}

// compareAny provides a very loose ordering for sortBy — string < string,
// number < number; otherwise falls back to string compare of Sprintf output.
func compareAny(a, b interface{}) int {
	af, aok := a.(float64)
	bf, bok := b.(float64)
	if aok && bok {
		switch {
		case af < bf:
			return -1
		case af > bf:
			return 1
		}
		return 0
	}
	if ai, ok := a.(int); ok {
		if bi, ok := b.(int); ok {
			switch {
			case ai < bi:
				return -1
			case ai > bi:
				return 1
			}
			return 0
		}
	}
	return strings.Compare(fmt.Sprintf("%v", a), fmt.Sprintf("%v", b))
}

func toByte(v interface{}) byte {
	switch val := v.(type) {
	case float64:
		return byte(val)
	case int:
		return byte(val)
	case int64:
		return byte(val)
	}
	return 0
}

func toUint16(v interface{}) uint16 {
	switch val := v.(type) {
	case float64:
		return uint16(val)
	case int:
		return uint16(val)
	case int64:
		return uint16(val)
	}
	return 0
}

func toUint32(v interface{}) uint32 {
	switch val := v.(type) {
	case float64:
		return uint32(val)
	case int:
		return uint32(val)
	case int64:
		return uint32(val)
	case string:
		var h uint32
		for _, c := range val {
			h = h*31 + uint32(c)
		}
		return h
	}
	return 0
}

func toUint64(v interface{}) uint64 {
	switch val := v.(type) {
	case float64:
		return uint64(val)
	case int:
		return uint64(val)
	case int64:
		return uint64(val)
	}
	return 0
}

func toInt(v interface{}) int64 {
	switch val := v.(type) {
	case float64:
		return int64(val)
	case int:
		return int64(val)
	case int64:
		return val
	case uint64:
		return int64(val)
	case string:
		n, _ := strconv.ParseInt(val, 10, 64)
		return n
	}
	return 0
}

func toUint64Strict(v interface{}) (uint64, bool) {
	switch val := v.(type) {
	case uint64:
		return val, true
	case int64:
		return uint64(val), true
	case int:
		return uint64(val), true
	case float64:
		return uint64(val), true
	}
	return 0, false
}

func toTimestamp(v interface{}) int64 {
	switch val := v.(type) {
	case string:
		t, err := time.Parse(time.RFC3339, val)
		if err == nil {
			return t.Unix()
		}
		return 0
	case float64:
		return int64(val)
	case int64:
		return val
	case time.Time:
		return val.Unix()
	}
	return 0
}
