package engine

import (
	"encoding/json"
	"log"
	"sync"
)

// catalogStore holds all loaded catalog JSON data.
var catalogStore = map[string]interface{}{}
var catalogMu sync.RWMutex

// catalogFiles maps catalog key → embedded file path.
var catalogFiles = map[string]string{
	"miracles":    "data/miracles_jesus.json",
	"parables":    "data/parables_jesus.json",
	"prayers":     "data/prayers_bible.json",
	"namesofgod":  "data/names_of_god.json",
	"quotations":  "data/ot_nt_quotations.json",
	"covenants":   "data/covenants.json",
	"festivals":   "data/festivals.json",
	"familytrees": "data/family_trees.json",
	"questions":   "data/questions.json",
	"glossary":    "data/glossary.json",
	"converter":   "data/biblical_measures.json",
	"timelines":   "data/timelines.json",
	"maps":        "data/maps.json",
	"places":      "data/places.json",
	"parallels":   "data/parallel_passages.json",
	"peoples":     "data/peoples_cultures.json",
	"religions":   "data/ancient_religions.json",
	"dailylife":   "data/daily_life.json",
	"archaeology": "data/archaeology.json",
	"definitions": "data/definitions.json",
	"topical":     "data/topical_index.json",
	"kings":       "data/kings_refined.json",
	"prophets":    "data/prophets.json",
	"mountains":   "data/mountains.json",
	"waters":      "data/waters.json",
	"strongs":     "data/strongs_data.json",
	"corrections": "data/strongs_corrections.json",
	"crossrefs":   "data/verified_connections.json",
}

// LoadCatalogData reads all catalog JSON files into memory.
// Called once at startup from RegisterBibleComponents.
func LoadCatalogData() {
	for key, path := range catalogFiles {
		raw, err := ReadEmbedFile(path)
		if err != nil {
			log.Printf("catalog: skip %s (%v)", key, err)
			continue
		}
		var data interface{}
		if err := json.Unmarshal(raw, &data); err != nil {
			log.Printf("catalog: parse error %s (%v)", key, err)
			continue
		}
		catalogMu.Lock()
		catalogStore[key] = data
		catalogMu.Unlock()
	}
	log.Printf("catalog: loaded %d catalogs", len(catalogStore))
}

// GetCatalog returns the parsed JSON for a catalog key, or nil.
func GetCatalog(key string) interface{} {
	catalogMu.RLock()
	defer catalogMu.RUnlock()
	return catalogStore[key]
}

// ── Strong's accessors ──────────────────────────────────────────────────────

// GetStrongsLexicon returns the lexicon map from strongs_data.json.
func GetStrongsLexicon() map[string]interface{} {
	data := GetCatalog("strongs")
	if data == nil {
		return nil
	}
	return jMap(data, "lexicon")
}

// GetStrongsAlignment returns the alignment entries for a verse ref (e.g. "Gen.1.1").
func GetStrongsAlignment(ref string) []interface{} {
	data := GetCatalog("strongs")
	if data == nil {
		return nil
	}
	alignment := jMap(data, "alignment")
	if alignment == nil {
		return nil
	}
	if arr, ok := alignment[ref].([]interface{}); ok {
		return arr
	}
	return nil
}

// GetStrongsEntry returns a single lexicon entry by Strong's number (e.g. "H0001").
func GetStrongsEntry(num string) map[string]interface{} {
	lex := GetStrongsLexicon()
	if lex == nil {
		return nil
	}
	if entry, ok := lex[num].(map[string]interface{}); ok {
		return entry
	}
	return nil
}

// GetStrongsCorrections returns the corrections for a verse ref.
func GetStrongsCorrections(ref string) map[string]interface{} {
	data := GetCatalog("corrections")
	if data == nil {
		return nil
	}
	corrections := jMap(data, "corrections")
	if corrections == nil {
		return nil
	}
	if entry, ok := corrections[ref].(map[string]interface{}); ok {
		return entry
	}
	return nil
}

// ── JSON helpers ────────────────────────────────────────────────────────────

// jArr extracts a named array from a JSON object.
func jArr(obj interface{}, key string) []interface{} {
	if m, ok := obj.(map[string]interface{}); ok {
		if a, ok := m[key].([]interface{}); ok {
			return a
		}
	}
	return nil
}

// jStr extracts a string field from a JSON object.
func jStr(obj interface{}, key string) string {
	if m, ok := obj.(map[string]interface{}); ok {
		if s, ok := m[key].(string); ok {
			return s
		}
	}
	return ""
}

// jMap extracts a nested object from a JSON object.
func jMap(obj interface{}, key string) map[string]interface{} {
	if m, ok := obj.(map[string]interface{}); ok {
		if sub, ok := m[key].(map[string]interface{}); ok {
			return sub
		}
	}
	return nil
}

// jFloat extracts a float64 field.
func jFloat(obj interface{}, key string) float64 {
	if m, ok := obj.(map[string]interface{}); ok {
		if f, ok := m[key].(float64); ok {
			return f
		}
		if i, ok := m[key].(int); ok {
			return float64(i)
		}
	}
	return 0
}

// jBool extracts a bool field.
func jBool(obj interface{}, key string) bool {
	if m, ok := obj.(map[string]interface{}); ok {
		if b, ok := m[key].(bool); ok {
			return b
		}
	}
	return false
}
