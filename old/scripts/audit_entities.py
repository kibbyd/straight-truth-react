import json
import os

files = [
    ("places.json", None),
    ("waters.json", None),
    ("mountains.json", None),
]

for fname, key in files:
    path = f"public/data/{fname}"
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            d = json.load(f)
        if isinstance(d, list):
            print(f"{fname}: {len(d)} entries")
            if d:
                print(f"  Sample keys: {list(d[0].keys())}")
        elif isinstance(d, dict):
            # Try to find the main array
            for k, v in d.items():
                if isinstance(v, list) and len(v) > 0:
                    print(f"{fname} -> {k}: {len(v)} entries")
                    if v:
                        print(f"  Sample keys: {list(v[0].keys()) if isinstance(v[0], dict) else 'not dict'}")
    else:
        print(f"{fname}: NOT FOUND")
