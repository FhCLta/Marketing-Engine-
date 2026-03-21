from google import genai
import os

# Load env
with open('.env') as f:
    for line in f:
        if '=' in line and not line.startswith('#'):
            k, v = line.strip().split('=', 1)
            os.environ[k] = v

output = []
try:
    client = genai.Client(api_key=os.environ['GEMINI_API_KEY'])
    output.append("=== Modelos disponibles ===")
    for model in client.models.list():
        output.append(model.name)
    output.append(f"\nTotal: {len(output)-1} modelos")
except Exception as e:
    output.append(f"Error: {e}")

# Write to file
with open('models_output.txt', 'w') as f:
    f.write('\n'.join(output))
print("Done - check models_output.txt")

