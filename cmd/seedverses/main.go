// seedverses — load bible_verses.json into bbolt via binary schema.
//
// Usage:
//   go run ./cmd/seedverses -src ../old/public/data/bible_verses.json
//
// Reads the JSON array of {book, chapter, verse, text} objects,
// inserts into the "verses" binary collection, and saves lookup tables.
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"chefscript/engine"
)

func main() {
	src := flag.String("src", "../old/public/data/bible_verses.json", "path to bible_verses.json")
	dbPath := flag.String("db", "chefscript.db", "bbolt file path")
	flag.Parse()

	// Open bbolt
	if err := engine.OpenBolt(*dbPath); err != nil {
		log.Fatalf("bolt open: %v", err)
	}
	defer engine.CloseBolt()

	// Load schemas
	if err := engine.LoadBinarySchemas("schemas/binary"); err != nil {
		log.Fatalf("schema load: %v", err)
	}

	s := engine.GetBinarySchema("verses")
	if s == nil {
		log.Fatal("verses schema not found — check schemas/binary/verses.json")
	}

	// Check existing
	existing, err := s.BinaryFindAll()
	if err != nil {
		log.Fatalf("count: %v", err)
	}

	if len(existing) > 0 {
		fmt.Printf("verses_bin already has %d records. Already seeded.\n", len(existing))
		return
	}

	// Read source JSON
	raw, err := os.ReadFile(*src)
	if err != nil {
		log.Fatalf("read %s: %v", *src, err)
	}

	var verses []map[string]interface{}
	if err := json.Unmarshal(raw, &verses); err != nil {
		log.Fatalf("parse json: %v", err)
	}
	log.Printf("parsed %d verses from %s", len(verses), *src)

	// Insert in batches
	start := time.Now()
	batchSize := 2000
	total := 0
	for i := 0; i < len(verses); i += batchSize {
		end := i + batchSize
		if end > len(verses) {
			end = len(verses)
		}
		if err := s.BinaryInsertMany(verses[i:end]); err != nil {
			log.Fatalf("insert batch at %d: %v", i, err)
		}
		total += end - i
		if total%10000 == 0 || total == len(verses) {
			fmt.Printf("  inserted %d / %d\n", total, len(verses))
		}
	}

	// Save dynamic lookup tables (text field)
	if err := s.SaveLookupTables(); err != nil {
		log.Printf("save lookups: %v", err)
	}

	log.Printf("seeded %d verses in %v", total, time.Since(start))
}
