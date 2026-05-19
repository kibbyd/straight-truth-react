# Bible Reader - Handoff Notes

## Vision & Guidelines

### Core Premise
Provide masters-level biblical scholarship in layman's terms. Completely fact and evidence-based with NO interpretation added. We show threads, connections, and history - it is up to the reader to make their own conclusions.

### Guiding Principles
- Present facts, not opinions
- Show connections without explaining meaning
- Reference historical evidence and sources
- Let the reader draw their own conclusions
- Academic rigor, accessible language
- **Unbiased presentation** - Show what the text says, even when it challenges common assumptions
- No theological agenda - present evidence as it exists in the text and history
- **Trace origins** - Don't just present conclusions. Show where beliefs started, who started them, and why
- **No data is better than wrong data** - If it cannot be confirmed, validated, or evidenced - remove it

### Language Rules
- ✅ "The text says..."
- ✅ "X is recorded in..."
- ✅ "Historical sources indicate..."
- ✅ "Unknown from scripture"
- ❌ "This means..."
- ❌ "This proves..."
- ❌ "Obviously..."
- ❌ "The correct view is..."

### Plain Language Rule (CRITICAL)
**No academic jargon.** Anyone should be able to read this app and draw insights without being separated by snobbish language. This is non-negotiable.

**The test:** If a 14-year-old with no biblical background can't understand it on first read, rewrite it.

### Reference Format
- Data: `Gen.5.3` → Display: "Genesis 5:3"
- Data: `Joh.20.30-31` → Display: "John 20:30-31"

### Questions & Evidence Model
- Questions are permitted. Conclusions are not.
- Questions function as lenses over evidence, not problems to solve
- Present positive evidence only
- Allow multiple passages to sit side-by-side without commentary
- The system shows what exists, shows how it connects, and stops

---

## Completed

### Strong's-to-ESV Alignment
**Multi-stage pipeline: Berean interlinear → KJV validation → KJV recovery.**

1. **Berean alignment (Jan 2025):** Built ESV word→Strong's mapping from Berean Standard Bible interlinear. 297,759 mappings (78.5% match rate). Scripts: `scripts/align_pass1.py`, `scripts/align_pass2.py`
2. **KJV validation (Jan 2025):** Dropped mappings where KJV doesn't have that Strong's in that verse. 223,930 confirmed (75.2%). Script: `scripts/validate_strongs_with_kjv.py`
3. **KJV alignment (Apr 2026):** Built standalone KJV word→Strong's alignment — 327,899 mappings across 31,199 verses. Script: `scripts/build_kjv_alignment.py`. Data: `public/data/strongs_kjv_alignment.json`
4. **KJV recovery (Apr 2026):** Recovered 38,424 dropped ESV mappings using cross-verse confirmation + gloss matching. Final: **262,354 mappings (88.1%)**. 35,405 remain dropped (no evidence). Script: `scripts/recover_esv_mappings.py`. Data: `public/data/strongs_esv_alignment_recovered.json`

- Theological distinctions preserved: Spirit/spirit, LORD/Lord, GOD/God
- **Algorithmic ceiling reached** — further gains require manual curation or better source data
- Live data: `public/data/strongs_data.json` (lexicon + recovered alignment)

### Features Complete
- **Passage columns** - Bible text with Strong's word clicking
- **Cross-references column** - Connections grouped by type
- **Notes column** - Verse/chapter/general pinning with SQLite backend
- **Search column** - Full-text search with highlighting
- **Strong's word study** - Lexicon definitions + all occurrences
- **Catalogues** - Miracles, Parables, Prayers, Names of God, OT→NT Quotations, Covenants, Calendar & Festivals, Family Trees
- **Questions** - 1,205 questions across 25+ categories
- **Glossary** - Doctrinal terms and definitions
- **Metric Converter** - 49 biblical units across 7 categories
- **Timelines** - 380 chronological entries
- **Maps & Geography** - 68 maps (legacy static images, kept for now)
- **Places Catalog** - 967 biblical locations from Tyndale TIPNR (CC BY 4.0). 966 with coordinates, 5,244 verse references, alternate names, regions, descriptions, Strong's links, Google Maps links. Alternate names (101) included in entity pin lookup.
- **Parallel Passages** - 214 parallel passage sets
- **Peoples & Cultures** - 54 entries
- **Ancient Religions** - 13 religions
- **Daily Life** - 32 topics across 8 categories
- **Archaeology** - 44 discoveries across 4 categories
- **Definitions** - 67 scripture-defined terms grounded in Strong's numbers
- **Hebrew/Greek Interlinear Toggle** - Shows transliterated root forms under English words. Gloss-matched (not Berean position-based) — correct or absent, never wrong. Toggle button (א) in passage header.

### Removed/Deprecated
- **Topical Study (old implementation)** - Replaced by curated Topical Index (see Features Complete)

---

## To Do

### Data Quality — Complete (Apr 2026)
- **Timelines** - Expanded to 380 entries (was ~223). All verse references validated against ESV dataset.
- **OT→NT Quotations** - Rebuilt from UBS4 apparatus (Felix Just, S.J.). 225 OT sources / 301 NT references. Replaced previous mixed-source data with single authoritative scholarly source. Allusions excluded — explicit quotations only.
- **Strong's alignment** - Berean position mapping dropped for word display. Now uses gloss-based matching (lexicon gloss matched directly against ESV words). Berean data still used for verse-level Strong's association, but word-level placement is gloss-driven.

#### Advanced Study Features
- **Manuscript Evidence** - Which manuscripts contain which verses, textual variants
- **Books Metadata** - Authorship claims, attribution history, date ranges, audience
- **People Index** - Comprehensive list of all ~3,000+ named individuals
- **Entity Catalogs** - Animals, Cities, Regions, Waters, Mountains with all references
- **Speech Attribution** - Tag every direct quote with speaker
- **Prophecy-Fulfillment Links** - OT prophecies → NT fulfillment claims
- **Hebrew/Greek Toggle** - ✅ Done (interlinear with gloss matching). Future: improve coverage with better inflection handling
- **Literary Structures** - Chiasms, acrostics, parallelisms

#### Refactoring
- **Remove Maps** - Replace with structured geographic data (journeys, distances from scripture)

#### Journey Visualization (future — layers on Places catalog)
- **Journey data** - Build dataset of biblical journeys: who traveled, waypoints in order, verse references per leg (e.g., Paul: Antioch → Iconium → Lystra, Acts 13-14)
- **Map renderer** - Plot journey waypoints on a real map using place coordinates from catalog
- **Route drawing** - Connect waypoints to show travel routes
- Requires: places catalog (foundation), journey dataset (new), map tile source (internet-dependent)

---

## Data Files

| File | Description |
|------|-------------|
| `bible_verses.json` | All ESV verses |
| `strongs_data.json` | Strong's lexicon + recovered ESV alignment (262,354 mappings, 88.1%) |
| `strongs_esv_alignment.json` | Raw Berean alignment (original, pre-validation) |
| `strongs_esv_alignment_validated.json` | KJV-validated alignment (223,930 mappings, 75.2%) |
| `strongs_esv_alignment_recovered.json` | Validated + recovered alignment (262,354 mappings, 88.1%) |
| `strongs_kjv_alignment.json` | Standalone KJV word→Strong's alignment (327,899 mappings) |
| `verified_connections.json` | Cross-references (~1270) |
| `definitions.json` | 67 scripture-defined terms |
| `topical_index.json` | Curated English topical index with sense disambiguation |
| `topical_clusters.json` | OLD - deprecated, do not use |
| Other data files | See Feature Status above |

### External Data Sources

| Location | Description |
|----------|-------------|
| `data_sources/berean/bsb_tables.xlsx` | Berean Standard Bible interlinear (source for alignment) |
| `data_sources/kjv/*.json` | KJV with inline Strong's (gold standard for validation) |

---

## To Run

```bash
python serve.py
# Open http://localhost:8000/reader_modular.html
```
