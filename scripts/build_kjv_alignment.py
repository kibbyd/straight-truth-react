"""
Build standalone KJV word→Strong's alignment.

Parses all 66 KJV book JSON files and extracts word-level Strong's mappings.
Output format matches ESV alignment for consistency.

Output:
- public/data/strongs_kjv_alignment.json  (word-level mappings)
- scripts/kjv_alignment_report.json       (stats)
"""

import json
import re
from pathlib import Path
from collections import defaultdict

BASE = Path(__file__).parent.parent
KJV_DIR = BASE / "data_sources" / "kjv"
OUTPUT_PATH = BASE / "public" / "data" / "strongs_kjv_alignment.json"
REPORT_PATH = BASE / "scripts" / "kjv_alignment_report.json"

# KJV book abbreviations -> standard abbreviations (ESV-compatible)
KJV_TO_STD_BOOK = {
    "Jhn": "Joh",
    "Rth": "Rut",
    "Jde": "Jud",
    "Phl": "Php",
}

SKIP_FILES = {"lexicon.json", "books.json", "chapter_count.json"}


def parse_kjv_json(book_file):
    """Parse a KJV book file. Falls back to regex if JSON is broken.

    Returns dict: {"Gen|1|1": "In the beginning[H7225]...", ...}
    """
    with open(book_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Try normal JSON first
    try:
        data = json.loads(content)
        result = {}
        for book_key, chapters in data.items():
            for chapter_key, verses in chapters.items():
                for verse_key, fields in verses.items():
                    parts = verse_key.split("|")
                    if len(parts) == 3:
                        result[verse_key] = fields.get("en", "")
        return result
    except (json.JSONDecodeError, AttributeError):
        pass

    # Fallback: regex extraction
    result = {}
    pattern = r'"([A-Za-z0-9]+\|\d+\|\d+)":\s*\{\s*"en":\s*"((?:[^"\\]|\\.)*)"'
    for match in re.finditer(pattern, content):
        verse_key = match.group(1)
        en_text = match.group(2)
        en_text = en_text.replace('\\"', '"').replace('\\\\', '\\')
        result[verse_key] = en_text

    return result


def extract_word_mappings(en_text):
    """Extract word-level Strong's mappings from KJV inline text.

    Input:  "In the beginning[H7225] God[H430] created[H1254][H853] the heaven[H8064]"
    Output: [{"pos": 2, "strong": "H7225", "word": "beginning"}, ...]

    Handles:
    - Multiple Strong's per word: created[H1254][H853]
    - Punctuation before brackets: form,[H8414]
    - Italicized words: <em>was</em>
    """
    # Strip <em> tags but track which words were italicized
    text = re.sub(r'<em>(.*?)</em>', r'\1', en_text)

    tokens = text.split()
    mappings = []

    for pos, token in enumerate(tokens):
        # Find all Strong's numbers in this token
        strongs = re.findall(r'\[([HG]\d+)\]', token)
        if not strongs:
            continue

        # Extract the word (everything before the first '[')
        bracket_idx = token.index('[')
        word = token[:bracket_idx]

        # Strip trailing punctuation from word
        word = word.rstrip('.,;:!?"\'-)')
        # Strip leading punctuation
        word = word.lstrip('"\'-(')

        if not word:
            continue

        # Normalize Strong's numbers: H430 -> H0430
        for s in strongs:
            prefix = s[0]
            num = s[1:]
            normalized = f"{prefix}{int(num):04d}"
            mappings.append({
                "pos": pos,
                "strong": normalized,
                "word": word
            })

    return mappings


def build_alignment():
    print("Building KJV word-level Strong's alignment...")
    print("=" * 60)

    alignment = {}
    per_book = defaultdict(lambda: {"verses": 0, "mappings": 0, "words_without_strongs": 0})
    total_verses = 0
    total_mappings = 0
    total_kjv_verses = 0

    book_files = sorted(KJV_DIR.glob("*.json"))

    for book_file in book_files:
        if book_file.name in SKIP_FILES:
            continue

        verses = parse_kjv_json(book_file)
        books_in_file = set()

        for verse_key, en_text in verses.items():
            parts = verse_key.split("|")
            if len(parts) != 3:
                continue

            book_abbrev, chapter, verse = parts
            books_in_file.add(book_abbrev)
            total_kjv_verses += 1

            # Map to standard abbreviation
            std_abbrev = KJV_TO_STD_BOOK.get(book_abbrev, book_abbrev)
            std_key = f"{std_abbrev}.{chapter}.{verse}"

            mappings = extract_word_mappings(en_text)

            if mappings:
                alignment[std_key] = mappings
                total_verses += 1
                total_mappings += len(mappings)
                per_book[std_abbrev]["verses"] += 1
                per_book[std_abbrev]["mappings"] += len(mappings)

                # Count words without Strong's in this verse
                word_count = len(en_text.split())
                tagged_count = len(set(m["pos"] for m in mappings))
                per_book[std_abbrev]["words_without_strongs"] += (word_count - tagged_count)

        books_str = ", ".join(sorted(books_in_file))
        book_verses = sum(1 for k in alignment if k.startswith(f"{KJV_TO_STD_BOOK.get(list(books_in_file)[0], list(books_in_file)[0])}.")) if books_in_file else 0
        print(f"  {book_file.name:10s} [{books_str}]: processed")

    # Build report
    report = {
        "summary": {
            "total_kjv_verses": total_kjv_verses,
            "verses_with_strongs": total_verses,
            "total_word_mappings": total_mappings,
            "avg_mappings_per_verse": round(total_mappings / total_verses, 1) if total_verses else 0,
        },
        "per_book": {}
    }

    for book in sorted(per_book.keys()):
        stats = per_book[book]
        avg = round(stats["mappings"] / stats["verses"], 1) if stats["verses"] else 0
        report["per_book"][book] = {
            "verses": stats["verses"],
            "mappings": stats["mappings"],
            "avg_per_verse": avg,
        }

    # Print summary
    print()
    print("=" * 60)
    print("KJV ALIGNMENT RESULTS")
    print("=" * 60)
    print(f"Total KJV verses:                  {total_kjv_verses:,}")
    print(f"Verses with Strong's:              {total_verses:,}")
    print(f"Total word-Strong's mappings:      {total_mappings:,}")
    print(f"Avg mappings per verse:            {report['summary']['avg_mappings_per_verse']}")
    print()

    # Book summary
    print("Per-book mapping counts (top 10):")
    book_counts = [(b, s["mappings"]) for b, s in report["per_book"].items()]
    book_counts.sort(key=lambda x: x[1], reverse=True)
    for book, count in book_counts[:10]:
        verses = per_book[book]["verses"]
        print(f"  {book:5s}: {count:6,} mappings across {verses:,} verses")

    # Save
    print(f"\nSaving KJV alignment to {OUTPUT_PATH}")
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(alignment, f, ensure_ascii=False)

    print(f"Saving report to {REPORT_PATH}")
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print("\nDone.")
    return alignment


if __name__ == "__main__":
    build_alignment()
