"""
Extract unique glyph shapes from NA28 pages and cluster similar ones.
Outputs a folder per cluster with sample glyphs for manual labelling.
"""

import cv2
import numpy as np
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

IMG_DIR = os.path.join(os.path.dirname(__file__), '..', 'Novum Testamentum Graece Enhanced')
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'ocr_test_results', 'glyph_clusters')
PAGES = [115, 116, 117, 120]  # Sample pages for building clusters
NORM_SIZE = (32, 32)  # Normalize all glyphs to this size for comparison

def extract_glyphs(img_path):
    img = cv2.imread(img_path)
    if img is None:
        return []
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY_INV)

    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(binary, connectivity=8)

    glyphs = []
    for i in range(1, num_labels):
        x, y, w, h, area = stats[i]
        if 5 < w < 200 and 5 < h < 200 and area > 20:
            glyph_img = binary[y:y+h, x:x+w]
            glyphs.append({
                'img': glyph_img,
                'x': x, 'y': y, 'w': w, 'h': h, 'area': area
            })
    return glyphs

def normalize_glyph(glyph_img):
    """Resize glyph to standard size for comparison."""
    return cv2.resize(glyph_img, NORM_SIZE, interpolation=cv2.INTER_AREA)

def glyph_similarity(a, b):
    """Compare two normalized glyphs. Returns 0-1 (1 = identical)."""
    na = normalize_glyph(a).astype(np.float32) / 255.0
    nb = normalize_glyph(b).astype(np.float32) / 255.0
    # Normalized cross-correlation
    diff = np.sum(np.abs(na - nb))
    max_diff = NORM_SIZE[0] * NORM_SIZE[1]
    return 1.0 - (diff / max_diff)

def cluster_glyphs(all_glyphs, threshold=0.85):
    """Group similar glyphs into clusters."""
    clusters = []  # Each cluster: {'template': normalized_img, 'members': [glyph_imgs]}

    for g in all_glyphs:
        norm = normalize_glyph(g['img'])
        best_match = -1
        best_score = 0

        for ci, cluster in enumerate(clusters):
            score = glyph_similarity(g['img'], cluster['template_raw'])
            if score > best_score:
                best_score = score
                best_match = ci

        if best_score >= threshold:
            clusters[best_match]['members'].append(g)
        else:
            clusters.append({
                'template': norm,
                'template_raw': g['img'],
                'members': [g]
            })

    return clusters

def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    all_glyphs = []
    for page in PAGES:
        img_name = f'NTG 28, Nestle-Aland - Institute for New Testament Textual Research_page-{page:04d}.jpg'
        img_path = os.path.join(IMG_DIR, img_name)
        glyphs = extract_glyphs(img_path)
        print(f'Page {page}: {len(glyphs)} glyphs')
        all_glyphs.extend(glyphs)

    print(f'\nTotal glyphs: {len(all_glyphs)}')
    print('Clustering...')

    clusters = cluster_glyphs(all_glyphs)
    clusters.sort(key=lambda c: len(c['members']), reverse=True)

    print(f'Unique clusters: {len(clusters)}')

    # Save each cluster
    for ci, cluster in enumerate(clusters):
        cluster_dir = os.path.join(OUT_DIR, f'cluster_{ci:03d}_x{len(cluster["members"])}')
        os.makedirs(cluster_dir, exist_ok=True)

        # Save template
        cv2.imwrite(os.path.join(cluster_dir, 'template.png'), cluster['template'])

        # Save up to 5 samples at original size
        for si, member in enumerate(cluster['members'][:5]):
            cv2.imwrite(os.path.join(cluster_dir, f'sample_{si}.png'), member['img'])

    # Print top 30 clusters by frequency
    print(f'\nTop 30 clusters by frequency:')
    for ci, cluster in enumerate(clusters[:30]):
        avg_w = np.mean([m['w'] for m in cluster['members']])
        avg_h = np.mean([m['h'] for m in cluster['members']])
        print(f'  Cluster {ci}: {len(cluster["members"])} instances, avg size {avg_w:.0f}x{avg_h:.0f}')

    print(f'\nClusters saved to {OUT_DIR}')
    print('Label each cluster by creating a "label.txt" file in its folder with the Unicode character.')

if __name__ == '__main__':
    main()
