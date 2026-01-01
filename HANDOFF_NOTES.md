# Bible Reader - Handoff Notes

## Latest Session Summary (Jan 1, 2025)

**Completed:**
- Added Daily Life column with 32 topics across 8 categories:
  - Occupations & Trades (10): carpenter, shepherd, fisherman, tentmaker, farmer, potter, smith, scribe, tax collector, physician
  - Food & Drink (5): bread, wine, olive oil, fish, meals & feasts
  - Clothing & Dress (4): tunic, cloak, sandals, headcoverings
  - Homes & Buildings (2): Israelite house, village layout
  - Family & Marriage (3): marriage customs, children & family, inheritance
  - Trade & Commerce (2): markets & bazaars, weights & money
  - Agriculture & Farming (3): plowing & sowing, harvest & threshing, vineyards
  - Crafts & Manufacturing (3): weaving, pottery making, metalwork
- Each topic includes: description, period, details, biblical examples, archaeological evidence, key references
- Added Ancient Religions column with 13 religions (see previous session)

**Remaining Tasks:**
1. Archaeology - Artifacts, excavated sites, manuscript evidence
2. Definitions - Let scripture define scripture
3. Topical Study - Strong's co-occurrence clustering (detailed plan in this file)

---

## Current State

### Modular UI (`reader_modular.html`)
A column-based Bible study interface with:

**Working Features:**
- **Passage columns** (max 2) - Parent passage + cross-reference passage
- **Cross-references column** - Shows connections grouped by type; clicking opens side-by-side passage comparison
- **Notes column** - Study notes with verse/chapter/general pinning, "View All" toggle
- **Search column** - Full-text search with highlighted results
- **Strong's word study column** - Click any word to see definition + all occurrences
- **Catalogues** - Miracles, Parables, Prayers, Names of God, OT→NT Quotations, Covenants, Calendar & Festivals, Family Trees
- **Drag-to-reorder** columns
- **Role highlighting** - Kings 👑, prophets 📜, places 📍, waters 💧, mountains ⛰️
- **Verse indicators** - 🔗 for cross-references, 📝 for notes
- **Layout persistence** - Saves to localStorage

### Server (`serve.py`)
Combined static file server + Notes API with SQLite backend.

**API Endpoints:**
- `GET /api/notes` - List all notes
- `GET /api/notes?id=X` - Get single note
- `GET /api/notes?search=query` - Search notes
- `POST /api/notes` - Create/update note
- `DELETE /api/notes?id=X` - Delete note
- `GET /api/notes/export` - Export as Markdown

---

## To Run
```bash
python serve.py
# Open http://localhost:8000/reader_modular.html
```

---

## Design Philosophy

**Core Premise**: Provide masters-level biblical scholarship in layman's terms. Completely fact and evidence-based with NO interpretation added. We show threads, connections, and history - it is up to the reader to make their own conclusions.

### Guiding Principles
- Present facts, not opinions
- Show connections without explaining meaning
- Reference historical evidence and sources
- Let the reader draw their own conclusions
- Academic rigor, accessible language
- **Unbiased presentation** - Show what the text says, even when it challenges common assumptions
- No theological agenda - present evidence as it exists in the text and history

### Language Rules
- ✅ "The text says..."
- ✅ "X is recorded in..."
- ✅ "Historical sources indicate..."
- ✅ "Unknown from scripture"
- ❌ "This means..."
- ❌ "This proves..."
- ❌ "Obviously..."
- ❌ "The correct view is..."

### UI Language Rules
- Use simple, clear language a layperson can understand
- Make relationships explicit (e.g., "Fathered Seth at 130" not "Age at son: 130")
- Avoid jargon or field-specific shorthand
- If meaning isn't clear without context, rewrite it

### Plain Language Rule (CRITICAL)
**No academic jargon.** Anyone should be able to read this app and draw insights without being separated by snobbish language. This is non-negotiable.

**Examples of violations:**
- ❌ "The divine realm was conceived as a clan headed by El"
- ❌ "Fertility was envisaged in seven-year cycles"
- ❌ "Mos maiorum ('way of the ancestors')"
- ❌ "A process scholars describe as 'acculturation' or 'creolization'"

**Correct approach:**
- ✅ "The gods were like a family. El was the father figure."
- ✅ "Life ran in seven-year cycles"
- ✅ "Old ways were best because they had been tested by time"
- ✅ "Over time they blended with local culture"

**The test:** If a 14-year-old with no biblical background can't understand it on first read, rewrite it.

### Reference Format

**Data format uses dots, display uses colons:**
- Data: `Gen.5.3` → Display: "Genesis 5:3"
- Data: `Joh.20.30-31` → Display: "John 20:30-31"

**Single verse:**
```json
"references": ["Gen.5.3"]
```

**Verse range (same chapter):**
```json
"references": ["Gen.5.3-5"]
```

**Multiple verses:**
```json
"references": ["Gen.5.3", "Gen.5.8", "Exo.12.29"]
```

**Full chapter ranges (NOT verse references):**
When referencing entire chapters (like Exodus 35-40 for Tabernacle construction), use a separate field:
```json
"chapter_range": "Exo.35-40"
```
This displays as "Exodus chs. 35-40" — NOT clickable, just informational.

**NEVER do this:**
- ❌ `"references": ["Exo.35-40"]` — This is NOT a valid verse reference
- ❌ Inventing random verses just because they contain a keyword
- ❌ Picking arbitrary start/end verses to represent a chapter range

### Inline Scripture References (CRITICAL)

When text contains inline references like `(Gen 32:28)` or `(Deu 7:7-8)`, these MUST be parsed into clickable links using the `parseTextWithRefs()` helper function.

**Rule:** ALL text fields that display user-facing content should use `parseTextWithRefs(text, handleRefClick)` instead of just `{text}`.

**Fields that need parsing in PeoplesCulturesColumn:**
- `people.description`
- `people.biblical_role`
- `people.worldview[key]` values
- `people.social_structure[key]` values
- `people.customs[key]` values
- `people.values[key]` values
- `people.religion`
- `interaction.summary`
- `sg.note` (sub_groups)
- `figure.note` (key_figures)

**Pattern:** The regex matches `(Book Chapter)` or `(Book Chapter:Verse)` formats:
- ✅ `(Gen 32:28)` → Genesis 32:28
- ✅ `(Deu 7:7-8)` → Deuteronomy 7:7-8
- ✅ `(Dan 4)` → Daniel 4
- ✅ `(2Ki 5:1-14)` → 2 Kings 5:1-14

**When adding new columns or data:** Always check if text fields contain inline references and apply `parseTextWithRefs()` accordingly.

---

## Feature Status

### COMPLETE
- **Passage columns** - Bible text with Strong's word clicking
- **Cross-references column** - Connections grouped by type
- **Notes column** - Verse/chapter/general pinning with SQLite backend
- **Search column** - Full-text search with highlighting
- **Strong's word study** - Lexicon definitions + all occurrences
- **Catalogues** - Miracles, Parables, Prayers, Names of God, OT→NT Quotations, Covenants, Calendar & Festivals, Family Trees
- **Questions** - 1,205 questions across 25+ categories
- **Glossary** - Doctrinal terms and definitions
- **Metric Converter** - 49 biblical units across 7 categories
- **Timelines** - 350+ chronological entries (lifespans, reigns, periods, events, journeys, building projects)
- **Maps & Geography** - 74 maps with zoom/pan modal viewer (journeys, kingdoms, empires, temple plans)
- **Parallel Passages** - 214 parallel passage sets with 2+ accounts (Identical, Samuel/Chronicles, Kings/Chronicles, Synoptic Gospels)
- **Peoples & Cultures** - 52 entries: Israelites, Jews, 18 foreign peoples, 9 religious/political groups, 12 customs, 11 social subclasses (tax collectors, shepherds, lepers, etc.)
- **Ancient Religions** - 13 religions: Mesopotamian (Sumerian, Babylonian, Assyrian), Egyptian, Canaanite (Baal, Phoenician), Neighbors (Philistine, Moabite, Ammonite, Edomite), Greco-Roman (Greek, Roman), Persian (Zoroastrianism)
- **Daily Life** - 32 topics: occupations (10), food (5), clothing (4), housing (2), family (3), commerce (2), agriculture (3), crafts (3)

### NOT YET IMPLEMENTED

#### Historical Context
- **Archaeology** - Artifacts, excavated sites, manuscript evidence

#### Advanced Study
- **Definitions** - Let scripture define scripture (show all verses where term appears)
- **Topical Study** - Bottom-up Strong's co-occurrence clustering (see detailed plan below)

### Questions Section
Exhaustive catalogue of questions answered with fact and evidence:
- State clearly what IS known vs. UNKNOWN
- Cite biblical references
- Provide historical context with sources
- Never speculate or interpret

**TOTAL: 1,205 questions implemented ✓ COMPLETE**

Sources:
- `question_master_list.md` - Original 1,055 questions
- `questions.md` - Additional 150 difficult theological/philosophical questions

All categories implemented:
- Symbols & Types (38) ✓
- Cultural Background (37) ✓
- Women in Scripture (33) ✓
- Objects & Artifacts (29) ✓
- Parables (27) ✓
- Word Studies Greek (25) ✓
- Word Studies Hebrew (22) ✓
- Angels & Heavenly Beings (21) ✓
- Prayers (18) ✓
- Covenants (10) ✓
- Apparent Contradictions (15) ✓
- Difficult Passages (15) ✓
- Numbers (14) ✓
- Persons OT/NT (175+) ✓
- Places (70+) ✓
- Events OT/NT (95+) ✓
- Miracles (70+) ✓
- Commands/Laws (50+) ✓
- Prophecy (40+) ✓
- Chronology (30+) ✓
- Authorship (20+) ✓
- Archaeology (35+) ✓
- Doctrinal/Glossary (~235) ✓

**NEW - Difficult Theological Questions (150):**
- God & Nature (existence, attributes, Trinity) ✓
- Faith & Doubt (believing, doubting, assurance) ✓
- Salvation (how, security, grace vs works) ✓
- Jesus (identity, deity, humanity, resurrection) ✓
- Scripture (authority, interpretation, canon) ✓
- Prayer (effectiveness, unanswered prayer) ✓
- Suffering & Evil (theodicy, purpose of pain) ✓
- End Times (rapture, tribulation, millennium) ✓
- Church & Sacraments (baptism, communion, denominations) ✓
- Ethics (sexuality, marriage, life issues) ✓
- Entry-Level (basic faith questions) ✓

---

## Data Files
- `bible_verses.json` - All verses
- `verified_connections.json` - Cross-references (~1270 connections)
- `strongs_data.json` - Hebrew/Greek lexicon
- `kings_refined.json`, `prophets.json`, `waters.json`, `mountains.json`, `places.json` - Entity data
- `miracles_jesus.json` - 35 miracles with Gospel parallels
- `parables_jesus.json` - 35 parables grouped by theme
- `prayers_bible.json` - 43 prayers (OT/NT) with context
- `names_of_god.json` - 24 Hebrew/Greek names with Strong's links
- `ot_nt_quotations.json` - 236 OT passages quoted in NT
- `covenants.json` - 11 biblical covenants with terms and references
- `festivals.json` - 14 sacred times (12 Torah-commanded + 2 post-exilic) with Hebrew calendar
- `family_trees.json` - 150+ persons from Adam to Jesus with genealogical connections
- `biblical_measures.json` - 49 biblical units with modern equivalents (length, volume, weight, currency, time, area)
- `timelines.json` - 350+ chronological entries (lifespans, reigns, periods, events, journeys, building projects)
- `maps.json` - 74 biblical maps organized by category (journeys, kingdoms, empires, periods, temple plans)
- `parallel_passages.json` - 214 parallel passage sets with 2+ accounts (identical, samuel/chronicles, kings/chronicles, synoptic gospels)
- `peoples_cultures.json` - 52 entries: peoples, religious groups, customs, and social subclasses organized by category
- `ancient_religions.json` - 13 ancient religions with pantheons, practices, worldviews, and biblical interactions
- `daily_life.json` - 32 daily life topics across 8 categories (occupations, food, clothing, housing, family, commerce, agriculture, crafts)
- `question_master_list.md` - Master list of 1,055 questions across 25 categories (pending implementation)

Bible Reader — Questions & Evidence Model (Agent Handoff)
Core Rule

Questions are permitted. Conclusions are not.

The system must never resolve a question unless the text itself resolves it explicitly.

Purpose of Questions

Questions function as lenses over evidence, not as problems to solve.

A question:

Organizes relevant scripture and historical data

Surfaces real textual connections

Stops before abstraction or philosophical framing

The reader draws conclusions independently.

What the System Must Never Do

Declare a question “answered,” “unanswered,” or “unclear”

Assert doctrinal or philosophical categories not used by the text

Emphasize absence of information (“Scripture does not say…”)

Introduce implications (“this means,” “therefore,” “this proves”)

Silence is not data and must not be highlighted.

What the System Must Always Do

Present positive evidence only

Use primary sources (scripture, history, archaeology, language)

Show connections based on:

Shared language

Named entities

Recorded events

Historical attestation

Allow multiple passages to sit side-by-side without commentary

Question Handling Rules

A Question:

Contains only the question text and references

Links to evidence sets (scripture, lexical data, historical sources)

Does not contain an answer, status, or resolution

Questions exist even when the abstraction is modern; evidence remains textual.

Evidence Rules

Evidence must be:

Directly cited

Textually or historically verifiable

Presented in neutral language (“The text records…”)

Evidence may describe:

Actions

Events

Commands

Roles

Relationships

Judgments

Recorded outcomes

Evidence must not:

Infer motive

Assign metaphysical categories

Draw conclusions

Language Constraints (Hard Rules)

Allowed:

“The text records…”

“X is described as…”

“These passages are connected by…”

“The term appears in…”

Disallowed:

“This means…”

“This implies…”

“Therefore…”

“The correct view is…”

“Scripture does not say…”

Structural Model

Questions → index inquiry

Evidence Sets / Threads → hold factual statements with references

Scripture / History / Language → primary data only

No layer resolves meaning.

Design Outcome

The Bible Reader functions as a primary-source navigation system, not a commentary or apologetics argument.

The system:

Shows what exists

Shows how it connects

Stops

---

## FUTURE FEATURE: Topical Study Column (Scripture-Defined Topics)

### Concept

A topical study column that stays within the app's rules by letting **topics emerge from the linguistic data itself** rather than imposing theological categories.

### The Problem with Traditional Topical Studies

Traditional approaches risk interpretation:
- "What the Bible teaches about X" implies synthesis
- Grouping English words conflates different original language terms (e.g., "love" = agape, phileo, chesed, ahavah)
- Editorial curation introduces bias

### The Solution: Bottom-Up Discovery

Work backwards from the Strong's data:
1. Analyze which Strong's numbers co-occur in the same verses
2. Find natural semantic clusters that emerge from the data
3. Topics are **discovered**, not imposed
4. Present as: "These terms appear together in X verses" (observational, not interpretive)

### Data Foundation

Analysis of `strongs_data.json` reveals:
- **31,127 verses** with Strong's annotations
- **13,847 unique Strong's numbers** (Hebrew + Greek)
- **623,794 unique co-occurrence pairs**

### Natural Clusters Already Identified

Initial analysis found 8 major semantic domains:

| Cluster | Verses | Key Co-occurrences |
|---------|--------|-------------------|
| **Governance & Dynasty** | 3,354 | king + son + Israel |
| **Land & Settlement** | 2,708 | land + to come + dwell |
| **Divine Names** | 2,319 | God + LORD (1,146x) |
| **Speech & Communication** | 2,273 | to say + word (452x) |
| **Family Relationships** | 1,920 | father + son (240x) |
| **Actions & Agency** | 1,498 | to make + to take + to go |
| **Time & Duration** | 895 | day + year + this |
| **Grace & Salvation (NT)** | 223 | Jesus + grace + faith + believe |

### Key Finding

The **Grace/Faith/Love cluster is small (223 verses) but densely coherent** - these terms appear together far more than random chance would predict. Scripture itself clusters them.

### More Clusters to Discover

The initial analysis was high-level. Deeper analysis will reveal:
- Sub-clusters within major domains
- Theological concepts (sin, sacrifice, atonement, covenant)
- Body/heart language (hand, eye, heart, blood)
- Emotions (fear, joy, hope, sorrow)
- Worship/ritual (altar, temple, priest, offering)
- Creation (heaven, earth, water, light)
- Dozens more granular topics

### Implementation Plan

**Phase 1: Analysis Script**
- Build Python script to analyze strongs_data.json
- Find all co-occurrence pairs above threshold
- Cluster related Strong's numbers
- Output: `topical_clusters.json` with discovered topics

**Phase 2: Data Structure**
```json
{
  "topic": "Grace & Faith",
  "discovered": true,
  "strongs": ["G5485", "G4102", "G26", "G4100"],
  "verse_count": 223,
  "co_occurrences": [
    { "pair": ["G5485", "G4102"], "count": 46 },
    { "pair": ["G26", "G4102"], "count": 38 }
  ],
  "explicit_definitions": [
    { "ref": "Heb.11.1", "strongs": "G4102", "label": "Faith defined" },
    { "ref": "Eph.2.8-9", "strongs": ["G5485", "G4102"], "label": "Grace through faith" }
  ]
}
```

**Phase 3: TopicalStudyColumn Component**
- New column type: `topical`
- Shows topics organized by Strong's numbers
- Each topic expands to show verses grouped by original language term
- Links to Strong's column for deeper study
- No editorial commentary - just "these words appear together"

**Phase 4: Curation Layer (Optional)**
- Add Scripture's explicit definitions where they exist
- Example: Heb 11:1 explicitly defines faith
- These are flagged as "Scripture's definition" not human interpretation

### Why This Fits the App's Philosophy

| Traditional Topical Study | This Approach |
|--------------------------|---------------|
| Human decides topics | Data reveals topics |
| English word grouping | Original language grounding |
| "Bible teaches X about Y" | "These terms co-occur in X verses" |
| Interpretive framework | Observational presentation |
| Risk of bias | Linguistic evidence |

### Files to Create/Modify

- `scripts/analyze_topics.py` - Analysis script (new)
- `public/data/topical_clusters.json` - Discovered topics (new)
- `src/components/columns/TopicalStudyColumn.jsx` - UI component (new)
- `src/context/AppContext.jsx` - Add topical data loading
- `src/services/dataLoader.js` - Load topical clusters

### Estimated Effort

- Analysis script + initial clusters: 2-3 hours
- Column component: 2-3 hours
- Deeper cluster discovery: Ongoing (can expand over time)

### Status: PLANNED (Not Yet Implemented)