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

### Strong's-to-ESV Alignment (Jan 11, 2025)
**Replaced broken STEPBible alignment with accurate Berean-based mapping.**

- STEPBible TTESV data had every word off by positions (unusable)
- Built new alignment using Berean Standard Bible interlinear data
- **78.5% of words accurately aligned** (296,460 / 377,869)
- **21.5% intentionally unmatched** (no ESV equivalent - honest gaps, not errors)
- Theological distinctions preserved:
  - Spirit vs spirit (Holy Spirit vs human spirit)
  - LORD vs Lord (YHWH vs Adonai)
  - GOD vs God
- Scripts: `scripts/align_pass1.py`, `scripts/align_pass2.py`
- Data: `public/data/strongs_data.json` (replaced), `public/data/strongs_esv_alignment.json`

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
- **Timelines** - ~223 chronological entries (⚠️ incomplete)
- **Maps & Geography** - 68 maps (⚠️ incomplete, should be replaced with structured data)
- **Parallel Passages** - 214 parallel passage sets
- **Peoples & Cultures** - 54 entries
- **Ancient Religions** - 13 religions
- **Daily Life** - 32 topics across 8 categories
- **Archaeology** - 44 discoveries across 4 categories
- **Definitions** - 67 scripture-defined terms grounded in Strong's numbers

### Removed/Deprecated
- **Topical Study (old implementation)** - Algorithmic clustering approach was flawed. Grouped all H7307/G4151 together, mixing Holy Spirit with human spirit. Needs complete redesign (see To Do).

---

## To Do

### HIGH PRIORITY: Topical Study Redesign

**Problem with old implementation:**
The algorithmic clustering grouped Strong's numbers together, but same Strong's number can have completely different meanings:
- H7307 (ruach) = Holy Spirit, human spirit, wind, breath
- G4151 (pneuma) = Holy Spirit, unclean spirit, human spirit
- G26 (agape) vs G5368 (phileo) = both "love" in English, different in Greek

Showing all H7307 verses together mixes "the Spirit of God" with "the spirit of Pul king of Assyria" - misleading.

**New Vision: English Topical Index**

An alphabetized list of English concepts that links to verses, with original language distinctions made clear.

**Structure:**
```
Love (agape) - G26 - unconditional love
  → John 3:16, Romans 5:8, 1 Cor 13:4-8, ...

Love (phileo) - G5368 - brotherly/friendship love
  → John 11:3, John 21:15-17, ...

Love (chesed) - H2617 - steadfast love/lovingkindness
  → Psalm 136 (26x), Exodus 34:6, ...

Spirit (Holy Spirit) - H7307/G4151 where ESV capitalizes "Spirit"
  → Genesis 1:2, Matthew 3:16, Acts 2:4, ...

spirit (human) - H7307/G4151 where ESV has lowercase "spirit"
  → Genesis 41:8, 1 Chronicles 5:26, ...

Word (logos) - G3056 - word as concept/message
  → John 1:1, John 1:14, ...

Word (rhema) - G4487 - spoken word/utterance
  → Matthew 4:4, Romans 10:17, ...
```

**Key principles:**
1. **English-first** - Users browse by English term, not Strong's numbers
2. **Original language distinctions** - Different Hebrew/Greek words shown separately
3. **Sense distinctions** - Same Strong's number split by ESV capitalization where meaningful
4. **Curated, not algorithmic** - Human-selected important terms, not auto-generated clusters
5. **Verse links** - Click any entry to see all verses (uses existing Strong's column infrastructure)

**Data structure:**
```json
{
  "topics": [
    {
      "english": "Love",
      "sense": "agape",
      "description": "unconditional love",
      "strongs": ["G26"],
      "filter": null
    },
    {
      "english": "Spirit",
      "sense": "Holy Spirit",
      "description": "Spirit of God",
      "strongs": ["H7307", "G4151"],
      "filter": "capitalize"  // Only verses where ESV has capital "Spirit"
    },
    {
      "english": "spirit",
      "sense": "human",
      "description": "human spirit",
      "strongs": ["H7307", "G4151"],
      "filter": "lowercase"  // Only verses where ESV has lowercase "spirit"
    }
  ]
}
```

**Implementation steps:**
1. Create curated `topical_index.json` with ~50-100 important terms
2. Update TopicalStudyColumn to display alphabetized list
3. Add filter logic to distinguish senses by ESV capitalization
4. Link to existing Strong's infrastructure for verse display

**Priority terms to include:**
- Love (agape, phileo, chesed, ahavah)
- Spirit/spirit (Holy Spirit vs human)
- Word (logos, rhema, dabar)
- Lord/LORD (adonai, YHWH)
- Faith (pistis, emunah)
- Grace (charis, chen)
- Sin (hamartia, chata, pesha, avon)
- Righteousness (dikaiosyne, tsedaqah)
- Salvation (soteria, yeshuah)
- Truth (aletheia, emet)
- Peace (eirene, shalom)
- Glory (doxa, kavod)
- Holy (hagios, qadosh)
- Fear (phobos, yirah) - fear of God vs terror
- Covenant (diatheke, berith)
- Mercy (eleos, racham)
- Soul (psyche, nephesh)
- Heart (kardia, lev)
- Flesh (sarx, basar)
- And many more...

---

### Other To Do Items

#### Data Quality
- **Timelines** - Currently ~223 entries, should be 350+
- **OT→NT Quotations** - Currently 236, scholarly consensus ~300-400

#### Advanced Study Features
- **Manuscript Evidence** - Which manuscripts contain which verses, textual variants
- **Books Metadata** - Authorship claims, attribution history, date ranges, audience
- **People Index** - Comprehensive list of all ~3,000+ named individuals
- **Entity Catalogs** - Animals, Cities, Regions, Waters, Mountains with all references
- **Speech Attribution** - Tag every direct quote with speaker
- **Prophecy-Fulfillment Links** - OT prophecies → NT fulfillment claims
- **Hebrew/Greek Toggle** - Show original language alongside English
- **Literary Structures** - Chiasms, acrostics, parallelisms

#### Refactoring
- **Remove Maps** - Replace with structured geographic data (journeys, distances from scripture)

---

## Data Files

| File | Description |
|------|-------------|
| `bible_verses.json` | All ESV verses |
| `strongs_data.json` | Strong's lexicon + verse alignment (Berean-based, Jan 2025) |
| `strongs_esv_alignment.json` | Raw alignment data |
| `verified_connections.json` | Cross-references (~1270) |
| `definitions.json` | 67 scripture-defined terms |
| `topical_clusters.json` | OLD - deprecated, do not use |
| Other data files | See Feature Status above |

---

## To Run

```bash
python serve.py
# Open http://localhost:8000/reader_modular.html
```
