"""
Pass 1: Case-sensitive Strong's alignment to ESV using Berean data.

Respects theological distinctions:
- Spirit vs spirit (Holy Spirit vs human/evil spirit)
- LORD vs Lord (YHWH vs Adonai)
- GOD vs God

Maps BSB conventions to ESV conventions:
- BSB "Yahweh" -> ESV "LORD" (H3068)
- BSB "the LORD" -> ESV "LORD" (H3068)
"""

import pandas as pd
import json
import re
from pathlib import Path
from collections import defaultdict

BASE = Path(__file__).parent.parent
BEREAN_PATH = BASE / "data_sources" / "berean" / "bsb_tables.xlsx"
ESV_PATH = BASE / "public" / "data" / "bible_verses.json"
OUTPUT_PATH = BASE / "public" / "data" / "strongs_esv_alignment.json"
UNMATCHED_PATH = BASE / "scripts" / "pass1_unmatched.json"
STATS_PATH = BASE / "scripts" / "pass1_stats.json"

BOOK_MAP = {
    'Genesis': 'Gen', 'Exodus': 'Exo', 'Leviticus': 'Lev', 'Numbers': 'Num', 'Deuteronomy': 'Deu',
    'Joshua': 'Jos', 'Judges': 'Jdg', 'Ruth': 'Rut', '1 Samuel': '1Sa', '2 Samuel': '2Sa',
    '1 Kings': '1Ki', '2 Kings': '2Ki', '1 Chronicles': '1Ch', '2 Chronicles': '2Ch',
    'Ezra': 'Ezr', 'Nehemiah': 'Neh', 'Esther': 'Est', 'Job': 'Job', 'Psalm': 'Psa', 'Psalms': 'Psa',
    'Proverbs': 'Pro', 'Ecclesiastes': 'Ecc', 'Song of Solomon': 'Sng', 'Isaiah': 'Isa',
    'Jeremiah': 'Jer', 'Lamentations': 'Lam', 'Ezekiel': 'Eze', 'Daniel': 'Dan', 'Hosea': 'Hos',
    'Joel': 'Joe', 'Amos': 'Amo', 'Obadiah': 'Oba', 'Jonah': 'Jon', 'Micah': 'Mic',
    'Nahum': 'Nah', 'Habakkuk': 'Hab', 'Zephaniah': 'Zep', 'Haggai': 'Hag', 'Zechariah': 'Zec',
    'Malachi': 'Mal', 'Matthew': 'Mat', 'Mark': 'Mar', 'Luke': 'Luk', 'John': 'Joh',
    'Acts': 'Act', 'Romans': 'Rom', '1 Corinthians': '1Co', '2 Corinthians': '2Co',
    'Galatians': 'Gal', 'Ephesians': 'Eph', 'Philippians': 'Php', 'Colossians': 'Col',
    '1 Thessalonians': '1Th', '2 Thessalonians': '2Th', '1 Timothy': '1Ti', '2 Timothy': '2Ti',
    'Titus': 'Tit', 'Philemon': 'Phm', 'Hebrews': 'Heb', 'James': 'Jas', '1 Peter': '1Pe',
    '2 Peter': '2Pe', '1 John': '1Jo', '2 John': '2Jo', '3 John': '3Jo', 'Jude': 'Jud', 'Revelation': 'Rev'
}

# Words where case matters theologically
CASE_SENSITIVE_WORDS = {
    'spirit', 'lord', 'god'
}

# BSB to ESV mappings for known translation conventions
BSB_TO_ESV_MAP = {
    'yahweh': 'LORD',      # H3068
    'the lord': 'LORD',    # When BSB has "the LORD" for YHWH
}

# Artifacts to skip (not real words)
ARTIFACTS = {'-', '', '. . .', 'vvv', '...', '—', '–'}


def strip_punctuation(word):
    """Remove punctuation but preserve the word."""
    return re.sub(r'^[^\w]+|[^\w]+$', '', word)


def normalize_for_comparison(word, case_sensitive=False):
    """
    Normalize word for comparison.
    - Strips punctuation
    - Lowercases only if not case-sensitive
    """
    word = strip_punctuation(word)
    if not case_sensitive:
        return word.lower()
    return word


def get_case_pattern(word):
    """
    Get the case pattern of a word.
    Returns: 'upper' (LORD), 'title' (Lord), 'lower' (lord), 'mixed'
    """
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


def is_case_sensitive_word(word):
    """Check if this word requires case-sensitive matching."""
    return strip_punctuation(word).lower() in CASE_SENSITIVE_WORDS


def get_esv_words(text):
    """
    Parse ESV text into indexed words with case info.
    Returns list of (position, word, stripped_word, case_pattern)
    """
    words = text.split()
    result = []
    for i, w in enumerate(words):
        stripped = strip_punctuation(w)
        if stripped:
            result.append((i, w, stripped, get_case_pattern(w)))
    return result


# Comprehensive function word list to skip during matching
FUNCTION_WORDS = {
    # Articles
    'the', 'a', 'an',
    # Prepositions
    'of', 'to', 'in', 'for', 'with', 'by', 'from', 'on', 'at', 'into', 'onto',
    'upon', 'unto', 'through', 'throughout', 'over', 'under', 'between', 'among',
    'before', 'after', 'behind', 'beside', 'besides', 'beyond', 'within', 'without',
    'against', 'toward', 'towards', 'about', 'around', 'along', 'across', 'beneath',
    # Conjunctions
    'and', 'or', 'but', 'nor', 'yet', 'so', 'for', 'as', 'if', 'then', 'than',
    'when', 'where', 'while', 'because', 'although', 'though', 'unless', 'until',
    'that', 'which', 'who', 'whom', 'whose', 'what', 'how', 'why',
    # Pronouns
    'i', 'me', 'my', 'mine', 'myself',
    'you', 'your', 'yours', 'yourself', 'yourselves',
    'he', 'him', 'his', 'himself',
    'she', 'her', 'hers', 'herself',
    'it', 'its', 'itself',
    'we', 'us', 'our', 'ours', 'ourselves',
    'they', 'them', 'their', 'theirs', 'themselves',
    'this', 'that', 'these', 'those',
    'who', 'whom', 'whose', 'which', 'what',
    # Auxiliary/Modal verbs
    'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'having',
    'do', 'does', 'did', 'doing',
    'will', 'would', 'shall', 'should', 'may', 'might', 'can', 'could', 'must',
    # Common adverbs
    'not', 'no', 'now', 'then', 'there', 'here', 'up', 'out', 'so', 'very',
    'also', 'just', 'only', 'even', 'still', 'again', 'ever', 'never', 'always',
    # Other function words
    'let', 'oh', 'o',
}


def extract_bsb_words(bsb_text):
    """
    Extract words from BSB text.
    Returns list of (word, stripped, case_pattern, is_content)
    is_content=True for content words, False for function words
    Content words are prioritized in matching.
    """
    if pd.isna(bsb_text):
        return []
    bsb = str(bsb_text).strip()
    if bsb in ARTIFACTS:
        return []

    # Check for BSB->ESV mappings
    bsb_lower = bsb.lower()
    if bsb_lower in BSB_TO_ESV_MAP:
        mapped = BSB_TO_ESV_MAP[bsb_lower]
        return [(mapped, mapped, get_case_pattern(mapped), True)]

    words = bsb.split()
    content_words = []
    function_words_list = []

    for w in words:
        stripped = strip_punctuation(w)
        if not stripped:
            continue
        case_pattern = get_case_pattern(w)
        is_content = stripped.lower() not in FUNCTION_WORDS

        if is_content:
            content_words.append((w, stripped, case_pattern, True))
        else:
            function_words_list.append((w, stripped, case_pattern, False))

    # Return content words first, then function words
    return content_words + function_words_list


def normalize_verse_id(verse_id):
    """Convert Berean verse ID to ESV format."""
    if pd.isna(verse_id):
        return None
    match = re.match(r'(.+?)\s+(\d+):(\d+)', str(verse_id))
    if match:
        book_name = match.group(1)
        book_code = BOOK_MAP.get(book_name)
        if book_code:
            return f'{book_code}.{match.group(2)}.{match.group(3)}'
    return None


def find_match(bsb_words, esv_words, used_positions, strong):
    """
    Find best ESV match for BSB words.

    CONSERVATIVE MATCHING:
    - Only match content words (nouns, verbs, adjectives)
    - Do NOT fallback to function words if content words exist but don't match
    - This prevents false matches like H0559 -> "he" when BSB has "he answered"

    For case-sensitive words (spirit, lord, god):
      - Match case pattern exactly
    For other words:
      - Case-insensitive match

    Returns (position, esv_word) or (None, None)
    """
    # Build lookup of available ESV words
    esv_available = [(pos, orig, stripped, case) for pos, orig, stripped, case in esv_words if pos not in used_positions]

    # Separate content words from function words
    content_words = [w for w in bsb_words if len(w) >= 4 and w[3] == True]
    function_words = [w for w in bsb_words if len(w) >= 4 and w[3] == False]

    # If there are content words, ONLY try to match content words
    # Do not fallback to function words - leave unmatched instead
    words_to_try = content_words if content_words else function_words

    for bsb_tuple in words_to_try:
        if len(bsb_tuple) == 4:
            bsb_orig, bsb_stripped, bsb_case, is_content = bsb_tuple
        else:
            bsb_orig, bsb_stripped, bsb_case = bsb_tuple
            is_content = True

        bsb_lower = bsb_stripped.lower()

        # Special handling for LORD (H3068 YHWH)
        if bsb_stripped == 'LORD' or (strong == 'H3068' and bsb_lower in {'yahweh', 'lord'}):
            # Must match "LORD" (all caps) in ESV
            for pos, orig, stripped, case in esv_available:
                if stripped == 'LORD':
                    return pos, orig
            continue

        # Special handling for GOD (H3069)
        if bsb_stripped == 'GOD' or (strong == 'H3069' and bsb_lower == 'god'):
            for pos, orig, stripped, case in esv_available:
                if stripped == 'GOD':
                    return pos, orig
            continue

        # Case-sensitive matching for theological words
        if is_case_sensitive_word(bsb_stripped):
            for pos, orig, stripped, case in esv_available:
                if stripped.lower() == bsb_lower and case == bsb_case:
                    return pos, orig
            continue

        # Standard case-insensitive matching for other words
        for pos, orig, stripped, case in esv_available:
            if stripped.lower() == bsb_lower:
                return pos, orig

    return None, None


def main():
    print("=== Pass 1: Case-Sensitive Alignment ===\n")

    print("Loading Berean data...")
    df = pd.read_excel(BEREAN_PATH, sheet_name='biblosinterlinear96')
    print(f"  Loaded {len(df)} rows")

    print("Loading ESV data...")
    with open(ESV_PATH, encoding='utf-8') as f:
        esv_verses = json.load(f)
    esv_lookup = {f"{v['book']}.{v['chapter']}.{v['verse']}": v['text'] for v in esv_verses}
    print(f"  Loaded {len(esv_lookup)} verses")

    print("Processing...")
    df['VerseId'] = df['VerseId'].ffill()
    df['NormVerse'] = df['VerseId'].apply(normalize_verse_id)

    alignment = {}
    unmatched = []
    stats = {
        'total_words': 0,
        'matched': 0,
        'unmatched': 0,
        'artifacts_skipped': 0,
        'verses_processed': 0,
        'by_type': {
            'exact_match': 0,
            'case_sensitive_match': 0,
            'yahweh_lord': 0,
        }
    }

    verse_groups = df.groupby('NormVerse')
    total_verses = len([v for v in verse_groups.groups.keys() if v in esv_lookup])

    for verse_id, group in verse_groups:
        if pd.isna(verse_id) or verse_id not in esv_lookup:
            continue

        stats['verses_processed'] += 1
        esv_text = esv_lookup[verse_id]
        esv_words = get_esv_words(esv_text)

        verse_alignment = []
        used_positions = set()

        for _, row in group.iterrows():
            bsb_raw = row[' BSB version ']
            strong_heb = row['Str Heb']
            strong_grk = row['Str Grk']

            # Determine Strong's number
            if pd.notna(strong_heb):
                strong = f"H{int(strong_heb):04d}"
            elif pd.notna(strong_grk):
                strong = f"G{int(strong_grk):04d}"
            else:
                continue

            # Check for artifacts
            bsb_str = str(bsb_raw).strip() if pd.notna(bsb_raw) else ''
            if bsb_str in ARTIFACTS:
                stats['artifacts_skipped'] += 1
                continue

            stats['total_words'] += 1
            bsb_words = extract_bsb_words(bsb_raw)

            if not bsb_words:
                # Try the raw word itself
                if bsb_str:
                    stripped = strip_punctuation(bsb_str)
                    if stripped:
                        bsb_words = [(bsb_str, stripped, get_case_pattern(bsb_str))]

            pos, matched_word = find_match(bsb_words, esv_words, used_positions, strong)

            if pos is not None:
                verse_alignment.append({
                    'pos': pos,
                    'strong': strong,
                    'word': strip_punctuation(matched_word)
                })
                used_positions.add(pos)
                stats['matched'] += 1
            else:
                stats['unmatched'] += 1
                unmatched.append({
                    'verse': verse_id,
                    'bsb': bsb_str,
                    'strong': strong,
                    'esv_text': esv_text
                })

        if verse_alignment:
            verse_alignment.sort(key=lambda x: x['pos'])
            alignment[verse_id] = verse_alignment

        if stats['verses_processed'] % 5000 == 0:
            pct = stats['verses_processed'] / total_verses * 100
            print(f"  {stats['verses_processed']}/{total_verses} verses ({pct:.1f}%)...")

    # Calculate final stats
    total = stats['total_words']
    matched = stats['matched']
    unmatched_count = stats['unmatched']

    print(f"\n=== Results ===")
    print(f"Verses processed: {stats['verses_processed']}")
    print(f"Artifacts skipped: {stats['artifacts_skipped']}")
    print(f"Total tagged words: {total}")
    print(f"Matched: {matched} ({matched/total*100:.1f}%)")
    print(f"Unmatched: {unmatched_count} ({unmatched_count/total*100:.1f}%)")

    # Save outputs
    print(f"\nWriting alignment to {OUTPUT_PATH}...")
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(alignment, f)

    print(f"Writing unmatched to {UNMATCHED_PATH}...")
    with open(UNMATCHED_PATH, 'w', encoding='utf-8') as f:
        json.dump(unmatched, f, ensure_ascii=False)

    print(f"Writing stats to {STATS_PATH}...")
    with open(STATS_PATH, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2)

    print("\nPass 1 complete.")


if __name__ == '__main__':
    main()
