"""
Test GPT-4o-mini vision on NA28 page 115.
Compare output against manual extraction.
"""

import base64, os, sys, time
from openai import OpenAI

sys.stdout.reconfigure(encoding='utf-8')

IMG_DIR = os.path.join(os.path.dirname(__file__), '..', 'Novum Testamentum Graece Enhanced')
IMG_NAME = 'NTG 28, Nestle-Aland - Institute for New Testament Textual Research_page-0115.jpg'
IMG_PATH = os.path.join(IMG_DIR, IMG_NAME)
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'ocr_test_results')

PROMPT = 'Extract all text from this image exactly as printed. Include every character - Greek text, apparatus notation, cross-references, page numbers, manuscript sigla. Do not summarize or interpret. Just transcribe faithfully. Preserve all special characters including ℵ, 𝔐, ƒ¹³, superscripts, and diacritical marks.'

def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    # Load API key from .env
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    with open(env_path) as f:
        for line in f:
            if line.strip().startswith('openai_api_key='):
                api_key = line.strip().split('=', 1)[1]

    client = OpenAI(api_key=api_key)

    print(f'Loading image: {IMG_NAME}')
    with open(IMG_PATH, 'rb') as f:
        img_b64 = base64.b64encode(f.read()).decode()

    models = ['gpt-5.4-nano']

    for model in models:
        print(f'\nSending to {model}...')
        start = time.time()
        try:
            params = {
                'model': model,
                'messages': [{
                    'role': 'user',
                    'content': [
                        {'type': 'text', 'text': PROMPT},
                        {'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{img_b64}', 'detail': 'high'}}
                    ]
                }],
            }
            if model in ('o1', 'gpt-5.4-nano'):
                params['max_completion_tokens'] = 16384
            else:
                params['max_tokens'] = 16384
            response = client.chat.completions.create(**params)

            elapsed = time.time() - start
            result = response.choices[0].message.content
            print(f'{model}: {len(result)} chars in {elapsed:.1f}s')

            safe_name = model.replace('.', '_').replace('-', '_')
            out_path = os.path.join(OUT_DIR, f'{safe_name}_page0115.md')
            with open(out_path, 'w', encoding='utf-8') as f:
                f.write(f'# {model} — Page 0115\n')
                f.write(f'# Time: {elapsed:.1f}s\n\n')
                f.write(result)

            print(f'Saved to {out_path}')
            print(f'\nFirst 500 chars:\n{result[:500]}')
        except Exception as e:
            print(f'ERROR with {model}: {e}')

if __name__ == '__main__':
    main()
