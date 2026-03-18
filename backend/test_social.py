import os
import json
import sys

# Añadir el path actual para importar los módulos locales
sys.path.append(os.getcwd())

from ai_copywriter import generate_social_posts

def test_social():
    print("Probando generación de Social Copy para Pink Riad...")
    
    # Simulamos que no hay API Key para forzar el fallback
    os.environ["GEMINI_API_KEY"] = ""
    
    res_json = generate_social_posts("Pink Riad")
    data = json.loads(res_json)
    
    variantes = data.get("variantes", [])
    print(f"Número de variantes encontradas: {len(variantes)}")
    
    if len(variantes) == 3:
        print("TEST EXITOSO: Se encontraron 3 variantes.")
        for i, v in enumerate(variantes):
            print(f"\nVariante {i+1}:")
            print(f"  TÍTULO: {v.get('titulo')}")
            print(f"  CUERPO: {v.get('cuerpo')[:100]}...")
    else:
        print(f"TEST FALLIDO: Se encontraron {len(variantes)} variantes, se esperaban 3.")

if __name__ == "__main__":
    test_social()
