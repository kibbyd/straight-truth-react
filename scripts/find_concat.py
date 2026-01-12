import json
import re

with open("public/data/bible_verses.json", "r", encoding="utf-8") as f:
    verses = json.load(f)

# Find concatenated words like 'righteousnessand'
concat_pattern = re.compile(r"(ness|tion|ing|ed|ous|dom|ment|ful|less|able|ible)(and|the|of|to|for|in|is|a|but|or|that|he|she|it|they|we|you|who|my|me|him|all|be|so|as|no|do)", re.IGNORECASE)

found = []
for v in verses:
    text = v.get("text", "")
    if concat_pattern.search(text):
        ref = f"{v['book']}.{v['chapter']}.{v['verse']}"
        found.append((ref, text[:150]))

print(f"Found {len(found)} verses with concatenation issues")
for ref, preview in found[:50]:
    print(f"{ref}: {preview}...")
