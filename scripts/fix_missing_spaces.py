import json
import re

# Load Bible verses
with open("public/data/bible_verses.json", "r", encoding="utf-8") as f:
    verses = json.load(f)

# All fixes to apply (from both searches)
# Format: {verse_ref: [(wrong, correct), ...]}
fixes = {
    # lowercase+lowercase concatenations (7)
    "2Ch.27.9": [("reignedin", "reigned in")],
    "Neh.7.5": [("enrolledby", "enrolled by")],
    "Isa.5.1": [("belovedmy", "beloved my")],
    "Isa.58.2": [("righteousnessand", "righteousness and")],
    "Lam.1.1": [("citythat", "city that")],
    "Eze.16.54": [("consolationto", "consolation to")],
    "Act.26.10": [("authorityfrom", "authority from")],

    # CamelCase errors (24)
    "Exo.7.21": [("theNile", "the Nile")],
    "1Sa.6.17": [("forAshdod", "for Ashdod")],
    "1Sa.29.9": [("ofGod", "of God")],
    "1Ki.14.6": [("ofJeroboam", "of Jeroboam")],
    "1Ki.16.34": [("byJoshua", "by Joshua")],
    "1Ki.22.51": [("ofJehoshaphat", "of Jehoshaphat")],
    "1Ch.8.28": [("inJerusalem", "in Jerusalem")],
    "1Ch.11.3": [("bySamuel", "by Samuel")],
    "1Ch.14.15": [("forGod", "for God")],
    "1Ch.18.9": [("ofZobah", "of Zobah")],
    "2Ch.18.25": [("toJoash", "to Joash")],
    "2Ch.25.1": [("inJerusalem", "in Jerusalem")],
    "Ezr.7.6": [("ofIsrael", "of Israel")],
    "Sol.3.1": [("nightI", "night I")],
    "Isa.41.17": [("theLORD", "the LORD")],
    "Jer.20.5": [("toBabylon", "to Babylon")],
    "Jer.38.7": [("putJeremiah", "put Jeremiah")],
    "Jer.46.26": [("ofBabylon", "of Babylon")],
    "Dan.9.16": [("cityJerusalem", "city Jerusalem")],
    "Amo.2.8": [("theirGod", "their God")],
    "Mat.1.4": [("ofSalmon", "of Salmon")],
    "Mat.14.3": [("brotherPhilip", "brother Philip")],
    "Rom.5.5": [("theHoly", "the Holy")],
    "1Jo.2.22": [("theFather", "the Father")],
}

# Apply fixes
fixed_count = 0
for v in verses:
    ref = f"{v['book']}.{v['chapter']}.{v['verse']}"
    if ref in fixes:
        text = v["text"]
        for wrong, correct in fixes[ref]:
            if wrong in text:
                v["text"] = text.replace(wrong, correct)
                print(f"Fixed {ref}: '{wrong}' -> '{correct}'")
                fixed_count += 1
                text = v["text"]
            else:
                print(f"WARNING: '{wrong}' not found in {ref}")

# Save
with open("public/data/bible_verses.json", "w", encoding="utf-8") as f:
    json.dump(verses, f, ensure_ascii=False)

print(f"\nTotal fixes applied: {fixed_count}")
print("Saved to public/data/bible_verses.json")
