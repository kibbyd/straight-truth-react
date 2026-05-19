"""
Deep content validation for timelines.json and ot_nt_quotations.json.

Three validation passes:
1. QUOTATION ACCURACY — Compare OT and NT verse text for actual textual overlap.
   Flag pairs with no meaningful word overlap (likely allusions, not explicit quotes).
2. EXPLICIT vs ALLUSION — Check if NT verse contains quotation markers
   ("it is written", "as the prophet said", "scripture says", etc.)
   or shares significant verbatim text with the OT source.
3. TIMELINE FACTUAL ACCURACY — For entries with numeric claims (years, days, months),
   check if the cited verse text actually contains that number.

Principle: No data is better than wrong data.
"""

import json
import re
from pathlib import Path
from collections import defaultdict

BASE = Path(__file__).parent.parent
VERSES_PATH = BASE / "public" / "data" / "bible_verses.json"
TIMELINES_PATH = BASE / "public" / "data" / "timelines.json"
QUOTATIONS_PATH = BASE / "public" / "data" / "ot_nt_quotations.json"

STOP_WORDS = {
    "the", "and", "of", "to", "in", "a", "is", "that", "for", "it",
    "with", "was", "on", "are", "be", "this", "have", "from", "or",
    "an", "but", "not", "you", "all", "can", "had", "her", "one",
    "our", "out", "his", "has", "he", "she", "they", "them", "will",
    "my", "no", "do", "if", "me", "so", "by", "up", "at", "we",
    "him", "your", "who", "what", "as", "i", "its", "let", "than",
    "into", "also", "shall", "said", "whom", "which", "their",
    "there", "then", "when", "were", "been", "upon", "did", "may",
    "am", "would", "could", "should", "about"
}

QUOTE_MARKERS = [
    r"it is written",
    r"it was written",
    r"as it is written",
    r"scripture says",
    r"the scripture",
    r"as the prophet",
    r"as he says",
    r"as god said",
    r"as it says",
    r"david says",
    r"moses said",
    r"moses wrote",
    r"moses writes",
    r"isaiah said",
    r"isaiah the prophet",
    r"isaiah says",
    r"jeremiah the prophet",
    r"the prophet says",
    r"saying",
    r"fulfilled",
    r"spoken by",
    r"spoken through",
    r"was said",
    r"have you not read",
    r"the law says",
    r"the prophet",
]


def load_verses():
    with open(VERSES_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    verses = {}
    for v in data:
        key = f"{v['book']}.{v['chapter']}.{v['verse']}"
        verses[key] = v["text"]
    return verses


def get_verse_text(verses, ref):
    m = re.match(r'^([A-Za-z0-9]+)\.(\d+)\.(\d+)(?:-(\d+))?$', ref)
    if not m:
        m = re.match(r'^([A-Za-z0-9]+)\.(\d+)\.(\d+)-(\d+)\.(\d+)$', ref)
        if m:
            book = m.group(1)
            ch1, vs1 = int(m.group(2)), int(m.group(3))
            ch2, vs2 = int(m.group(4)), int(m.group(5))
            texts = []
            for ch in range(ch1, ch2 + 1):
                v_start = vs1 if ch == ch1 else 1
                v_end = vs2 if ch == ch2 else 200
                for v in range(v_start, v_end + 1):
                    key = f"{book}.{ch}.{v}"
                    if key in verses:
                        texts.append(verses[key])
            return " ".join(texts) if texts else None
        return None

    book, ch, vs_start = m.group(1), int(m.group(2)), int(m.group(3))
    vs_end = int(m.group(4)) if m.group(4) else vs_start
    texts = []
    for v in range(vs_start, vs_end + 1):
        key = f"{book}.{ch}.{v}"
        if key in verses:
            texts.append(verses[key])
    return " ".join(texts) if texts else None


def content_words(text):
    words = re.findall(r'[a-z]+', text.lower())
    return set(w for w in words if w not in STOP_WORDS and len(w) > 2)


def word_overlap_score(text1, text2):
    words1 = content_words(text1)
    words2 = content_words(text2)
    if not words1 or not words2:
        return 0, 0.0
    shared = words1 & words2
    smaller = min(len(words1), len(words2))
    return len(shared), len(shared) / smaller * 100


def has_quote_marker(text):
    lower = text.lower()
    for marker in QUOTE_MARKERS:
        if re.search(marker, lower):
            return True
    return False


def check_number_in_text(number, text):
    text_lower = text.lower()
    int_num = int(number)

    # Check digit form
    if re.search(rf'\b{int_num}\b', text):
        return True

    # Common number words
    num_words = {
        1: ["one"], 2: ["two"], 3: ["three"], 4: ["four"], 5: ["five"],
        6: ["six"], 7: ["seven"], 8: ["eight"], 9: ["nine"], 10: ["ten"],
        11: ["eleven"], 12: ["twelve"], 13: ["thirteen"], 14: ["fourteen"],
        15: ["fifteen"], 16: ["sixteen"], 17: ["seventeen"], 18: ["eighteen"],
        19: ["nineteen"], 20: ["twenty"], 22: ["twenty-two"],
        23: ["twenty-three"], 24: ["twenty-four"], 25: ["twenty-five"],
        28: ["twenty-eight"], 29: ["twenty-nine"],
        30: ["thirty"], 31: ["thirty-one"], 33: ["thirty-three"],
        34: ["thirty-four"], 35: ["thirty-five"],
        37: ["thirty-seven"], 38: ["thirty-eight"],
        40: ["forty"], 41: ["forty-one"], 42: ["forty-two"],
        46: ["forty-six"], 50: ["fifty"], 52: ["fifty-two"],
        55: ["fifty-five"], 60: ["sixty"], 65: ["sixty-five"],
        70: ["seventy"], 75: ["seventy-five"], 77: ["seventy-seven"],
        80: ["eighty"], 85: ["eighty-five"], 86: ["eighty-six"],
        90: ["ninety"], 98: ["ninety-eight"], 99: ["ninety-nine"],
        100: ["hundred"], 110: ["hundred and ten"],
        120: ["hundred and twenty"], 127: ["hundred and twenty-seven"],
        130: ["hundred and thirty"], 133: ["hundred and thirty-three"],
        137: ["hundred and thirty-seven"], 147: ["hundred and forty-seven"],
        148: ["hundred and forty-eight"], 150: ["hundred and fifty"],
        162: ["hundred and sixty-two"], 175: ["hundred and seventy-five"],
        180: ["hundred and eighty"], 182: ["hundred and eighty-two"],
        187: ["hundred and eighty-seven"], 205: ["two hundred and five"],
        230: ["two hundred and thirty"], 239: ["two hundred and thirty-nine"],
        365: ["three hundred and sixty-five"],
        430: ["four hundred and thirty"], 433: ["four hundred and thirty-three"],
        438: ["four hundred and thirty-eight"], 450: ["four hundred and fifty"],
        464: ["four hundred and sixty-four"], 500: ["five hundred"],
        600: ["six hundred"], 777: ["seven hundred and seventy-seven"],
        895: ["eight hundred and ninety-five"], 905: ["nine hundred and five"],
        910: ["nine hundred and ten"], 912: ["nine hundred and twelve"],
        930: ["nine hundred and thirty"], 950: ["nine hundred and fifty"],
        962: ["nine hundred and sixty-two"], 969: ["nine hundred and sixty-nine"],
    }

    if int_num in num_words:
        for w in num_words[int_num]:
            if w in text_lower:
                return True

    # Half values
    if number != int_num and "half" in text_lower:
        return True

    return False


def extract_duration_entries(obj, path=""):
    entries = []
    if isinstance(obj, dict):
        has_duration = False
        duration_fields = {}
        refs = []
        name = obj.get("name", obj.get("event", ""))

        for k, v in obj.items():
            if k.startswith("duration_") or k in ("years", "age_at_son", "age", "ended_at_age"):
                if isinstance(v, (int, float)) and v is not None:
                    has_duration = True
                    duration_fields[k] = v
            if k in ("references", "reference"):
                if isinstance(v, list):
                    refs = v
                elif isinstance(v, str):
                    refs = [v]

        if has_duration and refs:
            entries.append({
                "name": name,
                "durations": duration_fields,
                "refs": refs,
                "path": path
            })

        for k, v in obj.items():
            if k.startswith("_"):
                continue
            entries.extend(extract_duration_entries(v, f"{path}.{k}"))
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            entries.extend(extract_duration_entries(item, f"{path}[{i}]"))
    return entries


def validate():
    print("Loading verse data...")
    verses = load_verses()
    print(f"  {len(verses):,} verses loaded\n")

    # =========================================================
    # PASS 1: Quotation text overlap
    # =========================================================
    print("=" * 60)
    print("PASS 1: OT->NT Quotation Text Overlap")
    print("=" * 60)

    with open(QUOTATIONS_PATH, "r", encoding="utf-8") as f:
        quotations = json.load(f)

    low_overlap = []
    no_text = []
    good = 0
    total_q = 0

    for i, q in enumerate(quotations["quotations"]):
        ot_ref = q["ot"]
        ot_text = get_verse_text(verses, ot_ref)

        if not ot_text:
            no_text.append(f"OT {ot_ref} — text not found")
            continue

        for nt_ref in q["nt"]:
            total_q += 1
            nt_text = get_verse_text(verses, nt_ref)

            if not nt_text:
                no_text.append(f"NT {nt_ref} (from OT {ot_ref}) — text not found")
                continue

            shared, pct = word_overlap_score(ot_text, nt_text)
            has_marker = has_quote_marker(nt_text)

            if shared <= 1 and not has_marker:
                low_overlap.append({
                    "ot": ot_ref,
                    "nt": nt_ref,
                    "shared_words": shared,
                    "overlap_pct": round(pct, 1),
                    "has_quote_marker": has_marker,
                    "ot_text": ot_text[:150],
                    "nt_text": nt_text[:150],
                })
            else:
                good += 1

    print(f"Total OT->NT pairs checked: {total_q}")
    print(f"Good (overlap or quote marker): {good}")
    print(f"Low/no overlap AND no quote marker: {len(low_overlap)}")
    print(f"Text not found: {len(no_text)}")

    if low_overlap:
        print(f"\n--- SUSPECT QUOTATIONS (may be allusions, not explicit quotes) ---")
        for item in low_overlap:
            print(f"\n  {item['ot']} -> {item['nt']}")
            print(f"    Shared content words: {item['shared_words']}, Overlap: {item['overlap_pct']}%")
            print(f"    OT: {item['ot_text']}")
            print(f"    NT: {item['nt_text']}")

    if no_text:
        print(f"\n--- TEXT NOT FOUND ---")
        for item in no_text:
            print(f"  {item}")

    # =========================================================
    # PASS 2: Timeline numeric claims
    # =========================================================
    print(f"\n{'='*60}")
    print("PASS 2: Timeline Numeric Claims vs Verse Text")
    print("=" * 60)

    with open(TIMELINES_PATH, "r", encoding="utf-8") as f:
        timelines = json.load(f)

    duration_entries = extract_duration_entries(timelines, "timelines")
    print(f"Entries with numeric claims: {len(duration_entries)}")

    numeric_errors = []
    numeric_good = 0
    numeric_skip = 0

    for entry in duration_entries:
        for dur_field, dur_value in entry["durations"].items():
            if dur_value is None or dur_value == 0:
                continue

            all_text = ""
            for ref in entry["refs"]:
                text = get_verse_text(verses, ref)
                if text:
                    all_text += " " + text

            if not all_text.strip():
                numeric_skip += 1
                continue

            found = check_number_in_text(dur_value, all_text)
            if found:
                numeric_good += 1
            else:
                numeric_errors.append({
                    "name": entry["name"],
                    "field": dur_field,
                    "value": dur_value,
                    "refs": entry["refs"],
                    "text_sample": all_text.strip()[:300],
                    "path": entry["path"],
                })

    print(f"Numeric claims verified: {numeric_good}")
    print(f"Numeric claims NOT found in text: {len(numeric_errors)}")
    print(f"Skipped (no verse text): {numeric_skip}")

    if numeric_errors:
        print(f"\n--- NUMERIC MISMATCHES ---")
        for item in numeric_errors:
            print(f"\n  {item['name']}: {item['field']}={item['value']}")
            print(f"    Refs: {', '.join(item['refs'])}")
            print(f"    Text: {item['text_sample']}")

    # Summary
    total_issues = len(low_overlap) + len(no_text) + len(numeric_errors)
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    print(f"Quotation pairs checked:     {total_q}")
    print(f"Suspect quotations:          {len(low_overlap)}")
    print(f"Numeric claims checked:      {numeric_good + len(numeric_errors)}")
    print(f"Numeric mismatches:          {len(numeric_errors)}")
    print(f"Total issues to review:      {total_issues}")

    report = {
        "suspect_quotations": low_overlap,
        "missing_text": no_text,
        "numeric_mismatches": numeric_errors,
        "summary": {
            "quotation_pairs_checked": total_q,
            "suspect_quotations": len(low_overlap),
            "numeric_claims_verified": numeric_good,
            "numeric_mismatches": len(numeric_errors),
        }
    }
    report_path = BASE / "scripts" / "content_validation_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"\nFull report saved to {report_path}")


if __name__ == "__main__":
    validate()
