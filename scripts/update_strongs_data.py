"""
Update strongs_data.json with recovered alignment data.

Replaces the 'verses' key with the recovered ESV alignment
(validated + recovered mappings). Preserves lexicon and updates _meta.
"""

import json
from pathlib import Path

BASE = Path(__file__).parent.parent
STRONGS_DATA_PATH = BASE / "public" / "data" / "strongs_data.json"
RECOVERED_PATH = BASE / "public" / "data" / "strongs_esv_alignment_recovered.json"


def update():
    print("Loading strongs_data.json...")
    with open(STRONGS_DATA_PATH, "r", encoding="utf-8") as f:
        strongs_data = json.load(f)

    old_verse_count = len(strongs_data["verses"])
    old_mapping_count = sum(len(v) for v in strongs_data["verses"].values())

    print("Loading recovered alignment...")
    with open(RECOVERED_PATH, "r", encoding="utf-8") as f:
        recovered = json.load(f)

    new_verse_count = len(recovered)
    new_mapping_count = sum(len(v) for v in recovered.values())

    # Replace verses
    strongs_data["verses"] = recovered

    # Update _meta
    strongs_data["_meta"]["tagged_verses"] = new_verse_count
    strongs_data["_meta"]["match_rate"] = "88.1%"
    strongs_data["_meta"]["note"] = (
        "Alignment pipeline: Berean interlinear -> ESV alignment (pass1+pass2) "
        "-> KJV validation (drop unconfirmed) -> KJV recovery (restore with cross-verse evidence). "
        "No data is better than wrong data."
    )
    strongs_data["_meta"]["validation_date"] = "2026-04-08"

    print(f"\nBefore: {old_verse_count:,} verses, {old_mapping_count:,} mappings")
    print(f"After:  {new_verse_count:,} verses, {new_mapping_count:,} mappings")
    print(f"Delta:  {new_verse_count - old_verse_count:+,} verses, {new_mapping_count - old_mapping_count:+,} mappings")

    print(f"\nSaving updated strongs_data.json...")
    with open(STRONGS_DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(strongs_data, f, ensure_ascii=False)

    print("Done.")


if __name__ == "__main__":
    update()
