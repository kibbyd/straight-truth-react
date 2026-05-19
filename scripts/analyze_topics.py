#!/usr/bin/env python3
"""
Analyze Strong's co-occurrences to discover natural topical clusters.
Topics emerge from the data itself - which words appear together in verses.
"""

import json
from collections import defaultdict, Counter
from itertools import combinations
import os

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
STRONGS_PATH = os.path.join(PROJECT_ROOT, 'public', 'data', 'strongs_data.json')
OUTPUT_PATH = os.path.join(PROJECT_ROOT, 'public', 'data', 'topical_clusters.json')

def load_strongs_data():
    """Load the Strong's concordance data."""
    print(f"Loading {STRONGS_PATH}...")
    with open(STRONGS_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def extract_verse_strongs(data):
    """Extract Strong's numbers for each verse."""
    verses = data.get('verses', {})
    verse_strongs = {}

    for verse_id, words in verses.items():
        strongs_in_verse = set()
        for word in words:
            if 'strong' in word:
                strongs_in_verse.add(word['strong'])
        if strongs_in_verse:
            verse_strongs[verse_id] = strongs_in_verse

    return verse_strongs

def find_cooccurrences(verse_strongs, min_count=5):
    """Find all pairs of Strong's numbers that co-occur in verses."""
    print("Finding co-occurrences...")
    pair_counts = Counter()
    pair_verses = defaultdict(list)

    for verse_id, strongs_set in verse_strongs.items():
        # Get all pairs in this verse
        strongs_list = sorted(strongs_set)
        for s1, s2 in combinations(strongs_list, 2):
            pair = (s1, s2)
            pair_counts[pair] += 1
            if pair_counts[pair] <= 50:  # Only store first 50 verse refs per pair
                pair_verses[pair].append(verse_id)

    # Filter to pairs that appear at least min_count times
    significant_pairs = {
        pair: count for pair, count in pair_counts.items()
        if count >= min_count
    }

    print(f"Found {len(significant_pairs)} significant co-occurrence pairs (>= {min_count} occurrences)")
    return significant_pairs, pair_verses

def get_strongs_frequency(verse_strongs):
    """Get frequency of each Strong's number."""
    freq = Counter()
    for strongs_set in verse_strongs.values():
        for s in strongs_set:
            freq[s] += 1
    return freq

def build_clusters(significant_pairs, lexicon, strongs_freq, min_cluster_size=3):
    """
    Build semantic clusters based on co-occurrence patterns.
    Uses a simple approach: group Strong's numbers that frequently co-occur.
    """
    print("Building clusters...")

    # Build adjacency map
    adjacency = defaultdict(set)
    pair_strength = {}

    for (s1, s2), count in significant_pairs.items():
        adjacency[s1].add(s2)
        adjacency[s2].add(s1)
        pair_strength[(s1, s2)] = count
        pair_strength[(s2, s1)] = count

    # Find seed terms - high frequency words that co-occur with many others
    seed_candidates = []
    for strong, neighbors in adjacency.items():
        if len(neighbors) >= 10 and strongs_freq.get(strong, 0) >= 50:
            seed_candidates.append((strong, len(neighbors), strongs_freq.get(strong, 0)))

    # Sort by neighbor count * frequency
    seed_candidates.sort(key=lambda x: x[1] * x[2], reverse=True)

    # Take top seeds, avoiding duplicates in meaning
    used_glosses = set()
    seeds = []
    for strong, neighbor_count, freq in seed_candidates[:100]:
        entry = lexicon.get(strong, {})
        gloss = entry.get('gloss', '').lower()
        if gloss and gloss not in used_glosses:
            seeds.append(strong)
            used_glosses.add(gloss)
            if len(seeds) >= 30:
                break

    print(f"Selected {len(seeds)} seed terms")

    # Build clusters around seeds
    clusters = []
    used_strongs = set()

    for seed in seeds:
        if seed in used_strongs:
            continue

        # Get all neighbors of seed, sorted by co-occurrence strength
        neighbors = []
        for neighbor in adjacency[seed]:
            strength = pair_strength.get((seed, neighbor), 0)
            neighbors.append((neighbor, strength))
        neighbors.sort(key=lambda x: x[1], reverse=True)

        # Take top neighbors that haven't been used
        cluster_members = [seed]
        for neighbor, strength in neighbors[:15]:
            if neighbor not in used_strongs and strength >= 10:
                cluster_members.append(neighbor)

        if len(cluster_members) >= min_cluster_size:
            # Mark as used
            for m in cluster_members:
                used_strongs.add(m)

            # Build cluster data
            cluster = build_cluster_data(
                cluster_members,
                lexicon,
                significant_pairs,
                strongs_freq
            )
            if cluster:
                clusters.append(cluster)

    print(f"Built {len(clusters)} clusters")
    return clusters

def build_cluster_data(members, lexicon, significant_pairs, strongs_freq):
    """Build data structure for a single cluster."""
    # Get lexicon entries
    entries = []
    for strong in members:
        entry = lexicon.get(strong, {})
        if entry:
            entries.append({
                'strong': strong,
                'original': entry.get('original', ''),
                'translit': entry.get('translit', ''),
                'gloss': entry.get('gloss', ''),
                'frequency': strongs_freq.get(strong, 0)
            })

    if not entries:
        return None

    # Sort by frequency
    entries.sort(key=lambda x: x['frequency'], reverse=True)

    # Determine cluster name from top glosses
    top_glosses = [e['gloss'] for e in entries[:3] if e['gloss']]
    cluster_name = ' / '.join(top_glosses) if top_glosses else 'Unknown'

    # Get co-occurrence pairs within cluster
    internal_pairs = []
    for i, s1 in enumerate(members):
        for s2 in members[i+1:]:
            pair = tuple(sorted([s1, s2]))
            count = significant_pairs.get(pair, 0)
            if count >= 5:
                internal_pairs.append({
                    'pair': list(pair),
                    'count': count
                })
    internal_pairs.sort(key=lambda x: x['count'], reverse=True)

    # Calculate total verse coverage
    total_freq = sum(e['frequency'] for e in entries)

    return {
        'id': entries[0]['strong'].lower().replace('h', 'hebrew-').replace('g', 'greek-'),
        'name': cluster_name,
        'strongs': [e['strong'] for e in entries],
        'entries': entries,
        'co_occurrences': internal_pairs[:20],
        'total_frequency': total_freq
    }

def add_predefined_clusters(clusters, lexicon, verse_strongs, strongs_freq):
    """Add curated clusters for important theological concepts."""

    predefined = [
        {
            'id': 'grace-faith-salvation',
            'name': 'Grace / Faith / Salvation',
            'strongs': ['G5485', 'G4102', 'G4982', 'G4991', 'G1344', 'G3086'],
            'description': 'NT salvation terminology'
        },
        {
            'id': 'love-mercy-compassion',
            'name': 'Love / Mercy / Compassion',
            'strongs': ['G0026', 'G0025', 'G1656', 'G3628', 'H2617', 'H0160', 'H7356'],
            'description': 'Love and mercy terms'
        },
        {
            'id': 'sin-iniquity-transgression',
            'name': 'Sin / Iniquity / Transgression',
            'strongs': ['G0266', 'G0458', 'G3900', 'H2403', 'H5771', 'H6588'],
            'description': 'Sin terminology'
        },
        {
            'id': 'holy-sanctify-pure',
            'name': 'Holy / Sanctify / Pure',
            'strongs': ['G0040', 'G0037', 'G2513', 'H6918', 'H6942', 'H2889'],
            'description': 'Holiness terminology'
        },
        {
            'id': 'spirit-soul-heart',
            'name': 'Spirit / Soul / Heart',
            'strongs': ['G4151', 'G5590', 'G2588', 'H7307', 'H5315', 'H3820'],
            'description': 'Inner being terminology'
        },
        {
            'id': 'word-speak-voice',
            'name': 'Word / Speak / Voice',
            'strongs': ['G3056', 'G4487', 'G2980', 'G5456', 'H1697', 'H0559', 'H6963'],
            'description': 'Communication terminology'
        },
        {
            'id': 'king-kingdom-reign',
            'name': 'King / Kingdom / Reign',
            'strongs': ['G0935', 'G0932', 'G0936', 'H4428', 'H4467', 'H4427'],
            'description': 'Kingship terminology'
        },
        {
            'id': 'covenant-promise-oath',
            'name': 'Covenant / Promise / Oath',
            'strongs': ['G1242', 'G1860', 'G3727', 'H1285', 'H7621', 'H5650'],
            'description': 'Covenant terminology'
        },
        {
            'id': 'sacrifice-offering-altar',
            'name': 'Sacrifice / Offering / Altar',
            'strongs': ['G2378', 'G4376', 'G2379', 'H2077', 'H7133', 'H4196'],
            'description': 'Sacrificial terminology'
        },
        {
            'id': 'blood-lamb-passover',
            'name': 'Blood / Lamb / Passover',
            'strongs': ['G0129', 'G0286', 'G3957', 'H1818', 'H3532', 'H6453'],
            'description': 'Blood sacrifice terminology'
        },
        {
            'id': 'priest-temple-worship',
            'name': 'Priest / Temple / Worship',
            'strongs': ['G2409', 'G3485', 'G4352', 'H3548', 'H1964', 'H7812'],
            'description': 'Worship terminology'
        },
        {
            'id': 'prophet-prophecy-vision',
            'name': 'Prophet / Prophecy / Vision',
            'strongs': ['G4396', 'G4394', 'G3706', 'H5030', 'H5016', 'H2377'],
            'description': 'Prophetic terminology'
        },
        {
            'id': 'truth-true-faithful',
            'name': 'Truth / True / Faithful',
            'strongs': ['G0225', 'G0227', 'G4103', 'H0571', 'H0539'],
            'description': 'Truth and faithfulness'
        },
        {
            'id': 'life-death-resurrection',
            'name': 'Life / Death / Resurrection',
            'strongs': ['G2222', 'G2288', 'G0386', 'H2416', 'H4194'],
            'description': 'Life and death terminology'
        },
        {
            'id': 'heaven-earth-creation',
            'name': 'Heaven / Earth / Creation',
            'strongs': ['G3772', 'G1093', 'G2937', 'H8064', 'H0776', 'H1254'],
            'description': 'Creation terminology'
        },
        {
            'id': 'light-darkness-glory',
            'name': 'Light / Darkness / Glory',
            'strongs': ['G5457', 'G4655', 'G1391', 'H0216', 'H2822', 'H3519'],
            'description': 'Light and glory terminology'
        },
        {
            'id': 'fear-trust-hope',
            'name': 'Fear / Trust / Hope',
            'strongs': ['G5401', 'G4100', 'G1680', 'H3374', 'H0982', 'H8615'],
            'description': 'Trust and hope terminology'
        },
        {
            'id': 'law-commandment-judgment',
            'name': 'Law / Commandment / Judgment',
            'strongs': ['G3551', 'G1785', 'G2920', 'H8451', 'H4687', 'H4941'],
            'description': 'Law terminology'
        },
        {
            'id': 'righteousness-justice-judgment',
            'name': 'Righteousness / Justice',
            'strongs': ['G1343', 'G1342', 'H6666', 'H6664', 'H4941'],
            'description': 'Righteousness terminology'
        },
        {
            'id': 'peace-rest-sabbath',
            'name': 'Peace / Rest / Sabbath',
            'strongs': ['G1515', 'G0372', 'G4521', 'H7965', 'H5117', 'H7676'],
            'description': 'Peace and rest terminology'
        }
    ]

    # Build cluster data for predefined
    for pre in predefined:
        # Filter to Strong's numbers that exist in lexicon
        valid_strongs = [s for s in pre['strongs'] if s in lexicon]
        if len(valid_strongs) < 2:
            continue

        entries = []
        for strong in valid_strongs:
            entry = lexicon.get(strong, {})
            entries.append({
                'strong': strong,
                'original': entry.get('original', ''),
                'translit': entry.get('translit', ''),
                'gloss': entry.get('gloss', ''),
                'frequency': strongs_freq.get(strong, 0)
            })

        entries.sort(key=lambda x: x['frequency'], reverse=True)

        # Find verses containing multiple terms from this cluster
        cluster_verses = []
        for verse_id, strongs_set in verse_strongs.items():
            matches = strongs_set.intersection(set(valid_strongs))
            if len(matches) >= 2:
                cluster_verses.append({
                    'verse': verse_id,
                    'matches': list(matches)
                })
        cluster_verses.sort(key=lambda x: len(x['matches']), reverse=True)

        cluster = {
            'id': pre['id'],
            'name': pre['name'],
            'description': pre['description'],
            'strongs': valid_strongs,
            'entries': entries,
            'total_frequency': sum(e['frequency'] for e in entries),
            'shared_verses': len(cluster_verses),
            'sample_verses': cluster_verses[:30]
        }

        # Check if this cluster ID already exists
        existing_ids = {c['id'] for c in clusters}
        if cluster['id'] not in existing_ids:
            clusters.append(cluster)

    return clusters

def main():
    # Load data
    data = load_strongs_data()
    lexicon = data.get('lexicon', {})

    print(f"Lexicon has {len(lexicon)} entries")

    # Extract verse -> Strong's mappings
    verse_strongs = extract_verse_strongs(data)
    print(f"Found {len(verse_strongs)} verses with Strong's annotations")

    # Get frequency of each Strong's number
    strongs_freq = get_strongs_frequency(verse_strongs)
    print(f"Found {len(strongs_freq)} unique Strong's numbers")

    # Find co-occurrences
    significant_pairs, pair_verses = find_cooccurrences(verse_strongs, min_count=10)

    # Build discovered clusters
    clusters = build_clusters(significant_pairs, lexicon, strongs_freq)

    # Add predefined theological clusters
    clusters = add_predefined_clusters(clusters, lexicon, verse_strongs, strongs_freq)

    # Sort clusters by total frequency
    clusters.sort(key=lambda x: x.get('shared_verses', x.get('total_frequency', 0)), reverse=True)

    # Build output
    output = {
        '_meta': {
            'description': 'Topical clusters discovered from Strong\'s co-occurrence analysis',
            'method': 'Bottom-up discovery from linguistic data',
            'total_verses_analyzed': len(verse_strongs),
            'total_clusters': len(clusters)
        },
        'clusters': clusters
    }

    # Write output
    print(f"\nWriting {len(clusters)} clusters to {OUTPUT_PATH}...")
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print("\nTop 10 clusters by verse coverage:")
    for i, c in enumerate(clusters[:10]):
        shared = c.get('shared_verses', 0)
        freq = c.get('total_frequency', 0)
        print(f"  {i+1}. {c['name']}: {shared} shared verses, {freq} total occurrences")

    print("\nDone!")

if __name__ == '__main__':
    main()
