import json
import os

data_dir = 'public/data'

audits = {
    'bible_verses.json': ('list', None),
    'verified_connections.json': ('dict_key', 'connections'),
    'strongs_data.json': ('dict_key', 'entries'),
    'parallel_passages.json': ('dict_key', 'parallel_sets'),
    'ot_nt_quotations.json': ('dict_key', 'quotations'),
    'names_of_god.json': ('dict_key', 'names'),
    'miracles_jesus.json': ('dict_key', 'miracles'),
    'parables_jesus.json': ('dict_key', 'parables'),
    'prayers_bible.json': ('dict_key', 'prayers'),
    'covenants.json': ('dict_key', 'covenants'),
    'festivals.json': ('dict_key', 'festivals'),
    'family_trees.json': ('dict_key', 'persons'),
    'timelines.json': ('dict_key', 'entries'),
    'maps.json': ('dict_key', 'maps'),
    'peoples_cultures.json': ('dict_key', 'peoples'),
    'ancient_religions.json': ('dict_key', 'religions'),
    'daily_life.json': ('dict_key', 'topics'),
    'archaeology.json': ('dict_key', 'discoveries'),
    'definitions.json': ('dict_key', 'definitions'),
    'topical_clusters.json': ('dict_key', 'clusters'),
    'glossary.json': ('dict_key', 'terms'),
    'questions.json': ('dict_key', 'questions'),
}

print(f"{'File':<35} {'Count':>8}")
print('-' * 45)

for fname, (dtype, key) in audits.items():
    path = os.path.join(data_dir, fname)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        if dtype == 'list':
            count = len(data)
        elif dtype == 'dict_key' and key in data:
            count = len(data[key])
        elif dtype == 'dict_key':
            # Try common alternative keys
            for alt in ['items', 'data', 'entries']:
                if alt in data:
                    count = len(data[alt])
                    break
            else:
                count = f"? keys: {list(data.keys())[:3]}"
        else:
            count = '?'

        print(f"{fname:<35} {str(count):>8}")
    else:
        print(f"{fname:<35} {'MISSING':>8}")