import os
import json
from ai_copywriter import generate_spectacular_copy

def test_pink_riad_variants():
    os.environ["GEMINI_API_KEY"] = "TU_API_KEY_AQUI" # Se asume cargada en el entorno real
    
    project = "Pink Riad"
    print(f"--- Probando generación para: {project} ---")
    
    res = generate_spectacular_copy(project)
    
    print(f"Número de variantes encontradas: {len(res.get('variantes', []))}")
    print(json.dumps(res, indent=2))
    
    for i, v in enumerate(res.get('variantes', [])):
        print(f"\nVariante {i+1}:")
        print(f"  SUPER: {v.get('super_headline')}")
        print(f"  MAIN:  {v.get('main_headline')}")
        print(f"  BODY:  {v.get('body_text')}")

if __name__ == "__main__":
    test_pink_riad_variants()
