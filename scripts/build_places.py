"""
Build biblical places catalog from STEPBible TIPNR dataset.

Source: Tyndale Individualised Proper Names with all References
        STEPBible.org, Tyndale House Cambridge — CC BY 4.0
"""

import json
import re
from pathlib import Path

BASE = Path(__file__).parent.parent
INPUT = BASE / "data_sources" / "stepbible" / "TIPNR.txt"
OUTPUT = BASE / "public" / "data" / "places.json"
VERSES_PATH = BASE / "public" / "data" / "bible_verses.json"


def parse_coords(google_url):
    m = re.search(r'maps/@([-\d.]+),([-\d.]+)', google_url or '')
    if m:
        lat, lng = float(m.group(1)), float(m.group(2))
        if lat == 0 and lng == 0:
            return None
        return {"lat": lat, "lng": lng}
    return None


def parse_refs(ref_str):
    if not ref_str:
        return []

    refs = []
    last_book = None

    for part in ref_str.split(';'):
        part = part.strip()
        if not part or part.isdigit():
            continue

        part = re.sub(r'ff$', '', part)
        part = re.sub(r'[a-c]$', '', part)

        m = re.match(r'^([123]?[A-Z][a-z]+)\.(\d+)\.(\d+)$', part)
        if m:
            last_book = m.group(1)
            refs.append(f"{m.group(1)}.{m.group(2)}.{m.group(3)}")
            continue

        m = re.match(r'^([123]?[A-Z][a-z]+)\.(\d+)\.(\d+(?:,\d+)*)$', part)
        if m:
            last_book = m.group(1)
            chapter = m.group(2)
            for v in m.group(3).split(','):
                v = v.strip()
                if v:
                    refs.append(f"{m.group(1)}.{chapter}.{v}")
            continue

        m = re.match(r'^(\d+)\.(\d+)$', part)
        if m and last_book:
            refs.append(f"{last_book}.{m.group(1)}.{m.group(2)}")
            continue

        m = re.match(r'^(\d+)\.(\d+(?:,\d+)*)$', part)
        if m and last_book:
            chapter = m.group(1)
            for v in m.group(2).split(','):
                v = v.strip()
                if v:
                    refs.append(f"{last_book}.{chapter}.{v}")
            continue

    return refs


def parse_strongs(strong_str):
    if not strong_str:
        return []

    nums = []
    for part in strong_str.split(','):
        part = part.strip()
        m = re.match(r'^([HG])(\d+)', part)
        if m:
            prefix = m.group(1)
            num = m.group(2)
            padded = num.zfill(4)
            nums.append(f"{prefix}{padded}")
    return list(set(nums))


def build():
    lines = INPUT.read_text(encoding='utf-8').splitlines()

    with open(VERSES_PATH, 'r', encoding='utf-8') as f:
        verse_data = json.load(f)
    valid_verses = set()
    for v in verse_data:
        valid_verses.add(f"{v['book']}.{v['chapter']}.{v['verse']}")

    places = []
    i = 0
    while i < len(lines):
        line = lines[i]

        if not line.startswith('$========== PLACE'):
            i += 1
            continue

        i += 1
        if i >= len(lines):
            break

        header = lines[i].split('\t')
        if len(header) < 7:
            i += 1
            continue

        unique_id = header[0]
        google_url = header[4] if len(header) > 4 else ''
        geo_area = header[6] if len(header) > 6 else ''

        name_match = re.match(r'^([^@]+)', unique_id)
        name = name_match.group(1) if name_match else unique_id

        coords = parse_coords(google_url)

        if geo_area == '>':
            geo_area = ''

        i += 1
        alternate_names = []
        all_refs = []
        strongs = []
        brief = ''

        while i < len(lines):
            sub = lines[i]

            if sub.startswith('$=========='):
                break

            parts = sub.split('\t')

            if '– Total' in sub:
                for pi, p in enumerate(parts):
                    if '– Total' in p:
                        if pi + 2 < len(parts):
                            strongs = parse_strongs(parts[pi + 2])
                        if pi + 3 < len(parts):
                            all_refs = parse_refs(parts[pi + 3])
                        break

            elif any(x in sub for x in ['– Named', '– Greek', '– Spelled']):
                for p in parts:
                    if p and not p.startswith('–') and not p.startswith('H') and not p.startswith('G') and not p.startswith('http') and '=' not in p and '@' not in p and '.' not in p and not p.startswith('('):
                        alt_name = re.sub(r'\s*\(.*\)$', '', p).strip()
                        if alt_name and alt_name != name and alt_name not in alternate_names and len(alt_name) < 50:
                            alternate_names.append(alt_name)

            elif sub.startswith('@Brief= '):
                brief = sub[len('@Brief= '):].strip()

            i += 1

        valid_refs = [r for r in all_refs if r in valid_verses]

        if not valid_refs:
            continue

        place = {
            "name": name,
            "refs": valid_refs,
            "strongs": strongs,
        }

        if coords:
            place["coords"] = coords
        if geo_area:
            place["region"] = geo_area
        if brief:
            place["description"] = brief
        if alternate_names:
            place["altNames"] = alternate_names

        places.append(place)

    places.sort(key=lambda p: p["name"].lower())

    with_coords = sum(1 for p in places if "coords" in p)
    total_refs = sum(len(p["refs"]) for p in places)
    with_desc = sum(1 for p in places if "description" in p)
    with_alts = sum(1 for p in places if "altNames" in p)

    output = {
        "_meta": {
            "description": "Biblical places with coordinates and verse references",
            "source": "TIPNR - Tyndale Individualised Proper Names with References, STEPBible.org, Tyndale House Cambridge",
            "license": "CC BY 4.0",
            "count": len(places),
            "with_coordinates": with_coords,
            "total_references": total_refs,
        },
        "places": places
    }

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"Places: {len(places)}")
    print(f"With coordinates: {with_coords}")
    print(f"With descriptions: {with_desc}")
    print(f"With alternate names: {with_alts}")
    print(f"Total verse references: {total_refs}")
    print(f"Saved to {OUTPUT}")


if __name__ == '__main__':
    build()
