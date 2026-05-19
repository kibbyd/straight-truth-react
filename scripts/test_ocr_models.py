"""
Test OCR models against a known page.
Runs page 115 through glm-ocr, deepseek-ocr, and gemma4:e4b.
Outputs saved for comparison against manual extraction.
"""

import base64, json, requests, sys, time, os

sys.stdout.reconfigure(encoding='utf-8')

IMG_DIR = os.path.join(os.path.dirname(__file__), '..', 'Novum Testamentum Graece Enhanced')
IMG_NAME = 'NTG 28, Nestle-Aland - Institute for New Testament Textual Research_page-0115.jpg'
IMG_PATH = os.path.join(IMG_DIR, IMG_NAME)
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'ocr_test_results')

MODELS = {
    'glm-ocr': 'Text Recognition:',
    'deepseek-ocr': 'Extract the text in the image.',
    'gemma4:e4b': 'Extract all text from this image exactly as printed. Include every character - Greek text, apparatus notation, cross-references, page numbers. Do not summarize or interpret. Just transcribe.',
}

OLLAMA_URL = 'http://localhost:11434/api/generate'

def run_model(model, prompt, img_b64):
    print(f'  Running {model} with prompt: {prompt[:50]}...')
    start = time.time()
    resp = requests.post(OLLAMA_URL, json={
        'model': model,
        'prompt': prompt,
        'images': [img_b64],
        'stream': False
    }, timeout=600)
    elapsed = time.time() - start
    result = resp.json().get('response', '')
    print(f'  {model}: {len(result)} chars in {elapsed:.1f}s')
    return result, elapsed

def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    print(f'Loading image: {IMG_NAME}')
    with open(IMG_PATH, 'rb') as f:
        img_b64 = base64.b64encode(f.read()).decode()
    print(f'Image size: {len(img_b64)} bytes (base64)')

    for model, prompt in MODELS.items():
        try:
            result, elapsed = run_model(model, prompt, img_b64)
            safe_name = model.replace(':', '_')
            out_path = os.path.join(OUT_DIR, f'{safe_name}_page0115.md')
            with open(out_path, 'w', encoding='utf-8') as f:
                f.write(f'# {model} — Page 0115\n')
                f.write(f'# Time: {elapsed:.1f}s\n\n')
                f.write(result)
            print(f'  Saved to {out_path}')
        except Exception as e:
            print(f'  ERROR with {model}: {e}')

    print('\nDone. Compare outputs in ocr_test_results/')

if __name__ == '__main__':
    main()
