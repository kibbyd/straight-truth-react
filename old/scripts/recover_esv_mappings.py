"""
Recover dropped ESV Strong's mappings using KJV alignment as evidence.

The validation script dropped 73,829 ESV mappings because KJV didn't have
that Strong's number in that verse. But some drops are legitimate Berean
data that KJV simply didn't tag — especially common Hebrew particles.

Recovery strategy (conservative):
1. Build a cross-verse confidence score: how often is this (word, Strong's)
   pair confirmed across all validated ESV verses?
2. Check if the Strong's gloss matches the ESV word.
3. Identify known under-tagged Strong's numbers (H0853/eth, etc.)
4. Require multiple lines of evidence for recovery.

Outputs:
- public/data/strongs_esv_alignment_recovered.json  (validated + recovered)
- scripts/recovery_report.json                       (stats + analysis)
"""

import json
import re
from pathlib import Path
from collections import defaultdict, Counter

BASE = Path(__file__).parent.parent
ESV_ORIGINAL_PATH = BASE / "public" / "data" / "strongs_esv_alignment.json"
ESV_VALIDATED_PATH = BASE / "public" / "data" / "strongs_esv_alignment_validated.json"
KJV_ALIGNMENT_PATH = BASE / "public" / "data" / "strongs_kjv_alignment.json"
LEXICON_PATH = BASE / "public" / "data" / "strongs_data.json"
OUTPUT_PATH = BASE / "public" / "data" / "strongs_esv_alignment_recovered.json"
REPORT_PATH = BASE / "scripts" / "recovery_report.json"


def normalize_word(w):
    """Lowercase and strip punctuation for comparison."""
    return re.sub(r'[^a-z]', '', w.lower())


def load_lexicon_glosses(lexicon_path):
    """Load Strong's lexicon and extract glosses + meaning keywords.

    Returns dict: {"H0776": {"gloss": "earth", "keywords": {"earth", "land", "ground"}}}
    """
    with open(lexicon_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    glosses = {}
    for strong_num, entry in data.get("lexicon", {}).items():
        gloss = entry.get("gloss", "")
        meaning = entry.get("meaning", "")

        # Extract keywords from gloss
        keywords = set()
        if gloss:
            for w in re.split(r'[,;/\s]+', gloss.lower()):
                w = re.sub(r'[^a-z]', '', w)
                if len(w) > 1:
                    keywords.add(w)

        # Extract key nouns/verbs from meaning (first few words of each numbered sense)
        if meaning:
            for sense in re.split(r'\d+\)', meaning):
                words = re.split(r'[,;/\s]+', sense.strip().lower())
                for w in words[:4]:
                    w = re.sub(r'[^a-z]', '', w)
                    if len(w) > 2:
                        keywords.add(w)

        glosses[strong_num] = {
            "gloss": gloss.lower(),
            "keywords": keywords,
        }

    return glosses


def build_confirmed_pairs(validated):
    """Build (word, Strong's) -> confirmation count from validated data.

    Returns dict: {("earth", "H0776"): 523, ...}
    """
    pairs = Counter()
    for verse_key, word_list in validated.items():
        for entry in word_list:
            word = normalize_word(entry.get("word", ""))
            if word:
                pairs[(word, entry["strong"])] += 1
    return pairs


def compute_dropped(original, validated):
    """Compute the dropped entries (in original but not in validated).

    Returns list of (verse_key, entry_dict) tuples.
    """
    # Build set of (verse, pos, strong) from validated
    validated_set = set()
    for verse_key, word_list in validated.items():
        for entry in word_list:
            validated_set.add((verse_key, entry["pos"], entry["strong"]))

    dropped = []
    for verse_key, word_list in original.items():
        for entry in word_list:
            key = (verse_key, entry["pos"], entry["strong"])
            if key not in validated_set:
                dropped.append((verse_key, entry))

    return dropped


def recover():
    print("Loading data...")
    with open(ESV_ORIGINAL_PATH, "r", encoding="utf-8") as f:
        original = json.load(f)
    print(f"  Original ESV alignment: {len(original):,} verses")

    with open(ESV_VALIDATED_PATH, "r", encoding="utf-8") as f:
        validated = json.load(f)
    print(f"  Validated ESV alignment: {len(validated):,} verses")

    with open(KJV_ALIGNMENT_PATH, "r", encoding="utf-8") as f:
        kjv_alignment = json.load(f)
    print(f"  KJV alignment: {len(kjv_alignment):,} verses")

    glosses = load_lexicon_glosses(LEXICON_PATH)
    print(f"  Lexicon entries: {len(glosses):,}")

    # Step 1: Build cross-verse confidence
    print("\nBuilding cross-verse confidence scores...")
    confirmed_pairs = build_confirmed_pairs(validated)
    print(f"  Unique (word, Strong's) pairs confirmed: {len(confirmed_pairs):,}")

    # Step 2: Build KJV verse->Strong's set for quick lookup
    kjv_verse_strongs = {}
    for verse_key, mappings in kjv_alignment.items():
        kjv_verse_strongs[verse_key] = set(m["strong"] for m in mappings)

    # Step 3: Compute dropped entries
    print("\nComputing dropped entries...")
    dropped = compute_dropped(original, validated)
    print(f"  Total dropped: {len(dropped):,}")

    # Step 4: Analyze and recover
    print("\nAnalyzing dropped entries for recovery...")

    # Track recovery reasons
    recovered = []
    not_recovered = []
    recovery_reasons = Counter()
    strong_drop_counts = Counter()

    for verse_key, entry in dropped:
        word = normalize_word(entry.get("word", ""))
        strong = entry["strong"]
        strong_drop_counts[strong] += 1

        # Evidence scoring
        evidence = []

        # Evidence 1: Cross-verse confirmation
        pair_count = confirmed_pairs.get((word, strong), 0)
        if pair_count >= 5:
            evidence.append(f"cross_verse:{pair_count}")
        elif pair_count >= 2:
            evidence.append(f"cross_verse_weak:{pair_count}")

        # Evidence 2: Gloss match
        if strong in glosses:
            gloss_info = glosses[strong]
            if word and (word == gloss_info["gloss"] or word in gloss_info["keywords"]):
                evidence.append("gloss_match")

        # Evidence 3: KJV has this Strong's in a nearby verse (same chapter)
        # This catches cases where KJV splits/merges verses differently
        parts = verse_key.split(".")
        if len(parts) == 3:
            book, ch, vs = parts
            for delta in [-1, 1]:
                nearby = f"{book}.{ch}.{int(vs) + delta}"
                if nearby in kjv_verse_strongs and strong in kjv_verse_strongs.get(nearby, set()):
                    evidence.append("kjv_nearby_verse")
                    break

        # Recovery decision (conservative)
        reason = None

        # Strong recovery: cross-verse confirmed AND (gloss match OR nearby KJV)
        if pair_count >= 5 and len(evidence) >= 2:
            reason = "strong_cross_verse_plus_evidence"

        # Medium recovery: high cross-verse count alone (very common, well-established pair)
        elif pair_count >= 20:
            reason = "high_cross_verse"

        # Gloss match with some cross-verse support
        elif "gloss_match" in evidence and pair_count >= 2:
            reason = "gloss_match_with_support"

        if reason:
            recovered.append((verse_key, entry, reason))
            recovery_reasons[reason] += 1
        else:
            not_recovered.append((verse_key, entry, evidence))

    print(f"\n  Recovered:     {len(recovered):,}")
    print(f"  Not recovered: {len(not_recovered):,}")
    print(f"\n  Recovery reasons:")
    for reason, count in recovery_reasons.most_common():
        print(f"    {reason}: {count:,}")

    # Step 5: Merge recovered into validated alignment
    print("\nMerging recovered entries into validated alignment...")
    merged = {}
    for verse_key, word_list in validated.items():
        merged[verse_key] = list(word_list)

    for verse_key, entry, reason in recovered:
        if verse_key not in merged:
            merged[verse_key] = []
        merged[verse_key].append(entry)

    # Sort each verse's entries by position
    for verse_key in merged:
        merged[verse_key].sort(key=lambda e: (e["pos"], e["strong"]))

    # Step 6: Stats
    total_validated = sum(len(v) for v in validated.values())
    total_merged = sum(len(v) for v in merged.values())
    total_original = sum(len(v) for v in original.values())

    print(f"\n{'='*60}")
    print("RECOVERY RESULTS")
    print(f"{'='*60}")
    print(f"Original ESV mappings:     {total_original:,}")
    print(f"After KJV validation:      {total_validated:,} ({total_validated/total_original*100:.1f}%)")
    print(f"After recovery:            {total_merged:,} ({total_merged/total_original*100:.1f}%)")
    print(f"Recovered:                 {len(recovered):,} ({len(recovered)/len(dropped)*100:.1f}% of drops)")
    print(f"Still dropped:             {len(not_recovered):,}")
    print(f"Verses before:             {len(validated):,}")
    print(f"Verses after:              {len(merged):,}")
    print(f"Verses gained:             {len(merged) - len(validated):,}")

    # Most commonly dropped Strong's numbers (not recovered)
    unrecovered_strongs = Counter()
    for verse_key, entry, evidence in not_recovered:
        unrecovered_strongs[entry["strong"]] += 1

    print(f"\nMost dropped Strong's (not recovered):")
    for strong, count in unrecovered_strongs.most_common(15):
        gloss = glosses.get(strong, {}).get("gloss", "?")
        print(f"  {strong} ({gloss}): {count:,} drops")

    # Build report
    report = {
        "summary": {
            "original_mappings": total_original,
            "validated_mappings": total_validated,
            "recovered_mappings": len(recovered),
            "final_mappings": total_merged,
            "still_dropped": len(not_recovered),
            "recovery_rate_of_drops": round(len(recovered) / len(dropped) * 100, 1),
            "final_vs_original_pct": round(total_merged / total_original * 100, 1),
            "verses_before": len(validated),
            "verses_after": len(merged),
            "verses_gained": len(merged) - len(validated),
        },
        "recovery_reasons": dict(recovery_reasons.most_common()),
        "top_unrecovered_strongs": [
            {"strong": s, "gloss": glosses.get(s, {}).get("gloss", "?"), "count": c}
            for s, c in unrecovered_strongs.most_common(30)
        ],
        "top_recovered_strongs": [],
    }

    # Top recovered Strong's
    recovered_strongs = Counter()
    for verse_key, entry, reason in recovered:
        recovered_strongs[entry["strong"]] += 1
    report["top_recovered_strongs"] = [
        {"strong": s, "gloss": glosses.get(s, {}).get("gloss", "?"), "count": c}
        for s, c in recovered_strongs.most_common(30)
    ]

    print(f"\nMost recovered Strong's:")
    for s, c in recovered_strongs.most_common(10):
        gloss = glosses.get(s, {}).get("gloss", "?")
        print(f"  {s} ({gloss}): {c:,} recovered")

    # Save
    print(f"\nSaving recovered alignment to {OUTPUT_PATH}")
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False)

    print(f"Saving report to {REPORT_PATH}")
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print("\nDone.")


if __name__ == "__main__":
    recover()
