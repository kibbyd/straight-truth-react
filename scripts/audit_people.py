import json

# Check family_trees for people
with open('public/data/family_trees.json', 'r', encoding='utf-8') as f:
    ft = json.load(f)
print(f"Family trees persons: {len(ft.get('persons', []))}")

# Check kings
with open('public/data/kings_refined.json', 'r', encoding='utf-8') as f:
    kings = json.load(f)
if isinstance(kings, list):
    print(f"Kings: {len(kings)}")
else:
    print(f"Kings entries: {sum(len(v) for v in kings.values() if isinstance(v, list))}")

# Check prophets
with open('public/data/prophets.json', 'r', encoding='utf-8') as f:
    prophets = json.load(f)
if isinstance(prophets, list):
    print(f"Prophets: {len(prophets)}")
else:
    print(f"Prophets entries: {len(prophets.get('prophets', []))}")

# Sample a person from family_trees
persons = ft.get('persons', [])
if persons:
    print(f"\nSample person keys: {list(persons[0].keys())}")
    print(f"Sample person: {persons[0]}")
