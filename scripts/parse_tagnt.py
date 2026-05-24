#!/usr/bin/env python3
"""
Parse STEPBible TAGNT TSV files into tagnt_variants.json.
Only keeps variant rows (where editions disagree).
Source: github.com/STEPBible/STEPBible-Data (CC BY 4.0)

TAGNT data line format (tab-separated):
  [0] Ref#pos=Type   e.g. "Mat.1.6#10=k"
  [1] Greek (translit)  e.g. "ὁ (ho)"
  [2] English         e.g. "the"
  [3] dStrong=Grammar e.g. "G3588=T-NSM"
  [4] Dict=Gloss      e.g. "ὁ=the/this/who"
  [5] Editions        e.g. "TR+Byz" or "NA28+NA27+Tyn+SBL+WH+Treg"
  [6] Meaning variant e.g. "Ἀμών (t=Amōn) Amon - G0300=N-ASM-P in: TR+Byz"
  [7] Spelling variant
  ...more columns (Spanish, sub-meaning, etc.)

Type codes:
  NKO / NK(O) / NK(o) = all editions agree -> skip
  k / K               = extra word in Traditional (TR/Byz) only
  n / N               = extra word in Ancient (NA) only
  o / O               = extra word in Other editions only
  N(k)O / N(K)O       = word in NA+Others, variant reading in Traditional
  NK(o) / NK(O)       = word in NA+Trad, variant in Others
  Lowercase = minor difference that may not affect translation
"""

import json
import os
import re
import sys
import urllib.request

URLS = [
    "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Translators%20Amalgamated%20OT%2BNT/TAGNT%20Mat-Jhn%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt",
    "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Translators%20Amalgamated%20OT%2BNT/TAGNT%20Act-Rev%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt",
]

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "data", "tagnt_variants.json")

# TAGNT book abbreviation -> app abbreviation
BOOK_MAP = {
    "Mat": "Mat", "Mrk": "Mar", "Luk": "Luk", "Jhn": "Joh",
    "Act": "Act", "Rom": "Rom", "1Co": "1Co", "2Co": "2Co",
    "Gal": "Gal", "Eph": "Eph", "Php": "Phi", "Col": "Col",
    "1Th": "1Th", "2Th": "2Th", "1Ti": "1Ti", "2Ti": "2Ti",
    "Tit": "Tit", "Phm": "Phm", "Heb": "Heb", "Jas": "Jam",
    "1Pe": "1Pe", "2Pe": "2Pe", "1Jn": "1Jo", "2Jn": "2Jo",
    "3Jn": "3Jo", "Jud": "Jud", "Rev": "Rev",
}

ALL_EDITIONS = ["NA28", "NA27", "SBL", "WH", "Treg", "Tyn", "TR", "Byz"]
CRITICAL_EDITIONS = {"NA28", "NA27", "SBL", "WH", "Treg", "Tyn"}
TRADITIONAL_EDITIONS = {"TR", "Byz"}

EDITIONS_META = {
    "NA28": {"name": "Nestle-Aland 28th", "plain": "Built from the earliest Greek copies we have. Used by most modern Bible translations."},
    "NA27": {"name": "Nestle-Aland 27th", "plain": "The previous version of the NA28. Nearly identical, with minor differences."},
    "SBL": {"name": "SBL Greek NT", "plain": "An edition by the Society of Biblical Literature, weighing the earliest copies."},
    "WH": {"name": "Westcott-Hort", "plain": "Published in 1881. Gave heavy weight to two of the oldest surviving copies."},
    "Treg": {"name": "Tregelles", "plain": "Published in 1879 by Samuel Tregelles, who compared hundreds of early copies by hand."},
    "Tyn": {"name": "Tyndale House", "plain": "Published in 2017 from Cambridge. Uses the single earliest copy available for each book."},
    "TR": {"name": "Textus Receptus", "plain": "The Greek text used to translate the King James Bible (1611). Based on copies available in the 1500s."},
    "Byz": {"name": "Byzantine Text", "plain": "Based on the largest number of surviving copies, most from the 800s\u20131400s AD."},
}

DISPUTED = [
    {"start": "Mar.16.9", "end": "Mar.16.20", "note": "Not in the earliest manuscripts. Some scholars consider these verses a later addition."},
    {"start": "Joh.7.53", "end": "Joh.8.11", "note": "Not in the earliest manuscripts. This passage about the woman caught in adultery may have been added later."},
]


def download(url, label):
    """Download a file, return its text content. Caches locally."""
    cache = os.path.join(os.path.dirname(__file__), f".tagnt_cache_{label}.tsv")
    if os.path.exists(cache):
        print(f"  Using cached {cache}")
        with open(cache, "r", encoding="utf-8") as f:
            return f.read()
    print(f"  Downloading {label}...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp:
        text = resp.read().decode("utf-8-sig")
    with open(cache, "w", encoding="utf-8") as f:
        f.write(text)
    return text


def parse_ref_and_type(col0):
    """Parse column 0: 'Mat.1.6#10=k' -> (book_app, chapter, verse, pos, type_str) or None."""
    if "=" not in col0:
        return None
    ref_part, type_str = col0.rsplit("=", 1)
    # Parse ref#pos
    if "#" in ref_part:
        ref, pos_str = ref_part.split("#", 1)
        # pos might have extra chars like leading zeros
        pos = int(re.sub(r'\D', '', pos_str) or '0')
    else:
        ref = ref_part
        pos = 0
    parts = ref.split(".")
    if len(parts) < 3:
        return None
    tagnt_book = parts[0]
    app_book = BOOK_MAP.get(tagnt_book)
    if not app_book:
        return None
    return app_book, parts[1], parts[2], pos, type_str


def classify_type(type_str):
    """Classify TAGNT type string into variant category.
    Returns: 'extra', 'reading', 'spelling', or None (skip).
    """
    if not type_str:
        return None
    t = type_str.strip()

    # All editions agree — skip
    if t in ("NKO", "NK(O)", "NK(o)", "NKo", "nKO", "nkO"):
        return None

    # Extra word: only in some editions, not present in others
    # k/K alone = extra in Traditional only; n/N alone = extra in Ancient only; o/O alone = extra in Others
    if t in ("k", "K", "K(o)", "K(O)", "k(o)", "k(O)"):
        return "extra"
    if t in ("n", "N", "N(o)", "N(O)", "n(o)", "n(O)"):
        return "extra"
    if t in ("o", "O"):
        return "extra"

    # Different reading: parenthesized letters indicate variant
    # N(k)O, N(K)O, N(k)(o), N(K)(O) = NA has word, Traditional differs
    # NK(o), NK(O), N(K)(o), nK(o) = NA+Trad have word, Others differ
    if "(" in t:
        return "reading"

    return None


def parse_editions_field(editions_str):
    """Parse editions field like 'NA28+NA27+Tyn+SBL+WH+Treg' into list."""
    if not editions_str:
        return []
    # Split on + and filter to known editions
    eds = []
    for part in editions_str.split("+"):
        part = part.strip()
        if part in ALL_EDITIONS or part == "KJV":
            eds.append(part)
    return eds


def parse_meaning_variant(meaning_var_str):
    """Parse meaning variant field like:
    'Ἀμών (t=Amōn) Amon - G0300=N-ASM-P in: TR+Byz'
    Returns dict with greek, translit, english, strong, in_editions or None.
    """
    if not meaning_var_str or not meaning_var_str.strip():
        return None
    s = meaning_var_str.strip()

    result = {"greek": "", "translit": "", "english": "", "strong": "", "in": []}

    # Extract "in: TR+Byz" at end
    in_match = re.search(r'\bin:\s*(.+?)$', s)
    if in_match:
        result["in"] = parse_editions_field(in_match.group(1))
        s = s[:in_match.start()].strip()

    # Extract Strong's number: "G0300=N-ASM-P" or "- G0300=N-ASM-P"
    strong_match = re.search(r'-?\s*(G\d+)\w*=', s)
    if strong_match:
        result["strong"] = strong_match.group(1)
        # English is between translit closing paren and the strong's dash
        before_strong = s[:strong_match.start()].strip().rstrip("-").strip()
    else:
        before_strong = s

    # Extract transliteration in parens: "(t=Amōn)" or "(o=heuron)"
    translit_match = re.search(r'\((?:[tnoTNO]=)?([^)]+)\)', before_strong)
    if translit_match:
        result["translit"] = translit_match.group(1)
        # Greek is before the paren
        result["greek"] = before_strong[:translit_match.start()].strip()
        # English is after the paren
        after = before_strong[translit_match.end():].strip()
        if after:
            result["english"] = after
    else:
        # Just take the first word as Greek
        result["greek"] = before_strong

    return result if (result["greek"] or result["english"]) else None


def parse_greek_translit(col1):
    """Parse column 1: 'ὁ (ho)' -> (greek, translit)."""
    match = re.match(r'^(.+?)\s*\(([^)]+)\)\s*$', col1)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    return col1.strip(), ""


def parse_strong(col3):
    """Parse dStrong from column 3: 'G3588=T-NSM' -> 'G3588'."""
    if "=" in col3:
        s = col3.split("=")[0].strip()
        # Remove trailing letter suffixes like G2424G
        m = re.match(r'(G\d+)', s)
        return m.group(1) if m else s
    return col3.strip()


def generate_note(entry):
    """Generate a plain-language explanation for a variant.
    Target: a 14-year-old with no biblical background can understand it on first read.
    """
    vtype = entry.get("type", "extra")
    english = entry.get("english", "")
    in_eds = set(entry.get("in", []))
    variant = entry.get("variant")

    word_desc = f"'{english}'" if english else f"'{entry.get('greek', '')}'"

    if vtype == "reading" and variant:
        var_eng = variant.get("english") or variant.get("greek", "")
        var_in = set(variant.get("in") or [])
        # Describe which group has which reading in plain terms
        if in_eds & CRITICAL_EDITIONS and var_in & TRADITIONAL_EDITIONS:
            return f"The earliest copies read {word_desc}. The copies behind the King James Bible read '{var_eng}'."
        elif in_eds & TRADITIONAL_EDITIONS and var_in & CRITICAL_EDITIONS:
            return f"The copies behind the King James Bible read {word_desc}. The earliest copies read '{var_eng}'."
        else:
            return f"Some copies read {word_desc}. Others read '{var_eng}'."

    if vtype == "extra":
        is_trad = bool(in_eds & TRADITIONAL_EDITIONS)
        is_crit = bool(in_eds & CRITICAL_EDITIONS)
        if is_trad and not is_crit:
            return f"This word ({word_desc}) only appears in the copies behind the King James Bible. It is not in the earliest copies."
        elif is_crit and not is_trad:
            return f"This word ({word_desc}) only appears in the earliest copies. It is not in the copies behind the King James Bible."
        else:
            ed_names = ", ".join(entry.get("in", [])[:3])
            return f"This word ({word_desc}) only appears in some copies ({ed_names}). Not all copies include it."

    if vtype == "spelling":
        if variant:
            return f"Same word, different spelling: '{entry.get('greek', '')}' vs '{variant.get('greek', '')}'."
        return f"Minor spelling difference in {word_desc}."

    return f"Not all copies agree on {word_desc}."


def process_file(text):
    """Process a TAGNT text file, return variant entries grouped by verse."""
    verses = {}
    lines = text.split("\n")
    row_count = 0
    variant_count = 0

    for line in lines:
        # Skip empty, comment, header lines
        if not line.strip():
            continue
        if line.startswith("#") or line.startswith("$"):
            continue
        if line.startswith("Word & Type") or line.startswith("Word &"):
            continue

        cols = line.split("\t")
        if len(cols) < 6:
            continue

        # Column 0 must look like a ref: Book.ch.vs#pos=Type
        col0 = cols[0].strip()
        if "=" not in col0 or "." not in col0:
            continue

        parsed = parse_ref_and_type(col0)
        if parsed is None:
            continue

        app_book, chapter, verse, pos, type_str = parsed
        row_count += 1

        # Classify — skip if all editions agree
        vtype = classify_type(type_str)
        if vtype is None:
            continue

        verse_id = f"{app_book}.{chapter}.{verse}"

        # Parse word data
        greek, translit = parse_greek_translit(cols[1]) if len(cols) > 1 else ("", "")
        english = cols[2].strip() if len(cols) > 2 else ""
        strong = parse_strong(cols[3]) if len(cols) > 3 else ""
        editions_str = cols[5].strip() if len(cols) > 5 else ""
        meaning_var_str = cols[6].strip() if len(cols) > 6 else ""
        spelling_var_str = cols[7].strip() if len(cols) > 7 else ""

        in_eds = parse_editions_field(editions_str)

        # Compute notIn as the complement
        not_in_eds = [e for e in ALL_EDITIONS if e not in in_eds]

        # Parse meaning variant
        variant = None
        if meaning_var_str:
            variant = parse_meaning_variant(meaning_var_str)
            if variant:
                vtype = "reading"
        elif spelling_var_str:
            # Parse spelling variant similarly
            variant = parse_meaning_variant(spelling_var_str)
            if variant:
                vtype = "spelling"

        # Build entry
        entry = {
            "pos": pos,
            "type": vtype,
            "greek": greek,
            "translit": translit,
            "english": english,
            "strong": strong,
            "in": in_eds,
            "notIn": not_in_eds,
            "variant": variant,
        }

        entry["note"] = generate_note(entry)

        if verse_id not in verses:
            verses[verse_id] = []
        verses[verse_id].append(entry)
        variant_count += 1

    print(f"  Processed {row_count} data rows, found {variant_count} variants in {len(verses)} verses")
    return verses


def main():
    print("TAGNT Parser - STEPBible Data (CC BY 4.0)")
    print()

    all_verses = {}

    for i, url in enumerate(URLS):
        label = "mat-jhn" if i == 0 else "act-rev"
        print(f"Processing {label}...")
        text = download(url, label)
        verses = process_file(text)
        all_verses.update(verses)

    print()
    print(f"Total: {len(all_verses)} verses with variants")

    output = {
        "editions": EDITIONS_META,
        "disputed": DISPUTED,
        "verses": all_verses,
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, separators=(",", ":"))

    size_mb = os.path.getsize(OUT) / (1024 * 1024)
    print(f"Written to {OUT} ({size_mb:.1f} MB)")

    # Spot checks
    print()
    print("Spot checks:")
    for check_id in ["Mat.1.6", "Mat.1.7", "Mat.1.25", "Mar.16.9"]:
        if check_id in all_verses:
            count = len(all_verses[check_id])
            first = all_verses[check_id][0]
            print(f"  {check_id}: {count} variants, first: {first.get('english','')} ({first.get('type','')})")
        else:
            print(f"  {check_id}: no variants found")


if __name__ == "__main__":
    main()
