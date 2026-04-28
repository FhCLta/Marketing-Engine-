"""Test profundo: guarda prompt enriquecido completo + imagen para inspeccion."""
import os, json, base64, sys

sys.stdout.reconfigure(encoding='utf-8')

env_path = os.path.join(os.path.dirname(__file__), '.env')
with open(env_path) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            os.environ[k.strip()] = v.strip()

from ai_copywriter import enrich_image_prompt_from_context, generate_ai_image

guion = """Sabes que paso cuando enfrentaron a cien traders humanos contra cien agentes de IA en cripto?
Los humanos perdieron 32% de su capital. La IA solo 4.4%.
La IA no dormia, no tenia miedo, no vendia por panico.
En 2026 los agentes de IA operan Bitcoin y altcoins 24/7 de forma autonoma.
Sin emociones. Sin errores humanos. Solo datos y ejecucion."""

user_request = guion + """

actualizate con este guion para que me ayudes a generar imagenes para el principio:
"Sabes que paso cuando enfrentaron a cien traders humanos". Genera una imagen super detallada,
animada, realista y visualmente impactante, en formato vertical (dimensiones de reel).
No debe llevar texto."""

history = [{"role": "user", "content": user_request}]

print("=" * 80)
print("ENRIQUECIMIENTO")
print("=" * 80)

enriched = enrich_image_prompt_from_context(
    user_prompt=user_request,
    chat_history=history,
    enhance_style="none",
    aspect_ratio="9:16",
    model="gemini-2.5-flash",
)
print("\n--- PROMPT ENRIQUECIDO ---")
print(enriched)
print("--- FIN ---\n")

with open("test_enrich_prompt.txt", "w", encoding="utf-8") as f:
    f.write(enriched)

print("=" * 80)
print("GENERACION DE IMAGEN")
print("=" * 80)
result = generate_ai_image(
    prompt=user_request,
    aspect_ratio="9:16",
    model="nano-banana-pro-preview",
    api_endpoint="auto",
    enhance_style="none",
    chat_history=history,
    enrich=True,
)
if "error" in result:
    print(f"ERROR: {result['error']}")
else:
    img_bytes = base64.b64decode(result["image_base64"])
    out_path = "test_traders_crypto.png"
    with open(out_path, "wb") as f:
        f.write(img_bytes)
    from PIL import Image
    img = Image.open(out_path)
    print(f"OK -> {out_path}, dims={img.size}, ratio={round(img.size[0]/img.size[1], 3)}")
