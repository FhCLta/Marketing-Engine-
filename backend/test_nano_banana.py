"""Test nano-banana-pro-preview model for image generation using REST API."""
import requests
import json
import base64

API_KEY = "AQ.Ab8RN6JnfCWwOtUqV7OVIw2T01LSRN4kNfrRumFyBUYzko2KGA"

# Models to test for image generation
models = [
    "nano-banana-pro-preview",
    "gemini-2.5-flash-image", 
    "imagen-4.0-generate-001"
]

def test_model(model_name):
    print(f"\n{'='*50}")
    print(f"Testing: {model_name}")
    print(f"{'='*50}")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={API_KEY}"
    
    payload = {
        "contents": [{
            "parts": [{"text": "Generate an image of a beautiful sunset over the ocean"}]
        }],
        "generationConfig": {
            "responseModalities": ["IMAGE", "TEXT"]
        }
    }
    
    try:
        print(f"Calling API...")
        response = requests.post(url, json=payload, timeout=60)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response keys: {data.keys()}")
            
            if "candidates" in data and data["candidates"]:
                for i, candidate in enumerate(data["candidates"]):
                    if "content" in candidate and "parts" in candidate["content"]:
                        for j, part in enumerate(candidate["content"]["parts"]):
                            if "inlineData" in part:
                                img_data = part["inlineData"]
                                print(f"  Part {j}: IMAGE - MimeType: {img_data.get('mimeType')}, Size: {len(img_data.get('data', ''))} chars")
                                # Save first image
                                if j == 0:
                                    with open(f"test_{model_name.replace('.', '_')}.png", "wb") as f:
                                        f.write(base64.b64decode(img_data["data"]))
                                    print(f"  Saved to test_{model_name.replace('.', '_')}.png")
                                return True
                            elif "text" in part:
                                print(f"  Part {j}: TEXT - {part['text'][:100]}...")
        else:
            print(f"Error: {response.text[:500]}")
            
    except requests.exceptions.Timeout:
        print("Request timed out after 60 seconds")
    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")
    
    return False

# Test each model
for model in models:
    if test_model(model):
        print(f"\n>>> SUCCESS with {model}! <<<")
        break
else:
    print("\nNo model worked for image generation")
