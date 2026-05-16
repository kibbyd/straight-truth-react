// binarybench — measure binary schema retrieval speed.
//
// Usage:
//   go run ./cmd/binarybench             # seeds if empty, runs queries, prints timings
//   go run ./cmd/binarybench -reset      # drops + reseeds
//
// What it does:
//   1. Opens bbolt at the -db path (default "bench.db")
//   2. Loads schemas/binary/versebench.json
//   3. If versebench_bin is empty (or -reset), seeds ~31k synthetic verse records
//   4. Times BinaryFind({book:"Gen", chapter:1})      — small indexed query
//   5. Times BinaryFind({book:"Gen"})                 — larger indexed query (all of Genesis)
//   6. Times BinaryFind({book:"Psa", chapter:119})    — Psalm 119 (largest chapter)
//   7. Times BinaryFindAll()                          — full scan baseline
//   8. Prints record counts + elapsed times
package main

import (
	"flag"
	"fmt"
	"log"
	"math/rand"
	"os"
	"time"

	"chefscript/engine"
)

// Rough chapter counts so the synthetic seed matches real Bible scale (~31,000 verses).
var bookChapters = []struct {
	abbr     string
	chapters int
}{
	{"Gen", 50}, {"Exo", 40}, {"Lev", 27}, {"Num", 36}, {"Deu", 34}, {"Jos", 24}, {"Jdg", 21}, {"Rut", 4},
	{"1Sa", 31}, {"2Sa", 24}, {"1Ki", 22}, {"2Ki", 25}, {"1Ch", 29}, {"2Ch", 36}, {"Ezr", 10}, {"Neh", 13},
	{"Est", 10}, {"Job", 42}, {"Psa", 150}, {"Pro", 31}, {"Ecc", 12}, {"Sol", 8}, {"Isa", 66}, {"Jer", 52},
	{"Lam", 5}, {"Eze", 48}, {"Dan", 12}, {"Hos", 14}, {"Joe", 3}, {"Amo", 9}, {"Oba", 1}, {"Jon", 4},
	{"Mic", 7}, {"Nah", 3}, {"Hab", 3}, {"Zep", 3}, {"Hag", 2}, {"Zec", 14}, {"Mal", 4}, {"Mat", 28},
	{"Mar", 16}, {"Luk", 24}, {"Joh", 21}, {"Act", 28}, {"Rom", 16}, {"1Co", 16}, {"2Co", 13}, {"Gal", 6},
	{"Eph", 6}, {"Phi", 4}, {"Col", 4}, {"1Th", 5}, {"2Th", 3}, {"1Ti", 6}, {"2Ti", 4}, {"Tit", 3},
	{"Phm", 1}, {"Heb", 13}, {"Jam", 5}, {"1Pe", 5}, {"2Pe", 3}, {"1Jo", 5}, {"2Jo", 1}, {"3Jo", 1},
	{"Jud", 1}, {"Rev", 22},
}

func main() {
	reset := flag.Bool("reset", false, "delete the bbolt file and reseed")
	dbPath := flag.String("db", "bench.db", "bbolt file path")
	flag.Parse()

	if *reset {
		log.Printf("removing %s…", *dbPath)
		os.Remove(*dbPath)
	}

	log.Printf("opening bbolt %s…", *dbPath)
	if err := engine.OpenBolt(*dbPath); err != nil {
		log.Fatalf("bolt open: %v", err)
	}
	defer engine.CloseBolt()

	log.Println("loading binary schemas from schemas/binary…")
	if err := engine.LoadBinarySchemas("schemas/binary"); err != nil {
		log.Fatalf("schema load: %v", err)
	}

	s := engine.GetBinarySchema("versebench")
	if s == nil {
		log.Fatal("versebench schema not found after load")
	}

	// Count existing records via a full scan (cheap on bbolt for sizing check)
	existing, err := s.BinaryFindAll()
	if err != nil {
		log.Fatalf("count: %v", err)
	}
	count := int64(len(existing))
	log.Printf("existing records in versebench_bin: %d", count)

	if count == 0 {
		seedStart := time.Now()
		total := seed(s)
		log.Printf("seeded %d records in %v", total, time.Since(seedStart))
		// persist dynamic lookup table (text) so subsequent runs decode correctly
		if err := s.SaveLookupTables(); err != nil {
			log.Printf("save lookups: %v", err)
		}
	}

	fmt.Println()
	fmt.Println("── Retrieval benchmarks ─────────────────────────────────────")
	bench("BinaryFind book=Gen chapter=1",
		func() (int, error) {
			r, err := s.BinaryFind(map[string]interface{}{"book": "Gen", "chapter": 1})
			return len(r), err
		})
	bench("BinaryFind book=Gen (all Genesis)",
		func() (int, error) {
			r, err := s.BinaryFind(map[string]interface{}{"book": "Gen"})
			return len(r), err
		})
	bench("BinaryFind book=Psa chapter=119",
		func() (int, error) {
			r, err := s.BinaryFind(map[string]interface{}{"book": "Psa", "chapter": 119})
			return len(r), err
		})
	bench("BinaryFind book=Rev (last book)",
		func() (int, error) {
			r, err := s.BinaryFind(map[string]interface{}{"book": "Rev"})
			return len(r), err
		})
	bench("BinaryFindAll (full scan, decodes every record)",
		func() (int, error) {
			r, err := s.BinaryFindAll()
			return len(r), err
		})

	fmt.Println()
	fmt.Println("── Repeated hot query (cache warm after first run) ──────────")
	for i := 1; i <= 3; i++ {
		bench(fmt.Sprintf("  run %d: book=Gen chapter=1", i),
			func() (int, error) {
				r, err := s.BinaryFind(map[string]interface{}{"book": "Gen", "chapter": 1})
				return len(r), err
			})
	}
}

func seed(s *engine.BinarySchema) int {
	const avgVersesPerChapter = 26 // ~31,102 / 1,189 chapters
	r := rand.New(rand.NewSource(42))

	// Insert in batches so we don't send one giant InsertMany.
	batchSize := 2000
	var batch []map[string]interface{}
	total := 0

	for _, bk := range bookChapters {
		for ch := 1; ch <= bk.chapters; ch++ {
			// varying verse counts: 15-40
			vCount := 15 + r.Intn(26)
			for v := 1; v <= vCount; v++ {
				batch = append(batch, map[string]interface{}{
					"book":    bk.abbr,
					"chapter": ch,
					"verse":   v,
					"text":    fmt.Sprintf("%s %d:%d synthetic verse text %d", bk.abbr, ch, v, r.Intn(1000000)),
				})
				if len(batch) >= batchSize {
					if err := s.BinaryInsertMany(batch); err != nil {
						log.Fatalf("insert batch: %v", err)
					}
					total += len(batch)
					batch = batch[:0]
				}
			}
		}
	}
	if len(batch) > 0 {
		if err := s.BinaryInsertMany(batch); err != nil {
			log.Fatalf("insert final batch: %v", err)
		}
		total += len(batch)
	}
	return total
}

func bench(label string, fn func() (int, error)) {
	start := time.Now()
	n, err := fn()
	elapsed := time.Since(start)
	if err != nil {
		fmt.Printf("  %-50s ERROR: %v\n", label, err)
		return
	}
	fmt.Printf("  %-50s %6d records  %v\n", label, n, elapsed)
}
