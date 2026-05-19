import json
import re

with open("public/data/bible_verses.json", "r", encoding="utf-8") as f:
    verses = json.load(f)

# Look for lowercase+lowercase word boundaries that shouldn't exist
# Pattern: any word character followed directly by common small words where there should be a space
# These are words that almost always follow a space
pattern = re.compile(r'([a-z])(\s*)(and|the|of|to|that|in|for|is|it|his|her|he|she|but|or|as|be|by|at|on|if|so|no|my|we|you|who|all|not|have|has|had|was|were|will|shall|may|can|do|did|are|this|these|those|there|here|then|now|an|a)\s', re.IGNORECASE)

# Alternative: look for sequences like "[a-z][A-Z]" within words (camelCase errors)
camelcase = re.compile(r'\b\w+[a-z][A-Z]\w*\b')

found = []
for v in verses:
    text = v.get("text", "")
    ref = f"{v['book']}.{v['chapter']}.{v['verse']}"

    # Look for CamelCase within words (excluding proper sentence boundaries)
    matches = camelcase.findall(text)
    for m in matches:
        if m not in found:
            # Find context
            idx = text.find(m)
            if idx >= 0:
                start = max(0, idx - 20)
                end = min(len(text), idx + len(m) + 20)
                context = text[start:end]
                found.append((ref, m, context))

print(f"Found {len(found)} potential camelCase errors:\n")
for ref, word, context in found[:50]:
    print(f"{ref}: '{word}'")
    print(f"  ...{context}...")
    print()
