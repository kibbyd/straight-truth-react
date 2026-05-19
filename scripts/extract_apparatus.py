"""
Batch extract NA28 pages using Claude Sonnet 4.6 vision.
Processes enhanced images, appends raw text to apparatus_raw_sonnet.md.
Resume-friendly — skips already-processed pages.
"""

import base64, os, sys, time, re
import anthropic

sys.stdout.reconfigure(encoding='utf-8')

IMG_DIR = os.path.join(os.path.dirname(__file__), '..', 'Novum Testamentum Graece Enhanced')
OUT_FILE = os.path.join(os.path.dirname(__file__), '..', 'Novum Testamentum Graece Enhanced', 'apparatus_raw_sonnet.md')
ENV_PATH = os.path.join(os.path.dirname(__file__), '..', '.env')

START_PAGE = 115
END_PAGE = 904

PROMPT = 'Extract all text from this image exactly as printed. Include every character - Greek text, apparatus notation, cross-references, page numbers, manuscript sigla. Do not summarize or interpret. Just transcribe faithfully. Preserve all special characters including ℵ, 𝔐, 𝔓, ƒ¹³, superscripts, and diacritical marks.'

def get_api_key():
    with open(ENV_PATH) as f:
        for line in f:
            if line.strip().startswith('claude_api_key='):
                return line.strip().split('=', 1)[1]

def get_processed_pages():
    if not os.path.exists(OUT_FILE):
        return set()
    with open(OUT_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    return set(int(m) for m in re.findall(r'## Page (\d+)', content))

def process_page(client, page_num):
    img_name = f'NTG 28, Nestle-Aland - Institute for New Testament Textual Research_page-{page_num:04d}.jpg'
    img_path = os.path.join(IMG_DIR, img_name)

    if not os.path.exists(img_path):
        return None, 0

    with open(img_path, 'rb') as f:
        img_b64 = base64.b64encode(f.read()).decode()

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
    return response.content[0].text, elapsed

def main():
    client = anthropic.Anthropic(api_key=get_api_key())
    processed = get_processed_pages()
    total_cost = 0
    pages_done = 0

    print(f'Already processed: {len(processed)} pages')
    print(f'Processing pages {START_PAGE}-{END_PAGE}...\n')

    for page in range(START_PAGE, END_PAGE + 1):
        if page in processed:
            continue

        try:
            result, elapsed = process_page(client, page)
            if result is None:
                continue

            with open(OUT_FILE, 'a', encoding='utf-8') as f:
                f.write(f'\n\n---\n\n## Page {page}\n\n')
                f.write(result)

            pages_done += 1
            print(f'Page {page}: {len(result)} chars in {elapsed:.1f}s (total: {pages_done})')

        except anthropic.RateLimitError:
            print(f'Rate limited at page {page}. Waiting 60s...')
            time.sleep(60)
            continue
        except anthropic.BadRequestError as e:
            if 'credit balance' in str(e):
                print(f'\nOut of credits after {pages_done} pages.')
                break
            print(f'Error on page {page}: {e}')
            continue
        except Exception as e:
            print(f'Error on page {page}: {e}')
            continue

    print(f'\nDone. {pages_done} pages processed. Output: {OUT_FILE}')

if __name__ == '__main__':
    main()
