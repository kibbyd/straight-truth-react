"""
Align Strong's numbers to ESV text using Berean Bible data as the source of truth.

Input:
- data_sources/berean/bsb_tables.xlsx (word-level Strong's alignment to BSB)
- public/data/bible_verses.json (ESV text)

Output:
- public/data/strongs_esv_alignment.json (new alignment)
- scripts/alignment_unmatched.json (words needing second pass)
"""

import pandas as pd
import json
import re
from pathlib import Path
from collections import defaultdict

# Paths
BASE = Path(__file__).parent.parent
BEREAN_PATH = BASE / "data_sources" / "berean" / "bsb_tables.xlsx"
ESV_PATH = BASE / "public" / "data" / "bible_verses.json"
OUTPUT_PATH = BASE / "public" / "data" / "strongs_esv_alignment.json"
UNMATCHED_PATH = BASE / "scripts" / "alignment_unmatched.json"

# Book name mapping (Berean full name -> ESV 3-letter code)
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

# Function words to skip when matching (these often differ or are added/removed)
SKIP_WORDS = {
    'the', 'a', 'an', 'of', 'to', 'in', 'and', 'for', 'with', 'by', 'from', 'on', 'at',
    'is', 'was', 'were', 'be', 'been', 'are', 'as', 'or', 'but', 'not', 'no', 'so',
    'he', 'she', 'it', 'his', 'her', 'its', 'they', 'their', 'them',
    'that', 'this', 'these', 'those', 'there', 'let', 'has', 'have', 'had',
    'will', 'would', 'shall', 'should', 'may', 'might', 'can', 'could',
    'do', 'did', 'does', 'if', 'then', 'than', 'when', 'where', 'who', 'whom',
    'which', 'what', 'how', 'why', 'now', 'up', 'out', 'over', 'under',
    'into', 'upon', 'after', 'before', 'am', 'i', 'me', 'my', 'we', 'us', 'our',
    'you', 'your', 'him', 'who', 'whom', 'whose'
}


def normalize(word):
    """Normalize word for comparison: lowercase, letters only."""
    return re.sub(r'[^a-z]', '', str(word).lower())


def get_esv_words(text):
    """
    Split ESV text into words with positions.
    Returns list of (position, normalized_word, original_word)
    """
    words = text.split()
    result = []
    for i, w in enumerate(words):
        norm = normalize(w)
        if norm:
            result.append((i, norm, w))
    return result


def get_bsb_content_words(bsb_text):
    """
    Extract content words from BSB text.
    Returns list of normalized words (excluding function words).
    """
    if pd.isna(bsb_text):
        return []
    bsb = str(bsb_text).strip()
    if bsb in ['-', '', '. . .', '[', ']', '—']:
        return []

    words = bsb.split()
    content = []
    for w in words:
        n = normalize(w)
        if n and n not in SKIP_WORDS and len(n) > 1:
            content.append(n)
    return content


def normalize_verse_id(verse_id):
    """Convert Berean verse ID to ESV format: 'Genesis 1:1' -> 'Gen.1.1'"""
    if pd.isna(verse_id):
        return None
    match = re.match(r'(.+?)\s+(\d+):(\d+)', str(verse_id))
    if match:
        book_name = match.group(1)
        book_code = BOOK_MAP.get(book_name)
        if book_code:
            return f'{book_code}.{match.group(2)}.{match.group(3)}'
    return None


def find_best_match(bsb_words, esv_word_list, used_positions):
    """
    Find the best ESV position for BSB content words.
    Returns (position, matched_word) or (None, None) if no match.
    """
    esv_by_word = defaultdict(list)
    for pos, norm, orig in esv_word_list:
        if pos not in used_positions:
            esv_by_word[norm].append((pos, orig))

    # Try to match any BSB content word to available ESV words
    for bsb_word in bsb_words:
        if bsb_word in esv_by_word:
            # Return first available position for this word
            pos, orig = esv_by_word[bsb_word][0]
            return pos, orig

    return None, None


def main():
    print("Loading Berean data...")
    df = pd.read_excel(BEREAN_PATH, sheet_name='biblosinterlinear96')
    print(f"  Loaded {len(df)} rows")

    print("Loading ESV data...")
    with open(ESV_PATH, encoding='utf-8') as f:
        esv_verses = json.load(f)
    esv_lookup = {f"{v['book']}.{v['chapter']}.{v['verse']}": v['text'] for v in esv_verses}
    print(f"  Loaded {len(esv_lookup)} verses")

    print("Processing verse IDs...")
    df['VerseId'] = df['VerseId'].ffill()
    df['NormVerse'] = df['VerseId'].apply(normalize_verse_id)

    # Group by verse
    print("Grouping by verse...")
    verse_groups = df.groupby('NormVerse')

    alignment = {}
    unmatched = []
    stats = {'total': 0, 'matched': 0, 'unmatched': 0, 'verses': 0}

    print("Aligning...")
    for verse_id, group in verse_groups:
        if pd.isna(verse_id) or verse_id not in esv_lookup:
            continue

        stats['verses'] += 1
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

            stats['total'] += 1
            bsb_words = get_bsb_content_words(bsb_raw)

            if not bsb_words:
                # No content words (function word only) - try direct match
                bsb_norm = normalize(bsb_raw) if pd.notna(bsb_raw) else None
                if bsb_norm:
                    bsb_words = [bsb_norm]

            pos, matched_word = find_best_match(bsb_words, esv_words, used_positions)

            if pos is not None:
                verse_alignment.append({'pos': pos, 'strong': strong})
                used_positions.add(pos)
                stats['matched'] += 1
            else:
                stats['unmatched'] += 1
                unmatched.append({
                    'verse': verse_id,
                    'bsb': str(bsb_raw).strip() if pd.notna(bsb_raw) else '',
                    'strong': strong,
                    'esv': esv_text[:100]
                })

        if verse_alignment:
            # Sort by position
            verse_alignment.sort(key=lambda x: x['pos'])
            alignment[verse_id] = verse_alignment

        if stats['verses'] % 5000 == 0:
            print(f"  Processed {stats['verses']} verses...")

    print(f"\nResults:")
    print(f"  Verses processed: {stats['verses']}")
    print(f"  Total tagged words: {stats['total']}")
    print(f"  Matched: {stats['matched']} ({stats['matched']/stats['total']*100:.1f}%)")
    print(f"  Unmatched: {stats['unmatched']} ({stats['unmatched']/stats['total']*100:.1f}%)")

    print(f"\nWriting alignment to {OUTPUT_PATH}...")
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(alignment, f, indent=2)

    print(f"Writing unmatched to {UNMATCHED_PATH}...")
    with open(UNMATCHED_PATH, 'w', encoding='utf-8') as f:
        json.dump(unmatched, f, indent=2, ensure_ascii=False)

    print("Done!")


if __name__ == '__main__':
    main()
