
import sys
import os
import json

# Añadir el path del backend para poder importar
sys.path.append(os.getcwd())

from ai_copywriter import generate_spectacular_copy, generate_social_posts

def test_samsara():
    print("--- Verificando Ad Copy para SAMSARA ---")
    ad_copy = generate_spectacular_copy("SAMSARA")
    print(json.dumps(ad_copy, indent=2, ensure_ascii=False))
    
    print("\n--- Verificando Social Copy para SAMSARA ---")
    social_copy = generate_social_posts("SAMSARA")
    print(json.dumps(json.loads(social_copy), indent=2, ensure_ascii=False))

if __name__ == "__main__":
    test_samsara()
