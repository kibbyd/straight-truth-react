"""
Rebuild OT→NT quotations from UBS4 apparatus (Felix Just / catholic-resources.org).

Replaces the entire quotations file with authoritative scholarly data.
Excludes allusions and typology — only explicit quotations and references.

Source: Felix Just, S.J., based on UBS4 Greek New Testament cross-reference system.
"""

import json
import re
from pathlib import Path
from collections import defaultdict

BASE = Path(__file__).parent.parent
OUTPUT_PATH = BASE / "public" / "data" / "ot_nt_quotations.json"
VERSES_PATH = BASE / "public" / "data" / "bible_verses.json"

# Book name -> abbreviation mapping
BOOK_MAP = {
    "Genesis": "Gen", "Exodus": "Exo", "Leviticus": "Lev", "Numbers": "Num",
    "Deuteronomy": "Deu", "Joshua": "Jos", "Judges": "Jdg", "Ruth": "Rut",
    "1 Samuel": "1Sa", "2 Samuel": "2Sa", "1 Kings": "1Ki", "2 Kings": "2Ki",
    "1 Chronicles": "1Ch", "2 Chronicles": "2Ch", "Ezra": "Ezr", "Nehemiah": "Neh",
    "Esther": "Est", "Job": "Job", "Psalm": "Psa", "Psalms": "Psa",
    "Proverbs": "Pro", "Ecclesiastes": "Ecc", "Song of Solomon": "Sng",
    "Isaiah": "Isa", "Jeremiah": "Jer", "Lamentations": "Lam",
    "Ezekiel": "Eze", "Daniel": "Dan", "Hosea": "Hos", "Joel": "Joe",
    "Amos": "Amo", "Obadiah": "Oba", "Jonah": "Jon", "Micah": "Mic",
    "Nahum": "Nah", "Habakkuk": "Hab", "Zephaniah": "Zep", "Haggai": "Hag",
    "Zechariah": "Zec", "Malachi": "Mal",
    "Matthew": "Mat", "Mark": "Mar", "Luke": "Luk", "John": "Joh",
    "Acts": "Act", "Romans": "Rom",
    "1 Corinthians": "1Co", "2 Corinthians": "2Co",
    "Galatians": "Gal", "Ephesians": "Eph", "Philippians": "Phi",
    "Colossians": "Col", "1 Thessalonians": "1Th", "2 Thessalonians": "2Th",
    "1 Timothy": "1Ti", "2 Timothy": "2Ti", "Titus": "Tit", "Philemon": "Phm",
    "Hebrews": "Heb", "James": "Jam",
    "1 Peter": "1Pe", "2 Peter": "2Pe",
    "1 John": "1Jo", "2 John": "2Jo", "3 John": "3Jo",
    "Jude": "Jud", "Revelation": "Rev",
}


def convert_ref(ref_str):
    """Convert 'Book Chapter:Verse' to 'Book.Chapter.Verse' format.

    Handles:
    - Genesis 1:27 -> Gen.1.27
    - Psalm 118:25-26 -> Psa.118.25-26
    - Isaiah 40:3-5 -> Isa.40.3-5
    - Genesis 2:24 -> Gen.2.24
    - 1 Samuel 13:14 -> 1Sa.13.14
    """
    ref_str = ref_str.strip()

    # Try each book name (longest first to avoid partial matches)
    for book_name in sorted(BOOK_MAP.keys(), key=len, reverse=True):
        if ref_str.startswith(book_name):
            abbrev = BOOK_MAP[book_name]
            remainder = ref_str[len(book_name):].strip()
            # Parse chapter:verse
            m = re.match(r'(\d+):(\d+(?:-\d+)?)', remainder)
            if m:
                chapter = m.group(1)
                verse = m.group(2)
                return f"{abbrev}.{chapter}.{verse}"
            # Chapter only
            m = re.match(r'(\d+)', remainder)
            if m:
                return f"{abbrev}.{m.group(1)}.1"
            break

    return None


# UBS4 data from Felix Just (catholic-resources.org)
# Type: Q = Quotation, DQ = Direct Quotation, R = Reference
# Excluded: Allusion, Typology, Genealogy
RAW_DATA = [
    # Matthew
    ("Isaiah 7:14", "Matthew 1:23", "Q"),
    ("Isaiah 8:8", "Matthew 1:23", "Q"),
    ("Micah 5:2", "Matthew 2:6", "Q"),
    ("Hosea 11:1", "Matthew 2:15", "Q"),
    ("Jeremiah 31:15", "Matthew 2:18", "Q"),
    ("Isaiah 40:3", "Matthew 3:3", "DQ"),
    ("Deuteronomy 8:3", "Matthew 4:4", "DQ"),
    ("Psalm 91:11-12", "Matthew 4:6", "DQ"),
    ("Deuteronomy 6:16", "Matthew 4:7", "DQ"),
    ("Deuteronomy 6:13", "Matthew 4:10", "DQ"),
    ("Isaiah 9:1-2", "Matthew 4:15-16", "Q"),
    ("Exodus 20:13", "Matthew 5:21", "R"),
    ("Exodus 20:14", "Matthew 5:27", "R"),
    ("Deuteronomy 24:1", "Matthew 5:31", "R"),
    ("Leviticus 19:12", "Matthew 5:33", "R"),
    ("Numbers 30:2", "Matthew 5:33", "R"),
    ("Exodus 21:24", "Matthew 5:38", "R"),
    ("Leviticus 24:20", "Matthew 5:38", "R"),
    ("Deuteronomy 19:21", "Matthew 5:38", "R"),
    ("Leviticus 19:18", "Matthew 5:43", "R"),
    ("Isaiah 53:4", "Matthew 8:17", "Q"),
    ("Hosea 6:6", "Matthew 9:13", "Q"),
    ("Micah 7:6", "Matthew 10:35-36", "Q"),
    ("Malachi 3:1", "Matthew 11:10", "Q"),
    ("Hosea 6:6", "Matthew 12:7", "Q"),
    ("Isaiah 42:1-4", "Matthew 12:18-21", "Q"),
    ("Isaiah 6:9-10", "Matthew 13:14-15", "Q"),
    ("Psalm 78:2", "Matthew 13:35", "Q"),
    ("Exodus 20:12", "Matthew 15:4", "R"),
    ("Exodus 21:17", "Matthew 15:4", "R"),
    ("Isaiah 29:13", "Matthew 15:8-9", "Q"),
    ("Deuteronomy 19:15", "Matthew 18:16", "R"),
    ("Genesis 1:27", "Matthew 19:4", "R"),
    ("Genesis 2:24", "Matthew 19:5", "Q"),
    ("Leviticus 19:18", "Matthew 19:19", "R"),
    ("Isaiah 62:11", "Matthew 21:5", "Q"),
    ("Zechariah 9:9", "Matthew 21:5", "Q"),
    ("Psalm 118:25-26", "Matthew 21:9", "Q"),
    ("Isaiah 56:7", "Matthew 21:13", "Q"),
    ("Psalm 8:2", "Matthew 21:16", "Q"),
    ("Psalm 118:22-23", "Matthew 21:42", "Q"),
    ("Deuteronomy 25:5", "Matthew 22:24", "R"),
    ("Exodus 3:6", "Matthew 22:32", "R"),
    ("Deuteronomy 6:5", "Matthew 22:37", "R"),
    ("Leviticus 19:18", "Matthew 22:39", "R"),
    ("Psalm 110:1", "Matthew 22:44", "Q"),
    ("Psalm 118:26", "Matthew 23:39", "Q"),
    ("Zechariah 13:7", "Matthew 26:31", "Q"),
    ("Zechariah 11:12-13", "Matthew 27:9-10", "Q"),
    ("Psalm 22:1", "Matthew 27:46", "DQ"),
    # Mark
    ("Malachi 3:1", "Mark 1:2", "Q"),
    ("Isaiah 40:3", "Mark 1:3", "DQ"),
    ("Isaiah 6:9-10", "Mark 4:12", "Q"),
    ("Isaiah 29:13", "Mark 7:6-7", "Q"),
    ("Exodus 20:12", "Mark 7:10", "R"),
    ("Exodus 21:17", "Mark 7:10", "R"),
    ("Genesis 1:27", "Mark 10:6", "R"),
    ("Genesis 2:24", "Mark 10:7-8", "Q"),
    ("Psalm 118:25-26", "Mark 11:9-10", "Q"),
    ("Isaiah 56:7", "Mark 11:17", "Q"),
    ("Psalm 118:22-23", "Mark 12:10-11", "Q"),
    ("Deuteronomy 25:5", "Mark 12:19", "R"),
    ("Exodus 3:6", "Mark 12:26", "R"),
    ("Deuteronomy 6:4-5", "Mark 12:29-30", "R"),
    ("Leviticus 19:18", "Mark 12:31", "R"),
    ("Psalm 110:1", "Mark 12:36", "Q"),
    ("Zechariah 13:7", "Mark 14:27", "Q"),
    ("Psalm 22:1", "Mark 15:34", "DQ"),
    # Luke
    ("Exodus 13:2", "Luke 2:23", "R"),
    ("Leviticus 12:8", "Luke 2:24", "R"),
    ("Isaiah 40:3-5", "Luke 3:4-6", "Q"),
    ("Deuteronomy 8:3", "Luke 4:4", "DQ"),
    ("Deuteronomy 6:13", "Luke 4:8", "DQ"),
    ("Psalm 91:11-12", "Luke 4:10-11", "DQ"),
    ("Deuteronomy 6:16", "Luke 4:12", "DQ"),
    ("Isaiah 61:1-2", "Luke 4:18-19", "DQ"),
    ("Isaiah 58:6", "Luke 4:18", "Q"),
    ("Malachi 3:1", "Luke 7:27", "Q"),
    ("Isaiah 6:9", "Luke 8:10", "Q"),
    ("Deuteronomy 6:5", "Luke 10:27", "R"),
    ("Leviticus 19:18", "Luke 10:27", "R"),
    ("Psalm 118:26", "Luke 13:35", "Q"),
    ("Psalm 118:26", "Luke 19:38", "Q"),
    ("Isaiah 56:7", "Luke 19:46", "Q"),
    ("Psalm 118:22", "Luke 20:17", "Q"),
    ("Deuteronomy 25:5", "Luke 20:28", "R"),
    ("Exodus 3:6", "Luke 20:37", "R"),
    ("Psalm 110:1", "Luke 20:42-43", "Q"),
    ("Isaiah 53:12", "Luke 22:37", "Q"),
    ("Hosea 10:8", "Luke 23:30", "Q"),
    ("Psalm 31:5", "Luke 23:46", "DQ"),
    # John
    ("Isaiah 40:3", "John 1:23", "DQ"),
    ("Psalm 69:9", "John 2:17", "Q"),
    ("Psalm 78:24", "John 6:31", "Q"),
    ("Isaiah 54:13", "John 6:45", "Q"),
    ("Psalm 82:6", "John 10:34", "DQ"),
    ("Psalm 118:25-26", "John 12:13", "Q"),
    ("Zechariah 9:9", "John 12:15", "Q"),
    ("Isaiah 53:1", "John 12:38", "Q"),
    ("Isaiah 6:10", "John 12:40", "Q"),
    ("Psalm 41:9", "John 13:18", "Q"),
    ("Psalm 35:19", "John 15:25", "Q"),
    ("Psalm 69:4", "John 15:25", "Q"),
    ("Psalm 22:18", "John 19:24", "Q"),
    ("Exodus 12:46", "John 19:36", "Q"),
    ("Numbers 9:12", "John 19:36", "Q"),
    ("Zechariah 12:10", "John 19:37", "Q"),
    # Acts
    ("Psalm 69:25", "Acts 1:20", "Q"),
    ("Psalm 109:8", "Acts 1:20", "Q"),
    ("Joel 2:28-32", "Acts 2:17-21", "DQ"),
    ("Psalm 16:8-11", "Acts 2:25-28", "Q"),
    ("Psalm 132:11", "Acts 2:30", "Q"),
    ("Psalm 16:10", "Acts 2:31", "Q"),
    ("Psalm 110:1", "Acts 2:34-35", "Q"),
    ("Exodus 3:6", "Acts 3:13", "R"),
    ("Deuteronomy 18:15-16", "Acts 3:22", "Q"),
    ("Deuteronomy 18:19", "Acts 3:23", "R"),
    ("Leviticus 23:29", "Acts 3:23", "R"),
    ("Genesis 22:18", "Acts 3:25", "Q"),
    ("Genesis 26:4", "Acts 3:25", "Q"),
    ("Psalm 118:22", "Acts 4:11", "Q"),
    ("Psalm 2:1-2", "Acts 4:25-26", "Q"),
    ("Genesis 12:1", "Acts 7:3", "R"),
    ("Genesis 17:8", "Acts 7:5", "R"),
    ("Genesis 15:13-14", "Acts 7:6-7", "Q"),
    ("Exodus 3:12", "Acts 7:7", "R"),
    ("Exodus 2:14", "Acts 7:27-28", "R"),
    ("Exodus 3:6", "Acts 7:32", "R"),
    ("Exodus 3:5", "Acts 7:33", "R"),
    ("Exodus 3:7-8", "Acts 7:34", "R"),
    ("Exodus 2:14", "Acts 7:35", "R"),
    ("Deuteronomy 18:15", "Acts 7:37", "Q"),
    ("Exodus 32:1", "Acts 7:40", "R"),
    ("Amos 5:25-27", "Acts 7:42-43", "Q"),
    ("Isaiah 66:1-2", "Acts 7:49-50", "Q"),
    ("Isaiah 53:7-8", "Acts 8:32-33", "Q"),
    ("Psalm 89:20", "Acts 13:22", "Q"),
    ("1 Samuel 13:14", "Acts 13:22", "Q"),
    ("Psalm 2:7", "Acts 13:33", "Q"),
    ("Isaiah 55:3", "Acts 13:34", "Q"),
    ("Psalm 16:10", "Acts 13:35", "Q"),
    ("Habakkuk 1:5", "Acts 13:41", "Q"),
    ("Isaiah 49:6", "Acts 13:47", "Q"),
    ("Amos 9:11-12", "Acts 15:16-17", "Q"),
    ("Exodus 22:28", "Acts 23:5", "R"),
    ("Isaiah 6:9-10", "Acts 28:26-27", "Q"),
    # Romans
    ("Habakkuk 2:4", "Romans 1:17", "Q"),
    ("Isaiah 52:5", "Romans 2:24", "Q"),
    ("Psalm 51:4", "Romans 3:4", "Q"),
    ("Psalm 14:1-3", "Romans 3:10-12", "Q"),
    ("Psalm 5:9", "Romans 3:13", "Q"),
    ("Psalm 140:3", "Romans 3:13", "Q"),
    ("Psalm 10:7", "Romans 3:14", "Q"),
    ("Isaiah 59:7-8", "Romans 3:15-17", "Q"),
    ("Psalm 36:1", "Romans 3:18", "Q"),
    ("Genesis 15:6", "Romans 4:3", "Q"),
    ("Psalm 32:1-2", "Romans 4:7-8", "Q"),
    ("Genesis 15:6", "Romans 4:9", "Q"),
    ("Genesis 17:5", "Romans 4:17", "R"),
    ("Genesis 15:5", "Romans 4:18", "R"),
    ("Genesis 15:6", "Romans 4:22", "Q"),
    ("Exodus 20:17", "Romans 7:7", "R"),
    ("Genesis 21:12", "Romans 9:7", "Q"),
    ("Genesis 18:10", "Romans 9:9", "Q"),
    ("Genesis 25:23", "Romans 9:12", "Q"),
    ("Malachi 1:2-3", "Romans 9:13", "Q"),
    ("Exodus 33:19", "Romans 9:15", "Q"),
    ("Exodus 9:16", "Romans 9:17", "Q"),
    ("Hosea 2:23", "Romans 9:25", "Q"),
    ("Hosea 1:10", "Romans 9:26", "Q"),
    ("Isaiah 10:22-23", "Romans 9:27-28", "Q"),
    ("Isaiah 1:9", "Romans 9:29", "Q"),
    ("Isaiah 8:14", "Romans 9:33", "Q"),
    ("Isaiah 28:16", "Romans 9:33", "Q"),
    ("Leviticus 18:5", "Romans 10:5", "Q"),
    ("Deuteronomy 30:12-14", "Romans 10:6-8", "Q"),
    ("Isaiah 28:16", "Romans 10:11", "Q"),
    ("Joel 2:32", "Romans 10:13", "Q"),
    ("Isaiah 52:7", "Romans 10:15", "Q"),
    ("Isaiah 53:1", "Romans 10:16", "Q"),
    ("Psalm 19:4", "Romans 10:18", "Q"),
    ("Deuteronomy 32:21", "Romans 10:19", "Q"),
    ("Isaiah 65:1", "Romans 10:20", "Q"),
    ("Isaiah 65:2", "Romans 10:21", "Q"),
    ("1 Kings 19:10", "Romans 11:3", "R"),
    ("1 Kings 19:18", "Romans 11:4", "R"),
    ("Isaiah 29:10", "Romans 11:8", "Q"),
    ("Deuteronomy 29:4", "Romans 11:8", "Q"),
    ("Psalm 69:22-23", "Romans 11:9-10", "Q"),
    ("Isaiah 59:20-21", "Romans 11:26-27", "Q"),
    ("Isaiah 40:13", "Romans 11:34", "Q"),
    ("Job 41:11", "Romans 11:35", "Q"),
    ("Deuteronomy 32:35", "Romans 12:19", "Q"),
    ("Proverbs 25:21-22", "Romans 12:20", "Q"),
    ("Leviticus 19:18", "Romans 13:9", "Q"),
    ("Isaiah 45:23", "Romans 14:11", "Q"),
    ("Psalm 69:9", "Romans 15:3", "Q"),
    ("Psalm 18:49", "Romans 15:9", "Q"),
    ("2 Samuel 22:50", "Romans 15:9", "Q"),
    ("Deuteronomy 32:43", "Romans 15:10", "Q"),
    ("Psalm 117:1", "Romans 15:11", "Q"),
    ("Isaiah 11:10", "Romans 15:12", "Q"),
    ("Isaiah 52:15", "Romans 15:21", "Q"),
    # 1 Corinthians
    ("Isaiah 29:14", "1 Corinthians 1:19", "Q"),
    ("Jeremiah 9:24", "1 Corinthians 1:31", "Q"),
    ("Isaiah 64:4", "1 Corinthians 2:9", "Q"),
    ("Isaiah 40:13", "1 Corinthians 2:16", "Q"),
    ("Job 5:13", "1 Corinthians 3:19", "Q"),
    ("Psalm 94:11", "1 Corinthians 3:20", "Q"),
    ("Deuteronomy 17:7", "1 Corinthians 5:13", "R"),
    ("Genesis 2:24", "1 Corinthians 6:16", "Q"),
    ("Deuteronomy 25:4", "1 Corinthians 9:9", "Q"),
    ("Exodus 32:6", "1 Corinthians 10:7", "R"),
    ("Psalm 24:1", "1 Corinthians 10:26", "Q"),
    ("Isaiah 28:11-12", "1 Corinthians 14:21", "Q"),
    ("Psalm 8:6", "1 Corinthians 15:27", "Q"),
    ("Isaiah 22:13", "1 Corinthians 15:32", "Q"),
    ("Genesis 2:7", "1 Corinthians 15:45", "R"),
    ("Isaiah 25:8", "1 Corinthians 15:54", "Q"),
    ("Hosea 13:14", "1 Corinthians 15:55", "Q"),
    # 2 Corinthians
    ("Psalm 116:10", "2 Corinthians 4:13", "Q"),
    ("Isaiah 49:8", "2 Corinthians 6:2", "Q"),
    ("Leviticus 26:12", "2 Corinthians 6:16", "Q"),
    ("Ezekiel 37:27", "2 Corinthians 6:16", "Q"),
    ("Isaiah 52:11", "2 Corinthians 6:17", "Q"),
    ("Ezekiel 20:34", "2 Corinthians 6:17", "Q"),
    ("2 Samuel 7:14", "2 Corinthians 6:18", "Q"),
    ("Exodus 16:18", "2 Corinthians 8:15", "R"),
    ("Psalm 112:9", "2 Corinthians 9:9", "Q"),
    ("Jeremiah 9:24", "2 Corinthians 10:17", "Q"),
    ("Deuteronomy 19:15", "2 Corinthians 13:1", "R"),
    # Galatians
    ("Genesis 15:6", "Galatians 3:6", "Q"),
    ("Genesis 12:3", "Galatians 3:8", "Q"),
    ("Deuteronomy 27:26", "Galatians 3:10", "Q"),
    ("Habakkuk 2:4", "Galatians 3:11", "Q"),
    ("Leviticus 18:5", "Galatians 3:12", "Q"),
    ("Deuteronomy 21:23", "Galatians 3:13", "Q"),
    ("Genesis 12:7", "Galatians 3:16", "Q"),
    ("Isaiah 54:1", "Galatians 4:27", "Q"),
    ("Genesis 21:10", "Galatians 4:30", "Q"),
    ("Leviticus 19:18", "Galatians 5:14", "Q"),
    # Ephesians
    ("Psalm 68:18", "Ephesians 4:8", "Q"),
    ("Psalm 4:4", "Ephesians 4:26", "Q"),
    ("Genesis 2:24", "Ephesians 5:31", "Q"),
    ("Exodus 20:12", "Ephesians 6:2-3", "R"),
    # Philippians
    ("Isaiah 45:23", "Philippians 2:10-11", "Q"),
    # 1 Timothy
    ("Deuteronomy 25:4", "1 Timothy 5:18", "Q"),
    # 2 Timothy
    ("Numbers 16:5", "2 Timothy 2:19", "Q"),
    # Hebrews
    ("Psalm 2:7", "Hebrews 1:5", "Q"),
    ("2 Samuel 7:14", "Hebrews 1:5", "Q"),
    ("Deuteronomy 32:43", "Hebrews 1:6", "Q"),
    ("Psalm 104:4", "Hebrews 1:7", "Q"),
    ("Psalm 45:6-7", "Hebrews 1:8-9", "Q"),
    ("Psalm 102:25-27", "Hebrews 1:10-12", "Q"),
    ("Psalm 110:1", "Hebrews 1:13", "Q"),
    ("Psalm 8:4-6", "Hebrews 2:6-8", "Q"),
    ("Psalm 22:22", "Hebrews 2:12", "Q"),
    ("Isaiah 8:17", "Hebrews 2:13", "Q"),
    ("Isaiah 8:18", "Hebrews 2:13", "Q"),
    ("Psalm 95:7-11", "Hebrews 3:7-11", "Q"),
    ("Psalm 95:7-8", "Hebrews 3:15", "Q"),
    ("Psalm 95:11", "Hebrews 4:3", "Q"),
    ("Genesis 2:2", "Hebrews 4:4", "Q"),
    ("Psalm 95:7-8", "Hebrews 4:7", "Q"),
    ("Psalm 2:7", "Hebrews 5:5", "Q"),
    ("Psalm 110:4", "Hebrews 5:6", "Q"),
    ("Genesis 22:16-17", "Hebrews 6:13-14", "Q"),
    ("Psalm 110:4", "Hebrews 7:17", "Q"),
    ("Psalm 110:4", "Hebrews 7:21", "Q"),
    ("Exodus 25:40", "Hebrews 8:5", "R"),
    ("Jeremiah 31:31-34", "Hebrews 8:8-12", "DQ"),
    ("Exodus 24:8", "Hebrews 9:20", "R"),
    ("Psalm 40:6-8", "Hebrews 10:5-7", "DQ"),
    ("Jeremiah 31:33-34", "Hebrews 10:16-17", "Q"),
    ("Deuteronomy 32:35-36", "Hebrews 10:30", "Q"),
    ("Habakkuk 2:3-4", "Hebrews 10:37-38", "Q"),
    ("Genesis 21:12", "Hebrews 11:18", "R"),
    ("Genesis 47:31", "Hebrews 11:21", "R"),
    ("Proverbs 3:11-12", "Hebrews 12:5-6", "Q"),
    ("Exodus 19:12-13", "Hebrews 12:20", "Q"),
    ("Deuteronomy 9:19", "Hebrews 12:21", "R"),
    ("Haggai 2:6", "Hebrews 12:26", "Q"),
    ("Deuteronomy 31:6", "Hebrews 13:5", "Q"),
    ("Psalm 118:6", "Hebrews 13:6", "Q"),
    # James
    ("Leviticus 19:18", "James 2:8", "Q"),
    ("Exodus 20:13-14", "James 2:11", "R"),
    ("Genesis 15:6", "James 2:23", "Q"),
    ("Proverbs 3:34", "James 4:6", "Q"),
    # 1 Peter
    ("Leviticus 19:2", "1 Peter 1:16", "Q"),
    ("Isaiah 40:6-8", "1 Peter 1:24-25", "Q"),
    ("Isaiah 28:16", "1 Peter 2:6", "Q"),
    ("Psalm 118:22", "1 Peter 2:7", "Q"),
    ("Isaiah 8:14", "1 Peter 2:8", "Q"),
    ("Exodus 19:6", "1 Peter 2:9", "Q"),
    ("Isaiah 43:21", "1 Peter 2:9", "Q"),
    ("Isaiah 53:9", "1 Peter 2:22", "Q"),
    ("Psalm 34:12-16", "1 Peter 3:10-12", "Q"),
    ("Isaiah 8:12", "1 Peter 3:14", "Q"),
    ("Proverbs 11:31", "1 Peter 4:18", "Q"),
    ("Proverbs 3:34", "1 Peter 5:5", "Q"),
    # 2 Peter
    ("Proverbs 26:11", "2 Peter 2:22", "Q"),
]


def rebuild():
    # Load verses for validation
    with open(VERSES_PATH, "r", encoding="utf-8") as f:
        verse_data = json.load(f)
    valid_verses = set()
    for v in verse_data:
        valid_verses.add(f"{v['book']}.{v['chapter']}.{v['verse']}")

    # Process raw data
    # Group by OT reference, collecting NT references
    ot_to_nt = defaultdict(list)
    conversion_errors = []

    for ot_raw, nt_raw, qtype in RAW_DATA:
        ot_ref = convert_ref(ot_raw)
        nt_ref = convert_ref(nt_raw)

        if not ot_ref:
            conversion_errors.append(f"Could not convert OT: {ot_raw}")
            continue
        if not nt_ref:
            conversion_errors.append(f"Could not convert NT: {nt_raw}")
            continue

        ot_to_nt[ot_ref].append(nt_ref)

    # Build quotations list
    quotations = []
    for ot_ref in sorted(ot_to_nt.keys(), key=lambda x: (
        ["Gen","Exo","Lev","Num","Deu","Jos","Jdg","Rut","1Sa","2Sa","1Ki","2Ki",
         "1Ch","2Ch","Ezr","Neh","Est","Job","Psa","Pro","Ecc","Sng",
         "Isa","Jer","Lam","Eze","Dan","Hos","Joe","Amo","Oba","Jon","Mic",
         "Nah","Hab","Zep","Hag","Zec","Mal"].index(x.split(".")[0])
        if x.split(".")[0] in ["Gen","Exo","Lev","Num","Deu","Jos","Jdg","Rut",
         "1Sa","2Sa","1Ki","2Ki","1Ch","2Ch","Ezr","Neh","Est","Job","Psa","Pro",
         "Ecc","Sng","Isa","Jer","Lam","Eze","Dan","Hos","Joe","Amo","Oba","Jon",
         "Mic","Nah","Hab","Zep","Hag","Zec","Mal"] else 99,
        int(x.split(".")[1]),
        int(x.split(".")[2].split("-")[0])
    )):
        nt_refs = sorted(set(ot_to_nt[ot_ref]))
        quotations.append({
            "ot": ot_ref,
            "nt": nt_refs
        })

    # Validate all references
    errors = []
    for q in quotations:
        ot_base = q["ot"].split("-")[0]
        if ot_base not in valid_verses:
            errors.append(f"OT not found: {q['ot']}")
        for nt in q["nt"]:
            nt_base = nt.split("-")[0]
            if nt_base not in valid_verses:
                errors.append(f"NT not found: {nt} (from OT {q['ot']})")

    total_nt = sum(len(q["nt"]) for q in quotations)

    output = {
        "_meta": {
            "description": "Old Testament passages quoted in the New Testament",
            "source": "UBS4 Greek New Testament cross-reference apparatus, via Felix Just, S.J.",
            "type": "SCRIPTURE_QUOTE",
            "note": "Explicit quotations and direct references only — allusions excluded",
            "count": len(quotations),
            "total_nt_references": total_nt
        },
        "quotations": quotations
    }

    print(f"OT source passages: {len(quotations)}")
    print(f"Total NT references: {total_nt}")
    print(f"Conversion errors: {len(conversion_errors)}")
    print(f"Validation errors: {len(errors)}")

    if conversion_errors:
        print("\n--- CONVERSION ERRORS ---")
        for e in conversion_errors:
            print(f"  {e}")

    if errors:
        print("\n--- VALIDATION ERRORS ---")
        for e in errors:
            print(f"  {e}")

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\nSaved to {OUTPUT_PATH}")
    print("Done.")


if __name__ == "__main__":
    rebuild()
