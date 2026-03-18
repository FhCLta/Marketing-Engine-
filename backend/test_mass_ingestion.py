
import sys
import os
import json

# Añadir el path del backend para poder importar
sys.path.append(os.getcwd())

from ai_copywriter import generate_spectacular_copy, generate_social_posts, PROJECT_COLOR_SCHEMES

def test_mass_ingestion():
    projects_to_test = [
        "ANTHAR", "LUNARA", "MUSA_DEL_PUERTO", "SOLE_BLU", 
        "BAY_VIEW_GRAND", "THE_RESIDENCES", "LOMAS_AURORA", 
        "AMARES", "INNA"
    ]
    
    print(f"--- Iniciando Validación Masiva ({len(projects_to_test)} proyectos) ---")
    
    results = {
        "passed": [],
        "failed": []
    }

    for project in projects_to_test:
        print(f"\nProcesando: {project}")
        try:
            # 1. Verificar Colores
            scheme = PROJECT_COLOR_SCHEMES.get(project)
            if not scheme:
                raise Exception(f"Esquema de color no encontrado para {project}")
            print(f"  [OK] Esquema de color: {scheme['name']}")

            # 2. Verificar Ad Copy (Fallback o IA)
            copy = generate_spectacular_copy(project)
            if not copy or "variantes" not in copy or len(copy["variantes"]) < 3:
                raise Exception(f"Error en generación de Ad Copy para {project}")
            print(f"  [OK] Ad Copy: {len(copy['variantes'])} variantes generadas.")

            # 3. Verificar Social Copy
            social = json.loads(generate_social_posts(project))
            if not social or "variantes" not in social or len(social["variantes"]) < 1:
                raise Exception(f"Error en generación de Social Copy para {project}")
            print(f"  [OK] Social Copy: {len(social['variantes'])} variantes encontradas.")
            
            results["passed"].append(project)
        except Exception as e:
            print(f"  [ERROR] {project}: {e}")
            results["failed"].append(project)

    print("\n" + "="*40)
    print(f"RESUMEN FINAL:")
    print(f"Exitosos: {len(results['passed'])}")
    print(f"Fallidos: {len(results['failed'])}")
    print("="*40)

    if len(results["failed"]) > 0:
        sys.exit(1)

if __name__ == "__main__":
    test_mass_ingestion()
