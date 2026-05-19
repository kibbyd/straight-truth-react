"""
Batch enhance NA28 page images for better readability.
Upscale 2x with LANCZOS, sharpen, boost contrast.
Input:  Novum Testamentum Graece/*.jpg
Output: Novum Testamentum Graece Enhanced/*.jpg
"""

import os
from PIL import Image, ImageEnhance, ImageFilter

INPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'Novum Testamentum Graece')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'Novum Testamentum Graece Enhanced')

SCALE = 2
SHARPNESS = 2.0
CONTRAST = 1.3

def enhance(path, out_path):
    img = Image.open(path)
    w, h = img.size
    img = img.resize((w * SCALE, h * SCALE), Image.LANCZOS)
    img = ImageEnhance.Sharpness(img).enhance(SHARPNESS)
    img = ImageEnhance.Contrast(img).enhance(CONTRAST)
    img.save(out_path, 'JPEG', quality=95)

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    files = sorted(f for f in os.listdir(INPUT_DIR) if f.lower().endswith('.jpg'))
    total = len(files)
    print(f'Enhancing {total} images...')
    for i, f in enumerate(files, 1):
        enhance(os.path.join(INPUT_DIR, f), os.path.join(OUTPUT_DIR, f))
        if i % 50 == 0 or i == total:
            print(f'  {i}/{total}')
    print('Done.')

if __name__ == '__main__':
    main()
