from fastapi import FastAPI, UploadFile, File, Form, Depends
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os

# Cargar .env manualmente si existe
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

from image_processor import process_image, AdParameters
from ai_copywriter import generate_spectacular_copy, get_project_color_scheme, AICopyRequest, generate_social_posts

app = FastAPI(title="Brisa Maya Marketing Engine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Brisa Maya Marketing Engine Backend is Running."}

@app.post("/api/render-ad")
async def render_ad(
    image: UploadFile = File(...),
    project_name: str = Form(""),
    location: str = Form(""),
    super_headline: str = Form(""),
    main_headline: str = Form(...),
    body_text: str = Form(""),
    layout: str = Form("left"),
    theme: str = Form("GOLDEN_LEGACY"),
    output_quality: str = Form("8k"),
    output_format: str = Form("jpeg"),
    color_enhance: bool = Form(True),
    aspect_ratio: str = Form("original"),
    accent_color_hex: str = Form(None),
    project_color_hex: str = Form(None),
    text_color_hex: str = Form(None),
    body_color_hex: str = Form(None),
    logo_color_hex: str = Form(None),
    line_color_hex: str = Form(None),
    super_font_size: float = Form(1.4),
    project_font_size: float = Form(4.0),
    headline_font_size: float = Form(2.8),
    body_font_size: float = Form(1.8)
):
    try:
        contents = await image.read()
        
        
        params = AdParameters(
            project_name=project_name,
            location=location,
            super_headline=super_headline,
            main_headline=main_headline,
            body_text=body_text,
            layout=layout,
            theme=theme,
            output_quality=output_quality,
            output_format=output_format,
            color_enhance=color_enhance,
            aspect_ratio=aspect_ratio,
            accent_color_hex=accent_color_hex,
            project_color_hex=project_color_hex,
            text_color_hex=text_color_hex,
            body_color_hex=body_color_hex,
            logo_color_hex=logo_color_hex,
            line_color_hex=line_color_hex,
            super_font_size=super_font_size,
            project_font_size=project_font_size,
            headline_font_size=headline_font_size,
            body_font_size=body_font_size
        )
        
        output_bytes = process_image(contents, params)
        
        ext = "png" if output_format.lower() == "png" else "jpg"
        media = "image/png" if ext == "png" else "image/jpeg"
        
        return Response(content=output_bytes, media_type=media, headers={
            "Content-Disposition": f'attachment; filename="BMC_Ad_8K.{ext}"'
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

@app.post("/api/enhance-image")
async def enhance_only(
    image: UploadFile = File(...),
    output_quality: str = Form("8k"),
    color_enhance: bool = Form(True)
):
    """
    Endpoint dedicado exclusivamente a limpiar, mejorar y escalar una imagen
    sin aplicar ningún logo, texto, ni degradado. Usa el motor central LANCZOS 8K.
    """
    try:
        from io import BytesIO
        from PIL import Image
        from image_processor import _upscale_to_target, _enhance_colors

        contents = await image.read()
        img = Image.open(BytesIO(contents)).convert('RGBA')
        
        # 1. Escalar (Upscale 8K/4K) respetando la proporción original exacta de la imagen subida
        img = _upscale_to_target(img, quality=output_quality, keep_original_ratio=True)
        
        # 2. Mejorar colores (Color Grading)
        if color_enhance:
            img = _enhance_colors(img)
            
        # 3. Empacar y devolver JPG máxima calidad
        out_io = BytesIO()
        img.convert('RGB').save(out_io, format="JPEG", quality=100, subsampling=0, optimize=True)
        
        return Response(content=out_io.getvalue(), media_type="image/jpeg", headers={
            "Content-Disposition": 'attachment; filename="BMC_Enhanced_8K.jpg"'
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

@app.post("/api/generate-copy")
async def generate_copy(request: AICopyRequest):
    print(f"🎯 DEBUG: Tono recibido = '{request.tone}'")  # DEBUG
    res = generate_spectacular_copy(request.project_name, request.context, request.tone)
    color_scheme = get_project_color_scheme(request.project_name)
    return {
        "variantes": res.get("variantes", []),
        "color_scheme": color_scheme
    }

@app.post("/api/color-scheme")
async def get_colors(request: AICopyRequest):
    """Auto-select the optimal color scheme based on project name."""
    scheme = get_project_color_scheme(request.project_name)
    return scheme

@app.post("/api/social-copy")
async def get_social_copy(request: AICopyRequest):
    """Generate social media posts for the project."""
    copy_json = generate_social_posts(request.project_name, request.context)
    try:
        data = json.loads(copy_json)
        return data
    except:
        return {"variantes": [], "error": f"Invalid JSON or AI error: {copy_json[:100]}..."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
