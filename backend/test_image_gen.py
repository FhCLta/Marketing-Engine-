import requests
import os
import base64
import json

# Load env
with open('.env') as f:
    for line in f:
        if '=' in line and not line.startswith('#'):
            k, v = line.strip().split('=', 1)
            os.environ[k] = v

api_key = os.environ['GEMINI_API_KEY']

print("Testing image generation via REST API...")

# Probar diferentes modelos de imagen
models_to_try = [
    "gemini-2.5-flash-image",
    "gemini-3.1-flash-image-preview",
    "gemini-3-pro-image-preview",
    "imagen-4.0-generate-001",
    "imagen-4.0-fast-generate-001"
]

for model in models_to_try:
    print(f"\n=== Testing {model} ===")
    
    # Para modelos imagen-* usar generateImages
    if model.startswith("imagen"):
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateImages?key={api_key}"
        payload = {
            "prompt": "luxury beachfront villa with pool at sunset in Riviera Maya Mexico",
            "config": {
                "numberOfImages": 1
            }
        }
    else:
        # Para modelos gemini usar generateContent
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {
            "contents": [{
                "parts": [{"text": "Generate an image of a luxury beachfront villa with pool at sunset in Riviera Maya Mexico"}]
            }],
            "generationConfig": {
                "responseModalities": ["IMAGE"]
            }
        }
    
    try:
        response = requests.post(url, json=payload, timeout=120)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"SUCCESS! Keys: {list(data.keys())}")
            
            # Check for image data
            if "candidates" in data:
                for cand in data["candidates"]:
                    if "content" in cand and "parts" in cand["content"]:
                        for part in cand["content"]["parts"]:
                            if "inlineData" in part:
                                print(f"IMAGE FOUND in {model}!")
                                break
            elif "generatedImages" in data:
                print(f"IMAGE FOUND via generateImages!")
            break  # Success, stop trying
        else:
            err = response.text[:200]
            print(f"Error: {err}")
            
    except Exception as e:
        print(f"Exception: {e}")
