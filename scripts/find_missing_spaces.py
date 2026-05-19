import json
import re

with open("public/data/bible_verses.json", "r", encoding="utf-8") as f:
    verses = json.load(f)

# Known valid words/names that match pattern but aren't errors
valid_words = {
    'thousand', 'thousands', 'cousin', 'cousins', 'medicine', 'medicines',
    'gedor', 'engedi', 'apollyon', 'credit', 'accredit', 'accredited',
    'edition', 'condition', 'addition', 'tradition', 'ambition', 'petition',
    'position', 'volition', 'intuition', 'nutrition', 'audition', 'tuition',
    'sedition', 'rendition', 'perdition', 'expedition', 'partition', 'coalition'
}

# Look for common word endings followed directly by common short words
pattern = re.compile(r'(\w+(?:ness|tion|dom|ment|ful|ous|ing|ed|ly|ble|ity|ance|ence))(and|the|of|to|for|in|is|a|but|or|that|he|she|it|they|we|you|who|my|be|so|as|no|with|from|by|at|on|if|all|not|his|her|have|has|had|was|were|will|shall|may|can|do|did|are|this|these|those|there|here|then|now|I)\b', re.IGNORECASE)

found = []
for v in verses:
    text = v.get("text", "")
    matches = pattern.findall(text)
    for m in matches:
        concat = m[0] + m[1]
        if concat.lower() not in valid_words:
            ref = f"{v['book']}.{v['chapter']}.{v['verse']}"
            # Get context around the match
            idx = text.lower().find(concat.lower())
            if idx >= 0:
                start = max(0, idx - 30)
                end = min(len(text), idx + len(concat) + 30)
                context = text[start:end]
                found.append((ref, concat, m[0], m[1], context))

print(f"Found {len(found)} actual missing space errors:\n")
for ref, concat, word1, word2, context in found:
    print(f"{ref}: '{word1}' + '{word2}' -> should be '{word1} {word2}'")
    print(f"  ...{context}...")
    print()
