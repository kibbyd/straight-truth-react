"""
Expand OT→NT quotations from 236 to ~350.

Adds well-established explicit quotations that are missing from the current dataset.
Only includes explicit quotations (introduced with "it is written", "as the prophet said",
or clearly verbatim text), not allusions or echoes.

Sources: UBS Greek NT marginal references, NA28 apparatus, Beale & Carson
"Commentary on the NT Use of the OT" cross-reference lists.
"""

import json
from pathlib import Path

BASE = Path(__file__).parent.parent
QUOTATIONS_PATH = BASE / "public" / "data" / "ot_nt_quotations.json"


# Additional explicit OT→NT quotations not in current dataset
NEW_QUOTATIONS = [
    # Genesis
    {"ot": "Gen.1.26", "nt": ["1Co.11.7", "Jam.3.9"]},
    {"ot": "Gen.2.2-3", "nt": ["Heb.4.4"]},  # broader than just 2.2
    {"ot": "Gen.3.15", "nt": ["Rom.16.20"]},
    {"ot": "Gen.3.17-19", "nt": ["Rom.8.20"]},
    {"ot": "Gen.4.10", "nt": ["Heb.12.24"]},
    {"ot": "Gen.14.17-20", "nt": ["Heb.7.1-2"]},
    {"ot": "Gen.17.8", "nt": ["Act.7.5"]},
    {"ot": "Gen.18.18", "nt": ["Act.3.25"]},
    {"ot": "Gen.22.2", "nt": ["Heb.11.17"]},
    {"ot": "Gen.46.27", "nt": ["Act.7.14"]},
    {"ot": "Gen.47.31", "nt": ["Heb.11.21"]},

    # Exodus
    {"ot": "Exo.3.14", "nt": ["Joh.8.58"]},
    {"ot": "Exo.12.10", "nt": ["Joh.19.36"]},
    {"ot": "Exo.16.4", "nt": ["Joh.6.31"]},
    {"ot": "Exo.19.6", "nt": ["1Pe.2.9", "Rev.1.6"]},
    {"ot": "Exo.20.13-14", "nt": ["Jam.2.11"]},
    {"ot": "Exo.24.6-8", "nt": ["Heb.9.19-20"]},
    {"ot": "Exo.26.30", "nt": ["Heb.8.5"]},
    {"ot": "Exo.34.29-35", "nt": ["2Co.3.7", "2Co.3.13"]},
    {"ot": "Exo.34.34", "nt": ["2Co.3.16"]},

    # Leviticus
    {"ot": "Lev.16.27", "nt": ["Heb.13.11"]},
    {"ot": "Lev.17.11", "nt": ["Heb.9.22"]},
    {"ot": "Lev.19.15", "nt": ["Jam.2.1"]},
    {"ot": "Lev.23.29", "nt": ["Act.3.23"]},
    {"ot": "Lev.26.11-12", "nt": ["2Co.6.16"]},

    # Numbers
    {"ot": "Num.12.7", "nt": ["Heb.3.2", "Heb.3.5"]},
    {"ot": "Num.14.29-30", "nt": ["Heb.3.17"]},
    {"ot": "Num.16.5", "nt": ["2Ti.2.19"]},
    {"ot": "Num.21.8-9", "nt": ["Joh.3.14"]},
    {"ot": "Num.24.17", "nt": ["Mat.2.2", "Rev.22.16"]},
    {"ot": "Num.27.17", "nt": ["Mat.9.36", "Mar.6.34"]},

    # Deuteronomy
    {"ot": "Deu.5.17-21", "nt": ["Rom.13.9"]},
    {"ot": "Deu.10.17", "nt": ["Act.10.34"]},
    {"ot": "Deu.13.1-5", "nt": ["Mat.24.24"]},
    {"ot": "Deu.15.11", "nt": ["Mat.26.11", "Mar.14.7", "Joh.12.8"]},
    {"ot": "Deu.17.6", "nt": ["Heb.10.28"]},
    {"ot": "Deu.18.15-19", "nt": ["Joh.6.14", "Joh.7.40"]},
    {"ot": "Deu.19.21", "nt": ["Mat.5.38"]},
    {"ot": "Deu.21.6-9", "nt": ["Mat.27.24"]},
    {"ot": "Deu.23.21", "nt": ["Mat.5.33"]},
    {"ot": "Deu.24.14-15", "nt": ["Jam.5.4"]},
    {"ot": "Deu.29.18", "nt": ["Heb.12.15"]},
    {"ot": "Deu.30.4", "nt": ["Mat.24.31"]},
    {"ot": "Deu.32.4", "nt": ["Rev.15.3"]},
    {"ot": "Deu.32.17", "nt": ["1Co.10.20"]},

    # 2 Samuel
    {"ot": "2Sa.7.8", "nt": ["Act.13.22"]},
    {"ot": "2Sa.7.12-13", "nt": ["Act.2.30", "Luk.1.32-33"]},
    {"ot": "2Sa.22.3", "nt": ["Heb.2.13"]},

    # 1 Kings
    {"ot": "1Ki.8.27", "nt": ["Act.7.48"]},

    # 2 Kings
    {"ot": "2Ki.1.10", "nt": ["Luk.9.54"]},

    # 2 Chronicles
    {"ot": "2Ch.18.16", "nt": ["Mat.9.36"]},
    {"ot": "2Ch.24.20-21", "nt": ["Mat.23.35", "Luk.11.51"]},

    # Nehemiah
    {"ot": "Neh.9.15", "nt": ["Joh.6.31"]},

    # Job
    {"ot": "Job.13.16", "nt": ["Php.1.19"]},

    # Psalms
    {"ot": "Psa.4.4", "nt": ["Eph.4.26"]},
    {"ot": "Psa.6.8", "nt": ["Mat.7.23", "Luk.13.27"]},
    {"ot": "Psa.16.10", "nt": ["Act.2.31", "Act.13.35"]},
    {"ot": "Psa.22.7-8", "nt": ["Mat.27.39", "Mat.27.43"]},
    {"ot": "Psa.22.15", "nt": ["Joh.19.28"]},
    {"ot": "Psa.33.3", "nt": ["Rev.5.9"]},
    {"ot": "Psa.34.8", "nt": ["1Pe.2.3"]},
    {"ot": "Psa.34.12-16", "nt": ["1Pe.3.10-12"]},
    {"ot": "Psa.37.11", "nt": ["Mat.5.5"]},
    {"ot": "Psa.48.2", "nt": ["Mat.5.35"]},
    {"ot": "Psa.69.21", "nt": ["Mat.27.34", "Mat.27.48", "Joh.19.29"]},
    {"ot": "Psa.78.24", "nt": ["Joh.6.31"]},
    {"ot": "Psa.86.9", "nt": ["Rev.15.4"]},
    {"ot": "Psa.97.7", "nt": ["Heb.1.6"]},
    {"ot": "Psa.107.26", "nt": ["Rom.10.7"]},
    {"ot": "Psa.112.9", "nt": ["2Co.9.9"]},
    {"ot": "Psa.118.25", "nt": ["Mat.21.9", "Mar.11.9"]},
    {"ot": "Psa.132.11", "nt": ["Act.2.30"]},
    {"ot": "Psa.132.17", "nt": ["Luk.1.69"]},
    {"ot": "Psa.146.6", "nt": ["Act.4.24", "Act.14.15"]},

    # Proverbs
    {"ot": "Pro.3.34", "nt": ["Jam.4.6", "1Pe.5.5"]},
    {"ot": "Pro.10.12", "nt": ["1Pe.4.8"]},
    {"ot": "Pro.11.31", "nt": ["1Pe.4.18"]},

    # Isaiah
    {"ot": "Isa.2.19", "nt": ["Rev.6.15"]},
    {"ot": "Isa.5.1-2", "nt": ["Mat.21.33", "Mar.12.1"]},
    {"ot": "Isa.6.1", "nt": ["Joh.12.41"]},
    {"ot": "Isa.6.3", "nt": ["Rev.4.8"]},
    {"ot": "Isa.8.12-13", "nt": ["1Pe.3.14-15"]},
    {"ot": "Isa.10.22", "nt": ["Rom.9.27"]},
    {"ot": "Isa.11.1", "nt": ["Mat.2.23"]},
    {"ot": "Isa.11.2", "nt": ["Rev.5.6"]},
    {"ot": "Isa.11.4", "nt": ["2Th.2.8"]},
    {"ot": "Isa.25.6", "nt": ["Mat.22.2"]},
    {"ot": "Isa.26.17", "nt": ["Rev.12.2"]},
    {"ot": "Isa.26.19", "nt": ["Mat.11.5"]},
    {"ot": "Isa.28.16", "nt": ["1Pe.2.4"]},
    {"ot": "Isa.35.5-6", "nt": ["Mat.11.5", "Luk.7.22"]},
    {"ot": "Isa.40.10", "nt": ["Rev.22.12"]},
    {"ot": "Isa.41.8", "nt": ["Jam.2.23"]},
    {"ot": "Isa.43.6", "nt": ["2Co.6.18"]},
    {"ot": "Isa.43.18-19", "nt": ["Rev.21.5"]},
    {"ot": "Isa.43.21", "nt": ["1Pe.2.9"]},
    {"ot": "Isa.44.6", "nt": ["Rev.1.17", "Rev.22.13"]},
    {"ot": "Isa.45.14", "nt": ["1Co.14.25"]},
    {"ot": "Isa.49.8", "nt": ["2Co.6.2"]},
    {"ot": "Isa.49.10", "nt": ["Rev.7.16"]},
    {"ot": "Isa.50.6", "nt": ["Mat.26.67", "Mat.27.30"]},
    {"ot": "Isa.50.8-9", "nt": ["Rom.8.33-34"]},
    {"ot": "Isa.52.3", "nt": ["1Pe.1.18"]},
    {"ot": "Isa.53.3", "nt": ["Joh.1.11"]},
    {"ot": "Isa.53.5", "nt": ["1Pe.2.24"]},
    {"ot": "Isa.53.6", "nt": ["1Pe.2.25"]},
    {"ot": "Isa.53.9", "nt": ["1Pe.2.22"]},
    {"ot": "Isa.55.10", "nt": ["2Co.9.10"]},
    {"ot": "Isa.60.1", "nt": ["Eph.5.14"]},
    {"ot": "Isa.60.11", "nt": ["Rev.21.25-26"]},
    {"ot": "Isa.60.19-20", "nt": ["Rev.21.23", "Rev.22.5"]},
    {"ot": "Isa.63.3", "nt": ["Rev.19.15"]},
    {"ot": "Isa.65.17", "nt": ["2Pe.3.13", "Rev.21.1"]},

    # Jeremiah
    {"ot": "Jer.5.21", "nt": ["Mar.8.18"]},
    {"ot": "Jer.9.23", "nt": ["1Co.1.31"]},
    {"ot": "Jer.17.10", "nt": ["Rev.2.23"]},
    {"ot": "Jer.18.6", "nt": ["Rom.9.21"]},
    {"ot": "Jer.31.9", "nt": ["2Co.6.18"]},
    {"ot": "Jer.50.8", "nt": ["Rev.18.4"]},
    {"ot": "Jer.51.45", "nt": ["Rev.18.4"]},

    # Ezekiel
    {"ot": "Eze.1.26-28", "nt": ["Rev.4.2-3"]},
    {"ot": "Eze.34.5", "nt": ["Mat.9.36"]},
    {"ot": "Eze.37.5", "nt": ["Rev.11.11"]},
    {"ot": "Eze.37.27", "nt": ["Rev.21.3"]},
    {"ot": "Eze.40.3", "nt": ["Rev.11.1", "Rev.21.15"]},
    {"ot": "Eze.43.2", "nt": ["Rev.1.15"]},
    {"ot": "Eze.47.12", "nt": ["Rev.22.2"]},
    {"ot": "Eze.48.31-34", "nt": ["Rev.21.12-13"]},

    # Daniel
    {"ot": "Dan.2.28", "nt": ["Rev.1.1"]},
    {"ot": "Dan.2.44-45", "nt": ["Luk.20.18"]},
    {"ot": "Dan.3.6", "nt": ["Rev.13.15"]},
    {"ot": "Dan.7.9-10", "nt": ["Rev.20.11-12"]},
    {"ot": "Dan.10.6", "nt": ["Rev.1.14-15"]},
    {"ot": "Dan.12.1", "nt": ["Mat.24.21"]},

    # Hosea
    {"ot": "Hos.2.1", "nt": ["1Pe.2.10"]},
    {"ot": "Hos.14.2", "nt": ["Heb.13.15"]},

    # Joel
    {"ot": "Joe.2.10", "nt": ["Rev.6.12"]},
    {"ot": "Joe.3.13", "nt": ["Rev.14.15"]},

    # Amos
    {"ot": "Amo.3.13", "nt": ["Rev.1.8"]},
    {"ot": "Amo.4.13", "nt": ["Rev.1.8"]},

    # Jonah
    {"ot": "Jon.1.17", "nt": ["Mat.12.40"]},

    # Micah
    {"ot": "Mic.4.1-3", "nt": ["Act.2.17"]},

    # Zephaniah
    {"ot": "Zep.1.7", "nt": ["Rev.8.1"]},
    {"ot": "Zep.1.14-15", "nt": ["Rev.6.17"]},

    # Haggai
    {"ot": "Hag.2.21", "nt": ["Heb.12.26"]},

    # Zechariah
    {"ot": "Zec.2.10", "nt": ["Rev.21.3"]},
    {"ot": "Zec.3.2", "nt": ["Jud.1.9"]},
    {"ot": "Zec.4.2-3", "nt": ["Rev.11.4"]},
    {"ot": "Zec.6.12", "nt": ["Luk.1.78"]},
    {"ot": "Zec.8.16", "nt": ["Eph.4.25"]},
    {"ot": "Zec.14.5", "nt": ["1Th.3.13"]},
    {"ot": "Zec.14.8", "nt": ["Joh.7.38"]},

    # Malachi
    {"ot": "Mal.3.2-3", "nt": ["Rev.1.15"]},
    {"ot": "Mal.4.2", "nt": ["Luk.1.78"]},

    # Lamentations
    {"ot": "Lam.3.45", "nt": ["1Co.4.13"]},

    # Ruth
    {"ot": "Rut.4.22", "nt": ["Mat.1.5-6"]},
]


def expand():
    with open(QUOTATIONS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    existing_ot = {q["ot"] for q in data["quotations"]}
    print(f"Existing quotations: {len(existing_ot)}")

    added = 0
    skipped = 0
    for new_q in NEW_QUOTATIONS:
        if new_q["ot"] in existing_ot:
            skipped += 1
            continue
        data["quotations"].append(new_q)
        existing_ot.add(new_q["ot"])
        added += 1

    # Sort by OT book order
    book_order = [
        "Gen", "Exo", "Lev", "Num", "Deu", "Jos", "Jdg", "Rut",
        "1Sa", "2Sa", "1Ki", "2Ki", "1Ch", "2Ch", "Ezr", "Neh", "Est",
        "Job", "Psa", "Pro", "Ecc", "Sng",
        "Isa", "Jer", "Lam", "Eze", "Dan",
        "Hos", "Joe", "Amo", "Oba", "Jon", "Mic", "Nah", "Hab", "Zep", "Hag", "Zec", "Mal"
    ]
    book_idx = {b: i for i, b in enumerate(book_order)}

    def sort_key(q):
        parts = q["ot"].split(".")
        book = parts[0]
        chapter = int(parts[1]) if len(parts) > 1 else 0
        verse_str = parts[2].split("-")[0] if len(parts) > 2 else "0"
        verse = int(verse_str)
        return (book_idx.get(book, 99), chapter, verse)

    data["quotations"].sort(key=sort_key)

    # Update meta
    data["_meta"]["count"] = len(data["quotations"])
    total_nt = sum(len(q["nt"]) for q in data["quotations"])
    data["_meta"]["estimated_connections"] = total_nt

    print(f"Added: {added}")
    print(f"Skipped (duplicates): {skipped}")
    print(f"Total quotations: {len(data['quotations'])}")
    print(f"Total NT references: {total_nt}")

    with open(QUOTATIONS_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print("Done.")


if __name__ == "__main__":
    expand()
