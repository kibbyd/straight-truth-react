"""
Validate ESV Strong's alignment against KJV Strong's data.

KJV is the original Strong's reference text. If a Strong's number doesn't
appear in KJV for a given verse, we drop it from our ESV alignment.

Principle: No data is better than wrong data.

Outputs:
- validated alignment (only confirmed mappings)
- validation report (stats, dropped entries, per-book breakdown)
"""

import json
import re
from pathlib import Path
from collections import defaultdict

BASE = Path(__file__).parent.parent
ESV_ALIGNMENT_PATH = BASE / "public" / "data" / "strongs_esv_alignment.json"
KJV_DIR = BASE / "data_sources" / "kjv"
OUTPUT_PATH = BASE / "public" / "data" / "strongs_esv_alignment_validated.json"
REPORT_PATH = BASE / "scripts" / "kjv_validation_report.json"
DROPPED_PATH = BASE / "scripts" / "kjv_validation_dropped.json"

# KJV book abbreviations -> ESV alignment abbreviations
# Only entries where they differ
KJV_TO_ESV_BOOK = {
    "Jhn": "Joh",
    "Rth": "Rut",
    "Jde": "Jud",
    "Phl": "Php",  # Philippians - KJV uses Phl, ESV alignment uses Php
    "Sng": "Sng",  # Same, but may not exist in ESV alignment
}


def parse_kjv_strongs(text):
    """Extract all Strong's numbers from KJV inline text.

    Format: word[H1234] or word[H1234][H5678]
    Returns a set of Strong's numbers like {'H1234', 'H5678'}
    """
    # Match [H####] or [G####] patterns
    matches = re.findall(r'\[([HG]\d+)\]', text)
    # Normalize: ensure 4-digit padding (H776 -> H0776)
    normalized = set()
    for m in matches:
        prefix = m[0]  # H or G
        num = m[1:]
        normalized.add(f"{prefix}{int(num):04d}")
    return normalized


def parse_kjv_json(book_file):
    """Parse a KJV book file. Falls back to regex extraction if JSON is broken.

    Some files have unescaped quotes in non-English translations that break
    JSON parsing. We only need the English text, so regex works fine as fallback.

    Returns dict: {"Gen|1|1": "In the beginning[H7225]...", ...}
    """
    with open(book_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Try normal JSON first
    try:
        data = json.load(open(book_file, "r", encoding="utf-8"))
        result = {}
        # Navigate nested structure: {"Gen": {"Gen|1": {"Gen|1|1": {"en": ...}}}}
        for book_key, chapters in data.items():
            for chapter_key, verses in chapters.items():
                for verse_key, fields in verses.items():
                    parts = verse_key.split("|")
                    if len(parts) == 3:
                        result[verse_key] = fields.get("en", "")
        return result
    except (json.JSONDecodeError, AttributeError):
        pass

    # Fallback: regex extraction of verse keys and English text
    # Pattern: "Book|ch|vs": {"en": "text...",
    result = {}
    pattern = r'"([A-Za-z0-9]+\|\d+\|\d+)":\s*\{\s*"en":\s*"((?:[^"\\]|\\.)*)"'
    for match in re.finditer(pattern, content):
        verse_key = match.group(1)
        en_text = match.group(2)
        # Unescape JSON string escapes
        en_text = en_text.replace('\\"', '"').replace('\\\\', '\\')
        result[verse_key] = en_text

    return result


def load_kjv_verse_strongs():
    """Load all KJV books and build verse -> set of Strong's numbers mapping.

    Returns dict like: {"Gen.1.1": {"H7225", "H0430", "H1254", ...}, ...}
    """
    kjv_data = {}
    book_files = sorted(KJV_DIR.glob("*.json"))

    for book_file in book_files:
        if book_file.name in ("lexicon.json", "books.json", "chapter_count.json"):
            continue

        verses = parse_kjv_json(book_file)

        verse_count = 0
        books_in_file = set()
        for verse_key, en_text in verses.items():
            parts = verse_key.split("|")
            if len(parts) != 3:
                continue

            book_abbrev, chapter, verse = parts
            books_in_file.add(book_abbrev)

            # Map to ESV abbreviation if different
            esv_abbrev = KJV_TO_ESV_BOOK.get(book_abbrev, book_abbrev)
            esv_key = f"{esv_abbrev}.{chapter}.{verse}"

            strongs = parse_kjv_strongs(en_text)
            if strongs:
                kjv_data[esv_key] = strongs
                verse_count += 1

        books_str = ", ".join(sorted(books_in_file))
        print(f"  {book_file.name:10s} [{books_str}]: {verse_count} verses with Strong's")

    return kjv_data


def validate():
    print("Loading KJV Strong's data...")
    kjv_strongs = load_kjv_verse_strongs()
    print(f"KJV: {len(kjv_strongs)} verses with Strong's numbers\n")

    print("Loading ESV alignment...")
    with open(ESV_ALIGNMENT_PATH, "r", encoding="utf-8") as f:
        esv_alignment = json.load(f)
    print(f"ESV: {len(esv_alignment)} verses with alignment\n")

    # Stats
    total_mappings = 0
    confirmed_mappings = 0
    dropped_mappings = 0
    no_kjv_verse = 0  # ESV verse not found in KJV at all

    per_book = defaultdict(lambda: {"total": 0, "confirmed": 0, "dropped": 0, "no_kjv": 0})
    dropped_details = []  # For review

    validated = {}

    for verse_key, word_list in esv_alignment.items():
        book = verse_key.split(".")[0]
        kjv_strongs_for_verse = kjv_strongs.get(verse_key, None)

        confirmed_words = []

        for word_entry in word_list:
            total_mappings += 1
            per_book[book]["total"] += 1

            strong_num = word_entry["strong"]

            if kjv_strongs_for_verse is None:
                # No KJV data for this verse at all
                no_kjv_verse += 1
                dropped_mappings += 1
                per_book[book]["no_kjv"] += 1
                per_book[book]["dropped"] += 1
                dropped_details.append({
                    "verse": verse_key,
                    "word": word_entry.get("word", ""),
                    "strong": strong_num,
                    "reason": "no_kjv_verse"
                })
                continue

            if strong_num in kjv_strongs_for_verse:
                # Confirmed: KJV has this Strong's number in this verse
                confirmed_words.append(word_entry)
                confirmed_mappings += 1
                per_book[book]["confirmed"] += 1
            else:
                # Not in KJV for this verse - drop it
                dropped_mappings += 1
                per_book[book]["dropped"] += 1
                dropped_details.append({
                    "verse": verse_key,
                    "word": word_entry.get("word", ""),
                    "strong": strong_num,
                    "reason": "not_in_kjv",
                    "kjv_has": sorted(kjv_strongs_for_verse)
                })

        if confirmed_words:
            validated[verse_key] = confirmed_words

    # Build report
    confirm_pct = (confirmed_mappings / total_mappings * 100) if total_mappings else 0
    drop_pct = (dropped_mappings / total_mappings * 100) if total_mappings else 0

    report = {
        "summary": {
            "total_esv_mappings": total_mappings,
            "confirmed": confirmed_mappings,
            "confirmed_pct": round(confirm_pct, 1),
            "dropped": dropped_mappings,
            "dropped_pct": round(drop_pct, 1),
            "esv_verses_before": len(esv_alignment),
            "esv_verses_after": len(validated),
            "verses_lost": len(esv_alignment) - len(validated),
            "no_kjv_verse_count": no_kjv_verse,
        },
        "per_book": {}
    }

    for book in sorted(per_book.keys()):
        stats = per_book[book]
        pct = round(stats["confirmed"] / stats["total"] * 100, 1) if stats["total"] else 0
        report["per_book"][book] = {
            "total": stats["total"],
            "confirmed": stats["confirmed"],
            "dropped": stats["dropped"],
            "no_kjv": stats["no_kjv"],
            "confirmed_pct": pct
        }

    # Print summary
    print("=" * 60)
    print("VALIDATION RESULTS")
    print("=" * 60)
    print(f"Total ESV word-Strong's mappings:  {total_mappings:,}")
    print(f"Confirmed by KJV:                  {confirmed_mappings:,} ({confirm_pct:.1f}%)")
    print(f"Dropped (not in KJV):              {dropped_mappings:,} ({drop_pct:.1f}%)")
    print(f"  - No KJV verse found:            {no_kjv_verse:,}")
    print(f"  - Strong's not in KJV verse:     {dropped_mappings - no_kjv_verse:,}")
    print(f"Verses before:                     {len(esv_alignment):,}")
    print(f"Verses after:                      {len(validated):,}")
    print()

    # Worst books
    print("Per-book confirmation rates (lowest first):")
    book_rates = [(b, s["confirmed_pct"]) for b, s in report["per_book"].items()]
    book_rates.sort(key=lambda x: x[1])
    for book, pct in book_rates[:10]:
        stats = per_book[book]
        print(f"  {book:5s}: {pct:5.1f}%  ({stats['confirmed']:,}/{stats['total']:,})")
    print("  ...")
    for book, pct in book_rates[-5:]:
        stats = per_book[book]
        print(f"  {book:5s}: {pct:5.1f}%  ({stats['confirmed']:,}/{stats['total']:,})")

    # Save outputs
    print(f"\nSaving validated alignment to {OUTPUT_PATH}")
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(validated, f, ensure_ascii=False)

    print(f"Saving report to {REPORT_PATH}")
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"Saving dropped details to {DROPPED_PATH}")
    with open(DROPPED_PATH, "w", encoding="utf-8") as f:
        json.dump(dropped_details[:1000], f, indent=2, ensure_ascii=False)
    if len(dropped_details) > 1000:
        print(f"  (truncated to first 1000 of {len(dropped_details):,} dropped entries)")

    print("\nDone.")


if __name__ == "__main__":
    validate()
