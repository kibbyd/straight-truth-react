"""
Validate all scripture references in timelines.json and ot_nt_quotations.json
against bible_verses.json to catch bad references.

Checks:
1. Every referenced verse actually exists in the ESV dataset
2. Book abbreviations are valid
3. Chapter/verse numbers are in range
4. Range references (e.g., Gen.1.1-3) have valid start and end
"""

import json
import re
from pathlib import Path
from collections import defaultdict

BASE = Path(__file__).parent.parent
VERSES_PATH = BASE / "public" / "data" / "bible_verses.json"
TIMELINES_PATH = BASE / "public" / "data" / "timelines.json"
QUOTATIONS_PATH = BASE / "public" / "data" / "ot_nt_quotations.json"


def load_verse_set():
    """Build set of all valid verse keys like 'Gen.1.1'."""
    with open(VERSES_PATH, "r", encoding="utf-8") as f:
        verses = json.load(f)

    verse_set = set()
    book_chapters = defaultdict(set)
    book_chapter_verses = defaultdict(set)

    for v in verses:
        key = f"{v['book']}.{v['chapter']}.{v['verse']}"
        verse_set.add(key)
        book_chapters[v['book']].add(v['chapter'])
        book_chapter_verses[f"{v['book']}.{v['chapter']}"].add(v['verse'])

    return verse_set, book_chapters, book_chapter_verses


def parse_ref(ref):
    """Parse a reference string and return list of verse keys to check."""
    results = []

    # Chapter-only range like "Exo.7-12"
    m = re.match(r'^([A-Za-z0-9]+)\.(\d+)-(\d+)$', ref)
    if m:
        book, ch_start, ch_end = m.group(1), int(m.group(2)), int(m.group(3))
        results.append(f"{book}.{ch_start}.1")
        return results, ref

    # Standard: Book.Chapter.Verse or Book.Chapter.Verse-Verse
    m = re.match(r'^([A-Za-z0-9]+)\.(\d+)\.(\d+)(?:-(\d+))?$', ref)
    if m:
        book, ch, vs_start = m.group(1), int(m.group(2)), int(m.group(3))
        vs_end = int(m.group(4)) if m.group(4) else vs_start
        for v in range(vs_start, vs_end + 1):
            results.append(f"{book}.{ch}.{v}")
        return results, ref

    # Cross-chapter range: Book.Chapter.Verse-Chapter.Verse
    m = re.match(r'^([A-Za-z0-9]+)\.(\d+)\.(\d+)-(\d+)\.(\d+)$', ref)
    if m:
        book = m.group(1)
        ch1, vs1 = int(m.group(2)), int(m.group(3))
        ch2, vs2 = int(m.group(4)), int(m.group(5))
        results.append(f"{book}.{ch1}.{vs1}")
        results.append(f"{book}.{ch2}.{vs2}")
        return results, ref

    # Single chapter ref like "Gen.1"
    m = re.match(r'^([A-Za-z0-9]+)\.(\d+)$', ref)
    if m:
        book, ch = m.group(1), int(m.group(2))
        results.append(f"{book}.{ch}.1")
        return results, ref

    return [], ref


def extract_refs_from_obj(obj, path=""):
    """Recursively extract all reference strings from a data structure."""
    refs = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in ("references", "reference"):
                if isinstance(v, list):
                    for r in v:
                        refs.append((r, path))
                elif isinstance(v, str):
                    refs.append((v, path))
            elif k in ("chapter_range",):
                if isinstance(v, str):
                    refs.append((v, path))
            else:
                refs.extend(extract_refs_from_obj(v, f"{path}.{k}"))
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            refs.extend(extract_refs_from_obj(item, f"{path}[{i}]"))
    return refs


def validate():
    print("Loading verse data...")
    verse_set, book_chapters, book_chapter_verses = load_verse_set()
    all_books = set(book_chapters.keys())
    print(f"  {len(verse_set):,} verses across {len(all_books)} books")

    errors = []
    warnings = []
    checked = 0

    # Validate timelines.json
    print("\nValidating timelines.json...")
    with open(TIMELINES_PATH, "r", encoding="utf-8") as f:
        timelines = json.load(f)

    timeline_refs = extract_refs_from_obj(timelines, "timelines")
    print(f"  Found {len(timeline_refs)} references")

    for ref_str, path in timeline_refs:
        checked += 1
        verse_keys, original = parse_ref(ref_str)

        if not verse_keys:
            warnings.append(f"UNPARSEABLE: {ref_str} at {path}")
            continue

        for vk in verse_keys:
            book = vk.split(".")[0]
            if book not in all_books:
                errors.append(f"BAD BOOK: '{book}' in {ref_str} at {path}")
                continue
            if vk not in verse_set:
                parts = vk.split(".")
                ch_key = f"{parts[0]}.{parts[1]}"
                if ch_key in book_chapter_verses:
                    max_verse = max(book_chapter_verses[ch_key])
                    errors.append(f"BAD VERSE: {vk} (max verse in {ch_key} is {max_verse}) from {ref_str} at {path}")
                else:
                    max_ch = max(book_chapters[book]) if book in book_chapters else 0
                    errors.append(f"BAD CHAPTER: {vk} (max chapter in {book} is {max_ch}) from {ref_str} at {path}")

    # Validate ot_nt_quotations.json
    print("\nValidating ot_nt_quotations.json...")
    with open(QUOTATIONS_PATH, "r", encoding="utf-8") as f:
        quotations = json.load(f)

    for i, q in enumerate(quotations["quotations"]):
        checked += 1
        ot_ref = q["ot"]
        verse_keys, _ = parse_ref(ot_ref)
        if not verse_keys:
            warnings.append(f"UNPARSEABLE OT: {ot_ref} at quotation[{i}]")
        else:
            for vk in verse_keys:
                book = vk.split(".")[0]
                if book not in all_books:
                    errors.append(f"BAD OT BOOK: '{book}' in {ot_ref} at quotation[{i}]")
                elif vk not in verse_set:
                    parts = vk.split(".")
                    ch_key = f"{parts[0]}.{parts[1]}"
                    if ch_key in book_chapter_verses:
                        max_verse = max(book_chapter_verses[ch_key])
                        errors.append(f"BAD OT VERSE: {vk} (max {max_verse}) from {ot_ref} at quotation[{i}]")
                    else:
                        errors.append(f"BAD OT CHAPTER: {vk} from {ot_ref} at quotation[{i}]")

        for nt_ref in q["nt"]:
            checked += 1
            verse_keys, _ = parse_ref(nt_ref)
            if not verse_keys:
                warnings.append(f"UNPARSEABLE NT: {nt_ref} at quotation[{i}] (OT: {ot_ref})")
            else:
                for vk in verse_keys:
                    book = vk.split(".")[0]
                    if book not in all_books:
                        errors.append(f"BAD NT BOOK: '{book}' in {nt_ref} at quotation[{i}] (OT: {ot_ref})")
                    elif vk not in verse_set:
                        parts = vk.split(".")
                        ch_key = f"{parts[0]}.{parts[1]}"
                        if ch_key in book_chapter_verses:
                            max_verse = max(book_chapter_verses[ch_key])
                            errors.append(f"BAD NT VERSE: {vk} (max {max_verse}) from {nt_ref} at quotation[{i}] (OT: {ot_ref})")
                        else:
                            errors.append(f"BAD NT CHAPTER: {vk} from {nt_ref} at quotation[{i}] (OT: {ot_ref})")

    # Report
    print(f"\n{'='*60}")
    print("VALIDATION RESULTS")
    print(f"{'='*60}")
    print(f"References checked: {checked}")
    print(f"Errors: {len(errors)}")
    print(f"Warnings: {len(warnings)}")

    if errors:
        print(f"\n--- ERRORS ---")
        for e in sorted(errors):
            print(f"  {e}")

    if warnings:
        print(f"\n--- WARNINGS ---")
        for w in sorted(warnings):
            print(f"  {w}")

    if not errors and not warnings:
        print("\nAll references valid.")

    return errors, warnings


if __name__ == "__main__":
    errors, warnings = validate()
    exit(1 if errors else 0)
