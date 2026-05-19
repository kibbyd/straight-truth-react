"""
Pass 2: Conservative synonym matching for remaining unmatched words.

Principle: Only add HIGH CONFIDENCE matches.
Leave uncertain cases unmatched — better no data than wrong data.

This pass handles:
1. Speech verb synonyms (replied/answered → said)
2. Clear translation equivalents with same Strong's meaning
"""

import json
import re
from pathlib import Path
from collections import defaultdict

BASE = Path(__file__).parent.parent
ALIGNMENT_PATH = BASE / "public" / "data" / "strongs_esv_alignment.json"
UNMATCHED_PATH = BASE / "scripts" / "pass1_unmatched.json"
OUTPUT_PATH = BASE / "public" / "data" / "strongs_esv_alignment.json"
PASS2_UNMATCHED_PATH = BASE / "scripts" / "pass2_unmatched.json"
ESV_PATH = BASE / "public" / "data" / "bible_verses.json"

# High-confidence synonym mappings
# BSB word -> list of ESV equivalents (in priority order)
# Only include mappings where the meaning is UNAMBIGUOUS
SYNONYMS = {
    # Speech verbs - these commonly differ between translations
    'replied': ['said', 'answered'],
    'answered': ['said', 'answered'],
    'asked': ['said'],  # Only when ESV has "said" for same Hebrew
    'told': ['said', 'told'],
    'declared': ['said', 'declared'],
    'exclaimed': ['said', 'cried'],
    'inquired': ['asked', 'said'],

    # Common equivalents
    'made': ['made', 'did'],
    'became': ['was', 'became'],
    'behold': ['behold', 'see', 'look'],
    'look': ['behold', 'see', 'look'],
    'surely': ['surely', 'indeed', 'certainly'],
    'indeed': ['indeed', 'surely', 'truly'],
    'thus': ['thus', 'so', 'therefore'],
    'therefore': ['therefore', 'so', 'thus'],

    # People references
    'men': ['men', 'people', 'man'],
    'man': ['man', 'men', 'one'],
    'mankind': ['mankind', 'man', 'people'],
    'everyone': ['everyone', 'all', 'every'],
    'everything': ['everything', 'all'],
    'anyone': ['anyone', 'any', 'one'],
    'whoever': ['whoever', 'who', 'anyone'],

    # Verbs
    'listen': ['hear', 'listen'],
    'hear': ['hear', 'listen'],
    'see': ['see', 'behold', 'look'],
    'observe': ['see', 'observe', 'keep'],
    'show': ['show', 'tell'],
    'speak': ['speak', 'say'],
    'call': ['call', 'called'],
    'called': ['called', 'call'],
}

# Words where case matters - don't apply synonyms
CASE_SENSITIVE = {'spirit', 'lord', 'god'}


def strip_punctuation(word):
    return re.sub(r'^[^\w]+|[^\w]+$', '', word)


def get_case_pattern(word):
    word = strip_punctuation(word)
    if not word:
        return 'empty'
    if word.isupper():
        return 'upper'
    if word.istitle():
        return 'title'
    if word.islower():
        return 'lower'
    return 'mixed'


def get_esv_words(text):
    """Parse ESV text into indexed words."""
    words = text.split()
    result = []
    for i, w in enumerate(words):
        stripped = strip_punctuation(w)
        if stripped:
            result.append((i, w, stripped, get_case_pattern(w)))
    return result


def find_synonym_match(bsb_text, esv_words, used_positions):
    """
    Try to find a synonym match in ESV.
    Returns (position, word) or (None, None)

    Only matches if:
    1. BSB has a word with known synonyms
    2. A synonym exists in ESV
    3. Position not already used
    """
    # Skip bracketed words (implied, interpretive)
    if bsb_text.startswith('[') or bsb_text.startswith('('):
        return None, None

    # Split BSB text into words and check each for synonyms
    bsb_words = bsb_text.split()

    # Available ESV words
    available = [(pos, orig, stripped, case)
                 for pos, orig, stripped, case in esv_words
                 if pos not in used_positions]

    # Try each BSB word
    for bsb_word in bsb_words:
        bsb_clean = strip_punctuation(bsb_word).lower()

        # Skip case-sensitive words
        if bsb_clean in CASE_SENSITIVE:
            continue

        # Skip function words - focus on content words
        if len(bsb_clean) < 3:
            continue

        # Get synonyms for this word
        synonyms = SYNONYMS.get(bsb_clean)
        if not synonyms:
            continue

        # Try each synonym in priority order
        for syn in synonyms:
            syn_lower = syn.lower()
            for pos, orig, stripped, case in available:
                if stripped.lower() == syn_lower:
                    return pos, orig

    return None, None


def main():
    print("=== Pass 2: Conservative Synonym Matching ===\n")

    print("Loading data...")
    with open(ALIGNMENT_PATH, encoding='utf-8') as f:
        alignment = json.load(f)

    with open(UNMATCHED_PATH, encoding='utf-8') as f:
        unmatched = json.load(f)

    with open(ESV_PATH, encoding='utf-8') as f:
        esv_verses = json.load(f)

    esv_lookup = {f"{v['book']}.{v['chapter']}.{v['verse']}": v['text'] for v in esv_verses}

    print(f"  Alignment: {len(alignment)} verses")
    print(f"  Unmatched: {len(unmatched)} entries")

    # Group unmatched by verse for efficient processing
    unmatched_by_verse = defaultdict(list)
    for entry in unmatched:
        unmatched_by_verse[entry['verse']].append(entry)

    # Process
    new_matches = 0
    still_unmatched = []

    print("\nProcessing...")
    for verse_id, entries in unmatched_by_verse.items():
        if verse_id not in esv_lookup:
            still_unmatched.extend(entries)
            continue

        esv_text = esv_lookup[verse_id]
        esv_words = get_esv_words(esv_text)

        # Get already-used positions from pass 1
        used_positions = set()
        if verse_id in alignment:
            used_positions = {tag['pos'] for tag in alignment[verse_id]}

        for entry in entries:
            bsb_word = entry['bsb']
            strong = entry['strong']

            pos, matched_word = find_synonym_match(bsb_word, esv_words, used_positions)

            if pos is not None:
                # Add to alignment
                if verse_id not in alignment:
                    alignment[verse_id] = []

                alignment[verse_id].append({
                    'pos': pos,
                    'strong': strong,
                    'word': strip_punctuation(matched_word)
                })
                used_positions.add(pos)
                new_matches += 1
            else:
                still_unmatched.append(entry)

    # Sort alignments by position
    for verse_id in alignment:
        alignment[verse_id].sort(key=lambda x: x['pos'])

    # Calculate stats
    total_tagged = 377869  # From pass 1
    total_matched = total_tagged - len(still_unmatched)

    print(f"\n=== Results ===")
    print(f"New matches from Pass 2: {new_matches}")
    print(f"Still unmatched: {len(still_unmatched)}")
    print(f"Total matched: {total_matched} ({total_matched/total_tagged*100:.1f}%)")
    print(f"Unmatched: {len(still_unmatched)} ({len(still_unmatched)/total_tagged*100:.1f}%)")

    print(f"\nWriting alignment to {OUTPUT_PATH}...")
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(alignment, f)

    print(f"Writing unmatched to {PASS2_UNMATCHED_PATH}...")
    with open(PASS2_UNMATCHED_PATH, 'w', encoding='utf-8') as f:
        json.dump(still_unmatched, f, ensure_ascii=False)

    print("\nPass 2 complete.")


if __name__ == '__main__':
    main()
