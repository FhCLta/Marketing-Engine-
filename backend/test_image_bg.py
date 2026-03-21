"""Test image generation with timeout."""
import requests
import base64
import sys

API_KEY = 'AQ.Ab8RN6JnfCWwOtUqV7OVIw2T01LSRN4kNfrRumFyBUYzko2KGA'

models = [
    'gemini-2.5-flash-image',  # Nano Banana
    'nano-banana-pro-preview',
    'imagen-4.0-fast-generate-001',  # Fastest option
]

for model in models:
    print(f"\n{'='*40}\nTesting: {model}\n{'='*40}")
    
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}'
    payload = {
        'contents': [{'parts': [{'text': 'Generate an image of a simple red circle'}]}],
        'generationConfig': {'responseModalities': ['IMAGE', 'TEXT']}
    }
    
    try:
        r = requests.post(url, json=payload, timeout=300)  # 5 min timeout
        print(f'Status: {r.status_code}')
        
        if r.status_code == 200:
            d = r.json()
            if 'candidates' in d:
                for p in d['candidates'][0]['content']['parts']:
                    if 'inlineData' in p:
                        print(f'IMAGE! mime: {p["inlineData"]["mimeType"]}')
                        fname = f'test_{model.replace(".", "_").replace("-", "_")}.png'
                        with open(fname, 'wb') as f:
                            f.write(base64.b64decode(p['inlineData']['data']))
                        print(f'Saved to {fname}')
                        sys.exit(0)  # Success - exit
                    elif 'text' in p:
                        print(f'Text: {p["text"][:200]}')
        else:
            print(f'Error: {r.text[:300]}')
    except requests.Timeout:
        print('Timeout after 5 minutes')
    except Exception as e:
        print(f'Error: {e}')

print('\nNo model worked!')
