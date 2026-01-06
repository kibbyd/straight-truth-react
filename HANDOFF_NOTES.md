# Bible Reader - Handoff Notes

## Latest Session Summary (Jan 5, 2025)

**Completed:**
- Added Definitions column with 67 scripture-defined terms
  - Categories: Salvation (19), God's Nature (12), Character (9), I AM Statements (7), This Is... (7), Sin & Salvation (5), Wisdom (5), Commands (3)
  - Each term grounded in Strong's number with original language
  - Clickable Strong's numbers → opens Strong's column
  - Clickable verse refs → navigates to verse

- Added Topical Study column with 23 discovered clusters
  - 20 curated theological clusters (Grace/Faith/Salvation, Love/Mercy/Compassion, Sin/Iniquity, etc.)
  - 3 algorithmically discovered clusters from co-occurrence analysis
  - Each cluster shows Strong's terms + shared verses
  - Clickable terms → opens Strong's column
  - Script at `scripts/analyze_topics.py` for regenerating clusters

- **Added Strong's Corrections Layer** (critical data quality fix)
  - Discovered upstream STEPBible TTESV data has word-level alignment errors
  - Example: H1697 (davar=word) incorrectly mapped to English "of" in Gen 12:17
  - Created `public/data/strongs_corrections.json` with 1,878 tag removals across 1,362 verses
  - Corrections applied on load via `applyStrongsCorrections()` in dataLoader.js
  - Principle: "If it cannot be confirmed, validated, or evidenced - remove it"
  - Content Strong's checked: H1697, H3068, H0430, H0776, H1004, H3117, H5971, H4428, H1121, H0802, H0376, H3027, H5869, H3820, H8034, H1870, H6440, H7200, H8085, H5414
  - Function words flagged: of, the, a, an, in, on, to, for, and, or, but, with, by, from, at, as, is, was, be, are, were, it, he, she, they, his, her, its, their, this, that, these, those

---

## Previous Session Summary (Jan 1, 2025)

**Completed:**
- Added Archaeology column with 44 discoveries across 4 categories:
  - Excavated Sites (15): Jericho, Megiddo, Hazor, Jerusalem, Samaria, Capernaum, Bethsaida, Lachish, Gezer, Dan, Nineveh, Babylon, Ur, Shiloh, Qumran
  - Artifacts (11): Tel Dan Stele, Siloam Inscription, Cyrus Cylinder, Black Obelisk, Taylor Prism, Mesha Stele, Ketef Hinnom Scrolls, Pilate Stone, Caiaphas Ossuary, Pool of Siloam, Hezekiah Seal
  - Ancient Manuscripts (10): Dead Sea Scrolls, Codex Sinaiticus, Codex Vaticanus, P52 Rylands, Nash Papyrus, Chester Beatty, Bodmer Papyri, Septuagint, Masoretic Text, Samaritan Pentateuch
  - Inscriptions (8): Merneptah Stele, Lachish Letters, Arad Ostraca, Samaria Ostraca, Gezer Calendar, YHWH inscriptions, Ekron Inscription, Balaam Inscription
- Each entry includes: discovery date, description, significance, key finds, biblical connection, scholarly notes, current location, key references
- Added Daily Life column with 32 topics (see previous session)
- Added Ancient Religions column with 13 religions (see previous session)

**Remaining Tasks:**
1. ~~Definitions - Let scripture define scripture~~ ✓ DONE
2. ~~Topical Study - Strong's co-occurrence clustering~~ ✓ DONE

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
- **Trace origins** - Don't just present conclusions. Show where beliefs started, who started them, and why. People don't believe things for no reason - show the reasoning chain. Let the reader see the evidence scholars and theologians used and decide for themselves: "Would I have made that connection?"

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
- **Timelines** - ~223 chronological entries (lifespans, reigns, periods, events, journeys, building projects) ⚠️ incomplete
- **Maps & Geography** - 68 maps with zoom/pan modal viewer (journeys, kingdoms, empires, temple plans) ⚠️ incomplete
- **Parallel Passages** - 214 parallel passage sets with 2+ accounts (Identical, Samuel/Chronicles, Kings/Chronicles, Synoptic Gospels)
- **Peoples & Cultures** - 51 entries: Israelites, Jews, 18 foreign peoples, 9 religious/political groups, 12 customs, 11 social subclasses (tax collectors, shepherds, lepers, etc.) ⚠️ 1 missing
- **Ancient Religions** - 13 religions: Mesopotamian (Sumerian, Babylonian, Assyrian), Egyptian, Canaanite (Baal, Phoenician), Neighbors (Philistine, Moabite, Ammonite, Edomite), Greco-Roman (Greek, Roman), Persian (Zoroastrianism)
- **Daily Life** - 32 topics: occupations (10), food (5), clothing (4), housing (2), family (3), commerce (2), agriculture (3), crafts (3)
- **Archaeology** - 44 discoveries: excavated sites (15), artifacts (11), manuscripts (10), inscriptions (8)
- **Definitions** - 67 scripture-defined terms grounded in Strong's numbers (Salvation, God's Nature, Character, I AM Statements, This Is..., Sin & Salvation, Wisdom, Commands)
- **Topical Study** - 23 clusters discovered through Strong's co-occurrence analysis (20 curated theological + 3 algorithmically discovered)
- **Strong's Corrections Layer** - 1,878 upstream data quality fixes removing unevidenced word-level alignments

### NOT YET IMPLEMENTED

#### Advanced Study
- ~~**Definitions** - Let scripture define scripture~~ ✓ DONE (67 terms)
- ~~**Topical Study** - Bottom-up Strong's co-occurrence clustering~~ ✓ DONE (23 clusters)
- **Manuscript Evidence** - Which manuscripts contain which verses, textual variants, raw data
- **Books Metadata** - For each of the 66 books: What the text claims about authorship (or doesn't). Who attributed it and when. Why they attributed it (the evidence/reasoning they cited). Date ranges, audience, setting, genre. Trace the origin of beliefs - people don't believe things for no reason. Show where ideas started, who started them, and why.
- **People Index** - Comprehensive alphabetical list of all ~3,000+ named individuals in the Bible. For each: name (English + Hebrew/Greek), meaning, who they were, key facts with refs, relationships, all verses where mentioned, extra-biblical sources (Josephus, archaeology, etc.). Currently fragmented across family_trees (169), kings (108), prophets (41). Consolidate and expand.
- **Entity Catalogs** - Comprehensive lists for: Animals (with literal/symbolic appearances), Cities, Countries/Regions, Towns/Villages, Seas, Rivers, Springs/Wells, Mountains. Currently have places (119), waters (32), mountains (30) - expand and reorganize with Hebrew/Greek names, meanings, all references.
- **Inline Measurements** - Tag all measurement occurrences in Bible text. User toggle: Original / Imperial / Metric. Real-time swap in text. E.g., "300 cubits" → "450 feet" or "137m". Cover length, weight, volume, currency, distance, time. Already have biblical_measures.json with conversions.
- **Speech Attribution** - Tag every direct quote with speaker. Filter by speaker: show everything God says, everything Jesus says, everything Satan says. ~10,000+ quoted speeches in scripture.
- **Prophecy-Fulfillment Links** - Link OT prophecies to NT claims of fulfillment. Not asserting fulfillment occurred - just showing where NT text claims to fulfill OT. Let reader evaluate the connection.
- **Hebrew/Greek Toggle** - Show original language text alongside English. Already have Strong's linked per word - render actual Hebrew/Greek. Helps students see word order, particles, structure.
- **Literary Structures** - Mark chiasms (ABBA patterns), acrostics (Psalm 119 = 22 sections by Hebrew letter), parallelisms in poetry. These exist in the text - just making them visible.
- **Questions in Scripture** - Catalog every question asked. Who asked, to whom, context, whether answered (and where). ~3,000+ questions in the Bible.
- **Commands/Imperatives** - Every command given in scripture. Who gave it, to whom, context. Categorize by giver (God, Jesus, apostles, etc.).
- **Promises** - Every promise made. By whom, to whom, conditional or unconditional, fulfillment references if claimed in text.
- **Numbers Catalog** - Every number mentioned. What it counts, context, refs. "40 days", "12 tribes", "7 churches", "666", etc.
- **Genealogy Visualization** - Interactive family tree viewer. Already have family_trees.json (169 persons) - render as navigable tree.
- **Chronological Reading Order** - Reorder passages by when events happened. Timeline view of scripture. Foundation exists in timelines.json.
- **Hebrew Calendar Integration** - Show which events happened on which Hebrew dates. Passover, Pentecost, feast days mapped to narrative.
- **Discourse Markers** - Who is speaking to whom in each passage. Audience identification throughout scripture.

#### Refactoring
- **Remove Maps** - Maps are interpretive (someone's visual representation). Replace with structured geographic data: journey sequences, place relationships, distances stated in scripture, regional groupings. Display the data, not artistic renderings.

#### Incomplete Data (from Jan 5 audit)
- **Timelines** - Currently ~223 entries, HANDOFF claimed 350+ (~127 short)
- **OT→NT Quotations** - Currently 236, scholarly consensus ~300-400 direct quotes
- **Festivals** - Currently 12, HANDOFF claimed 14 (2 missing)
- **Peoples/Cultures** - Currently 51, HANDOFF claimed 52 (1 missing)

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
- `festivals.json` - 12 sacred times with Hebrew calendar ⚠️ 2 missing (claimed 14)
- `family_trees.json` - 150+ persons from Adam to Jesus with genealogical connections
- `biblical_measures.json` - 49 biblical units with modern equivalents (length, volume, weight, currency, time, area)
- `timelines.json` - ~223 chronological entries (lifespans, reigns, periods, events, journeys, building projects) ⚠️ incomplete
- `maps.json` - 68 biblical maps organized by category (journeys, kingdoms, empires, periods, temple plans) ⚠️ 6 missing
- `parallel_passages.json` - 214 parallel passage sets with 2+ accounts (identical, samuel/chronicles, kings/chronicles, synoptic gospels)
- `peoples_cultures.json` - 51 entries: peoples, religious groups, customs, and social subclasses organized by category ⚠️ 1 missing
- `ancient_religions.json` - 13 ancient religions with pantheons, practices, worldviews, and biblical interactions
- `daily_life.json` - 32 daily life topics across 8 categories (occupations, food, clothing, housing, family, commerce, agriculture, crafts)
- `archaeology.json` - 44 archaeological discoveries across 4 categories (sites, artifacts, manuscripts, inscriptions)
- `question_master_list.md` - Master list of 1,055 questions across 25 categories (pending implementation)
- `definitions.json` - 67 scripture-defined terms grounded in Strong's numbers
- `topical_clusters.json` - 23 topic clusters discovered through Strong's co-occurrence analysis
- `strongs_corrections.json` - 1,878 corrections to upstream STEPBible word-level tagging errors

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