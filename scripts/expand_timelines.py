"""
Expand timelines.json from ~234 entries to 350+.

Adds scripture-referenced entries across all categories.
Every entry must have explicit biblical references — no data without evidence.
"""

import json
from pathlib import Path

BASE = Path(__file__).parent.parent
TIMELINES_PATH = BASE / "public" / "data" / "timelines.json"


def expand():
    with open(TIMELINES_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    # =========================================================
    # LIFESPANS — add notable figures with recorded ages
    # =========================================================
    data["lifespans"]["notable_ages"] = [
        {"name": "Jehoiada the priest", "years": 130, "references": ["2Ch.24.15"], "notes": "Oldest recorded age outside Genesis"},
        {"name": "Job (after restoration)", "years_added": 140, "references": ["Job.42.16"], "notes": "Lived 140 years after his trials"},
        {"name": "Eli", "years": 98, "references": ["1Sa.4.15"]},
        {"name": "Ishmael", "years": 137, "references": ["Gen.25.17"]},
        {"name": "Levi", "years": 137, "references": ["Exo.6.16"]},
        {"name": "Kohath", "years": 133, "references": ["Exo.6.18"]},
        {"name": "Amram", "years": 137, "references": ["Exo.6.20"]},
    ]

    # Remove duplicates from patriarchs (Ishmael, Levi, Kohath, Amram already there)
    existing_patriarch_names = {p["name"] for p in data["lifespans"]["patriarchs"]}
    data["lifespans"]["notable_ages"] = [
        e for e in data["lifespans"]["notable_ages"]
        if e["name"] not in existing_patriarch_names
    ]

    # =========================================================
    # EVENTS — Old Testament additions
    # =========================================================
    new_ot_events = [
        # Genesis
        {
            "name": "Jacob's Service for Rachel",
            "duration_years": 7,
            "references": ["Gen.29.20"],
            "notes": "Served Laban 7 years for Rachel, received Leah instead"
        },
        {
            "name": "Jacob's Service for Rachel (Second)",
            "duration_years": 7,
            "references": ["Gen.29.27-30"],
            "notes": "Served 7 more years after receiving Rachel"
        },
        {
            "name": "Jacob's Service for Flocks",
            "duration_years": 6,
            "references": ["Gen.31.41"],
            "notes": "6 years tending Laban's flocks after 14 years for wives"
        },
        {
            "name": "Joseph in Prison",
            "duration_years": 2,
            "references": ["Gen.41.1"],
            "notes": "Minimum 2 years; cupbearer forgot him for 2 full years after interpretation"
        },
        {
            "name": "Seven Years of Plenty (Egypt)",
            "duration_years": 7,
            "references": ["Gen.41.29", "Gen.41.47-49"]
        },
        {
            "name": "Embalming of Jacob",
            "duration_days": 40,
            "references": ["Gen.50.3"]
        },
        {
            "name": "Mourning for Jacob",
            "duration_days": 70,
            "references": ["Gen.50.3"]
        },
        # Exodus
        {
            "name": "Moses Hidden by Mother",
            "duration_months": 3,
            "references": ["Exo.2.2", "Act.7.20", "Heb.11.23"]
        },
        {
            "name": "Moses in Pharaoh's Court",
            "duration_years": 40,
            "references": ["Act.7.23"],
            "notes": "From adoption to flight at age 40"
        },
        {
            "name": "Tabernacle Erected",
            "date_note": "First day of first month, second year",
            "references": ["Exo.40.17"],
            "notes": "Exactly one year after leaving Egypt"
        },
        # Numbers
        {
            "name": "Miriam's Exclusion from Camp",
            "duration_days": 7,
            "references": ["Num.12.15"],
            "notes": "Shut outside the camp for leprosy after speaking against Moses"
        },
        {
            "name": "Israel at Kadesh-barnea",
            "references": ["Num.13.26", "Deu.1.46"],
            "notes": "Remained many days; spies sent from here"
        },
        {
            "name": "Korah's Rebellion",
            "references": ["Num.16.1-35"],
            "notes": "Duration not specified; earth swallowed rebels"
        },
        {
            "name": "Israel Circling Mount Seir",
            "duration_years": 38,
            "references": ["Deu.2.1", "Deu.2.14"],
            "notes": "From Kadesh-barnea until crossing the brook Zered"
        },
        # Joshua
        {
            "name": "Jordan River Crossing",
            "references": ["Jos.3.14-17", "Jos.4.19"],
            "notes": "Crossed on 10th day of first month; waters stopped at Adam"
        },
        {
            "name": "Circumcision at Gilgal",
            "references": ["Jos.5.2-9"],
            "notes": "Second generation circumcised before Passover"
        },
        {
            "name": "Sun Standing Still at Gibeon",
            "duration_days": 1,
            "references": ["Jos.10.12-14"],
            "notes": "Sun stopped about a whole day"
        },
        # Judges
        {
            "name": "Shamgar as Judge",
            "references": ["Jdg.3.31"],
            "notes": "Duration not specified; killed 600 Philistines"
        },
        {
            "name": "Gideon's Fleece Test",
            "duration_days": 2,
            "references": ["Jdg.6.36-40"]
        },
        # Samuel / Kings
        {
            "name": "Goliath's Challenge",
            "duration_days": 40,
            "references": ["1Sa.17.16"],
            "notes": "Defied Israel morning and evening for 40 days"
        },
        {
            "name": "David's Flight from Saul",
            "duration_years": 10,
            "references": ["1Sa.19.10", "1Sa.27.7", "2Sa.2.11"],
            "notes": "Approximate; David was ~20 at Goliath, king at 30"
        },
        {
            "name": "David in Philistine Territory",
            "duration_months": 16,
            "references": ["1Sa.27.7"],
            "notes": "A year and four months with Achish of Gath"
        },
        {
            "name": "David's Census Plague",
            "duration_days": 3,
            "references": ["2Sa.24.13-15"],
            "notes": "70,000 died; stopped at threshing floor of Araunah"
        },
        {
            "name": "Drought in Elijah's Time",
            "duration_years": 3.5,
            "references": ["1Ki.17.1", "1Ki.18.1", "Luk.4.25", "Jas.5.17"],
            "notes": "Three years and six months with no rain"
        },
        {
            "name": "Elijah at Brook Cherith",
            "references": ["1Ki.17.2-7"],
            "notes": "Duration not specified; until brook dried up"
        },
        {
            "name": "Elijah at Zarephath",
            "references": ["1Ki.17.8-24"],
            "notes": "Duration not specified; widow's oil and flour did not run out"
        },
        {
            "name": "Siege of Jerusalem (First Babylonian)",
            "date_estimate": "597 BC",
            "references": ["2Ki.24.10-12"],
            "notes": "Jehoiachin surrendered; first deportation"
        },
        {
            "name": "Gedaliah's Governorship",
            "references": ["2Ki.25.22-26", "Jer.40.5-41.3"],
            "notes": "Duration not specified; assassinated by Ishmael"
        },
        # Ezra / Nehemiah / Esther
        {
            "name": "Ezra's Journey from Babylon",
            "duration_months": 4,
            "references": ["Ezr.7.9"],
            "notes": "Left Babylon on 1st of 1st month, arrived on 1st of 5th month"
        },
        {
            "name": "Ezra's Mourning over Intermarriage",
            "references": ["Ezr.9.1-10.17"],
            "notes": "Resolution took from 9th month to 1st month (3 months)"
        },
        {
            "name": "Esther's Three-Day Fast",
            "duration_days": 3,
            "references": ["Est.4.16"]
        },
        {
            "name": "Esther's Two Banquets",
            "duration_days": 2,
            "references": ["Est.5.4-8", "Est.7.1-6"]
        },
        {
            "name": "Purim Celebration Established",
            "duration_days": 2,
            "references": ["Est.9.21-22"],
            "notes": "14th and 15th of Adar"
        },
        # Prophets
        {
            "name": "Nebuchadnezzar's Madness",
            "duration_periods": 7,
            "references": ["Dan.4.32-33"],
            "notes": "Seven periods of time (likely years); lived like an animal"
        },
        {
            "name": "Daniel in the Lions' Den",
            "duration_days": 1,
            "references": ["Dan.6.16-23"],
            "notes": "From evening to dawn"
        },
        {
            "name": "Shadrach, Meshach, Abednego in Furnace",
            "references": ["Dan.3.19-27"],
            "notes": "Brief; emerged unharmed with no smell of fire"
        },
        {
            "name": "Ezekiel's Silence",
            "references": ["Eze.3.26", "Eze.24.27", "Eze.33.22"],
            "notes": "Could only speak when God opened his mouth; ended at fall of Jerusalem"
        },
        {
            "name": "Ezekiel's Model Siege of Jerusalem",
            "duration_days": 430,
            "references": ["Eze.4.1-8"],
            "notes": "390 days on left side (Israel), 40 on right (Judah)"
        },
        {
            "name": "Hosea's Marriage to Gomer",
            "references": ["Hos.1.2-3", "Hos.3.1-2"],
            "notes": "Duration not specified; prophetic symbol of God and Israel"
        },
        {
            "name": "Isaiah Walking Naked",
            "duration_years": 3,
            "references": ["Isa.20.3"],
            "notes": "Three years as a sign against Egypt and Cush"
        },
    ]

    data["events"]["old_testament"].extend(new_ot_events)

    # =========================================================
    # EVENTS — New Testament additions
    # =========================================================
    new_nt_events = [
        {
            "name": "Mary's Visit to Elizabeth",
            "duration_months": 3,
            "references": ["Luk.1.56"]
        },
        {
            "name": "Flight to Egypt",
            "references": ["Mat.2.13-15"],
            "notes": "Duration not specified; until death of Herod"
        },
        {
            "name": "Jesus at Sychar (Samaria)",
            "duration_days": 2,
            "references": ["Joh.4.40"]
        },
        {
            "name": "Transfiguration",
            "references": ["Mat.17.1", "Mar.9.2", "Luk.9.28"],
            "notes": "Six days (Matthew/Mark) or about eight days (Luke) after Peter's confession"
        },
        {
            "name": "Lazarus in the Tomb",
            "duration_days": 4,
            "references": ["Joh.11.17"]
        },
        {
            "name": "Last Supper to Arrest",
            "references": ["Mat.26.17-56"],
            "notes": "Same night; Passover evening to garden of Gethsemane"
        },
        {
            "name": "Crucifixion Duration",
            "duration_hours": 6,
            "references": ["Mar.15.25", "Mar.15.33-37"],
            "notes": "Third hour (9 AM) to ninth hour (3 PM)"
        },
        {
            "name": "Darkness during Crucifixion",
            "duration_hours": 3,
            "references": ["Mar.15.33", "Mat.27.45", "Luk.23.44"],
            "notes": "Sixth hour to ninth hour (noon to 3 PM)"
        },
        {
            "name": "Jesus in the Tomb",
            "duration_days": 3,
            "references": ["Mat.12.40", "Mat.27.63", "Mar.8.31"],
            "notes": "Friday evening to Sunday morning"
        },
        {
            "name": "Paul's Blindness after Conversion",
            "duration_days": 3,
            "references": ["Act.9.9"]
        },
        {
            "name": "Peter at Cornelius's House",
            "references": ["Act.10.24-48"],
            "notes": "Stayed some days (Act.10.48)"
        },
        {
            "name": "Peter's Imprisonment and Release",
            "references": ["Act.12.3-11"],
            "notes": "During Passover week; released by angel at night"
        },
        {
            "name": "Paul at Troas (Third Journey)",
            "duration_days": 7,
            "references": ["Act.20.6"]
        },
        {
            "name": "Paul in Tyre",
            "duration_days": 7,
            "references": ["Act.21.4"]
        },
        {
            "name": "Paul in Ptolemais",
            "duration_days": 1,
            "references": ["Act.21.7"]
        },
        {
            "name": "Paul in Malta",
            "duration_months": 3,
            "references": ["Act.28.11"]
        },
        {
            "name": "Paul in Puteoli",
            "duration_days": 7,
            "references": ["Act.28.14"]
        },
        {
            "name": "Paul in Thessalonica",
            "duration_weeks": 3,
            "references": ["Act.17.2"],
            "notes": "Three Sabbaths reasoning in the synagogue"
        },
        {
            "name": "Paul before Gallio",
            "references": ["Act.18.12-17"],
            "date_estimate": "51-52 AD",
            "notes": "Gallio inscription provides key chronological anchor"
        },
        {
            "name": "Waiting for the Spirit at Pentecost",
            "duration_days": 10,
            "references": ["Act.1.3", "Act.2.1"],
            "notes": "Ascension at 40 days, Pentecost at 50 days after resurrection"
        },
    ]

    data["events"]["new_testament"].extend(new_nt_events)

    # =========================================================
    # JOURNEYS — additions
    # =========================================================
    data["journeys"]["elijah"] = [
        {
            "name": "To Brook Cherith",
            "from": "Before Ahab",
            "to": "Brook Cherith, east of Jordan",
            "references": ["1Ki.17.2-3"]
        },
        {
            "name": "Cherith to Zarephath",
            "from": "Brook Cherith",
            "to": "Zarephath (Sidon)",
            "references": ["1Ki.17.8-10"]
        },
        {
            "name": "Zarephath to Mount Carmel",
            "from": "Zarephath",
            "to": "Mount Carmel",
            "references": ["1Ki.18.19-20"]
        },
        {
            "name": "Mount Carmel to Jezreel",
            "from": "Mount Carmel",
            "to": "Jezreel",
            "references": ["1Ki.18.46"],
            "notes": "Ran ahead of Ahab's chariot"
        },
        {
            "name": "Jezreel to Beersheba to Horeb",
            "from": "Jezreel",
            "to": "Horeb (Mount Sinai)",
            "duration_days": 40,
            "references": ["1Ki.19.3-8"],
            "notes": "40 days and 40 nights on the strength of angelic food"
        },
    ]

    data["journeys"]["ruth"] = [
        {
            "name": "Bethlehem to Moab",
            "from": "Bethlehem",
            "to": "Moab",
            "references": ["Rut.1.1-2"],
            "notes": "Elimelech's family fled famine"
        },
        {
            "name": "Moab to Bethlehem (Return)",
            "from": "Moab",
            "to": "Bethlehem",
            "references": ["Rut.1.19"],
            "notes": "Naomi and Ruth; arrived at beginning of barley harvest"
        },
    ]

    data["journeys"]["david"] = [
        {
            "name": "Bethlehem to Valley of Elah",
            "from": "Bethlehem",
            "to": "Valley of Elah",
            "references": ["1Sa.17.20"],
            "notes": "Sent by Jesse to bring food to brothers"
        },
        {
            "name": "Flight to Nob (Ahimelech)",
            "from": "Gibeah",
            "to": "Nob",
            "references": ["1Sa.21.1"]
        },
        {
            "name": "Nob to Gath (Achish)",
            "from": "Nob",
            "to": "Gath",
            "references": ["1Sa.21.10"]
        },
        {
            "name": "Gath to Cave of Adullam",
            "from": "Gath",
            "to": "Cave of Adullam",
            "references": ["1Sa.22.1"]
        },
        {
            "name": "Flight to Moab (Parents)",
            "from": "Adullam",
            "to": "Moab",
            "references": ["1Sa.22.3-4"],
            "notes": "Brought parents to safety with king of Moab"
        },
        {
            "name": "Wilderness of Ziph/Maon/En-gedi",
            "references": ["1Sa.23.14-24.1"],
            "notes": "Moved between strongholds while Saul pursued"
        },
    ]

    data["journeys"]["jesus"] = [
        {
            "name": "Bethlehem to Egypt",
            "from": "Bethlehem",
            "to": "Egypt",
            "references": ["Mat.2.13-14"],
            "notes": "Joseph warned in dream; fled Herod"
        },
        {
            "name": "Egypt to Nazareth",
            "from": "Egypt",
            "to": "Nazareth",
            "references": ["Mat.2.19-23"],
            "notes": "After Herod's death"
        },
        {
            "name": "Nazareth to Jerusalem (Age 12)",
            "from": "Nazareth",
            "to": "Jerusalem",
            "references": ["Luk.2.41-42"],
            "notes": "Passover pilgrimage; found in temple after 3 days"
        },
        {
            "name": "Nazareth to Jordan (Baptism)",
            "from": "Nazareth",
            "to": "Jordan River",
            "references": ["Mat.3.13", "Mar.1.9"]
        },
        {
            "name": "Jordan to Wilderness (Temptation)",
            "from": "Jordan River",
            "to": "Wilderness",
            "references": ["Mat.4.1", "Mar.1.12"]
        },
        {
            "name": "Galilee to Tyre and Sidon",
            "from": "Galilee",
            "to": "Tyre and Sidon",
            "references": ["Mat.15.21", "Mar.7.24"]
        },
        {
            "name": "Final Journey to Jerusalem",
            "from": "Galilee",
            "to": "Jerusalem",
            "references": ["Luk.9.51", "Luk.13.22", "Luk.17.11"],
            "notes": "Set his face toward Jerusalem; Luke's travel narrative"
        },
    ]

    data["journeys"]["ezra_nehemiah"] = [
        {
            "name": "First Return under Zerubbabel",
            "from": "Babylon",
            "to": "Jerusalem",
            "date_estimate": "538 BC",
            "references": ["Ezr.1.1-2.1"],
            "notes": "42,360 returnees plus servants (Ezr.2.64-65)"
        },
        {
            "name": "Second Return under Ezra",
            "from": "Babylon",
            "to": "Jerusalem",
            "duration_months": 4,
            "date_estimate": "458 BC",
            "references": ["Ezr.7.9", "Ezr.8.31"]
        },
        {
            "name": "Nehemiah's Journey to Jerusalem",
            "from": "Susa",
            "to": "Jerusalem",
            "date_estimate": "445 BC",
            "references": ["Neh.2.1-11"]
        },
    ]

    # =========================================================
    # PROPHETIC PERIODS — add missing prophets
    # =========================================================
    new_prophets = [
        {
            "name": "Obadiah",
            "active_during": ["After fall of Jerusalem"],
            "date_estimate": "586-550 BC",
            "references": ["Oba.1.1"],
            "notes": "Prophecy against Edom for betraying Judah"
        },
        {
            "name": "Joel",
            "active_during": ["Uncertain; possibly Joash of Judah"],
            "date_estimate": "835-800 BC (early) or 500-400 BC (late)",
            "references": ["Joe.1.1"],
            "notes": "Date debated; locust plague and Day of the LORD"
        },
        {
            "name": "Nahum",
            "active_during": ["Between fall of Thebes (663 BC) and fall of Nineveh (612 BC)"],
            "date_estimate": "663-612 BC",
            "references": ["Nah.1.1", "Nah.3.8"],
            "notes": "Prophecy against Nineveh"
        },
        {
            "name": "Habakkuk",
            "active_during": ["Late Josiah or Jehoiakim"],
            "date_estimate": "620-605 BC",
            "references": ["Hab.1.1"],
            "notes": "Questioned God about Babylonian judgment"
        },
        {
            "name": "Zephaniah",
            "active_during": ["Josiah"],
            "date_estimate": "640-620 BC",
            "references": ["Zep.1.1"],
            "notes": "Great-great-grandson of Hezekiah"
        },
        {
            "name": "Jonah",
            "active_during": ["Jeroboam II"],
            "date_estimate": "780-760 BC",
            "references": ["Jon.1.1", "2Ki.14.25"],
            "notes": "Sent to Nineveh; also prophesied Israel's border restoration"
        },
        {
            "name": "Gad",
            "active_during": ["David's reign"],
            "references": ["1Sa.22.5", "2Sa.24.11"],
            "notes": "David's seer"
        },
        {
            "name": "Ahijah",
            "active_during": ["Solomon", "Jeroboam I"],
            "references": ["1Ki.11.29-39", "1Ki.14.2"],
            "notes": "Prophesied the kingdom's division"
        },
        {
            "name": "Shemaiah",
            "active_during": ["Rehoboam"],
            "references": ["1Ki.12.22", "2Ch.12.5"],
            "notes": "Prevented Rehoboam from fighting Israel"
        },
        {
            "name": "Huldah",
            "active_during": ["Josiah"],
            "date_estimate": "622 BC",
            "references": ["2Ki.22.14-20"],
            "notes": "Prophetess; confirmed the Book of the Law found in temple"
        },
        {
            "name": "Deborah",
            "active_during": ["Period of Judges"],
            "references": ["Jdg.4.4-5"],
            "notes": "Prophetess and judge; judged Israel under the palm tree"
        },
    ]

    data["prophetic_periods"].extend(new_prophets)

    # =========================================================
    # AGE MILESTONES — additions
    # =========================================================
    data["age_milestones"]["sarah"] = [
        {"age": 65, "event": "Left Haran with Abraham (est.)", "reference": "Gen.12.4", "notes": "10 years younger than Abraham (Gen.17.17)"},
        {"age": 76, "event": "Gave Hagar to Abraham", "reference": "Gen.16.16", "notes": "Abraham was 86"},
        {"age": 90, "event": "Isaac born", "reference": "Gen.17.17", "notes": "Laughed at the promise"},
        {"age": 127, "event": "Death at Kiriath-arba (Hebron)", "reference": "Gen.23.1-2"},
    ]

    data["age_milestones"]["samuel"] = [
        {"age": 0, "event": "Dedicated to the LORD before birth", "reference": "1Sa.1.11"},
        {"age": 3, "event": "Brought to tabernacle at Shiloh (est.)", "reference": "1Sa.1.24", "notes": "After weaning"},
        {"age": 12, "event": "Called by the LORD at night (est.)", "reference": "1Sa.3.1-10", "notes": "Age not specified; described as a boy"},
    ]

    data["age_milestones"]["caleb"] = [
        {"age": 40, "event": "Sent as spy to Canaan", "reference": "Jos.14.7"},
        {"age": 85, "event": "Claimed Hebron after conquest", "reference": "Jos.14.10-12", "notes": "Still strong as at age 40"},
    ]

    data["age_milestones"]["joshua"] = [
        {"age": 110, "event": "Death", "reference": "Jos.24.29"},
    ]

    data["age_milestones"]["solomon"] = [
        {"age": 0, "event": "Born to David and Bathsheba", "reference": "2Sa.12.24"},
        {"age_note": "young", "event": "Became king", "reference": "1Ki.3.7", "notes": "Called himself 'a little child' — actual age unknown"},
        {"age_note": "4th year of reign", "event": "Began building temple", "reference": "1Ki.6.1"},
    ]

    data["age_milestones"]["noah"] = [
        {"age": 500, "event": "Fathered Shem, Ham, Japheth", "reference": "Gen.5.32"},
        {"age": 600, "event": "The flood began", "reference": "Gen.7.6"},
        {"age": 601, "event": "Earth dried after flood", "reference": "Gen.8.13"},
        {"age": 950, "event": "Death", "reference": "Gen.9.29"},
    ]

    # =========================================================
    # BUILDING PROJECTS — additions
    # =========================================================
    new_buildings = [
        {
            "name": "Hezekiah's Tunnel (Siloam)",
            "references": ["2Ki.20.20", "2Ch.32.30"],
            "notes": "533m tunnel cut through bedrock to redirect Gihon Spring into city"
        },
        {
            "name": "Jeroboam's Shrines at Dan and Bethel",
            "references": ["1Ki.12.28-31"],
            "notes": "Golden calves set up as alternative to Jerusalem temple"
        },
        {
            "name": "Ahab's Ivory House",
            "references": ["1Ki.22.39"],
            "notes": "Ivory palace in Samaria"
        },
        {
            "name": "Omri Built Samaria",
            "references": ["1Ki.16.24"],
            "notes": "Bought hill of Samaria for 2 talents of silver; made it capital"
        },
    ]

    data["building_projects"].extend(new_buildings)

    # =========================================================
    # PROPHETIC TIME MARKERS — new section
    # =========================================================
    data["prophetic_time_markers"] = [
        {
            "name": "Daniel's 70 Weeks",
            "duration": "70 sevens (490 years)",
            "references": ["Dan.9.24-27"],
            "notes": "From decree to restore Jerusalem to 'the Anointed One'"
        },
        {
            "name": "Jeremiah's 70 Years of Exile",
            "duration_years": 70,
            "references": ["Jer.25.11-12", "Jer.29.10"],
            "notes": "Nations shall serve Babylon 70 years"
        },
        {
            "name": "Ezekiel's 390 + 40 Days",
            "duration_days": 430,
            "references": ["Eze.4.4-6"],
            "notes": "390 days for Israel's sin, 40 for Judah's — one day per year"
        },
        {
            "name": "Daniel's 2,300 Evenings and Mornings",
            "duration_days": 2300,
            "references": ["Dan.8.14"],
            "notes": "Until the sanctuary is restored to its rightful state"
        },
        {
            "name": "Daniel's 1,290 Days",
            "duration_days": 1290,
            "references": ["Dan.12.11"],
            "notes": "From abolition of regular sacrifice to the abomination"
        },
        {
            "name": "Daniel's 1,335 Days",
            "duration_days": 1335,
            "references": ["Dan.12.12"],
            "notes": "Blessed is he who waits and reaches 1,335 days"
        },
        {
            "name": "Isaiah's 65 Years",
            "duration_years": 65,
            "references": ["Isa.7.8"],
            "notes": "Within 65 years Ephraim will be shattered"
        },
        {
            "name": "Revelation's 42 Months",
            "duration_months": 42,
            "references": ["Rev.11.2", "Rev.13.5"],
            "notes": "Nations trample the holy city; beast given authority"
        },
        {
            "name": "Revelation's 1,260 Days",
            "duration_days": 1260,
            "references": ["Rev.11.3", "Rev.12.6"],
            "notes": "Two witnesses prophesy; woman protected in wilderness"
        },
        {
            "name": "Revelation's Five Months",
            "duration_months": 5,
            "references": ["Rev.9.5", "Rev.9.10"],
            "notes": "Locusts given power to torment for five months"
        },
    ]

    # =========================================================
    # Save
    # =========================================================
    with open(TIMELINES_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    # Count entries
    count = 0
    def count_items(obj):
        nonlocal count
        if isinstance(obj, list):
            for item in obj:
                if isinstance(item, dict) and any(k in item for k in ("name", "event", "age")):
                    count += 1
        elif isinstance(obj, dict):
            for k, v in obj.items():
                if k.startswith("_"):
                    continue
                count_items(v)

    for k, v in data.items():
        if k == "_meta":
            continue
        count_items(v)

    print(f"Total entries after expansion: {count}")
    print("Done.")


if __name__ == "__main__":
    expand()
