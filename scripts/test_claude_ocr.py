"""
Test Claude Sonnet vision on NA28 page 115.
"""

import base64, os, sys, time
import anthropic

sys.stdout.reconfigure(encoding='utf-8')

IMG_DIR = os.path.join(os.path.dirname(__file__), '..', 'Novum Testamentum Graece Enhanced')
IMG_NAME = 'NTG 28, Nestle-Aland - Institute for New Testament Textual Research_page-0115.jpg'
IMG_PATH = os.path.join(IMG_DIR, IMG_NAME)
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'ocr_test_results')

PROMPT = 'Extract all text from this image exactly as printed. Include every character - Greek text, apparatus notation, cross-references, page numbers, manuscript sigla. Do not summarize or interpret. Just transcribe faithfully. Preserve all special characters including ℵ, 𝔐, ƒ¹³, superscripts, and diacritical marks.'

def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    with open(env_path) as f:
        for line in f:
            if line.strip().startswith('claude_api_key='):
                api_key = line.strip().split('=', 1)[1]

    client = anthropic.Anthropic(api_key=api_key)

    print(f'Loading image: {IMG_NAME}')
    with open(IMG_PATH, 'rb') as f:
        img_b64 = base64.b64encode(f.read()).decode()

    print('Sending to claude-sonnet-4-20250514...')
    start = time.time()

    response = client.messages.create(
        model='claude-sonnet-4-6',
        max_tokens=16384,
        messages=[{
            'role': 'user',
            'content': [
                {'type': 'image', 'source': {'type': 'base64', 'media_type': 'image/jpeg', 'data': img_b64}},
                {'type': 'text', 'text': PROMPT}
            ]
        }]
    )

    elapsed = time.time() - start
    result = response.content[0].text
    print(f'claude-sonnet: {len(result)} chars in {elapsed:.1f}s')

    out_path = os.path.join(OUT_DIR, 'claude_sonnet_page0115.md')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(f'# claude-sonnet — Page 0115\n')
        f.write(f'# Time: {elapsed:.1f}s\n\n')
        f.write(result)

    print(f'Saved to {out_path}')
    print(f'\nFirst 500 chars:\n{result[:500]}')

if __name__ == '__main__':
    main()
