import json

with open("public/data/bible_verses.json", "r", encoding="utf-8") as f:
    verses = json.load(f)

# Find Isaiah 58
isa58 = [v for v in verses if v.get("book") == "Isa" and v.get("chapter") == 58]
print(f"Found {len(isa58)} verses in Isaiah 58")

# Show first 5
for v in isa58[:5]:
    print(f"  {v['book']}.{v['chapter']}.{v['verse']}: {v['text'][:80]}...")
