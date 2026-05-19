import json
import re
from collections import Counter

with open("public/data/bible_verses.json", "r", encoding="utf-8") as f:
    verses = json.load(f)

# Find actual concatenated words
# Looking for lowercase letter followed by uppercase (wordWord)
# Or common word endings followed by common word starts without space
patterns = [
    r'\b\w+ness[a-z]+\b',  # blessingand
    r'\b\w+tion[a-z]+\b',  # nationand
    r'\b\w+ing[a-z]+\b',   # bringin -> maybe false positive
    r'\b\w+dom[a-z]+\b',   # kingdomand
]

# Just find all instances of "wordword" - lowercase ending touching lowercase start
# specifically where common endings meet common word starts
concat_words = []
for v in verses:
    text = v.get("text", "")
    # Find words that have common endings directly followed by common words
    matches = re.findall(r'\b(\w+(?:ness|tion|dom|ment|ful|ous))(and|the|of|to|for|in|is|a|but|or|that|he|she|it|they|we|you|who)\b', text, re.IGNORECASE)
    for m in matches:
        concat_words.append(m[0] + m[1])

counter = Counter(concat_words)
print(f"Total concatenation instances: {len(concat_words)}")
print(f"\nMost common concatenations:")
for word, count in counter.most_common(50):
    print(f"  {word}: {count}")
