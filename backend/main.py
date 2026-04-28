from fastapi import FastAPI, UploadFile, File, Form, Depends
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
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
from ai_copywriter import (
    generate_spectacular_copy, 
    get_project_color_scheme, 
    AICopyRequest, 
    generate_social_posts, 
    generate_ai_image,
    edit_image_with_ai,
    get_design_prompts,
    DESIGN_PROMPTS_LIBRARY,
    extract_prompt_from_image,
    extract_colors_from_image,
    adapt_prompt_to_project,
    create_ad_prompt_from_reference,
    chat_with_marketing_ai,
    get_available_models,
    generate_html_ad,
    CHAT_MODELS,
    IMAGE_MODELS,
    split_script_into_scenes,
    build_visual_bible,
)

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

class ImageGenRequest(BaseModel):
    prompt: str
    aspect_ratio: str = "1:1"

@app.post("/api/generate-ai-image")
async def generate_image(request: ImageGenRequest):
    """Genera una imagen con IA usando Google Imagen 3."""
    result = generate_ai_image(request.prompt, request.aspect_ratio)
    
    if "error" in result:
        return {"success": False, "error": result["error"]}
    
    return {
        "success": True,
        "image_base64": result["image_base64"],
        "mime_type": result["mime_type"]
    }


# ═══════════════════════════════════════════════════════════════════
# AI IMAGE STUDIO ENDPOINTS
# ═══════════════════════════════════════════════════════════════════

class ImageEditRequest(BaseModel):
    image_base64: str
    prompt: str
    style_preset: str = "luxury_real_estate"

@app.post("/api/studio/edit-image")
async def edit_image(request: ImageEditRequest):
    """Edita una imagen existente manteniendo estructura y colores."""
    result = edit_image_with_ai(
        request.image_base64, 
        request.prompt, 
        request.style_preset
    )
    
    if "error" in result:
        return {"success": False, "error": result["error"]}
    
    return {
        "success": True,
        "image_base64": result["image_base64"],
        "mime_type": result["mime_type"]
    }

@app.get("/api/studio/prompts")
async def get_prompts(category: str = None):
    """Obtiene biblioteca de prompts de diseño."""
    if category:
        prompts = get_design_prompts(category=category)
    else:
        prompts = get_design_prompts()
    
    return {
        "prompts": prompts,
        "categories": list(DESIGN_PROMPTS_LIBRARY.keys())
    }

@app.get("/api/studio/style-presets")
async def get_style_presets():
    """Obtiene presets de estilo disponibles para image-to-image."""
    return {
        "presets": [
            {"id": "luxury_real_estate", "name": "Luxury Real Estate", "desc": "Fotografía profesional de bienes raíces de lujo"},
            {"id": "twilight", "name": "Twilight/Blue Hour", "desc": "Hora azul con luces interiores cálidas"},
            {"id": "golden_hour", "name": "Golden Hour", "desc": "Iluminación dorada de atardecer"},
            {"id": "aerial_luxury", "name": "Aerial Drone", "desc": "Vista aérea profesional tipo dron"},
            {"id": "interior_luxury", "name": "Interior Design", "desc": "Fotografía de interiores de revista"},
            {"id": "pool_paradise", "name": "Pool Paradise", "desc": "Piscina cristalina estilo resort"},
            {"id": "jungle_luxury", "name": "Jungle Luxury", "desc": "Selva tropical exuberante"},
            {"id": "minimalist_clean", "name": "Minimalist Clean", "desc": "Estética minimalista y limpia"},
        ]
    }


# ═══════════════════════════════════════════════════════════════════
# PROMPT ENGINEERING STUDIO ENDPOINTS
# ═══════════════════════════════════════════════════════════════════

class ExtractPromptRequest(BaseModel):
    image_base64: str

@app.post("/api/studio/extract-prompt")
async def extract_prompt(request: ExtractPromptRequest):
    """Extrae el prompt de una imagen de referencia (Pinterest/diseño)."""
    result = extract_prompt_from_image(request.image_base64)
    return result

class ExtractColorsRequest(BaseModel):
    image_base64: str

@app.post("/api/studio/extract-colors")
async def extract_colors(request: ExtractColorsRequest):
    """Extrae la paleta de colores de una imagen."""
    result = extract_colors_from_image(request.image_base64)
    return result

class AdaptPromptRequest(BaseModel):
    base_prompt: str
    project_name: str = None
    project_location: str = None
    color_palette: list = None

@app.post("/api/studio/adapt-prompt")
async def adapt_prompt(request: AdaptPromptRequest):
    """Adapta un prompt a un proyecto específico con sus colores."""
    result = adapt_prompt_to_project(
        base_prompt=request.base_prompt,
        project_name=request.project_name,
        project_location=request.project_location,
        color_palette=request.color_palette
    )
    return result

class CreateAdPromptRequest(BaseModel):
    reference_image_base64: str
    background_image_base64: str = None
    project_name: str = None
    ad_type: str = "hero"

@app.post("/api/studio/create-ad-prompt")
async def create_ad_prompt(request: CreateAdPromptRequest):
    """
    Pipeline completo: Extrae prompt de referencia, analiza colores,
    y genera prompt de publicidad adaptado.
    """
    result = create_ad_prompt_from_reference(
        reference_image_base64=request.reference_image_base64,
        background_image_base64=request.background_image_base64,
        project_name=request.project_name,
        ad_type=request.ad_type
    )
    return result


# ═══════════════════════════════════════════════════════════════════
# MARKETING AI CHAT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════

@app.get("/api/models")
async def list_models():
    """
    Retorna la lista de modelos disponibles para chat e imágenes.
    """
    return get_available_models()


class ChatRequest(BaseModel):
    message: str
    model: str = "gemini-2.5-flash"
    history: Optional[List[dict]] = []
    image_base64: Optional[str] = None
    audio_base64: Optional[str] = None
    system_prompt: Optional[str] = None
    api_endpoint: str = "auto"


@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Chat con la IA. Soporta texto, imágenes, audio y system prompt custom.
    """
    result = chat_with_marketing_ai(
        message=request.message,
        model=request.model,
        history=request.history,
        image_base64=request.image_base64,
        audio_base64=request.audio_base64,
        system_prompt=request.system_prompt,
        api_endpoint=request.api_endpoint
    )
    return result


class GenerateImageRequest(BaseModel):
    prompt: str
    aspect_ratio: str = "1:1"
    model: str = "nano-banana-pro-preview"
    api_endpoint: str = "auto"  # 'auto', 'gemini', 'vertex', 'openrouter'
    enhance_style: str = "real_estate"  # 'real_estate', 'viral', 'crypto', 'none'
    history: Optional[List[dict]] = None  # contexto de conversación para enriquecer prompt
    enrich: bool = True  # enriquecer prompt con contexto antes de generar


@app.post("/api/studio/generate-image-v2")
async def generate_image_v2(request: GenerateImageRequest):
    """
    Genera una imagen con modelo seleccionable y API endpoint configurable.
    """
    result = generate_ai_image(
        prompt=request.prompt,
        aspect_ratio=request.aspect_ratio,
        model=request.model,
        api_endpoint=request.api_endpoint,
        enhance_style=request.enhance_style,
        chat_history=request.history,
        enrich=request.enrich,
    )
    return result


# ═══════════════════════════════════════════════════════════════════
# SCRIPT-TO-IMAGES — Planificación automática de escenas
# ═══════════════════════════════════════════════════════════════════

# Precios USD por imagen (estimados a abril 2026)
IMAGE_MODEL_PRICING = {
    "imagen-4.0-ultra-generate-001":   0.060,
    "imagen-4.0-generate-001":         0.040,
    "imagen-4.0-fast-generate-001":    0.020,
    "nano-banana-pro-preview":         0.039,
    "gemini-3.1-flash-image-preview":  0.039,
    "gemini-2.5-flash-image":          0.039,
    "openrouter/google/gemini-2.5-flash-image-preview:free":  0.000,
    "openrouter/google/gemini-2.5-flash-image-preview":       0.030,
}
USD_TO_MXN = 17.5  # tipo de cambio aproximado


class PlanScriptRequest(BaseModel):
    script: str
    seconds_per_image: float = 5.0
    style_hint: str = "viral"  # viral, crypto, real_estate, none
    aspect_ratio: str = "9:16"
    model: str = "gemini-2.5-flash"
    viral_mode: bool = True
    bible: Optional[dict] = None  # opcional: bible pre-generada para reusar


class BibleRequest(BaseModel):
    script: str
    style_hint: str = "viral"
    aspect_ratio: str = "9:16"
    model: str = "gemini-2.5-flash"


@app.post("/api/studio/visual-bible")
async def visual_bible_endpoint(request: BibleRequest):
    """Genera solo la Visual Bible (rápido, barato) — útil para previsualizar dirección visual."""
    bible = build_visual_bible(
        script=request.script,
        style_hint=request.style_hint,
        aspect_ratio=request.aspect_ratio,
        model=request.model,
    )
    return bible


@app.post("/api/studio/plan-script")
async def plan_script_endpoint(request: PlanScriptRequest):
    """
    Divide un guion en escenas con prompts visuales listos para generar imagen.
    Devuelve también el costo estimado por modelo de imagen.
    """
    result = split_script_into_scenes(
        script=request.script,
        seconds_per_image=request.seconds_per_image,
        style_hint=request.style_hint,
        aspect_ratio=request.aspect_ratio,
        model=request.model,
        viral_mode=request.viral_mode,
        bible=request.bible,
    )
    if not result.get("success"):
        return result

    # Anexar tabla de costos estimados
    n = result["total_scenes"]
    cost_table = {}
    for mid, usd in IMAGE_MODEL_PRICING.items():
        cost_table[mid] = {
            "per_image_usd": usd,
            "per_image_mxn": round(usd * USD_TO_MXN, 2),
            "total_usd": round(usd * n, 4),
            "total_mxn": round(usd * USD_TO_MXN * n, 2),
        }
    result["pricing"] = cost_table
    result["usd_to_mxn"] = USD_TO_MXN
    return result


@app.get("/api/studio/pricing")
async def pricing_endpoint():
    """Devuelve la tabla de precios por modelo."""
    return {"pricing": IMAGE_MODEL_PRICING, "usd_to_mxn": USD_TO_MXN}


# ═══════════════════════════════════════════════════════════════════
# HTML AD BUILDER — Generador de HTML/CSS con análisis de imagen
# ═══════════════════════════════════════════════════════════════════

class HtmlAdRequest(BaseModel):
    image_base64: str
    eyebrow: str = ""
    headline: str = ""
    subheadline: str = ""
    pills: Optional[List[str]] = []
    price_label: str = ""
    price_value: str = ""
    cta_text: str = ""
    project_name: str = ""
    aspect_ratio: str = "1:1"  # "1:1", "9:16", "16:9", "4:3"
    style_notes: str = ""


@app.post("/api/studio/generate-html-ad")
async def generate_html_ad_endpoint(request: HtmlAdRequest):
    """
    Genera código HTML/CSS para un anuncio publicitario.
    Analiza la imagen de fondo para extraer colores y crear un diseño coherente.
    """
    result = generate_html_ad(
        image_base64=request.image_base64,
        eyebrow=request.eyebrow,
        headline=request.headline,
        subheadline=request.subheadline,
        pills=request.pills,
        price_label=request.price_label,
        price_value=request.price_value,
        cta_text=request.cta_text,
        project_name=request.project_name,
        aspect_ratio=request.aspect_ratio,
        style_notes=request.style_notes
    )
    return result


# ═══════════════════════════════════════════════════════════════════
# CLAUDE API — Para edición incremental de HTML en Design Copilot
# ═══════════════════════════════════════════════════════════════════

import anthropic

class ClaudeChatRequest(BaseModel):
    message: str
    model: str = "claude-sonnet-4-20250514"
    system_prompt: Optional[str] = None
    current_html: Optional[str] = None
    history: Optional[List[dict]] = []


@app.post("/api/chat-claude")
async def chat_claude_endpoint(request: ClaudeChatRequest):
    """
    Chat con Claude para edición incremental de HTML/CSS.
    Optimizado para el Design Copilot.
    """
    try:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            return {"error": "ANTHROPIC_API_KEY no configurada", "success": False}
        
        client = anthropic.Anthropic(api_key=api_key)
        
        # System prompt por defecto para Design Copilot
        default_system = """Eres un experto diseñador web especializado en publicidad de bienes raíces de lujo.

REGLA CRÍTICA PARA EDICIONES:
- Si el usuario te proporciona HTML existente, DEBES hacer SOLO los cambios específicos que pide.
- NO regeneres todo el HTML desde cero.
- Mantén INTACTO todo lo que no se mencione en la solicitud.
- Los cambios deben ser QUIRÚRGICOS y PRECISOS.

Formato de respuesta:
- Devuelve SOLO el código HTML/CSS completo actualizado.
- NO incluyas explicaciones, solo el código.
- El código debe estar listo para renderizar."""
        
        system_prompt = request.system_prompt or default_system
        
        # Si hay HTML actual, agregarlo al contexto
        user_message = request.message
        if request.current_html:
            user_message = f"""HTML ACTUAL A EDITAR:
```html
{request.current_html}
```

INSTRUCCIÓN DEL USUARIO:
{request.message}

IMPORTANTE: Haz SOLO el cambio solicitado. No regeneres todo. Devuelve el HTML completo con la modificación aplicada."""
        
        # Convertir historial al formato de Claude
        messages = []
        for msg in request.history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role in ["user", "assistant"]:
                messages.append({"role": role, "content": content})
        
        # Agregar mensaje actual
        messages.append({"role": "user", "content": user_message})
        
        # Llamar a Claude
        response = client.messages.create(
            model=request.model,
            max_tokens=8192,
            system=system_prompt,
            messages=messages
        )
        
        # Extraer respuesta
        assistant_response = response.content[0].text
        
        return {
            "success": True,
            "response": assistant_response,
            "model": request.model,
            "usage": {
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens
            }
        }
        
    except anthropic.APIError as e:
        return {"error": f"Error de API Claude: {str(e)}", "success": False}
    except Exception as e:
        return {"error": f"Error: {str(e)}", "success": False}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
