"""
Extract red-letter (words of Jesus) data from BibleGateway ESV.
Outputs public/data/red_letters.json with character ranges per verse.

Format: { "Mat.5.3": [[0, 47]], "Mat.26.26": [[12, 38], [42, 55]] }
Each entry is a list of [start, end] character offsets into the verse text.
"""

import json
import re
import time
import os
import urllib.request
from html.parser import HTMLParser

# NT books: (abbreviation_ours, biblegateway_slug, chapters)
NT_BOOKS = [
    ('Mat', 'Matthew', 28),
    ('Mar', 'Mark', 16),
    ('Luk', 'Luke', 24),
    ('Joh', 'John', 21),
    ('Act', 'Acts', 28),
    ('Rom', 'Romans', 16),
    ('1Co', '1+Corinthians', 16),
    ('2Co', '2+Corinthians', 13),
    ('Gal', 'Galatians', 6),
    ('Eph', 'Ephesians', 6),
    ('Phi', 'Philippians', 4),
    ('Col', 'Colossians', 4),
    ('1Th', '1+Thessalonians', 5),
    ('2Th', '2+Thessalonians', 3),
    ('1Ti', '1+Timothy', 6),
    ('2Ti', '2+Timothy', 4),
    ('Tit', 'Titus', 3),
    ('Phm', 'Philemon', 1),
    ('Heb', 'Hebrews', 13),
    ('Jam', 'James', 5),
    ('1Pe', '1+Peter', 5),
    ('2Pe', '2+Peter', 3),
    ('1Jo', '1+John', 5),
    ('2Jo', '2+John', 1),
    ('3Jo', '3+John', 1),
    ('Jud', 'Jude', 1),
    ('Rev', 'Revelation', 22),
]

CACHE_DIR = os.path.join(os.path.dirname(__file__), '.bg_cache')
os.makedirs(CACHE_DIR, exist_ok=True)


def fetch_chapter(bg_slug, chapter):
    """Fetch chapter HTML from BibleGateway with caching."""
    cache_file = os.path.join(CACHE_DIR, f'{bg_slug}_{chapter}.html')
    if os.path.exists(cache_file):
        with open(cache_file, 'r', encoding='utf-8') as f:
            return f.read()

    url = f'https://www.biblegateway.com/passage/?search={bg_slug}+{chapter}&version=ESV'
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8')

    with open(cache_file, 'w', encoding='utf-8') as f:
        f.write(html)

    time.sleep(1.5)  # Rate limit
    return html


class VerseParser(HTMLParser):
    """Parse BibleGateway HTML to extract verse text with woj markers."""

    def __init__(self):
        super().__init__()
        self.verses = {}  # verse_num -> list of (text, is_woj)
        self.current_verse = None
        self.in_verse_text = False
        self.in_woj = False
        self.depth = 0
        self.woj_depth = 0
        self.skip_tags = {'sup', 'h3', 'h4'}
        self.skip_depth = 0
        self.in_passage = False

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        classes = attrs_dict.get('class', '')

        # Track when we're in the passage text
        if 'passage-text' in classes:
            self.in_passage = True

        if not self.in_passage:
            return

        # Skip footnotes, headings, crossrefs
        if tag in self.skip_tags or 'footnote' in classes or 'crossref' in classes or 'crossreference' in classes:
            self.skip_depth += 1
            return

        if self.skip_depth > 0:
            self.skip_depth += 1
            return

        # Verse number marker
        if tag == 'span' and 'versenum' in classes:
            # Extract verse number from content (handled in handle_data)
            self.skip_depth += 1
            return

        # Chapter number (verse 1)
        if tag == 'span' and 'chapternum' in classes:
            self.current_verse = 1
            if 1 not in self.verses:
                self.verses[1] = []
            self.in_verse_text = True
            self.skip_depth += 1
            return

        # Words of Jesus
        if tag == 'span' and 'woj' in classes:
            self.in_woj = True
            self.woj_depth = self.depth
            self.depth += 1
            return

        self.depth += 1

    def handle_endtag(self, tag):
        if not self.in_passage:
            if tag == 'div':
                pass  # passage-text div might be closing
            return

        if self.skip_depth > 0:
            self.skip_depth -= 1
            return

        self.depth -= 1

        if self.in_woj and self.depth <= self.woj_depth:
            self.in_woj = False

        # End of passage
        if tag == 'div' and self.depth < 0:
            self.in_passage = False
            self.depth = 0

    def handle_data(self, data):
        if not self.in_passage:
            return
        if self.skip_depth > 0:
            # Check if this is a verse number
            stripped = data.strip()
            if stripped.isdigit():
                self.current_verse = int(stripped)
                if self.current_verse not in self.verses:
                    self.verses[self.current_verse] = []
                self.in_verse_text = True
            return

        if self.in_verse_text and self.current_verse is not None:
            if data.strip() or data == ' ':
                self.verses[self.current_verse].append((data, self.in_woj))


def extract_woj_ranges(verse_parts, our_text):
    """
    Given parsed (text, is_woj) parts from BibleGateway and our ESV text,
    find character ranges in our_text that correspond to woj sections.
    """
    if not verse_parts or not our_text:
        return []

    # Reconstruct the BG text and find which character positions are woj
    bg_text = ''.join(part[0] for part in verse_parts)
    bg_text = re.sub(r'\s+', ' ', bg_text).strip()

    # Build woj mask for BG text
    bg_woj_mask = []
    for text, is_woj in verse_parts:
        for ch in text:
            bg_woj_mask.append(is_woj)

    # Normalize BG text same way
    normalized_bg = re.sub(r'\s+', ' ', ''.join(part[0] for part in verse_parts)).strip()

    # Build woj mask for normalized text
    raw = ''.join(part[0] for part in verse_parts)
    woj_chars = []
    raw_idx = 0
    for text, is_woj in verse_parts:
        for ch in text:
            woj_chars.append(is_woj)
            raw_idx += 1

    # Collapse whitespace in the mask too
    norm_mask = []
    i = 0
    in_space = False
    for ch, is_woj in zip(raw, woj_chars):
        if ch in ' \t\n\r':
            if not in_space:
                norm_mask.append(is_woj)
                in_space = True
        else:
            norm_mask.append(is_woj)
            in_space = False

    # Strip leading/trailing
    start_strip = len(raw) - len(raw.lstrip())
    end_strip = len(raw) - len(raw.rstrip())

    # Now map BG words to our text words
    bg_words = normalized_bg.split()
    our_words = our_text.split()

    if not bg_words:
        return []

    # Determine which BG words are woj
    bg_word_woj = []
    pos = 0
    for word in bg_words:
        # Find this word's start in normalized_bg
        word_start = normalized_bg.find(word, pos)
        if word_start == -1:
            bg_word_woj.append(False)
            continue
        # Check if majority of chars in this word are woj
        word_end = word_start + len(word)
        if word_end <= len(norm_mask):
            woj_count = sum(1 for i in range(word_start, word_end) if i < len(norm_mask) and norm_mask[i])
            bg_word_woj.append(woj_count > len(word) // 2)
        else:
            bg_word_woj.append(False)
        pos = word_end

    # Map to our text by word index alignment
    # BG and our ESV should have very similar words
    # Use simple index mapping: bg_word[i] -> our_word[i]
    our_word_woj = [False] * len(our_words)

    # Align words — they should mostly match
    min_len = min(len(bg_words), len(our_words))
    for i in range(min_len):
        if i < len(bg_word_woj):
            our_word_woj[i] = bg_word_woj[i]

    # If BG has more woj words beyond our length, ignore
    # If our text is longer, remaining words are not woj

    # Convert word-level woj to character ranges in our_text
    ranges = []
    current_start = None
    char_pos = 0

    for i, word in enumerate(our_words):
        word_start = our_text.find(word, char_pos)
        if word_start == -1:
            char_pos += len(word) + 1
            continue
        word_end = word_start + len(word)

        if our_word_woj[i]:
            if current_start is None:
                current_start = word_start
            current_end = word_end
        else:
            if current_start is not None:
                ranges.append([current_start, current_end])
                current_start = None

        char_pos = word_end

    if current_start is not None:
        ranges.append([current_start, current_end])

    return ranges


def load_our_verses():
    """Load our ESV verse text."""
    verses_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'data', 'bible_verses.json')
    with open(verses_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    lookup = {}
    for v in data:
        key = f"{v['book']}.{v['chapter']}.{v['verse']}"
        lookup[key] = v['text']
    return lookup


def main():
    our_verses = load_our_verses()
    red_letters = {}
    total_verses = 0
    total_marked = 0

    for abbr, bg_slug, num_chapters in NT_BOOKS:
        print(f'Processing {bg_slug}...')
        for ch in range(1, num_chapters + 1):
            try:
                html = fetch_chapter(bg_slug, ch)
            except Exception as e:
                print(f'  Error fetching {bg_slug} {ch}: {e}')
                continue

            parser = VerseParser()
            try:
                parser.feed(html)
            except Exception as e:
                print(f'  Error parsing {bg_slug} {ch}: {e}')
                continue

            for verse_num, parts in parser.verses.items():
                verse_id = f'{abbr}.{ch}.{verse_num}'
                our_text = our_verses.get(verse_id)
                if not our_text:
                    continue

                total_verses += 1
                has_woj = any(is_woj for _, is_woj in parts)
                if not has_woj:
                    continue

                ranges = extract_woj_ranges(parts, our_text)
                if ranges:
                    red_letters[verse_id] = ranges
                    total_marked += 1

        print(f'  {bg_slug} done. Running total: {total_marked} verses marked.')

    # Write output
    out_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'data', 'red_letters.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(red_letters, f, separators=(',', ':'))

    print(f'\nDone. {total_marked}/{total_verses} NT verses have words of Jesus.')
    print(f'Output: {out_path}')


if __name__ == '__main__':
    main()
