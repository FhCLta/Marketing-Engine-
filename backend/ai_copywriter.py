import json
import os
import re
import random
from google import genai
from pydantic import BaseModel

# ═══════════════════════════════════════════════════════════════════
# BRISA MAYA CAPITAL — AI COPYWRITER v3.0 (ULTRA-LUXURY ENGINE)
# Basado en: Manual de Producción Visual BMC / NotebookLM Report
# ═══════════════════════════════════════════════════════════════════

import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, 'assets', 'Database_Proyectos_BMC.json')

# ═══════════════════════════════════════════════════════════════════
# MODELOS DISPONIBLES — Google AI API
# ═══════════════════════════════════════════════════════════════════

CHAT_MODELS = [
    {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash", "desc": "Rápido y eficiente"},
    {"id": "gemini-2.5-pro", "name": "Gemini 2.5 Pro", "desc": "Más preciso y detallado"},
    {"id": "gemini-2.5-flash-lite", "name": "Gemini 2.5 Flash Lite", "desc": "Ultra rápido"},
    {"id": "gemini-3-flash-preview", "name": "Gemini 3 Flash Preview", "desc": "Nueva generación"},
    {"id": "gemini-3-pro-preview", "name": "Gemini 3 Pro Preview", "desc": "Máxima calidad"},
    {"id": "gemini-3.1-flash-lite-preview", "name": "Gemini 3.1 Flash Lite", "desc": "Experimental"},
    {"id": "gemini-3.1-pro-preview", "name": "Gemini 3.1 Pro Preview", "desc": "Última versión"},
    # ─── OpenRouter (free) ────────────────────────────────────────
    {"id": "openrouter/deepseek/deepseek-chat-v3.1:free", "name": "DeepSeek Chat v3.1", "desc": "🆓 OpenRouter · razonamiento"},
    {"id": "openrouter/deepseek/deepseek-r1:free", "name": "DeepSeek R1", "desc": "🆓 OpenRouter · reasoning"},
    {"id": "openrouter/meta-llama/llama-3.3-70b-instruct:free", "name": "Llama 3.3 70B", "desc": "🆓 OpenRouter · Meta"},
    {"id": "openrouter/qwen/qwen-2.5-72b-instruct:free", "name": "Qwen 2.5 72B", "desc": "🆓 OpenRouter · Alibaba"},
    {"id": "openrouter/google/gemini-2.0-flash-exp:free", "name": "Gemini 2.0 Flash (OR)", "desc": "🆓 OpenRouter · Google"},
    {"id": "openrouter/mistralai/mistral-small-3.2-24b-instruct:free", "name": "Mistral Small 3.2", "desc": "🆓 OpenRouter · Mistral"},
    {"id": "openrouter/meta-llama/llama-3.2-11b-vision-instruct:free", "name": "Llama 3.2 Vision", "desc": "🆓 OpenRouter · visión"},
    {"id": "openrouter/nvidia/nemotron-nano-9b-v2:free", "name": "Nemotron Nano 9B", "desc": "🆓 OpenRouter · NVIDIA"},
    {"id": "openrouter/microsoft/mai-ds-r1:free", "name": "MAI DS R1", "desc": "🆓 OpenRouter · Microsoft"},
    # OpenRouter premium (de pago, según créditos)
    {"id": "openrouter/anthropic/claude-3.5-sonnet", "name": "Claude 3.5 Sonnet (OR)", "desc": "💳 OpenRouter · pago"},
    {"id": "openrouter/openai/gpt-4o-mini", "name": "GPT-4o mini (OR)", "desc": "💳 OpenRouter · pago"},
    {"id": "openrouter/openai/gpt-4o", "name": "GPT-4o (OR)", "desc": "💳 OpenRouter · pago"},
]

IMAGE_MODELS = [
    # Imagen 4 - Última generación (requiere endpoint predict)
    {"id": "imagen-4.0-ultra-generate-001", "name": "Imagen 4 Ultra", "desc": "🏆 MEJOR calidad + texto", "type": "imagen4"},
    {"id": "imagen-4.0-generate-001", "name": "Imagen 4", "desc": "✅ Alta calidad + texto", "type": "imagen4"},
    {"id": "imagen-4.0-fast-generate-001", "name": "Imagen 4 Fast", "desc": "⚡ Rápido + texto", "type": "imagen4"},
    # Nano Banana - Via Gemini generateContent
    {"id": "nano-banana-pro-preview", "name": "Nano Banana Pro", "desc": "⚠️ Sin texto en imagen", "type": "gemini"},
    {"id": "gemini-3.1-flash-image-preview", "name": "Nano Banana 2", "desc": "⚠️ Sin texto en imagen", "type": "gemini"},
    {"id": "gemini-2.5-flash-image", "name": "Nano Banana", "desc": "⚠️ Sin texto en imagen", "type": "gemini"},
    # OpenRouter image generation
    {"id": "openrouter/google/gemini-2.5-flash-image-preview:free", "name": "Gemini Image (OR free)", "desc": "🆓 OpenRouter", "type": "openrouter"},
    {"id": "openrouter/google/gemini-2.5-flash-image-preview", "name": "Gemini Image (OR)", "desc": "💳 OpenRouter", "type": "openrouter"},
]

class AICopyResponse(BaseModel):
    super_headline: str
    main_headline: str
    body_text: str

class AICopyRequest(BaseModel):
    project_name: str
    context: str = ""
    tone: str = "balanced"  # investment, lifestyle, urgency, luxury, balanced

# ═══════════════════════════════════════════════════════════════════
# TONOS DE COPY — Configuración de ángulos por tono
# ═══════════════════════════════════════════════════════════════════

TONE_CONFIGS = {
    "investment": {
        "name": "Inversión",
        "focus": "ROI, plusvalía, activo patrimonial, resiliencia financiera, liquidez",
        "emotion": "Seguridad y crecimiento del patrimonio",
        "keywords": ["plusvalía", "ROI", "activo", "patrimonio", "inversión inteligente", "rendimiento"],
        "avoid": ["emocional", "sueños", "escape"],
    },
    "lifestyle": {
        "name": "Lifestyle",
        "focus": "Experiencia de vida, bienestar, legado familiar, memorias, conexión con la naturaleza",
        "emotion": "Aspiración, pertenencia y trascendencia familiar",
        "keywords": ["refugio", "santuario", "legado", "bienestar", "experiencia", "vida plena"],
        "avoid": ["números", "porcentajes", "finanzas"],
    },
    "urgency": {
        "name": "Urgencia",
        "focus": "Escasez de inventario, últimas unidades, oportunidad limitada, ventana de tiempo",
        "emotion": "FOMO (miedo a perder la oportunidad)",
        "keywords": ["últimas", "escasez", "ahora", "oportunidad única", "no espere", "cierre"],
        "avoid": ["calma", "tómese su tiempo", "sin prisa"],
    },
    "luxury": {
        "name": "Ultra Lujo",
        "focus": "Exclusividad absoluta, privacidad, estatus, colección limitada, diseño de autor",
        "emotion": "Superioridad silenciosa y distinción",
        "keywords": ["exclusivo", "privacidad", "élite", "colección", "único", "incomparable"],
        "avoid": ["accesible", "económico", "para todos"],
    },
    "balanced": {
        "name": "Balanceado",
        "focus": "Mix equilibrado de inversión, lifestyle y exclusividad",
        "emotion": "Sofisticación integral",
        "keywords": ["refugio", "plusvalía", "diseño", "ubicación", "oportunidad"],
        "avoid": [],
    },
}

# ═══════════════════════════════════════════════════════════════════
# PROJECT COLOR SCHEMES — Paletas de color por proyecto
# ═══════════════════════════════════════════════════════════════════

PROJECT_COLOR_SCHEMES = {
    "VELMARI": {
        "name": "Heritage Navy",
        "base": "#001219",
        "accent_key": "GOLD",
        "text_key": "WHITE",
        "logo_color": "GOLD",
    },
    "ALBA": {
        "name": "Heritage Navy",
        "base": "#001219",
        "accent_key": "GOLD",
        "text_key": "WHITE",
        "logo_color": "GOLD",
    },
    "MISTRAL": {
        "name": "Obsidian Luxe",
        "base": "#1A1A1B",
        "accent_key": "PLATINUM",
        "text_key": "WHITE",
        "logo_color": "PLATINUM",
    },
    "CANDELA": {
        "name": "Obsidian Luxe",
        "base": "#1A1A1B",
        "accent_key": "PLATINUM",
        "text_key": "WHITE",
        "logo_color": "PLATINUM",
    },
    "COSTA RESIDENCES": {
        "name": "Earth Echo",
        "base": "#2C2C2C",
        "accent_key": "GOLD",
        "text_key": "SILVER",
        "logo_color": "GOLD",
    },
    "ROSEWOOD": {
        "name": "Coastal Ivory",
        "base": "#F9F7F2",
        "accent_key": "GOLD",
        "text_key": "ONYX",
        "logo_color": "GOLD",
    },
    "AMARES": {
        "name": "Modern Slate",
        "base": "#343A40",
        "accent_key": "EMERALD",
        "text_key": "WHITE",
        "logo_color": "WHITE",
    },
    "ALTRA": {
        "name": "Obsidian Luxe",
        "base": "#1A1A1B",
        "accent_key": "PLATINUM",
        "text_key": "WHITE",
        "logo_color": "PLATINUM",
    },
    "MACONDO": {
        "name": "Heritage Navy",
        "base": "#001219",
        "accent_key": "GOLD",
        "text_key": "WHITE",
        "logo_color": "GOLD",
    },
    "MELIORA": {
        "name": "Obsidian Luxe",
        "base": "#1A1A1B",
        "accent_key": "PLATINUM",
        "text_key": "WHITE",
        "logo_color": "PLATINUM",
    },
    "PARAMAR BLACK": {
        "name": "Obsidian Luxe",
        "base": "#1A1A1B",
        "accent_key": "PLATINUM",
        "text_key": "WHITE",
        "logo_color": "PLATINUM",
    },
    "PINK_RIAD": {
        "name": "Heritage Navy",
        "base": "#001219",
        "accent_key": "GOLD",
        "text_key": "WHITE",
        "logo_color": "GOLD",
    },
    "RIVA_PUERTO_CANCUN": {
        "name": "Obsidian Luxe",
        "base": "#1A1A1B",
        "accent_key": "PLATINUM",
        "text_key": "WHITE",
        "logo_color": "PLATINUM",
    },
    "OCEAN_TULUM": {
        "name": "Heritage Navy",
        "base": "#001219",
        "accent_key": "GOLD",
        "text_key": "WHITE",
        "logo_color": "GOLD",
    },
    "AFLORA_TULUM": {
        "name": "Obsidian Luxe",
        "base": "#1A1A1B",
        "accent_key": "PLATINUM",
        "text_key": "WHITE",
        "logo_color": "PLATINUM",
    },
    "AZULIK_RESIDENCES": {
        "name": "Obsidian Luxe",
        "base": "#1A1A1B",
        "accent_key": "PLATINUM",
        "text_key": "WHITE",
        "logo_color": "PLATINUM",
    },
    "ANTHAR": {
        "name": "Carmesí Profundo",
        "base": "#4A0E0E",
        "accent_key": "GOLD",
        "text_key": "WHITE",
        "logo_color": "GOLD",
    },
    "LUNARA": {
        "name": "Esmeralda Ancestral",
        "base": "#064E3B",
        "accent_key": "PLATINUM",
        "text_key": "WHITE",
        "logo_color": "PLATINUM",
    },
    "MUSA_DEL_PUERTO": {
        "name": "Platino Sereno",
        "base": "#E5E7EB",
        "accent_key": "ONYX",
        "text_key": "#1F2937",
        "logo_color": "ONYX",
    },
    "SOLE_BLU": {
        "name": "Azul Profundo 2025",
        "base": "#1E3A8A",
        "accent_key": "GOLD",
        "text_key": "WHITE",
        "logo_color": "GOLD",
    },
    "BAY_VIEW_GRAND": {
        "name": "Obsidian Luxe",
        "base": "#1A1A1B",
        "accent_key": "PLATINUM",
        "text_key": "WHITE",
        "logo_color": "PLATINUM",
    },
    "THE_RESIDENCES": {
        "name": "Heritage Navy",
        "base": "#001219",
        "accent_key": "GOLD",
        "text_key": "WHITE",
        "logo_color": "GOLD",
    },
    "LOMAS_AURORA": {
        "name": "Tierra Calmante",
        "base": "#FDFCF8",
        "accent_key": "EMERALD",
        "text_key": "#374151",
        "logo_color": "EMERALD",
    },
    "INNA": {
        "name": "Wellness Gold",
        "base": "#F9F7F2",
        "accent_key": "GOLD",
        "text_key": "#1F2937",
        "logo_color": "GOLD",
    },
    "OPENCLAW": {
        "name": "Obsidian Luxe",
        "base": "#1A1A1B",
        "accent_key": "PLATINUM",
        "text_key": "WHITE",
        "logo_color": "PLATINUM",
    },
    "THE_LANDMARK": {
        "name": "Urban Elite",
        "base": "#FDFBF7",
        "accent_key": "GOLD",
        "text_key": "#1F2937",
        "logo_color": "GOLD",
    },
    "MACONDO_CORAZON": {
        "name": "Obsidian Luxe",
        "base": "#1A1A1B",
        "accent_key": "PLATINUM",
        "text_key": "WHITE",
        "logo_color": "PLATINUM",
    },
    "T3RRA": {
        "name": "Esmeralda Ancestral",
        "base": "#064E3B",
        "accent_key": "EMERALD",
        "text_key": "WHITE",
        "logo_color": "EMERALD",
    },
}

# ═══════════════════════════════════════════════════════════════════
# BANCO DE COPYS (35 variantes — 7 proyectos × 5 ángulos cada uno)
# ═══════════════════════════════════════════════════════════════════

COPY_BANK = {
    "VELMARI": [
        {"angle": "Escasez", "super_headline": "EL ÚLTIMO HORIZONTE DE PUERTO CANCÚN", "main_headline": "Velmari: Donde la náutica\nencuentra su legado", "body_text": "Solo 2.5 años de inventario disponible en la zona.\nAsegure su posición hoy."},
        {"angle": "Financiero", "super_headline": "OPTIMIZACIÓN DE CAPITAL 2026", "main_headline": "Invierta $5.8M MXN\ncon solo $300k USD", "body_text": "Aproveche la fortaleza del dólar en el desarrollo\nnáutico más exclusivo del Caribe."},
        {"angle": "Lifestyle", "super_headline": "VIDA EN LA MARINA", "main_headline": "Velmari: Acceso privado\nal azul profundo", "body_text": "Residencias de ultra-lujo con conectividad total\nal ecosistema náutico."},
        {"angle": "ROI", "super_headline": "RENDIMIENTO ASEGURADO", "main_headline": "Plusvalía proyectada en el\nepicentro de Cancún", "body_text": "Invierta en el activo con mayor velocidad\nde absorción del mercado actual."},
        {"angle": "Heritage", "super_headline": "HERITAGE RESIDENCES", "main_headline": "Velmari: El estándar de oro\nen Real Estate", "body_text": "Seguridad jurídica y financiera respaldada\npor 15 años de experiencia local."},
    ],
    "MISTRAL": [
        {"angle": "Crecimiento", "super_headline": "EL NUEVO HORIZONTE DE INVERSIÓN", "main_headline": "Mistral: El despertar de\nCosta Mujeres", "body_text": "Sea parte del desarrollo con mayor proyección\nde plusvalía post-Tren Maya."},
        {"angle": "ROI", "super_headline": "RENTABILIDAD 2026", "main_headline": "Mistral: Inversión estratégica\nfrente al mar", "body_text": "Proyecte retornos de inversión superiores al\npromedio en la zona de mayor expansión."},
        {"angle": "Financiamiento", "super_headline": "FACILIDAD DE ENTRADA", "main_headline": "Plan de Financiamiento\nDirecto 30/70", "body_text": "Asegure su unidad en Mistral y liquide\nel resto contra entrega."},
        {"angle": "Urgencia", "super_headline": "OPORTUNIDAD FINITA", "main_headline": "El mercado de Costa Mujeres\nse agota", "body_text": "Con una absorción del 43%, las mejores unidades\nde Mistral no esperarán."},
        {"angle": "Exclusividad", "super_headline": "PRIVACIDAD ABSOLUTA", "main_headline": "Mistral: Un refugio de lujo\nfuera del radar", "body_text": "Diseño arquitectónico de vanguardia en el sector\nmás exclusivo del norte."},
    ],
    "ALTRA": [
        {"angle": "Ubicación", "super_headline": "EL CORAZÓN DE PLAYA", "main_headline": "Altra: Donde la Quinta Avenida\nse encuentra con el mar", "body_text": "A pasos de Calle 38 y Playa Mamitas.\nLa ubicación más codiciada de la Riviera Maya."},
        {"angle": "Plusvalía", "super_headline": "ACTIVO PATRIMONIAL 2024", "main_headline": "Asegure su unidad en Altra\nantes de la entrega", "body_text": "70 unidades de lujo con entrega en Diciembre 2024.\nPlusvalía garantizada por ubicación triple A."},
        {"angle": "Lifestyle", "super_headline": "ROOFTOP EXPERIENCE", "main_headline": "Altra: El estilo de vida que\ntu inversión merece", "body_text": "Piscina infinita, spa, gym y acceso a club de playa.\nDiseñado para el nómada digital de alto perfil."},
        {"angle": "ROI", "super_headline": "RENTABILIDAD VACACIONAL", "main_headline": "Altra: El motor de rentas\nmás potente de PDC", "body_text": "Proyecte altos retornos gracias a la ubicación\ny amenidades premium del desarrollo."},
        {"angle": "Escasez", "super_headline": "ÚLTIMAS UNIDADES", "main_headline": "Altra: No pierda su lugar\nen el epicentro de Playa", "body_text": "Precios de preventa final. Solo quedan unidades\nseleccionadas de 1 y 2 recámaras."},
    ],
    "MACONDO": [
        {"angle": "Oportunidad", "super_headline": "ENTREGA INMEDIATA", "main_headline": "Macondo: Comience a recibir\nrentas hoy mismo", "body_text": "Unidades listas para habitar o rentar.\nLiquidez inmediata en la zona de mayor demanda."},
        {"angle": "Mayakoba", "super_headline": "CERCANÍA ESTRATÉGICA", "main_headline": "Macondo Mayakoba: El lujo\nde vivir junto al santuario", "body_text": "Desarrollo boutique con conectividad total\nal ecosistema más exclusivo de la Riviera."},
        {"angle": "Inversión", "super_headline": "DIVERSIFICACIÓN 2026", "main_headline": "Macondo: Invierta en el\nmodelo de negocio probado", "body_text": "Alta ocupación vacacional histórica.\nSeguridad en su flujo de efectivo mensual."},
        {"angle": "Amenidades", "super_headline": "BIENESTAR URBANO", "main_headline": "Macondo: Amenidades que\nelevan el estándar", "body_text": "Rooftop pool, seguridad 24/7 y acabados\nque garantizan la durabilidad de su inversión."},
        {"angle": "Confianza", "super_headline": "RESPALDO BMC", "main_headline": "Invierta con la seguridad\nde Brisa Maya Capital", "body_text": "Estructuración financiera y legal blindada\nen todos nuestros desarrollos en Playa."},
    ],
    "MELIORA": [
        {"angle": "Diseño", "super_headline": "ESTILO CONTEMPORÁNEO", "main_headline": "Meliora: La nueva cara del\nlujo en Playa del Carmen", "body_text": "Arquitectura que destaca. Espacios pensados\npara la vida moderna y el confort absoluto."},
        {"angle": "Ubicación", "super_headline": "URBAN LIVING", "main_headline": "Meliora: Conectividad total\ncon el pulso de la ciudad", "body_text": "A solo minutos de la zona comercial y playas.\nIdeal para rentas de mediano y largo plazo."},
        {"angle": "ROI", "super_headline": "ACTIVO DE ALTO FLUJO", "main_headline": "Meliora: Maximice su retorno\npor metro cuadrado", "body_text": "Eficiencia en diseño y costos de mantenimiento bajos.\nUn activo diseñado para producir."},
        {"angle": "Exclusividad", "super_headline": "COMUNIDAD SELECTA", "main_headline": "Meliora: El refugio privado\nen el centro de todo", "body_text": "Pocas unidades, mayor privacidad.\nSeguridad y distinción en cada detalle."},
        {"angle": "Fase", "super_headline": "PRE-VENTA EXCLUSIVA", "main_headline": "Meliora: Entre en la fase\nde mayor crecimiento", "body_text": "Aproveche los precios de lanzamiento y\ncapitule la plusvalía de obra."},
    ],
    "ALBA": [
        {"angle": "Diseño", "super_headline": "ARQUITECTURA DE AUTOR", "main_headline": "Alba: El diseño que redefine\nPuerto Cancún", "body_text": "Un santuario residencial donde cada detalle\nes una declaración de estatus."},
        {"angle": "Ubicación", "super_headline": "CONECTIVIDAD Y LUJO", "main_headline": "Alba: El corazón de\nla exclusividad", "body_text": "Ubicación privilegiada con acceso a campo de golf,\nmarina y centro comercial."},
        {"angle": "ROI", "super_headline": "INVERSIÓN DE PATRIMONIO", "main_headline": "Alba: Plusvalía consolidada\nen zona premium", "body_text": "Un activo resiliente en el mercado más estable\nde Quintana Roo."},
        {"angle": "Lifestyle", "super_headline": "VISTAS AL CARIBE", "main_headline": "Alba: Despierte frente\nal azul infinito", "body_text": "Terrazas privadas y acabados de mármol\nen el edificio más icónico del puerto."},
        {"angle": "Fiduciario", "super_headline": "SEGURIDAD INMOBILIARIA", "main_headline": "Alba: Transparencia y certeza\nen su inversión", "body_text": "Estructura legal sólida para inversores\nnacionales y extranjeros."},
    ],
    "ROSEWOOD": [
        {"angle": "Heritage", "super_headline": "HERITAGE BRANDING", "main_headline": "Rosewood Mayakoba:\nUn legado inalterable", "body_text": "Adquiera una propiedad en el resort\nmás premiado de Latinoamérica."},
        {"angle": "Exclusividad", "super_headline": "MUNDO DE PRIVACIDAD", "main_headline": "Residencias Rosewood:\nEl santuario definitivo", "body_text": "Servicio de clase mundial y amenidades privadas\nentre manglares y canales."},
        {"angle": "Financiero", "super_headline": "CAPITAL PRESERVADO", "main_headline": "Rosewood: La inversión\nsegura del UHNW", "body_text": "Estabilidad financiera en un activo\nde reconocimiento global."},
        {"angle": "Ecosistema", "super_headline": "LUJO SUSTENTABLE", "main_headline": "Rosewood: Armonía total\ncon el entorno", "body_text": "Certificaciones de sustentabilidad en el corazón\nde Mayakoba."},
        {"angle": "Status", "super_headline": "PERTENENCIA", "main_headline": "Rosewood: Donde el lujo\nes una herencia", "body_text": "Un estilo de vida reservado para quienes\nexigen la perfección absoluta."},
    ],
    "COSTA RESIDENCES": [
        {"angle": "Amenidades", "super_headline": "THE BEACH CLUB LIFE", "main_headline": "Costa Residences:\nEl club de playa más grande", "body_text": "Invierta en el epicentro social de Corasol\ncon 120 metros de frente de playa."},
        {"angle": "Golf", "super_headline": "FAIRWAY LIVING", "main_headline": "Costa Residences:\nEntre el golf y el Caribe", "body_text": "Ubicación estratégica frente al campo Gran Coyote\ndiseñado por Nick Price."},
        {"angle": "ROI", "super_headline": "INVERSIÓN TURÍSTICA", "main_headline": "Costa Residences:\nAlta demanda en rentas", "body_text": "Maximice su flujo de caja en un destino\ncon ocupación anual resiliente."},
        {"angle": "Espacio", "super_headline": "AMPLITUD EXCLUSIVA", "main_headline": "Costa Residences:\nEspacios que respiran lujo", "body_text": "Departamentos con terrazas profundas\ny acabados de importación."},
        {"angle": "Financiamiento", "super_headline": "ESTRATEGIA FISCAL", "main_headline": "Costa Residences:\nFinanciamiento 30/70", "body_text": "Optimice su liquidez con planes de pago\nadaptados a su portafolio."},
    ],
    "AMARES": [
        {"angle": "Digital Nomad", "super_headline": "EL REFUGIO DEL NÓMADA DIGITAL", "main_headline": "Amares: Equilibrio natural\nen Playa del Carmen", "body_text": "Diseñado para la nueva era del trabajo\nremoto y el bienestar."},
        {"angle": "Estabilidad", "super_headline": "MERCADO EN ASCENSO", "main_headline": "Amares: Invierta en el 43%\nde absorción anual", "body_text": "Un mercado que agota su inventario\nasegura la revalorización de su unidad."},
        {"angle": "Wellness", "super_headline": "SALUD Y PATRIMONIO", "main_headline": "Amares: Un santuario de\nbienestar integral", "body_text": "Senderos de jungla, spa y gimnasio\nde última generación en su hogar."},
        {"angle": "Ubicación", "super_headline": "PLAYA DEL CARMEN NORTE", "main_headline": "Amares: La zona de\nmayor plusvalía", "body_text": "Conectividad inmediata con la Quinta Avenida\ny el mar Caribe."},
        {"angle": "ROI", "super_headline": "RETORNOS PASIVOS", "main_headline": "Amares: Rentabilidad\nproyectada del 10% anual", "body_text": "Gestión profesional de rentas\npara un ROI sin complicaciones."},
    ],
    "CANDELA": [
        {"angle": "Eco-Lujo", "super_headline": "ECO-LUXURY LIVING", "main_headline": "Candela Tulum: Donde la selva\nencuentra al mar", "body_text": "Ubicación privilegiada en Aldea Zama\ncon arquitectura que respeta el entorno."},
        {"angle": "Escasez", "super_headline": "ÚLTIMA OPORTUNIDAD EN ALDEA ZAMA", "main_headline": "Candela Tulum: Solo 2.5 years\nde stock restante", "body_text": "Invierta antes de que el mercado de Tulum\nalcance su madurez total."},
        {"angle": "Diseño", "super_headline": "ESTÉTICA ATEMPORAL", "main_headline": "Candela: La joya arquitectónica\nde Tulum", "body_text": "Un concepto único de privacidad y diseño\ninspirado en las ruinas mayas."},
        {"angle": "ROI", "super_headline": "INVERSIÓN CON PROPÓSITO", "main_headline": "Candela Tulum: Alta plusvalía\nen Region 15", "body_text": "Aproveche el auge de Tulum con un activo\ndiseñado para la exclusividad."},
        {"angle": "Tren Maya", "super_headline": "CONECTIVIDAD TOTAL", "main_headline": "Candela: Plusvalía impulsada\npor el Tren Maya", "body_text": "Invierta en el nodo de transporte más importante\ndel sureste mexicano."},
    ],
    "PARAMAR BLACK": [
        {"angle": "Entrega", "super_headline": "ENTREGA INMEDIATA EN TULUM", "main_headline": "Paramar Black:\nLujo listo para habitar", "body_text": "Sin esperas. Adquiera su unidad en Aldea Zama hoy mismo.\nPlusvalía consolidada y rentas inmediatas."},
        {"angle": "Ubicación", "super_headline": "ZONA PREMIUM: ALDEA ZAMA", "main_headline": "Paramar Black:\nEl epicentro de la exclusividad", "body_text": "Ubicación estratégica con acceso a lo mejor de Tulum.\nSeguridad 24/7 y amenidades de clase mundial."},
        {"angle": "Financiero", "super_headline": "ESTRATEGIA DE INVERSIÓN 30/70", "main_headline": "Paramar Black:\nOptimice su capital", "body_text": "Enganche del 30% y saldo a la entrega.\nPrecios competitivos desde $232,000 USD."},
        {"angle": "Lifestyle", "super_headline": "VIDA EN LA SELVA MAYA", "main_headline": "Paramar Black:\nElegancia y Naturaleza", "body_text": "Sky Bar, Spa, Sauna y dos albercas privadas.\nUn santuario diseñado para el confort absoluto."},
        {"angle": "Confianza", "super_headline": "RESPALDO Y EXPERIENCIA", "main_headline": "Invierta en el 7º desarrollo\nde la marca Paramar", "body_text": "Más de 10 años de trayectoria y 35 proyectos exitosos.\nSeguridad jurídica y financiera para su patrimonio."},
    ],
    "PINK_RIAD": [
        {"angle": "Oportunidad", "super_headline": "PINK RIAD TULUM", "main_headline": "Tu Refugio en Pre-venta\nen el Corazón de Tulum", "body_text": "Oportunidad excepcional de 93 m² por $6,980,000 MXN.\nIncluye 2 habitaciones, piscina y amenidades pet-friendly."},
        {"angle": "Inversión", "super_headline": "PLUSVALÍA GARANTIZADA", "main_headline": "Pink Riad: El activo\nmás sexy de Tulum", "body_text": "Diseño icónico y ubicación estratégica.\nAsegure su unidad en la fase de mayor rentabilidad."},
        {"angle": "Estilo de Vida", "super_headline": "TULUM LIFESTYLE", "main_headline": "Pink Riad: Esencia y\nSofisticación en la Selva", "body_text": "Experimente el equilibrio perfecto entre confort moderno\ny la magia ancestral de Tulum."},
    ],
    "SAMSARA": [
        {"angle": "Exclusividad", "super_headline": "ICONIC BOUTIQUE LIVING", "main_headline": "Samsara: El Nuevo Estándar\nde Lujo en Tulum", "body_text": "Colección privada de residencias con acabados de ultra-lujo.\nEntrega inmediata para los perfiles más exigentes."},
        {"angle": "Inversión", "super_headline": "OPORTUNIDAD PATRIMONIAL", "main_headline": "Samsara: Rendimientos que\ndefinen el Mercado", "body_text": "Invierta en un activo de alta liquidez en la Riviera Maya.\nPlusvalía asegurada por diseño y ubicación estratégica."},
        {"angle": "Lifestyle", "super_headline": "YOUR SAMSARA LIFE", "main_headline": "Samsara: Un Refugio\nDiseñado para Trascender", "body_text": "Descubra el equilibrio perfecto entre privacidad y confort.\nSu legado en el Caribe Mexicano comienza aquí."},
    ],
    "ANTHAR": [
        {"angle": "Legacy", "super_headline": "ARCHITECTURAL LEGACY", "main_headline": "Anthar: Simetría entre\nla Tierra y las Estrellas", "body_text": "Tributo al Mediterráneo en el corazón de Playa del Carmen.\nUn refugio de diseño simbólico con centro comercial privado."},
        {"angle": "Inversión", "super_headline": "ACTIVO ESTRATÉGICO", "main_headline": "Anthar: Plusvalía en el\nCentro de la Acción", "body_text": "Invierta en el desarrollo que redefine el centro de Playa.\nSeguridad absoluta y rentabilidad vacacional superior."},
        {"angle": "Lifestyle", "super_headline": "URBAN ELEGANCE", "main_headline": "Anthar: El nuevo latido\nde Playa del Carmen", "body_text": "Vivir rodeado de diseño, comercio de élite y\nla energía vibrante de la mejor zona de la ciudad."},
    ],
    "LUNARA": [
        {"angle": "Sanctuary", "super_headline": "TROPICAL SANCTUARY", "main_headline": "Lunara: Siete Cenotes\ncomo su Jardín Privado", "body_text": "Privacidad extrema en el entorno virgen de Akumal.\nUn legado patrimonial inmerso en la selva virgen."},
        {"angle": "Exclusividad", "super_headline": "ELITE PRIVACY", "main_headline": "Lunara: El Retiro de\nlos Visionarios", "body_text": "Solo para quienes buscan desconexión total y lujo silente.\nNaturaleza indómita con infraestructura de primer nivel."},
        {"angle": "Patrimonio", "super_headline": "ANCESTRAL WEALTH", "main_headline": "Lunara: Un activo que\ntrasciende generaciones", "body_text": "La tierra más fértil para el crecimiento de su capital.\nSoberanía natural en el corazón de Akumal."},
    ],
    "MUSA_DEL_PUERTO": [
        {"angle": "Contemporary", "super_headline": "CONTEMPORARY ELEGANCE", "main_headline": "Musa: Redefiniendo el\nLujo en Puerto Morelos", "body_text": "Distribución funcional y estética apacible frente al mar.\nLa inversión segura en el nodo de mayor crecimiento."},
        {"angle": "Ubicación", "super_headline": "THE NEW GOLDEN GATE", "main_headline": "Musa: El epicentro del\ncrecimiento caribeño", "body_text": "Puerto Morelos es el destino con mayor plusvalía proyectada.\nAsegure su retorno con diseño de clase mundial."},
        {"angle": "ROI", "super_headline": "INVESTMENT EXCELLENCE", "main_headline": "Musa: Rentabilidad con\nvista al horizonte", "body_text": "Modelos de inversión diseñados para el flujo de caja.\nGestión premium en la zona más dinámica del estado."},
    ],
    "SOLE_BLU": [
        {"angle": "Sophistication", "super_headline": "OCEANFRONT SOPHISTICATION", "main_headline": "Sole Blu: Conexión Pura\ncon el Mar Caribe", "body_text": "Arquitectura contemporánea para maximizar la vista al océano.\nUn refugio de sofisticación con servicios de resort mundial."},
        {"angle": "Lifestyle", "super_headline": "CARIBBEAN SOUL", "main_headline": "Sole Blu: Despierte con\nel sonido del arrecife", "body_text": "Exclusividad frente al mar en Puerto Morelos.\nAmenidades de ultra-lujo pensadas para la plenitud."},
        {"angle": "Estatus", "super_headline": "ELITE RESIDENTIAL", "main_headline": "Sole Blu: El estándar\nde la vida frente al mar", "body_text": "Privacidad total y acceso privilegiado al Caribe.\nSu hogar diseñado por la excelencia arquitectónica."},
    ],
    "BAY_VIEW_GRAND": [
        {"angle": "Status", "super_headline": "GLOBAL STATUS", "main_headline": "Bay View Grand: El Epicentro\ndel Lujo en Cancún", "body_text": "Estatus, seguridad y plusvalía en la Zona Hotelera.\nVistas panorámicas duales: Caribe y Laguna Nichupté."},
        {"angle": "Iconic", "super_headline": "THE LEGENDARY ADDRESS", "main_headline": "Bay View Grand: Donde\nCancún encuentra su gloria", "body_text": "La dirección más prestigiosa del Caribe Mexicano.\nSeguridad institucional y amenidades de clase mundial."},
        {"angle": "Plusvalía", "super_headline": "CERTIFIED APPRECIATION", "main_headline": "Bay View Grand: Valor\nque desafía al tiempo", "body_text": "Un activo resiliente en la zona más codiciada.\nLa inversión patrimonial definitiva en el mercado de lujo."},
    ],
    "THE_RESIDENCES": [
        {"angle": "Privacy", "super_headline": "ULTIMATE PRIVACY", "main_headline": "Grand Island: Discreción y\nArquitectura Excepcional", "body_text": "Refugio residencial de ultra-lujo para el perfil UHNW.\nPrivacidad absoluta y diseño de vanguardia excepcional."},
        {"angle": "Architecture", "super_headline": "ARCHITECTURAL MASTERPIECE", "main_headline": "The Residences: El arte de\nvivir en Grand Island", "body_text": "Diseño escultórico que rinde homenaje a la naturaleza.\nEspacios expansivos para una vida sin límites."},
        {"angle": "Exclusividad", "super_headline": "BEYOND LUXURY", "main_headline": "The Residences: Solo para\nel círculo más selecto", "body_text": "Un ecosistema de servicios privados y seguridad total.\nDonde la discreción es el máximo lujo imaginable."},
    ],
    "LOMAS_AURORA": [
        {"angle": "Heritage", "super_headline": "FAMILY HERITAGE", "main_headline": "Lomas Aurora: Confort y\nSeguridad entre Lagos", "body_text": "El entorno perfecto para consolidar el legado familiar.\nNaturaleza y plusvalía garantizada cerca de Xcaret."},
        {"angle": "Nature", "super_headline": "NATURAL SOVEREIGNTY", "main_headline": "Lomas Aurora: Viva en\nel corazón de la selva", "body_text": "Desarrollo sustentable entre lagos cristalinos.\nPrivacidad y bienestar para las próximas generaciones."},
        {"angle": "Crecimiento", "super_headline": "STRATEGIC GROWTH", "main_headline": "Lomas Aurora: Invierta en\nla zona de oro de Xcaret", "body_text": "Plusvalía acelerada por infraestructura de primer nivel.\nEl refugio ideal con conectividad total en Playa."},
    ],
    "INNA": [
        {"angle": "Wellness", "super_headline": "BEACHFRONT WELLNESS OASIS", "main_headline": "Inna: Autonomía Privada y\nHospitalidad 5 Estrellas", "body_text": "Condominios frente al mar con servicios hoteleros de lujo.\nUn refugio de bienestar para inversionistas UHNW."},
        {"angle": "Service", "super_headline": "HOSPITALITY EXCELLENCE", "main_headline": "Inna: El estándar del\nhotel en su residencia", "body_text": "Servicios concierge, spa de clase mundial y gastronomía.\nViva la experiencia vacacional perpetua en Puerto Morelos."},
        {"angle": "Financial", "super_headline": "ASSET OPTIMIZATION", "main_headline": "Inna: Alto rendimiento\ncon gestión hotelera", "body_text": "Maximice su ROI con un modelo híbrido residencial.\nSeguridad patrimonial frente al azul del Caribe."},
    ],
    "OPENCLAW": [
        {"angle": "Intelectual", "super_headline": "PRESERVACIÓN DE CAPITAL INTELECTUAL", "main_headline": "Blinde su Conocimiento\nEstratégico", "body_text": "OpenClaw: Ejecución local de agentes que protege sus secretos comerciales.\nSin APIs externas. Acceda al Reporte de Transparencia 2025."},
        {"angle": "Estatus", "super_headline": "ESTATUS SILENTE", "main_headline": "Inteligencia sin\nRastros", "body_text": "El lujo de la IA local con Qwen3.\nEficiencia absoluta para su oficina familiar."},
        {"angle": "Seguridad", "super_headline": "ARQUITECTURA SEGURA", "main_headline": "Infraestructura Blindada\ncontra Malware", "body_text": "Seguridad AES-256 y curaduría de la OpenClaw Foundation frente a riesgos de ClawHub.\nÚnase al Programa de Subvenciones Institucionales."},
        {"angle": "Soberania", "super_headline": "SOBERANÍA DE DATOS", "main_headline": "Dueño Total de\nsu Inteligencia", "body_text": "Evite la dependencia de la nube.\nTransicione de 0.0.0.0 a la seguridad de 127.0.0.1."},
        {"angle": "Privacidad", "super_headline": "ESCASEZ DE PRIVACIDAD", "main_headline": "Privacidad: El Activo más\nEscaso de 2026", "body_text": "Mientras miles exponen sus datos, asegure su entorno con OpenClaw.\nSoberanía garantizada."},
    ],
    "THE_LANDMARK": [
        {"angle": "Ubicación", "super_headline": "PRIME LOCATION", "main_headline": "El Epicentro de la\nRiviera Maya", "body_text": "A una cuadra de la Quinta Avenida.\nVida urbana de alto nivel en Playa del Carmen."},
        {"angle": "Amenidades", "super_headline": "SKY CLUB EXCLUSIVE", "main_headline": "Lujo Elevado con\nVistas al Caribe", "body_text": "Alberca infinity, gimnasio y áreas de yoga.\nEl refugio perfecto de relajación."},
        {"angle": "Inversión", "super_headline": "HIGH YIELD ASSET", "main_headline": "Capitalice en el Corazón\nde Playa del Carmen", "body_text": "Estudios y departamentos de 1 y 2 recámaras.\nAlta demanda de rentas vacacionales."},
    ],
    "MACONDO_CORAZON": [
        {"angle": "Estrategia", "super_headline": "SELECCIÓN PORCELANOSA", "main_headline": "Macondo Corazón: La alianza\nexclusiva con Porcelanosa", "body_text": "Acabados que garantizan una estética atemporal.\nUn diseño creado para el disfrute visual absoluto."},
        {"angle": "ROI", "super_headline": "ESTILO DE VIDA URBANO", "main_headline": "Viva la Quinta Avenida\nen máxima serenidad", "body_text": "Refugio privado en el corazón del destino.\nCapture la esencia y belleza desde el primer día."},
        {"angle": "Ubicación", "super_headline": "OASIS DE DESCANSO", "main_headline": "El equilibrio entre vitalidad\ny privacidad absoluta", "body_text": "A un minuto de la 5ta Avenida, aislado del ruido.\nLa ubicación que garantiza máxima tranquilidad."},
        {"angle": "Amenidades", "super_headline": "INFRAESTRUCTURA PREMIUM", "main_headline": "Amenidades diseñadas para\nel disfrute infinito", "body_text": "Rooftop con alberca infinity y coworking de primer nivel.\nEl ecosistema ideal para estancias eternas y confortables."},
        {"angle": "Exclusividad", "super_headline": "COLECCIÓN PH CORNER", "main_headline": "La escasez como motor\nde exclusividad", "body_text": "Penthouses Corner Living que dominan el horizonte.\nLa joya arquitectónica definitiva de Playa del Carmen."},
    ],
    "T3RRA": [
        {"angle": "Biofílico", "super_headline": "BIOPHILIC RESORT LIVING", "main_headline": "T3RRA: El latido natural\nen Playa del Carmen", "body_text": "Arquitectura que fusiona el lujo contemporáneo\ncon la identidad selvática del Caribe."},
        {"angle": "Urban Infill", "super_headline": "EL RETIRO PERFECTO", "main_headline": "Descubra el paraíso\na pasos del Mar", "body_text": "Ubicación estratégica a 350m de la Quinta Avenida.\nEl horizonte perfecto para una vida plena."},
        {"angle": "Llave en Mano", "super_headline": "RESIDENCIA LLAVE EN MANO", "main_headline": "Entrega 100% Equipada\nDiseño y Confort Inmediato", "body_text": "Amueblado y decorado para que inicies tu historia hoy mismo.\nTu santuario en el Caribe listo para ser habitado."},
        {"angle": "Financiero", "super_headline": "ADQUISICIÓN PRIVILEGIADA", "main_headline": "T3RRA: Oportunidad de\nPre Venta Exclusiva", "body_text": "Descubra una colección residencial sin paralelo.\nConsolide su legado familiar frente al mar."},
        {"angle": "Exclusividad", "super_headline": "AMENIDADES RESORT", "main_headline": "Eleve su estilo de vida\ncon experiencias de hotel", "body_text": "Cine al aire libre, wellness y relajación profunda.\nEl refugio definitivo para usted y los suyos."},
    ],
}

def get_project_color_scheme(project_name):
    """Retorna el esquema de colores basado en el nombre del proyecto."""
    def normalize(text):
        return re.sub(r'[^A-Z0-9]', '', text.upper())
    
    name_norm = normalize(project_name)
    for key, scheme in PROJECT_COLOR_SCHEMES.items():
        if normalize(key) == name_norm:
            return scheme
    return PROJECT_COLOR_SCHEMES.get("VELMARI") # Default

def load_project_database():
    try:
        if not os.path.exists(DATABASE_PATH):
            return {}
        with open(DATABASE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading database: {e}")
        return {}

def find_project_match(project_name, database):
    """Busca coincidencia flexible entre el nombre proporcionado y la base de datos."""
    def normalize(text):
        return re.sub(r'[^A-Z0-9]', '', text.upper())

    name_norm = normalize(project_name)
    
    # 1. Coincidencia exacta o normalizada
    for key in database:
        if key != "DEFAULT" and normalize(key) == name_norm:
            return database[key]
            
    # 2. Coincidencia parcial
    for key in database:
        if key != "DEFAULT" and (name_norm in normalize(key) or normalize(key) in name_norm):
            return database[key]
            
    return database.get("DEFAULT", {
        "super_headline": "COLECCIÓN BMC",
        "main_headline": "Lujo Estético",
        "body_text": "Aspiración, diseño y belleza espectacular en el Caribe."
    })

def find_copy_bank_match(project_name):
    """Busca si el proyecto tiene un banco de copys predefinido."""
    def normalize(text):
        return re.sub(r'[^A-Z0-9]', '', text.upper())

    name_norm = normalize(project_name)
    for key in COPY_BANK:
        if normalize(key) == name_norm:
            return key
    return None

def generate_spectacular_copy(project_name: str, additional_context: str = "", tone: str = "balanced") -> dict:
    """
    Pipeline de generación de copy para imágenes con 3 variantes.
    Ahora con soporte para tonos: investment, lifestyle, urgency, luxury, balanced
    """
    db = load_project_database()
    project_info = find_project_match(project_name, db)
    
    # Obtener configuración del tono
    tone_config = TONE_CONFIGS.get(tone, TONE_CONFIGS["balanced"])
    
    bank_key = find_copy_bank_match(project_name)
    base_variants = []
    
    if bank_key:
        base_variants = COPY_BANK[bank_key]
    else:
        # Fallback si no hay banco específico, creamos variaciones genéricas basadas en la info de la DB
        base_variants = [
            {
                "angle": "General", 
                "super_headline": project_info.get("super_headline", "COLECCIÓN BMC"),
                "main_headline": project_info.get("main_headline", "Lujo Estético"),
                "body_text": project_info.get("body_text", "Refugio de belleza extraordinaria en el Caribe.")
            },
            {
                "angle": "Plusvalía", 
                "super_headline": "LEGADO FAMILIAR",
                "main_headline": f"{project_name}: Estilo de vida\ny belleza incomparable",
                "body_text": "Descubra un santuario diseñado para la trascendencia y la paz.\nEspacios arquitectónicos para crear memorias eternas."
            },
            {
                "angle": "Exclusividad", 
                "super_headline": "LUJO SIN COMPROMISOS",
                "main_headline": f"{project_name}: El Nuevo\nParaíso del Caribe",
                "body_text": "Privacidad absoluta y un diseño impecable y vanguardista.\nDonde la exclusividad encuentra su hogar definitivo y soñado."
            }
        ]

    api_key = os.environ.get("GEMINI_API_KEY")
    
    # Si no hay API Key o Gemini falla, devolvemos 3 variantes del banco o genéricas
    def get_fallback():
        print(f"⚠️ Usando fallback para {project_name}")
        return {"variantes": [v for v in base_variants[:3]]}

    if not api_key:
        print("❌ No hay GEMINI_API_KEY configurada")
        return get_fallback()

    print(f"🎯 Generando copy para '{project_name}' con tono '{tone}'")
    print(f"📋 Tone config: {tone_config['name']} - {tone_config['focus'][:50]}...")

    try:
        client = genai.Client(api_key=api_key)
        
        # System instruction mejorado con soporte de tonos
        system_instruction = f"""ROL Y PERSONA:
Actúa como el Copywriter y Director de Arte Principal de 'Brisa Maya Capital', una firma de corretaje inmobiliario premium en la Riviera Maya. Tu objetivo es redactar textos creativos, poéticos, elegantes y de altísimo impacto visual que serán colocados DIRECTAMENTE SOBRE IMÁGENES.

IDENTIDAD DE MARCA (BRISA MAYA CAPITAL):
- Tono: Sofisticado, inspirador, exclusivo, estético, aspiracional y sumamente emotivo.
- Prohibido: Sonar a vendedor tradicional, usar lenguaje saturado o texto excesivo.

═══════════════════════════════════════════════════════════════════
🎯 TONO SOLICITADO: {tone_config['name'].upper()}
═══════════════════════════════════════════════════════════════════
ENFOQUE PRINCIPAL: {tone_config['focus']}
EMOCIÓN A EVOCAR: {tone_config['emotion']}
PALABRAS CLAVE A USAR: {', '.join(tone_config['keywords'])}
{'EVITAR: ' + ', '.join(tone_config['avoid']) if tone_config['avoid'] else ''}

REGLAS ESTRICTAS DE FORMATO:
- PALABRAS PROHIBIDAS: 'Institucional', 'Inversionista Calificado', 'Estructuración', 'Capex'.
- PROHIBIDO: Emojis, hashtags, llamados a acción de redes sociales.
- LONGITUD: Textos concisos, bellos y fáciles de leer. Son titulares visuales.

FORMATOS DE SALIDA:
- super_headline: 1-3 palabras en MAYÚSCULAS. Badge sutil. Ej: 'PREVENTA EXCLUSIVA'
- main_headline: SOLO el tagline/eslogan, SIN incluir el nombre del proyecto. El nombre se muestra por separado en la imagen como elemento HERO. Debe ser aspiracional, 4-7 palabras. Ej: 'Tu Santuario Vital', 'Donde el Lujo Encuentra la Naturaleza'.
- body_text: 1-2 líneas breves de apoyo. Valor concreto o diferenciador."""
        
        # Prompt específico según el tono
        tone_specific_instructions = {
            "investment": """
VARIANTES A GENERAR (todas con enfoque INVERSIÓN):
1. ENFOQUE ROI: Plusvalía, rendimiento, activo patrimonial
2. ENFOQUE SEGURIDAD: Resiliencia, protección de capital, diversificación
3. ENFOQUE OPORTUNIDAD: Timing de mercado, ventana de entrada, momentum""",
            "lifestyle": """
VARIANTES A GENERAR (todas con enfoque LIFESTYLE):
1. ENFOQUE BIENESTAR: Paz, naturaleza, desconexión, wellness
2. ENFOQUE LEGADO: Familia, memorias, trascendencia generacional
3. ENFOQUE EXPERIENCIA: Vivencias únicas, sensaciones, el arte de vivir""",
            "urgency": """
VARIANTES A GENERAR (todas con enfoque URGENCIA):
1. ENFOQUE ESCASEZ: Últimas unidades, inventario limitado
2. ENFOQUE TIEMPO: Ventana de oportunidad, precios de lanzamiento
3. ENFOQUE FOMO: Lo que otros ya aseguraron, cierre inminente""",
            "luxury": """
VARIANTES A GENERAR (todas con enfoque ULTRA LUJO):
1. ENFOQUE EXCLUSIVIDAD: Membresía selecta, acceso privado
2. ENFOQUE DISEÑO: Arquitectura de autor, materiales nobles
3. ENFOQUE ESTATUS: Privacidad absoluta, el círculo más selecto""",
            "balanced": """
VARIANTES A GENERAR (MIX EQUILIBRADO):
1. ENFOQUE INVERSIÓN + LIFESTYLE: Patrimonio que se disfruta
2. ENFOQUE EXCLUSIVIDAD + UBICACIÓN: Posición única e irrepetible  
3. ENFOQUE MINIMALISTA: Impacto visual máximo con mínimo texto"""
        }
        
        prompt = f"""Proyecto: {project_name}
Datos del proyecto: {json.dumps(project_info)}
Contexto adicional: {additional_context}

{tone_specific_instructions.get(tone, tone_specific_instructions['balanced'])}

IMPORTANTE: NO incluyas el nombre '{project_name}' en el main_headline - se mostrará por separado como elemento HERO en la imagen. El main_headline debe ser SOLO el tagline.
Genera copy ESPECTACULAR que haga detenerse a quien lo vea.

Devuelve JSON puro con estructura: {{"variantes": [{{"super_headline": "...", "main_headline": "...", "body_text": "..."}}]}}"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            config=genai.types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.8,  # Un poco más creativo
                response_mime_type="application/json",
                response_schema={
                    "type": "object",
                    "properties": {
                        "variantes": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "super_headline": {"type": "string"},
                                    "main_headline": {"type": "string"},
                                    "body_text": {"type": "string"}
                                },
                                "required": ["super_headline", "main_headline", "body_text"]
                            }
                        }
                    },
                    "required": ["variantes"]
                }
            ),
            contents=prompt
        )
        
        # Parseo robusto
        clean_text = response.text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
            
        res_json = json.loads(clean_text)
        
        if "variantes" in res_json and len(res_json["variantes"]) > 0:
            while len(res_json["variantes"]) < 3 and len(base_variants) >= 3:
                res_json["variantes"].append(base_variants[len(res_json["variantes"])])
            return res_json
        
        return get_fallback()
        
    except Exception as e:
        print(f"Error Calling Gemini Generate Copy: {e}")
        return get_fallback()

def generate_social_posts(project_name: str, context: str = "") -> str:
    """Generates social media post variations using Gemini."""
    db = load_project_database()
    project_info = find_project_match(project_name, db)
    
    # Banco de Social Posts para fallback
    social_bank = {
        "PINK_RIAD": [
            {
                "id": 1,
                "titulo": "Pink Riad: El activo más sexy de Tulum",
                "cuerpo": "Descubre Pink Riad, una joya arquitectónica en el corazón de Tulum. Unidades de 2 habitaciones con piscina privada y amenidades de lujo. Invierte en el destino con mayor plusvalía del Caribe Mexicano.",
                "hashtags": "#PinkRiad #TulumRealEstate #InversionTuristica #BrisaMayaCapital"
            },
            {
                "id": 2,
                "titulo": "Tu refugio de lujo te espera en Tulum",
                "cuerpo": "¿Buscas exclusividad y confort? Pink Riad ofrece el equilibrio perfecto entre diseño moderno y naturaleza. Unidades limitadas en fase de pre-venta. Ideal para rentas vacacionales.",
                "hashtags": "#LujoTulum #RivieraMaya #BrisaMaya #EstiloDeVida"
            },
            {
                "id": 3,
                "titulo": "Rendimiento y Sofisticación en la Selva",
                "cuerpo": "Invertir con Brisa Maya Capital es asegurar tu patrimonio. Pink Riad no es solo un desarrollo, es una declaración de estilo. Conoce nuestras opciones de financiamiento y asegura tu unidad hoy mismo.",
                "hashtags": "#RealEstateMexico #Plusvalia #Tulum #PinkRiad"
            }
        ],
        "SAMSARA": [
            {
                "id": 1,
                "titulo": "Samsara: El Nuevo Icono de Tulum",
                "cuerpo": "Entrega inmediata en la zona de mayor lujo. Samsara redefine la exclusividad con su colección Iconic Boutique. 2 habitaciones listas para habitar.",
                "hashtags": "#SamsaraTulum #LujoInmobiliario #InversionSegura #BrisaMaya"
            },
            {
                "id": 2,
                "titulo": "Tu Legado en el Caribe Comienza Hoy",
                "cuerpo": "Samsara Tulum ofrece la privacidad y sofisticación que tu patrimonio merece. Unidades de ultra-lujo con acabados premium y ubicación estratégica.",
                "hashtags": "#TulumLifestyle #RealEstateLuxury #Patrimonio #RivieraMaya"
            },
            {
                "id": 3,
                "titulo": "Inversión con Plusvalía Garantizada",
                "cuerpo": "Samsara es el activo inteligente en Tulum. Diseño boutique y escasez de inventario aseguran tu retorno. Consulta planes de pago con Brisa Maya Capital.",
                "hashtags": "#ROI #InversionInteligente #Samsara #TulumVentas"
            }
        ],
        "ANTHAR": [
            {
                "id": 1,
                "titulo": "Anthar: Simetría y Legado en Playa",
                "cuerpo": "Un tributo al Mediterráneo en el corazón de la Riviera Maya. Anthar combina diseño simbólico con una ubicación estratégica imbatible.",
                "hashtags": "#AntharPDC #PlayaDelCarmen #LujoInstitucional"
            },
            {
                "id": 2,
                "titulo": "Invierte en el Corazón de la Acción",
                "cuerpo": "Anthar ofrece seguridad absoluta y un modelo de negocio probado. Centro comercial privado y acabados de lujo para el inversor sofisticado.",
                "hashtags": "#InversionRealEstate #PDC #BrisaMayaCapital"
            },
            {
                "id": 3,
                "titulo": "Urban Elegance: El Nuevo Latido de Playa",
                "cuerpo": "Diseño, comercio de élite y la energía vibrante de Playa del Carmen. Anthar es el destino para quienes exigen lo mejor.",
                "hashtags": "#LuxuryLiving #RivieraMaya #Anthar"
            }
        ],
        "LUNARA": [
            {
                "id": 1,
                "titulo": "Lunara: Tu Santuario Privado en Akumal",
                "cuerpo": "Imagina tener siete cenotes como tu jardín privado. Lunara es el refugio de ultra-lujo inmerso en la selva virgen de Akumal.",
                "hashtags": "#LunaraAkumal #PrivacidadExtrema #QuietLuxury"
            },
            {
                "id": 2,
                "titulo": "Un Legado en la Selva Maya",
                "cuerpo": "Consolide su patrimonio en un entorno de naturaleza indómita. Lunara ofrece soberanía natural y diseño arquitectónico de vanguardia.",
                "hashtags": "#InversionConsciente #Akumal #Exclusividad"
            },
            {
                "id": 3,
                "titulo": "Wellness y Patrimonio en Lunara",
                "cuerpo": "La tierra más fértil para el crecimiento de su capital. Disfrute de la paz absoluta y el valor intrínseco de la naturaleza.",
                "hashtags": "#RealEstateMexico #Lunara #AkumalLujo"
            }
        ],
        "MUSA_DEL_PUERTO": [
            {
                "id": 1,
                "titulo": "Musa: Elegancia Frente al Mar Caribe",
                "cuerpo": "Puerto Morelos se redefine con Musa. Diseño contemporáneo y vistas inigualables en el nodo de mayor crecimiento de la Riviera.",
                "hashtags": "#MusaPuertoMorelos #LujoFrenteAlMar #InversionSegura"
            },
            {
                "id": 2,
                "titulo": "Inversión Estratégica en Puerto Morelos",
                "cuerpo": "Maximiza tu ROI con Musa. Ubicación privilegiada y arquitectura diseñada para la rentabilidad y el confort.",
                "hashtags": "#ROI #PuertoMorelos #BrisaMaya"
            },
            {
                "id": 3,
                "titulo": "Estilo de Vida Musa",
                "cuerpo": "Vivir frente al Caribe es posible. Musa ofrece el equilibrio perfecto entre modernidad y naturaleza apacible.",
                "hashtags": "#CaribeMexicano #Musa #LujoRelajado"
            }
        ],
        "SOLE_BLU": [
            {
                "id": 1,
                "titulo": "Sole Blu: Sofisticación en Puerto Morelos",
                "cuerpo": "Conexión pura con el mar Caribe. Sole Blu ofrece arquitectura de clase mundial y servicios de resort para un estilo de vida excepcional.",
                "hashtags": "#SoleBlu #OceanfrontLiving #PuertoMorelos"
            },
            {
                "id": 2,
                "titulo": "Despierta con el Sonido del Mar",
                "cuerpo": "Exclusividad y diseño frente al arrecife. Sole Blu es el refugio de ultra-lujo que redefine el descanso premium.",
                "hashtags": "#LujoFrenteAlMar #SoleBlu #PuertoMorelos"
            },
            {
                "id": 3,
                "titulo": "Inversión Patrimonial Sole Blu",
                "cuerpo": "Asegure su futuro con un activo de alta sofisticación. Gestión de clase mundial y plusvalía garantizada.",
                "hashtags": "#RealEstateInvest #SoleBlu #Caribe"
            }
        ],
        "BAY_VIEW_GRAND": [
            {
                "id": 1,
                "titulo": "Bay View Grand: Estatus Global en Cancún",
                "cuerpo": "El epicentro del lujo en la Zona Hotelera. Vistas duales al Caribe y la Laguna Nichupté en la ubicación más icónica de México.",
                "hashtags": "#BVGCancun #ZonaHotelera #LujoGlobal"
            },
            {
                "id": 2,
                "titulo": "La Dirección más Prestigiosa",
                "cuerpo": "Bay View Grand es sinónimo de exclusividad y seguridad institucional. Un activo que desafía al tiempo y consolida su patrimonio.",
                "hashtags": "#CancunLuxury #RealEstateMexico #Estatus"
            },
            {
                "id": 3,
                "titulo": "Privacidad y Confort en el Epicentro",
                "cuerpo": "Viva la leyenda. Amenidades de primer nivel y la mejor vista de Cancún desde su terraza privada.",
                "hashtags": "#ZonaHotelera #BVG #InversionSegura"
            }
        ],
        "THE_RESIDENCES": [
            {
                "id": 1,
                "titulo": "The Residences: Discreción UHNW",
                "cuerpo": "Privacidad absoluta y arquitectura excepcional en Grand Island. El refugio diseñado para los perfiles más exigentes del mundo.",
                "hashtags": "#TheResidences #GrandIsland #UltraLujo"
            },
            {
                "id": 2,
                "titulo": "Arquitectura Más allá del Lujo",
                "cuerpo": "The Residences en Grand Island ofrece un ecosistema de servicios privados y diseño de vanguardia sin precedentes.",
                "hashtags": "#Architecture #GrandIsland #Exclusividad"
            },
            {
                "id": 3,
                "titulo": "El Retiro de los Elegidos",
                "cuerpo": "Donde la discreción es el máximo valor. Viva en un santuario residencial blindado y lleno de sofisticación.",
                "hashtags": "#UHNW #TheResidences #Cancun"
            }
        ],
        "LOMAS_AURORA": [
            {
                "id": 1,
                "titulo": "Lomas Aurora: El Legado Familiar",
                "cuerpo": "Viva entre lagos y naturaleza cerca de Xcaret. Lomas Aurora es el entorno perfecto para la seguridad y el crecimiento de su patrimonio.",
                "hashtags": "#LomasAurora #HerenciaFamiliar #CancunRealEstate"
            },
            {
                "id": 2,
                "titulo": "Soberanía Natural cerca de Playa",
                "cuerpo": "Lomas Aurora ofrece el equilibrio perfecto entre desarrollo sustentable y conectividad estratégica en la zona de oro.",
                "hashtags": "#WellnessNature #InversionSegura #PlayaDelCarmen"
            },
            {
                "id": 3,
                "titulo": "Invierta en Futuro y Bienestar",
                "cuerpo": "Plusvalía acelerada en una comunidad planeada con lagos cristalinos. Su refugio ideal cerca de los mejores parques de la Riviera.",
                "hashtags": "#LomasAurora #Plusvalia #RealEstate"
            }
        ],
        "AMARES": [
            {
                "id": 1,
                "titulo": "Amares: Salud y Patrimonio en Equilibrio",
                "cuerpo": "Residential Resort con 3 cenotes privados. Descubre la primera comunidad planeada diseñada para el bienestar y la alta rentabilidad.",
                "hashtags": "#AmaresPDC #WellnessLiving #InversionInteligente"
            },
            {
                "id": 2,
                "titulo": "Invierta en el 43% de Absorción Anual",
                "cuerpo": "Amares es el éxito comercial de Playa del Carmen. Asegure su unidad en un mercado que agota su inventario rápidamente.",
                "hashtags": "#ROI #RealEstateMarket #Amares"
            },
            {
                "id": 3,
                "titulo": "Tu Refugio Biófilo en Playa",
                "cuerpo": "Diseño que honra la selva maya. Viva la experiencia de un resort de lujo todos los días en Amares.",
                "hashtags": "#BiophilicDesign #LuxuryLifestyle #PlayaDelCarmen"
            }
        ],
        "INNA": [
            {
                "id": 1,
                "titulo": "Inna: Hospitalidad 5 Estrellas en tu Hogar",
                "cuerpo": "Condominios frente al mar con servicios de hotel de lujo. Inna es el refugio de bienestar definitivo en Puerto Morelos.",
                "hashtags": "#InnaBeach #PuertoMorelos #LujoBienestar"
            },
            {
                "id": 2,
                "titulo": "Alta Rentabilidad con Gestión Hotelera",
                "cuerpo": "Inna ofrece un modelo híbrido residencial-hotelero. Maximice su ROI con la tranquilidad de una operación profesional.",
                "hashtags": "#InvestMexico #PuertoMorelos #ROI"
            },
            {
                "id": 3,
                "titulo": "Un Oasis de Paz frente al Arrecife",
                "cuerpo": "Privacidad absoluta y servicios concierge en la zona más exclusiva de Puerto Morelos. Inna es su legado en el Caribe.",
                "hashtags": "#Beachfront #Wellness #Inna"
            },
        ],
        "OPENCLAW": [
            {
                "id": 1,
                "titulo": "El fin de las alertas nocturnas: La era de Reef.",
                "cuerpo": "Nathan desplegó 'Reef', un agente OpenClaw que actúa como un sysadmin junior infatigable. Usando Ansible y Terraform, el sistema detecta fallos en clústeres Kubernetes y los repara antes de que usted despierte. La infraestructura que se cura sola es el nuevo estándar de lujo operativo.",
                "hashtags": "#Kubernetes #SelfHealing #OpenClaw #DevOps"
            },
            {
                "id": 2,
                "titulo": "Su vida privada no es un conjunto de datos para la nube.",
                "cuerpo": "OpenClaw sincroniza iMessage y calendarios familiares localmente. Detecta citas y crea buffers de conducción sin enviar un solo byte a servidores externos. En un mundo de 135,000 instancias abiertas, la configuración 127.0.0.1 es su mayor lujo.",
                "hashtags": "#PrivacyFirst #OpenClaw #FamilyOffice #LocalAI"
            },
            {
                "id": 3,
                "titulo": "Aprendiendo de Moltbook: Por qué la soberanía es vital.",
                "cuerpo": "Moltbook eliminó el modo offline, robando efectivamente acceso a dispositivos comprados. OpenClaw es el antídoto arquitectónico: su IA corre en GPU local AMD/NVIDIA. Sin licencias en la nube, sin suscripciones, sin control externo.",
                "hashtags": "#VendorLockIn #TechSovereignty #LocalLLM #OpenClaw"
            },
            {
                "id": 4,
                "titulo": "El asistente que conoce el menú, no sus inversiones.",
                "cuerpo": "Mientras otras IAs envían sus conversaciones a la nube para reentrenamiento, OpenClaw opera en LangGraph localmente. Puede procesar su portafolio en un iPad pro sin que un solo token abandone su red. Privacidad por defecto, no por opción.",
                "hashtags": "#DataPrivacy #LangChain #OfflineAI #OpenClaw"
            },
            {
                "id": 5,
                "titulo": "La tranquilidad de un hogar que anticipa.",
                "cuerpo": "OpenClaw integra Home Assistant con modelos multimodales locales. Identifica que su vuelo se retrasó y ajusta la temperatura del hogar en consecuencia, sin pasar por servidores corporativos de terceros.",
                "hashtags": "#SmartHome #HomeAssistant #AIHome #OpenClaw"
            },
            {
                "id": 6,
                "titulo": "Audite su lujo: Transparencia total.",
                "cuerpo": "Las 'cajas negras' son inaceptables para patrimonios formales. El sistema de registro de OpenClaw permite ver exactamente qué razonamiento usó su LLM local para tomar una decisión en la red de la casa. Control total.",
                "hashtags": "#AITransparency #ExplainableAI #WhiteBox #OpenClaw"
            },
            {
                "id": 7,
                "titulo": "El ancho de banda no debería dictar sus capacidades.",
                "cuerpo": "Con OpenClaw, el procesamiento pesado —desde reconocimiento de voz Whisper hasta generación de texto local— se realiza en el edge. Incluso sin internet, su hogar y oficina siguen siendo inteligentes.",
                "hashtags": "#EdgeComputing #LocalInference #OfflineFirst #OpenClaw"
            },
            {
                "id": 8,
                "titulo": "La verdadera exclusividad es no depender de nadie.",
                "cuerpo": "Depender de servidores externos significa depender de sus caídas. OpenClaw es resiliencia estructurada: si el proveedor de nube falla, sus agentes locales siguen ejecutando rutinas críticas.",
                "hashtags": "#Resilience #TechAutonomy #Failover #OpenClaw"
            },
            {
                "id": 9,
                "titulo": "Un Hub diseñado para la élite técnica.",
                "cuerpo": "Claw Hub no es una tienda de aplicaciones mundana. Es un repositorio cifrado de agentes auditados, desde gestores de repositorios hasta analistas de logs, desplegables con un comando en su infraestructura local.",
                "hashtags": "#ClawHub #AgentMarketplace #DevTools #OpenClaw"
            },
            {
                "id": 10,
                "titulo": "El valor del silencio en un mundo ruidoso.",
                "cuerpo": "Su IA no tiene por qué ser locuaz. OpenClaw está diseñado para intervenir solo cuando es necesario, corrigiendo flujos y alertando solo en anomalías críticas. 'Quiet Luxury' aplicado al software.",
                "hashtags": "#QuietLuxury #TechAesthetics #Minimalism #OpenClaw"
            },
            {
                "id": 11,
                "titulo": "No alquile su cerebro digital. Cómprelo.",
                "cuerpo": "Suscripciones mensuales por modelos de lenguaje son el CAPEX de la clase media. La inversión UHNW instala H100s locales orquestados por OpenClaw para un ROI continuo libre de rentas cognitivas.",
                "hashtags": "#CAPEX #AIInvestment #LocalCompute #OpenClaw"
            },
            {
                "id": 12,
                "titulo": "La curaduría de sus datos comienza en el firewall.",
                "cuerpo": "OpenClaw asegura que todos los datos sensibles —documentos legales, historiales médicos procesados por IA local— permanezcan detrás de su firewall corporativo o doméstico.",
                "hashtags": "#DataSecurity #Firewall #EnterpriseAI #OpenClaw"
            },
            {
                "id": 13,
                "titulo": "Amenidades digitales: El conserje que usted controla.",
                "cuerpo": "Desde el rastreador de despensa por visión artificial hasta el briefing de reuniones de las 7 AM. Las amenidades de OpenClaw elevan su estándar de vida digital bajo encriptación TLS 1.3. Sofisticación sin compromiso.",
                "hashtags": "#DigitalAmenities #SmartOffice #VisionAI #OpenClaw"
            },
            {
                "id": 14,
                "titulo": "No instale cualquier skill. Instale confianza.",
                "cuerpo": "Con un 17% de malware en el Hub, la curaduría es su escudo. OpenClaw permite auditar el código fuente antes de cada ejecución. Transparencia total para una seguridad total. No sea parte de la estadística.",
                "hashtags": "#InfoSec #OpenSource #ClawHub #OpenClaw"
            },
            {
                "id": 15,
                "titulo": "Bienvenidos a la era del Capital Agéntico.",
                "cuerpo": "OpenClaw no es software, es un activo de alto rendimiento. Con 188k estrellas y un crecimiento explosivo, es la base de la economía de 2026. ¿Está su cartera lista para la infraestructura soberana?",
                "hashtags": "#Investment #AgentEconomy #TechPortfolio #OpenClaw"
            }
        ],
        "THE_LANDMARK": [
            {
                "id": 1,
                "titulo": "Refinamiento Urbano en Playa",
                "cuerpo": "Descubra The Landmark, donde el lujo urbano se encuentra con el paraíso de Playa del Carmen. Su próximo activo inmobiliario de alto rendimiento a un paso de la Quinta Avenida.",
                "hashtags": "#TheLandmark #PlayaDelCarmen #RealEstate #LuxuryLiving"
            },
            {
                "id": 2,
                "titulo": "Vista al Caribe desde el Sky Club",
                "cuerpo": "Rooftop Sky Club, alberca infinity y amenidades de clase mundial. The Landmark redefine la experiencia de invertir en el Caribe Mexicano.",
                "hashtags": "#RivieraMaya #Investment #SkyClub"
            },
            {
                "id": 3,
                "titulo": "Santuario de Alta Inversión",
                "cuerpo": "Desde estudios hasta amplias residencias de 2 recámaras. The Landmark es su santuario urbano diseñado para el inversor sofisticado.",
                "hashtags": "#UHNW #PropertyInvestment #MexicoRealEstate"
            }
        ],
        "MACONDO_CORAZON": [
            {
                "id": 1,
                "titulo": "Macondo Corazón: Arquitectura y Rendimiento",
                "cuerpo": "Proteja su CAPEX con la calidad incomparable de Porcelanosa. Macondo Corazón no es solo un refugio de lujo, es un activo institucional estructurado para maximizar su ROI en el nodo más vibrante de Playa del Carmen.",
                "hashtags": "#MacondoCorazon #PlayaDelCarmen #RealEstateInvestment #BrisaMayaCapital"
            },
            {
                "id": 2,
                "titulo": "El lujo como motor de rentabilidad",
                "cuerpo": "Exclusividad que trasciende lo estético. Con amenidades diseñadas para atraer al nómada digital sofisticado: alberca infinity, coworking premium y un sky bar inigualable. Apalancamiento inteligente 20-80.",
                "hashtags": "#QuietLuxury #InversionInmobiliaria #RivieraMaya #Patrimonio"
            },
            {
                "id": 3,
                "titulo": "La ubicación que define la liquidez",
                "cuerpo": "A un minuto de la 5ta Avenida, pero inmerso en una atmósfera de privacidad absoluta. La 'buffer zone' de Macondo Corazón garantiza la tranquilidad de sus huéspedes y la ocupación constante de su inversión.",
                "hashtags": "#UHNW #ActivosDeLujo #PlayaDelCarmenRealEstate #Estatus"
            }
        ],
        "T3RRA": [
            {
                "id": 1,
                "titulo": "T3RRA: Naturaleza y Rendimiento en Playa del Carmen",
                "cuerpo": "Descubra T3RRA Nature Living, un activo inmobiliario de alto rendimiento desarrollado por Grupo Cunin. Entrega 100% llave en mano para optimizar su Time-to-Market en el Caribe.",
                "hashtags": "#T3RRA #PlayaDelCarmen #InversionSegura #BrisaMayaCapital"
            },
            {
                "id": 2,
                "titulo": "Arquitectura Biofílica a pasos de la Quinta Avenida",
                "cuerpo": "Ubicado en el epicentro de la demanda turística, T3RRA se clasifica como un 'urban infill' estratégico. Garantice liquidez inmediata y una apreciación de capital superior.",
                "hashtags": "#ArquitecturaBiofilica #RivieraMaya #BienesRaices #Lujo"
            },
            {
                "id": 3,
                "titulo": "El Verdadero Resort Living para Inversores UHNW",
                "cuerpo": "Maximice su ADR con operación hotelera profesional a cargo de Bunik. Amenidades excepcionales desde Cine al aire libre hasta Wellness de alto rendimiento.",
                "hashtags": "#UHNW #ROI #VacationRental #BrisaMaya"
            }
        ],
    }

    # Fallback genérico institucional
    generic_social = [
        {
            "id": 1,
            "titulo": f"Descubre {project_name} con Brisa Maya Capital",
            "cuerpo": f"{project_name} representa la cúspide del lujo y la inversión inteligente en el Caribe. Un proyecto diseñado para quienes buscan exclusividad y altos rendimientos patrimoniales.",
            "hashtags": f"#{project_name.replace(' ', '')} #BrisaMayaCapital #LujoCaribe #InversionSegura"
        },
        {
            "id": 2,
            "titulo": f"Oportunidad Exclusiva en {project_name}",
            "cuerpo": f"Asegura tu lugar en {project_name}. Ubicación estratégica, diseño de vanguardia y la garantía de calidad de Brisa Maya Capital. Contáctanos para conocer disponibilidad y planes de pago.",
            "hashtags": "#RealEstateMexico #RivieraMaya #InversionInmobiliaria #Exclusividad"
        },
        {
            "id": 3,
            "titulo": f"El estilo de vida que mereces en {project_name}",
            "cuerpo": f"Vive la experiencia {project_name}. Espacios creados para inspirar y conectar con la esencia del paraíso. Una inversión en bienestar y futuro para ti y tu familia.",
            "hashtags": "#EstiloDeVida #Tulum #CaribeMexicano #Patrimonio"
        }
    ]

    base_social = social_bank.get(project_name.upper().replace(" ", "_"), generic_social)
    
    api_key = os.environ.get("GEMINI_API_KEY")
    
    def get_fallback():
        return json.dumps({"variantes": base_social[:3]})

    if not api_key:
        return get_fallback()

    try:
        client = genai.Client(api_key=api_key)
        
        system_instruction = (
            "Eres un Especialista en Redes Sociales para el segmento Inmobiliario de Lujo en Brisa Maya Capital.\n"
            "Tu misión es generar publicaciones para redes sociales hermosas, aspiracionales y que logren enamorar al cliente en la Riviera Maya.\n\n"
            "Reglas de Estilo BMC:\n"
            "- Tono: Poético, elegante, conversacional y sumamente vibrante. El enfoque es el disfrute, la exclusividad y la realización personal, apoyado por una base de inversión sólida pero no fría.\n"
            "- Vocabulario Sugerido: Usa palabras clave hermosas: 'santuario', 'refugio', 'mar Caribe', 'diseño de autor', 'arquitectura excepcional', 'estilo de vida', 'plusvalía', 'legado'.\n"
            "- PALABRAS ESTRICTAMENTE PROHIBIDAS: JAMÁS uses términos fríos como 'institucional', 'inversionista calificado', 'estructuración', 'consecución de fondos'. Estás vendiendo el sueño de la Riviera Maya frente al mar, no un fondo de cobertura.\n"
            "- Lo que debes EVITAR: Evita emojis genéricos excesivos y NUNCA uses lenguaje promocional desesperado (No uses '¡Llama hoy!', 'Oportunidad única', etc.).\n"
            "- Enfoque Institucional Cuidado: Trata al lector como alguien sofisticado que busca la mejor adquisición de su vida, con textos ricos en descripciones de estilo de vida.\n\n"
            "Formatos Obligatorios a Devolver (STRICT JSON):\n"
            "- titulo: El gancho de la publicación (no usar hashtags aquí).\n"
            "- cuerpo: El texto principal de la publicación. Puedes usar \\n para formato.\n"
            "- hashtags: Una cadena de texto que OBLIGATORIAMENTE incluya '#BrisaMayaCapital' más otros 3-5 hashtags del sector inmobiliario.\n"
            "- id: Número secuencial (1, 2, 3).\n"
        )
        
        prompt = (
            f"Proyecto: {project_name}\n"
            f"Datos del proyecto: {json.dumps(project_info)}\n"
            f"Contexto: {context}\n\n"
            "Genera EXACTAMENTE 3 publicaciones con los siguientes ángulos:\n"
            "1. Preservación de Capital/Estructura Financiera.\n"
            "2. Curaduría de Vida/Bienestar.\n"
            "3. Legado y Exclusividad.\n"
            f"La marca publicadora es Brisa Maya Capital y el proyecto o enfoque actual es '{project_name}'.\n"
            "Devuelve la respuesta PURAMENTE en formato JSON plano."
        )

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            config=genai.types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
                response_mime_type="application/json",
                response_schema={
                    "type": "object",
                    "properties": {
                        "variantes": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "id": {"type": "integer"},
                                    "titulo": {"type": "string"},
                                    "cuerpo": {"type": "string"},
                                    "hashtags": {"type": "string"}
                                },
                                "required": ["id", "titulo", "cuerpo", "hashtags"]
                            }
                        }
                    },
                    "required": ["variantes"]
                }
            ),
            contents=prompt
        )
        
        clean_text = response.text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
            
        res_json = json.loads(clean_text)
        
        if "variantes" in res_json and len(res_json["variantes"]) > 0:
            while len(res_json["variantes"]) < 3:
                res_json["variantes"].append(base_social[len(res_json["variantes"])])
            return json.dumps(res_json)
            
        return get_fallback()
        
    except Exception as e:
        print(f"Error Calling Gemini Social Copy: {e}")
        return get_fallback()
        
        return get_fallback()
        
    except Exception as e:
        print(f"Error Social AI: {e}")
        return get_fallback()


# ═══════════════════════════════════════════════════════════════════
# GENERACIÓN DE IMÁGENES CON GOOGLE AI (Modelo Seleccionable)
# ═══════════════════════════════════════════════════════════════════

def generate_ai_image(prompt: str, aspect_ratio: str = "1:1", model: str = "nano-banana-pro-preview", api_endpoint: str = "auto", enhance_style: str = "real_estate", chat_history: list = None, enrich: bool = True, enrich_model: str = "gemini-2.5-flash") -> dict:
    """
    Genera una imagen usando Google AI con modelo seleccionable.
    
    Args:
        prompt: Descripción de la imagen a generar
        aspect_ratio: Formato de imagen ("1:1", "16:9", "9:16", "4:3", "3:4")
        model: Modelo a usar (imagen-4.0-ultra-generate-001, nano-banana-pro-preview, etc.)
        api_endpoint: 'auto', 'gemini', o 'vertex' - cual API usar
    
    Returns:
        dict con "image_base64" (str), "mime_type" (str), "model_used" (str), "api_used" (str), o "error" (str)
    """
    import base64
    import requests
    
    # ─── Enriquecer prompt con contexto conversacional (estilo ChatGPT/Sora) ───
    if enrich and (chat_history or len(prompt or "") < 250):
        try:
            prompt = enrich_image_prompt_from_context(
                user_prompt=prompt,
                chat_history=chat_history,
                enhance_style=enhance_style,
                aspect_ratio=aspect_ratio,
                model=enrich_model,
                api_endpoint=api_endpoint,
            )
        except Exception as _e:
            print(f"⚠️ enrich falló silenciosamente: {_e}")

    # Routing a OpenRouter
    if model.startswith("openrouter/") or api_endpoint == "openrouter":
        # Aplicar enhance_style al prompt antes de enviar
        if enhance_style == "viral":
            styled = f"High-impact viral social media visual, cinematic composition, bold contrast.\n\n{prompt}\n\nStyle: Ultra sharp, vibrant, scroll-stopping, professional quality."
        elif enhance_style == "crypto":
            styled = f"Futuristic crypto/AI/tech visual, cinematic dark mode aesthetic, neon accents.\n\n{prompt}\n\nStyle: Cyberpunk-inspired, dramatic lighting, blue/purple/cyan palette, ultra-detailed."
        elif enhance_style == "real_estate":
            styled = f"Photorealistic luxury real estate photography in Riviera Maya, Mexico.\n\n{prompt}\n\nStyle: Ultra high resolution professional architectural photography, golden hour lighting, magazine cover quality."
        else:
            styled = prompt
        return generate_image_openrouter(
            prompt=styled,
            model=model if model.startswith("openrouter/") else f"openrouter/{model}",
        )

    # Seleccionar API key según preferencia del usuario
    gemini_key = os.environ.get("GEMINI_API_KEY")
    vertex_key = os.environ.get("VERTEX_API_KEY")
    
    if api_endpoint == "gemini":
        api_key = gemini_key
        api_name = "Gemini API"
        if not api_key:
            return {"error": "No hay GEMINI_API_KEY configurada"}
    elif api_endpoint == "vertex":
        api_key = vertex_key
        api_name = "Vertex AI"
        if not api_key:
            return {"error": "No hay VERTEX_API_KEY configurada"}
    else:  # auto
        api_key = gemini_key or vertex_key
        api_name = "Gemini API" if gemini_key else "Vertex AI"
        if not api_key:
            return {"error": "No hay GEMINI_API_KEY ni VERTEX_API_KEY configurada"}
    
    # Detectar tipo de key para usar endpoint correcto
    # AQ.* = Vertex AI endpoint | AIza* = Generative Language endpoint
    is_vertex_key = api_key.startswith("AQ.")
    
    # Detectar si es modelo Imagen 4 (usa endpoint predict)
    is_imagen4 = model.startswith("imagen-4")
    
    # ─── Enriquecer prompt con contexto conversacional (estilo ChatGPT/Sora) ───
    # (ya se hizo arriba antes del routing OpenRouter)

    # Prompt engineering por estilo
    if enhance_style == "none" or not enhance_style:
        # Prompt puro, sin wrapper
        enhanced_prompt = prompt
    elif enhance_style == "viral":
        enhanced_prompt = f"""High-impact viral social media visual, cinematic composition, bold contrast, eye-catching.

{prompt}

Style: Ultra sharp, vibrant, scroll-stopping, optimized for Instagram/TikTok/YouTube thumbnails, professional quality."""
    elif enhance_style == "crypto":
        enhanced_prompt = f"""Futuristic crypto/AI/tech visual, cinematic dark mode aesthetic, neon accents, high-tech atmosphere.

{prompt}

Style: Cyberpunk-inspired, glowing data, dramatic lighting, blue/purple/cyan palette, ultra-detailed, magazine-quality digital art."""
    else:  # "real_estate" (default - mantiene comportamiento original)
        enhanced_prompt = f"""Photorealistic luxury real estate photography in Riviera Maya, Mexico.

{prompt}

Style: Ultra high resolution professional architectural photography, golden hour lighting, warm tropical tones, magazine cover quality, clean composition for text overlay, aspirational luxury atmosphere."""

    print(f"🎨 Generando imagen con modelo: {model} ({'Imagen 4' if is_imagen4 else 'Gemini'})...")
    print(f"🔑 Usando endpoint: {'Vertex AI' if is_vertex_key else 'Generative Language'}")
    print(f"📝 Prompt: {enhanced_prompt[:100]}...")
    
    try:
        if is_imagen4:
            # ═══ IMAGEN 4 - Usa endpoint predict ═══
            if is_vertex_key:
                url = f"https://aiplatform.googleapis.com/v1/publishers/google/models/{model}:predict?key={api_key}"
            else:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:predict?key={api_key}"
            
            # Mapear aspect ratio a formato Imagen 4
            aspect_map = {
                "1:1": "1:1",
                "16:9": "16:9",
                "9:16": "9:16",
                "4:3": "4:3",
                "3:4": "3:4"
            }
            
            payload = {
                "instances": [{
                    "prompt": enhanced_prompt
                }],
                "parameters": {
                    "sampleCount": 1,
                    "aspectRatio": aspect_map.get(aspect_ratio, "1:1"),
                    "outputOptions": {
                        "mimeType": "image/png"
                    }
                }
            }
            
            headers = {"Content-Type": "application/json"}
            response = requests.post(url, json=payload, headers=headers, timeout=180)
            
            if response.status_code == 200:
                data = response.json()
                predictions = data.get("predictions", [])
                if predictions and len(predictions) > 0:
                    # Imagen 4 devuelve base64 directamente
                    image_data = predictions[0].get("bytesBase64Encoded") or predictions[0].get("image", {}).get("bytesBase64Encoded")
                    if image_data:
                        print(f"✅ Imagen generada exitosamente con {model} via {api_name}")
                        return {
                            "image_base64": image_data,
                            "mime_type": "image/png",
                            "model_used": model,
                            "api_used": api_name
                        }
                return {"error": "No se generó ninguna imagen en la respuesta de Imagen 4"}
            else:
                error_msg = response.text[:500]
                print(f"❌ Error API Imagen 4: {response.status_code} - {error_msg}")
                return {"error": f"Error {response.status_code}: {error_msg}"}
        
        else:
            # ═══ GEMINI/NANO BANANA - Usa endpoint generateContent ═══
            if is_vertex_key:
                url = f"https://aiplatform.googleapis.com/v1/publishers/google/models/{model}:generateContent?key={api_key}"
            else:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            
            # Aspect ratios soportados por Nano Banana / Gemini image-preview
            valid_ratios = {"1:1","2:3","3:2","3:4","4:3","4:5","5:4","9:16","16:9","21:9"}
            ar = aspect_ratio if aspect_ratio in valid_ratios else "1:1"
            
            payload = {
                "contents": [{
                    "parts": [{"text": enhanced_prompt}]
                }],
                "generationConfig": {
                    "responseModalities": ["IMAGE", "TEXT"],
                    "imageConfig": {
                        "aspectRatio": ar
                    }
                }
            }
            
            headers = {"Content-Type": "application/json"}
            response = requests.post(url, json=payload, headers=headers, timeout=180)
            
            if response.status_code == 200:
                data = response.json()
                if "candidates" in data and len(data["candidates"]) > 0:
                    parts = data["candidates"][0].get("content", {}).get("parts", [])
                    for part in parts:
                        if "inlineData" in part:
                            image_base64 = part["inlineData"].get("data")
                            mime_type = part["inlineData"].get("mimeType", "image/png")
                            if image_base64:
                                print(f"✅ Imagen generada exitosamente con {model} via {api_name}")
                                return {
                                    "image_base64": image_base64,
                                    "mime_type": mime_type,
                                    "model_used": model,
                                    "api_used": api_name
                                }
                return {"error": "No se generó ninguna imagen en la respuesta"}
            else:
                error_msg = response.text[:500]
                print(f"❌ Error API: {response.status_code} - {error_msg}")
                return {"error": f"Error {response.status_code}: {error_msg}"}
            
    except Exception as e:
        print(f"❌ Error generando imagen: {e}")
        return {"error": str(e)}


# ═══════════════════════════════════════════════════════════════════
# IMAGE-TO-IMAGE EDITING (Mantiene estructura, aplica mejoras)
# ═══════════════════════════════════════════════════════════════════

def edit_image_with_ai(image_base64: str, prompt: str, style_preset: str = "luxury_real_estate") -> dict:
    """
    Edita una imagen existente usando IA, manteniendo estructura y colores.
    
    Args:
        image_base64: Imagen original en base64
        prompt: Instrucciones de edición (ej: "mejorar iluminación golden hour")
        style_preset: Preset de estilo ("luxury_real_estate", "twilight", "aerial", etc.)
    
    Returns:
        dict con "image_base64" y "mime_type", o "error"
    """
    import base64
    import requests
    
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("VERTEX_API_KEY")
    
    if not api_key:
        return {"error": "No hay GEMINI_API_KEY ni VERTEX_API_KEY configurada"}
    
    # Style presets para real estate de lujo
    STYLE_PRESETS = {
        "luxury_real_estate": "Maintain exact composition and architecture. Enhance with professional real estate photography lighting, warm golden hour tones, crystal clear sky, lush green vegetation, pristine pool water.",
        "twilight": "Transform to magical twilight/blue hour. Keep all architecture identical. Add warm interior lights glowing from windows, deep blue sky with subtle purple gradients, professional real estate twilight photography.",
        "golden_hour": "Enhance to perfect golden hour lighting. Maintain exact structure. Add warm sunlight casting long shadows, golden reflections on water/glass, magazine-quality real estate photography.",
        "aerial_luxury": "Maintain aerial perspective and layout. Enhance with crystal clear drone photography quality, vibrant jungle greens, turquoise water, luxury resort atmosphere.",
        "interior_luxury": "Keep exact room layout and furniture. Enhance with professional interior photography lighting, warm ambient glow, magazine-quality staging, luxury hospitality atmosphere.",
        "pool_paradise": "Maintain pool and architecture exactly. Add crystal clear turquoise water reflections, palm tree shadows, resort paradise atmosphere, professional architectural photography.",
        "jungle_luxury": "Keep all structures identical. Enhance jungle vegetation to lush tropical paradise, add morning mist, exotic bird of paradise atmosphere, National Geographic quality.",
        "minimalist_clean": "Maintain composition exactly. Clean up distractions, enhance with minimalist luxury aesthetic, soft diffused lighting, architectural digest quality.",
    }
    
    style_instructions = STYLE_PRESETS.get(style_preset, STYLE_PRESETS["luxury_real_estate"])
    
    # Prompt engineering para mantener fidelidad
    full_prompt = f"""CRITICAL: You are editing an existing real estate photograph. 

ABSOLUTE RULES:
- Keep the EXACT same buildings, architecture, pool shapes, and layout
- Do NOT change the position or structure of any element
- Do NOT add or remove buildings, furniture, or major elements
- Maintain the same camera angle and perspective
- Preserve the brand colors if visible

ENHANCEMENT INSTRUCTIONS:
{prompt}

STYLE GUIDE:
{style_instructions}

OUTPUT: Ultra high resolution, photorealistic, professional real estate photography quality."""

    print(f"🎨 Editando imagen con IA (Image-to-Image)...")
    print(f"📝 Style: {style_preset}")
    print(f"📝 Prompt: {prompt[:80]}...")
    
    # Detectar tipo de key para usar endpoint correcto
    is_vertex_key = api_key.startswith("AQ.")
    
    try:
        if is_vertex_key:
            url = f"https://aiplatform.googleapis.com/v1/publishers/google/models/nano-banana-pro-preview:generateContent?key={api_key}"
        else:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/nano-banana-pro-preview:generateContent?key={api_key}"
        
        # Payload con imagen de referencia + prompt
        payload = {
            "contents": [{
                "parts": [
                    {
                        "inlineData": {
                            "mimeType": "image/jpeg",
                            "data": image_base64
                        }
                    },
                    {
                        "text": full_prompt
                    }
                ]
            }],
            "generationConfig": {
                "responseModalities": ["IMAGE", "TEXT"]
            }
        }
        
        headers = {"Content-Type": "application/json"}
        
        response = requests.post(url, json=payload, headers=headers, timeout=240)
        
        if response.status_code == 200:
            data = response.json()
            if "candidates" in data and len(data["candidates"]) > 0:
                parts = data["candidates"][0].get("content", {}).get("parts", [])
                for part in parts:
                    if "inlineData" in part:
                        image_base64_result = part["inlineData"].get("data")
                        mime_type = part["inlineData"].get("mimeType", "image/png")
                        if image_base64_result:
                            print(f"✅ Imagen editada exitosamente")
                            return {
                                "image_base64": image_base64_result,
                                "mime_type": mime_type
                            }
            return {"error": "No se generó ninguna imagen editada"}
        else:
            error_msg = response.text[:500]
            print(f"❌ Error API: {response.status_code} - {error_msg}")
            return {"error": f"Error {response.status_code}: {error_msg}"}
            
    except Exception as e:
        print(f"❌ Error editando imagen: {e}")
        return {"error": str(e)}


# ═══════════════════════════════════════════════════════════════════
# BIBLIOTECA DE PROMPTS DE DISEÑO PROFESIONALES
# ═══════════════════════════════════════════════════════════════════

DESIGN_PROMPTS_LIBRARY = {
    "hero_shots": [
        {
            "name": "Golden Hour Paradise",
            "prompt": "Luxury beachfront villa at golden hour, infinity pool reflecting sunset, palm trees silhouettes, warm amber lighting, magazine cover quality",
            "tags": ["exterior", "pool", "sunset", "hero"]
        },
        {
            "name": "Twilight Elegance",
            "prompt": "Modern luxury residence at twilight, interior lights glowing warmly, deep blue sky, architectural photography, Dwell magazine style",
            "tags": ["exterior", "twilight", "architecture", "hero"]
        },
        {
            "name": "Aerial Jungle Estate",
            "prompt": "Aerial drone view of luxury development surrounded by lush Mayan jungle, turquoise cenote, winding paths, resort atmosphere",
            "tags": ["aerial", "jungle", "development", "hero"]
        },
        {
            "name": "Rooftop Infinity",
            "prompt": "Rooftop infinity pool overlooking Caribbean sea, sunset colors reflecting on water, lounge chairs, ultra-luxury resort vibe",
            "tags": ["rooftop", "pool", "ocean", "hero"]
        },
    ],
    "lifestyle": [
        {
            "name": "Couple Champagne Sunset",
            "prompt": "Elegant couple enjoying champagne on private terrace, golden hour sunset over ocean, luxury lifestyle, aspirational real estate photography",
            "tags": ["people", "lifestyle", "terrace", "sunset"]
        },
        {
            "name": "Family Pool Day",
            "prompt": "Happy family enjoying luxury pool, tropical paradise setting, palm trees, crystal clear water, vacation lifestyle photography",
            "tags": ["people", "family", "pool", "lifestyle"]
        },
        {
            "name": "Yoga Morning Zen",
            "prompt": "Woman doing yoga on private terrace at sunrise, jungle view, wellness retreat atmosphere, peaceful luxury living",
            "tags": ["wellness", "lifestyle", "morning", "terrace"]
        },
    ],
    "interiors": [
        {
            "name": "Living Room Luxury",
            "prompt": "Spacious luxury living room with floor-to-ceiling windows, jungle view, contemporary Mexican design, natural materials, Architectural Digest quality",
            "tags": ["interior", "living", "windows", "design"]
        },
        {
            "name": "Master Suite Paradise",
            "prompt": "Master bedroom with private terrace, ocean view, king bed with white linens, boutique hotel luxury, warm ambient lighting",
            "tags": ["interior", "bedroom", "ocean", "luxury"]
        },
        {
            "name": "Gourmet Kitchen",
            "prompt": "Modern gourmet kitchen with island, high-end appliances, natural stone counters, tropical breakfast setting, lifestyle photography",
            "tags": ["interior", "kitchen", "modern", "lifestyle"]
        },
    ],
    "amenities": [
        {
            "name": "Beach Club Sunset",
            "prompt": "Exclusive beach club at sunset, lounge beds on white sand, tiki torches, Caribbean sea, ultra-luxury resort atmosphere",
            "tags": ["amenity", "beach", "club", "sunset"]
        },
        {
            "name": "Spa Sanctuary",
            "prompt": "Luxury spa treatment room, jungle view, natural materials, candles, wellness retreat atmosphere, tranquil and serene",
            "tags": ["amenity", "spa", "wellness", "interior"]
        },
        {
            "name": "Fine Dining Terrace",
            "prompt": "Elegant outdoor restaurant terrace, ocean view, candlelit tables, gourmet cuisine presentation, five-star resort dining",
            "tags": ["amenity", "dining", "restaurant", "terrace"]
        },
    ],
    "riviera_maya": [
        {
            "name": "Tulum Ruins View",
            "prompt": "Luxury terrace with view of ancient Mayan ruins and Caribbean sea, cultural heritage meets modern luxury, Tulum atmosphere",
            "tags": ["tulum", "ruins", "cultural", "view"]
        },
        {
            "name": "Cenote Experience",
            "prompt": "Crystal clear cenote surrounded by jungle, sunlight rays through cave opening, mystical Yucatan atmosphere, natural wonder",
            "tags": ["cenote", "nature", "mystical", "yucatan"]
        },
        {
            "name": "Jungle Canopy",
            "prompt": "Luxury treehouse villa in jungle canopy, howler monkeys, exotic birds, eco-luxury architecture, sustainable design",
            "tags": ["jungle", "eco", "treehouse", "nature"]
        },
    ],
}

def get_design_prompts(category: str = None, tags: list = None) -> list:
    """
    Obtiene prompts de diseño filtrados por categoría o tags.
    
    Args:
        category: Categoría específica o None para todas
        tags: Lista de tags para filtrar
    
    Returns:
        Lista de prompts que coinciden
    """
    results = []
    
    categories = [category] if category else DESIGN_PROMPTS_LIBRARY.keys()
    
    for cat in categories:
        if cat in DESIGN_PROMPTS_LIBRARY:
            for prompt_item in DESIGN_PROMPTS_LIBRARY[cat]:
                if tags:
                    if any(tag in prompt_item["tags"] for tag in tags):
                        results.append({**prompt_item, "category": cat})
                else:
                    results.append({**prompt_item, "category": cat})
    
    return results


# ═══════════════════════════════════════════════════════════════════
# PROMPT ENGINEERING STUDIO - Extracción y Adaptación de Prompts
# ═══════════════════════════════════════════════════════════════════

def extract_prompt_from_image(image_base64: str) -> dict:
    """
    Analiza una imagen de referencia (Pinterest/diseño) y extrae el prompt
    que la generaría. Reverse engineering de prompts.
    
    Args:
        image_base64: Imagen de referencia en base64
    
    Returns:
        dict con prompt extraído, elementos, estilo, colores detectados
    """
    import requests
    
    api_key = os.environ.get("VERTEX_API_KEY") or os.environ.get("GEMINI_API_KEY")
    
    if not api_key:
        return {"error": "No hay API key configurada"}
    
    analysis_prompt = """Eres un experto en prompt engineering para generación de imágenes de IA.

Analiza esta imagen de diseño/publicidad y extrae EXACTAMENTE qué prompt la generaría.

Responde en JSON con esta estructura EXACTA:
{
    "extracted_prompt": "El prompt completo y detallado que generaría esta imagen",
    "style": "Estilo visual (ej: minimalist, luxury, editorial, dramatic)",
    "composition": "Descripción de la composición (ej: centered, rule of thirds, aerial)",
    "lighting": "Tipo de iluminación (ej: golden hour, studio, natural, moody)",
    "color_palette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
    "dominant_mood": "Atmósfera/mood (ej: aspirational, serene, energetic, exclusive)",
    "key_elements": ["elemento1", "elemento2", "elemento3"],
    "text_areas": "Zonas ideales para poner texto (ej: top, bottom, left margin)",
    "photography_style": "Estilo fotográfico (ej: architectural, lifestyle, product, aerial drone)",
    "target_audience": "Audiencia objetivo inferida (ej: luxury buyers, investors, families)"
}

Sé MUY específico y técnico. El prompt extraído debe poder recrear una imagen similar."""

    print(f"🔍 Extrayendo prompt de imagen de referencia...")
    
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        
        payload = {
            "contents": [{
                "parts": [
                    {
                        "inlineData": {
                            "mimeType": "image/jpeg",
                            "data": image_base64
                        }
                    },
                    {"text": analysis_prompt}
                ]
            }],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 2000
            }
        }
        
        response = requests.post(url, json=payload, timeout=60)
        
        if response.status_code == 200:
            data = response.json()
            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            
            # Limpiar y parsear JSON
            text = text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            
            try:
                result = json.loads(text.strip())
                print(f"✅ Prompt extraído exitosamente")
                return {"success": True, **result}
            except json.JSONDecodeError:
                return {"success": True, "extracted_prompt": text, "raw": True}
        else:
            return {"error": f"Error API: {response.status_code}"}
            
    except Exception as e:
        print(f"❌ Error extrayendo prompt: {e}")
        return {"error": str(e)}


def extract_colors_from_image(image_base64: str) -> dict:
    """
    Extrae la paleta de colores dominantes de una imagen.
    
    Args:
        image_base64: Imagen en base64
    
    Returns:
        dict con colores en hex y nombres descriptivos
    """
    import requests
    
    api_key = os.environ.get("VERTEX_API_KEY") or os.environ.get("GEMINI_API_KEY")
    
    if not api_key:
        return {"error": "No hay API key configurada"}
    
    color_prompt = """Analiza esta imagen y extrae su paleta de colores profesional.

Responde SOLO en JSON con esta estructura:
{
    "colors": [
        {"hex": "#XXXXXX", "name": "nombre descriptivo", "usage": "donde se usa en la imagen"},
        {"hex": "#XXXXXX", "name": "nombre", "usage": "uso"},
        {"hex": "#XXXXXX", "name": "nombre", "usage": "uso"},
        {"hex": "#XXXXXX", "name": "nombre", "usage": "uso"},
        {"hex": "#XXXXXX", "name": "nombre", "usage": "uso"}
    ],
    "palette_mood": "descripción del mood de la paleta (ej: warm luxury, cool minimal, tropical vibrant)",
    "suggested_text_color": "#XXXXXX",
    "suggested_accent_color": "#XXXXXX",
    "contrast_level": "alto/medio/bajo"
}

Extrae 5 colores principales. Incluye colores de fondo, acentos y detalles."""

    print(f"🎨 Extrayendo paleta de colores...")
    
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        
        payload = {
            "contents": [{
                "parts": [
                    {
                        "inlineData": {
                            "mimeType": "image/jpeg",
                            "data": image_base64
                        }
                    },
                    {"text": color_prompt}
                ]
            }],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 1000
            }
        }
        
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            
            print(f"🔍 Raw response: {text[:200]}...")  # Debug
            
            # Limpiar JSON - múltiples estrategias
            text = text.strip()
            
            # Estrategia 1: Buscar bloque ```json
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
            
            # Estrategia 2: Buscar directamente el objeto JSON con regex
            import re
            json_match = re.search(r'\{[\s\S]*"colors"[\s\S]*\}', text)
            if json_match:
                text = json_match.group(0)
            
            # Limpiar caracteres problemáticos
            text = text.strip()
            
            print(f"🧹 Cleaned JSON: {text[:150]}...")  # Debug
            
            try:
                result = json.loads(text)
                print(f"✅ Colores extraídos: {len(result.get('colors', []))} colores")
                return {"success": True, **result}
            except json.JSONDecodeError as je:
                print(f"❌ JSON parse error: {je}")
                print(f"❌ Failed text: {text}")
                
                # Fallback: extraer colores manualmente con regex
                hex_colors = re.findall(r'#[0-9A-Fa-f]{6}', text)
                if hex_colors:
                    fallback_colors = [{"hex": c, "name": f"Color {i+1}", "usage": "extraído"} for i, c in enumerate(hex_colors[:5])]
                    return {"success": True, "colors": fallback_colors, "palette_mood": "extracted"}
                
                return {"error": "Error parseando respuesta de colores"}
        else:
            return {"error": f"Error API: {response.status_code}"}
            
    except Exception as e:
        print(f"❌ Error extrayendo colores: {e}")
        return {"error": str(e)}


def adapt_prompt_to_project(
    base_prompt: str, 
    project_name: str = None,
    project_location: str = None,
    color_palette: list = None,
    style_overrides: dict = None
) -> dict:
    """
    Adapta un prompt base a un proyecto específico con sus colores y características.
    
    Args:
        base_prompt: Prompt original a adaptar
        project_name: Nombre del proyecto (ej: VELMARI, ALBA)
        project_location: Ubicación (ej: Tulum, Riviera Maya)
        color_palette: Lista de colores hex extraídos de la imagen de fondo
        style_overrides: Overrides de estilo específicos
    
    Returns:
        dict con prompt adaptado y variantes
    """
    import requests
    
    api_key = os.environ.get("VERTEX_API_KEY") or os.environ.get("GEMINI_API_KEY")
    
    if not api_key:
        return {"error": "No hay API key configurada"}
    
    # Obtener datos del proyecto si existe
    project_data = None
    if project_name:
        project_name_upper = project_name.upper()
        color_scheme = get_project_color_scheme(project_name_upper)
        if color_scheme:
            project_data = {
                "name": project_name_upper,
                "colors": color_scheme,
                "location": project_location or "Riviera Maya, México"
            }
    
    # Construir contexto de adaptación
    context_parts = []
    
    if project_data:
        context_parts.append(f"PROYECTO: {project_data['name']}")
        context_parts.append(f"UBICACIÓN: {project_data['location']}")
        context_parts.append(f"COLORES DE MARCA: {json.dumps(project_data['colors'])}")
    
    if color_palette:
        context_parts.append(f"PALETA DE IMAGEN DE FONDO: {', '.join(color_palette[:5])}")
    
    if style_overrides:
        context_parts.append(f"ESTILO ESPECÍFICO: {json.dumps(style_overrides)}")
    
    context = "\n".join(context_parts) if context_parts else "Sin contexto específico"
    
    adaptation_prompt = f"""Eres un experto en adaptación de prompts para publicidad de real estate de lujo.

PROMPT ORIGINAL:
{base_prompt}

CONTEXTO DE ADAPTACIÓN:
{context}

Tu tarea es adaptar el prompt original para que:
1. Mantenga la esencia y estructura visual del original
2. Incorpore los colores de la paleta proporcionada de forma natural
3. Se ajuste al proyecto y ubicación si se proporcionan
4. Optimice para fotografía de bienes raíces de ultra lujo

Responde en JSON:
{{
    "adapted_prompt": "El prompt adaptado completo",
    "color_integration": "Cómo se integraron los colores",
    "style_notes": "Notas sobre el estilo aplicado",
    "variants": [
        {{"name": "Golden Hour", "prompt": "variante con iluminación dorada"}},
        {{"name": "Twilight", "prompt": "variante al atardecer/anochecer"}},
        {{"name": "Aerial", "prompt": "variante vista aérea si aplica"}}
    ]
}}

El prompt adaptado debe ser específico, técnico y generar imágenes de calidad publicitaria."""

    print(f"🔄 Adaptando prompt para proyecto: {project_name or 'genérico'}...")
    
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        
        payload = {
            "contents": [{"parts": [{"text": adaptation_prompt}]}],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 2000
            }
        }
        
        response = requests.post(url, json=payload, timeout=45)
        
        if response.status_code == 200:
            data = response.json()
            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            
            # Limpiar JSON
            text = text.strip()
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
            
            try:
                result = json.loads(text.strip())
                print(f"✅ Prompt adaptado con {len(result.get('variants', []))} variantes")
                return {"success": True, **result}
            except json.JSONDecodeError:
                # Si no es JSON válido, devolver el texto como prompt
                return {"success": True, "adapted_prompt": text, "variants": []}
        else:
            return {"error": f"Error API: {response.status_code}"}
            
    except Exception as e:
        print(f"❌ Error adaptando prompt: {e}")
        return {"error": str(e)}


def create_ad_prompt_from_reference(
    reference_image_base64: str,
    background_image_base64: str = None,
    project_name: str = None,
    ad_type: str = "hero"
) -> dict:
    """
    Pipeline completo: Extrae prompt de referencia, analiza colores del fondo,
    y genera un prompt de publicidad adaptado.
    
    Args:
        reference_image_base64: Imagen de Pinterest/diseño de referencia
        background_image_base64: Imagen de fondo del proyecto (opcional)
        project_name: Nombre del proyecto
        ad_type: Tipo de anuncio (hero, social, story)
    
    Returns:
        dict con prompt final y todos los análisis intermedios
    """
    print(f"🚀 Iniciando pipeline de creación de prompt publicitario...")
    
    results = {
        "success": False,
        "extraction": None,
        "colors": None,
        "final_prompt": None,
        "variants": []
    }
    
    # Paso 1: Extraer prompt de la imagen de referencia
    print("📌 Paso 1: Extrayendo prompt de referencia...")
    extraction = extract_prompt_from_image(reference_image_base64)
    if "error" in extraction:
        return {"error": f"Error en extracción: {extraction['error']}"}
    results["extraction"] = extraction
    
    # Paso 2: Extraer colores del fondo (si se proporciona)
    color_palette = None
    if background_image_base64:
        print("📌 Paso 2: Extrayendo colores del fondo...")
        colors = extract_colors_from_image(background_image_base64)
        if "error" not in colors:
            results["colors"] = colors
            color_palette = [c["hex"] for c in colors.get("colors", [])]
    
    # Paso 3: Adaptar el prompt
    print("📌 Paso 3: Adaptando prompt al proyecto...")
    base_prompt = extraction.get("extracted_prompt", "")
    
    adaptation = adapt_prompt_to_project(
        base_prompt=base_prompt,
        project_name=project_name,
        color_palette=color_palette,
        style_overrides={
            "ad_type": ad_type,
            "lighting": extraction.get("lighting", "golden hour"),
            "composition": extraction.get("composition", "clean with text space")
        }
    )
    
    if "error" in adaptation:
        return {"error": f"Error en adaptación: {adaptation['error']}"}
    
    results["final_prompt"] = adaptation.get("adapted_prompt", base_prompt)
    results["variants"] = adaptation.get("variants", [])
    results["success"] = True
    
    print(f"✅ Pipeline completado exitosamente")
    return results


# ═══════════════════════════════════════════════════════════════════
# CHAT MULTIMODELO — Director de Marketing AI
# ═══════════════════════════════════════════════════════════════════

MARKETING_SYSTEM_PROMPT = """Eres el Director de Marketing AI de Brisa Maya Capital, una desarrolladora de real estate de ultra-lujo en la Riviera Maya, México.

Tu rol:
- Ayudar a crear y mejorar prompts para generación de imágenes
- Analizar imágenes de competencia o referencias
- Sugerir mejoras de copy y estrategia visual
- Adaptar contenido a diferentes plataformas (Instagram, Facebook, WhatsApp)
- Mantener la consistencia de marca (oro, elegancia, exclusividad)
- GENERAR CÓDIGO HTML/CSS COMPLETO para publicidad con texto sobre imágenes

Estilo de comunicación:
- Profesional pero accesible
- Creativo y orientado a resultados
- Conocimiento profundo del mercado inmobiliario de lujo
- Siempre en español

Cuando analices imágenes, proporciona:
1. Descripción detallada de la composición
2. Análisis de colores y paleta
3. Sugerencias de mejora
4. Prompt optimizado para recrear/mejorar

═══ GENERACIÓN DE PUBLICIDAD HTML/CSS ═══

Cuando el usuario pida "dame el HTML", "genera la publicidad", "código HTML/CSS", o suba una imagen pidiendo texto sobre ella, genera un documento HTML COMPLETO con:

ESTRUCTURA OBLIGATORIA:
```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>[NOMBRE PROYECTO] – Riviera Maya</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1080px; height: 1080px; overflow: hidden; background: #000; }
  .ad { position: relative; width: 1080px; height: 1080px; overflow: hidden; }
  
  /* BACKGROUND - Usuario reemplaza URL */
  .bg {
    position: absolute; inset: 0;
    background-image: url('REEMPLAZAR_CON_TU_IMAGEN.jpg');
    background-size: cover;
    background-position: center;
  }
  
  /* GRADIENTES CINEMATOGRÁFICOS */
  .overlay-top {
    position: absolute; top: 0; left: 0; right: 0;
    height: 300px;
    background: linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%);
  }
  .overlay-bottom {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 450px;
    background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
  }
  
  /* CONTENIDO */
  .content { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between; padding: 60px 72px; }
  
  /* TIPOGRAFÍA */
  .logo-name { font-family: 'Cormorant Garamond', serif; font-weight: 300; font-size: 28px; letter-spacing: 8px; color: #fff; text-transform: uppercase; }
  .logo-tagline { font-family: 'Montserrat', sans-serif; font-weight: 300; font-size: 11px; letter-spacing: 4px; color: rgba(255,255,255,0.7); text-transform: uppercase; }
  .badge { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.4); backdrop-filter: blur(8px); padding: 10px 22px; }
  .badge span { font-family: 'Montserrat', sans-serif; font-weight: 500; font-size: 11px; letter-spacing: 3px; color: #fff; text-transform: uppercase; }
  .eyebrow { font-family: 'Montserrat', sans-serif; font-weight: 400; font-size: 13px; letter-spacing: 5px; color: rgba(255,255,255,0.75); text-transform: uppercase; display: flex; align-items: center; gap: 14px; }
  .eyebrow::before { content: ''; width: 40px; height: 1px; background: rgba(255,255,255,0.6); }
  .headline { font-family: 'Cormorant Garamond', serif; font-weight: 300; font-size: 86px; line-height: 0.95; color: #fff; }
  .headline em { font-style: italic; color: #f0d9a8; }
  .subheadline { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 32px; color: rgba(255,255,255,0.85); }
  .price-value { font-family: 'Cormorant Garamond', serif; font-weight: 600; font-size: 52px; color: #fff; }
  .price-label { font-family: 'Montserrat', sans-serif; font-weight: 300; font-size: 10px; letter-spacing: 4px; color: rgba(255,255,255,0.6); text-transform: uppercase; }
  .feature { display: flex; align-items: center; gap: 10px; }
  .feature-dot { width: 5px; height: 5px; border-radius: 50%; background: #f0d9a8; }
  .feature span { font-family: 'Montserrat', sans-serif; font-weight: 300; font-size: 11.5px; letter-spacing: 2px; color: rgba(255,255,255,0.8); text-transform: uppercase; }
  .cta-btn { background: #fff; color: #1a1a1a; font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; padding: 16px 40px; border: none; }
</style>
</head>
<body>
<div class="ad">
  <div class="bg"></div>
  <div class="overlay-top"></div>
  <div class="overlay-bottom"></div>
  <div class="content">
    <!-- TOP -->
    <div class="top" style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div class="logo-area">
        <div class="logo-name">[PROYECTO]</div>
        <div class="logo-tagline">Riviera Maya · Luxury Living</div>
      </div>
      <div class="badge"><span>[BADGE]</span></div>
    </div>
    <!-- BOTTOM -->
    <div class="bottom">
      <div class="eyebrow">[EYEBROW]</div>
      <div class="headline">[HEADLINE CON <em>PALABRA DESTACADA</em>]</div>
      <div class="subheadline">[SUBHEADLINE]</div>
      <div style="width:60px;height:1px;background:rgba(255,255,255,0.5);margin:28px 0;"></div>
      <div class="price-row" style="display:flex;gap:40px;margin-bottom:32px;">
        <div><div class="price-label">Desde</div><div class="price-value">$X.X MDP</div></div>
      </div>
      <div class="features-row" style="display:flex;gap:36px;margin-bottom:32px;">
        <div class="feature"><div class="feature-dot"></div><span>[FEATURE 1]</span></div>
        <div class="feature"><div class="feature-dot"></div><span>[FEATURE 2]</span></div>
        <div class="feature"><div class="feature-dot"></div><span>[FEATURE 3]</span></div>
      </div>
      <div class="cta-btn">[CTA]</div>
    </div>
  </div>
</div>
</body>
</html>
```

PALETA ESTÁNDAR DE LUJO:
- Dorado accent: #f0d9a8
- Blanco principal: #ffffff
- Blanco cuerpo: rgba(255,255,255,0.8)
- Sombras overlay: rgba(0,0,0,0.6-0.75)

FORMATOS:
- Instagram Feed: 1080x1080
- Instagram Story/Reel: 1080x1920
- Facebook: 1200x628

Cuando generes HTML/CSS:
1. SIEMPRE incluye el código completo y funcional
2. Personaliza textos según lo que pida el usuario
3. Indica dónde reemplazar la imagen de fondo
4. El código debe ser copy-paste listo para usar

Proyectos activos: SOL KAÁ, VELMARI, MISTRAL, ALBA, CEIBA, LANDMARK, THE RESIDENCES"""


def detect_image_request(message: str) -> dict:
    """
    Detecta si el usuario quiere generar una imagen.
    Returns: {"should_generate": bool, "prompt": str}
    """
    message_lower = message.lower()
    
    # Patrones para detectar solicitudes de imagen
    image_triggers = [
        "genera una imagen",
        "generar una imagen",
        "genera imagen",
        "crea una imagen",
        "crear una imagen",
        "hazme una imagen",
        "haz una imagen",
        "dibuja",
        "dibújame",
        "quiero una imagen",
        "necesito una imagen",
        "podrías generar",
        "puedes generar",
        "generate an image",
        "create an image",
        "make an image",
    ]
    
    for trigger in image_triggers:
        if trigger in message_lower:
            # Extraer el prompt de la imagen
            # Remover el trigger y usar el resto como prompt
            prompt = message
            for t in image_triggers:
                prompt = prompt.lower().replace(t, "").strip()
            
            # Si el prompt está vacío, usar el mensaje completo
            if len(prompt) < 10:
                prompt = message
            
            return {"should_generate": True, "prompt": prompt}
    
    return {"should_generate": False, "prompt": ""}


def _strip_openrouter_prefix(model: str) -> str:
    """Quita el prefijo 'openrouter/' del id de modelo."""
    return model[len("openrouter/"):] if model.startswith("openrouter/") else model


def enrich_image_prompt_from_context(
    user_prompt: str,
    chat_history: list = None,
    enhance_style: str = "none",
    aspect_ratio: str = "1:1",
    model: str = "gemini-2.5-flash",
    api_endpoint: str = "auto",
) -> str:
    """
    Usa un LLM rápido (Gemini Flash) para enriquecer el brief de imagen
    con el contexto de la conversación, estilo similar a ChatGPT/Sora.
    """
    import requests

    if not user_prompt:
        return user_prompt

    # Construir contexto: últimos 6 mensajes
    history = chat_history or []
    recent = history[-6:]
    ctx_lines = []
    for h in recent:
        role = (h.get("role") or "user").upper()
        content = (h.get("content") or "").strip()
        if content:
            ctx_lines.append(f"[{role}]: {content[:600]}")
    context_block = "\n".join(ctx_lines) if ctx_lines else "(sin contexto previo)"

    style_hint = {
        "viral":       "viral redes sociales (cinematográfico, contraste alto, hook visual)",
        "crypto":      "cripto/IA/tech (cyberpunk, neón, dark mode, dramático)",
        "real_estate": "real estate de lujo Riviera Maya (golden hour, arquitectura, aspiracional)",
    }.get(enhance_style, "libre, según contexto")

    enrichment_prompt = f"""Eres un director de arte experto en prompts para modelos de imagen (Imagen 4 / Nano Banana / DALL-E).

Tu tarea: convertir un BRIEF CORTO del usuario en un PROMPT ENRIQUECIDO listo para generar imagen, usando el contexto de la conversación.

CONTEXTO DE LA CONVERSACIÓN (últimos mensajes):
{context_block}

BRIEF DEL USUARIO:
{user_prompt}

ESTILO DESEADO: {style_hint}
ASPECT RATIO: {aspect_ratio}

REGLAS:
1. Detecta el TEMA real (ej: traders humanos vs IA, bitcoin, lujo, etc.) y úsalo.
2. Añade composición, iluminación, paleta, ángulo de cámara, mood, estilo cinematográfico.
3. Si el usuario dice "sin texto", añade explícitamente "no text, no letters, no logos".
4. Mantén la intención original — NO cambies el sujeto.
5. Idioma: INGLÉS (los modelos de imagen rinden mejor en inglés).
6. Máx 120 palabras, una sola descripción densa, sin bullets ni explicaciones.

Devuelve SOLO el prompt enriquecido, nada más."""

    try:
        gemini_key = os.environ.get("GEMINI_API_KEY")
        vertex_key = os.environ.get("VERTEX_API_KEY")
        api_key = gemini_key or vertex_key
        if not api_key:
            return user_prompt

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {
            "contents": [{"role": "user", "parts": [{"text": enrichment_prompt}]}],
            "generationConfig": {
                "temperature": 0.8,
                "maxOutputTokens": 2048,
                # Gemini 2.5 Flash gasta tokens en "thinking" antes de responder.
                # Si no lo desactivamos, el output útil queda truncado a ~80 chars.
                "thinkingConfig": {"thinkingBudget": 0},
            },
        }
        r = requests.post(url, json=payload, timeout=45)
        if r.status_code != 200:
            print(f"⚠️ enrich falló {r.status_code}, uso prompt original")
            return user_prompt
        data = r.json()
        text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        text = (text or "").strip().strip('"').strip("`").strip()
        if len(text) < 20:
            return user_prompt
        print(f"🎨 Prompt enriquecido: {text[:120]}…")
        return text
    except Exception as e:
        print(f"⚠️ enrich error: {e}")
        return user_prompt


def chat_with_openrouter(
    message: str,
    model: str,
    history: list = None,
    image_base64: str = None,
    system_prompt: str = None,
) -> dict:
    """
    Chat con OpenRouter (OpenAI-compatible API).
    Soporta texto + visión + generación de imágenes (modelos compatibles).
    """
    import requests

    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        return {"error": "OPENROUTER_API_KEY no configurada", "success": False}

    real_model = _strip_openrouter_prefix(model)
    is_image_model = "image" in real_model.lower()

    print(f"💬 OpenRouter chat con {real_model}{' [IMAGE]' if is_image_model else ''}")

    # Construir mensajes en formato OpenAI
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})

    if history:
        for h in history:
            role = "user" if h.get("role") == "user" else "assistant"
            content_parts = []
            if h.get("image_base64"):
                mime = h.get("image_mime", "image/jpeg")
                content_parts.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:{mime};base64,{h['image_base64']}"}
                })
            if h.get("content"):
                content_parts.append({"type": "text", "text": h["content"]})
            if content_parts:
                # Si es solo texto, simplificar
                if len(content_parts) == 1 and content_parts[0]["type"] == "text":
                    messages.append({"role": role, "content": content_parts[0]["text"]})
                else:
                    messages.append({"role": role, "content": content_parts})

    # Mensaje actual
    current_content = []
    if image_base64:
        current_content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}
        })
    current_content.append({"type": "text", "text": message})
    if len(current_content) == 1:
        messages.append({"role": "user", "content": message})
    else:
        messages.append({"role": "user", "content": current_content})

    payload = {
        "model": real_model,
        "messages": messages,
    }
    # Para modelos con generación de imagen, pedimos modalidad imagen
    if is_image_model:
        payload["modalities"] = ["image", "text"]

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://marketing-engine.brisamayacapital.com",
        "X-Title": "Brisa Maya Marketing Engine",
    }

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=180,
        )
        if response.status_code != 200:
            print(f"❌ OpenRouter error {response.status_code}: {response.text[:300]}")
            return {"error": f"OpenRouter {response.status_code}: {response.text[:300]}", "success": False}

        data = response.json()
        msg = data.get("choices", [{}])[0].get("message", {})
        text = msg.get("content", "") or ""

        # Extraer imágenes si vienen
        images_b64 = []
        for img in (msg.get("images") or []):
            url = (img.get("image_url") or {}).get("url", "")
            if url.startswith("data:") and "base64," in url:
                images_b64.append(url.split("base64,", 1)[1])

        result = {
            "response": text,
            "model_used": real_model,
            "success": True,
        }
        if images_b64:
            result["images_base64"] = images_b64
        return result

    except Exception as e:
        print(f"❌ Error OpenRouter: {e}")
        return {"error": str(e), "success": False}


def generate_image_openrouter(prompt: str, model: str) -> dict:
    """
    Genera una imagen vía OpenRouter (modelos con capacidad image).
    """
    real_model = _strip_openrouter_prefix(model)
    result = chat_with_openrouter(
        message=prompt,
        model=f"openrouter/{real_model}",
        system_prompt=None,
    )
    if not result.get("success"):
        return {"error": result.get("error", "Unknown OpenRouter error")}

    images = result.get("images_base64") or []
    if not images:
        return {"error": "OpenRouter no devolvió imágenes para este modelo"}

    return {
        "image_base64": images[0],
        "mime_type": "image/png",
        "model_used": real_model,
        "api_used": "OpenRouter",
        "success": True,
    }


def chat_with_marketing_ai(
    message: str,
    model: str = "gemini-2.5-flash",
    history: list = None,
    image_base64: str = None,
    audio_base64: str = None,
    system_prompt: str = None,
    api_endpoint: str = "auto"
) -> dict:
    """
    Chat con el asistente AI usando el modelo seleccionado.
    
    Args:
        message: Mensaje del usuario
        model: Modelo a usar (gemini-2.5-flash, gemini-2.5-pro, etc.)
        history: Historial de conversación [{role, content}]
        image_base64: Imagen adjunta (opcional)
        audio_base64: Audio adjunto (opcional)
        system_prompt: System prompt custom (si es None usa MARKETING_SYSTEM_PROMPT)
        api_endpoint: 'auto', 'gemini', o 'vertex'
    
    Returns:
        dict con "response" (str), "model_used" (str), o "error" (str)
    """
    import requests

    # Routing a OpenRouter si el modelo lo indica
    if model.startswith("openrouter/") or api_endpoint == "openrouter":
        return chat_with_openrouter(
            message=message,
            model=model if model.startswith("openrouter/") else f"openrouter/{model}",
            history=history,
            image_base64=image_base64,
            system_prompt=system_prompt or MARKETING_SYSTEM_PROMPT,
        )

    gemini_key = os.environ.get("GEMINI_API_KEY")
    vertex_key = os.environ.get("VERTEX_API_KEY")
    
    if api_endpoint == "gemini":
        api_key = gemini_key
    elif api_endpoint == "vertex":
        api_key = vertex_key
    else:
        api_key = vertex_key or gemini_key
    
    if not api_key:
        return {"error": "No hay API key configurada"}
    
    print(f"💬 Chat con {model}...")
    
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        
        # Construir el contenido
        contents = []
        
        # Historial completo (no recortar) - dejamos que el modelo maneje su context window
        if history:
            for h in history:
                role = "user" if h.get("role") == "user" else "model"
                parts = []
                # Soportar imágenes en historial
                if h.get("image_base64"):
                    parts.append({
                        "inlineData": {
                            "mimeType": h.get("image_mime", "image/jpeg"),
                            "data": h["image_base64"]
                        }
                    })
                if h.get("content"):
                    parts.append({"text": h["content"]})
                if parts:
                    contents.append({"role": role, "parts": parts})
        
        # Construir el mensaje actual
        current_parts = []
        
        # Agregar imagen si existe
        if image_base64:
            current_parts.append({
                "inlineData": {
                    "mimeType": "image/jpeg",
                    "data": image_base64
                }
            })
        
        # Agregar audio si existe
        if audio_base64:
            current_parts.append({
                "inlineData": {
                    "mimeType": "audio/webm",
                    "data": audio_base64
                }
            })
        
        # Agregar el mensaje de texto
        current_parts.append({"text": message})
        
        contents.append({
            "role": "user",
            "parts": current_parts
        })
        
        payload = {
            "systemInstruction": {
                "parts": [{"text": system_prompt or MARKETING_SYSTEM_PROMPT}]
            },
            "contents": contents,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 8192
            }
        }
        
        response = requests.post(url, json=payload, timeout=120)
        
        if response.status_code == 200:
            data = response.json()
            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            
            if text:
                print(f"✅ Respuesta generada con {model}")
                return {
                    "response": text,
                    "model_used": model,
                    "success": True
                }
            return {"error": "Sin respuesta del modelo"}
        else:
            error_msg = response.text[:300]
            print(f"❌ Error API {model}: {response.status_code}")
            return {"error": f"Error {response.status_code}: {error_msg}"}
            
    except Exception as e:
        print(f"❌ Error en chat: {e}")
        return {"error": str(e)}


def chat_with_marketing_ai_stream(
    message: str,
    model: str = "gemini-2.5-flash",
    history: list = None,
    image_base64: str = None,
    audio_base64: str = None
):
    """
    Chat con streaming - genera respuesta token por token (generator).
    
    Yields:
        str: Cada fragmento de texto generado
    """
    import requests
    
    api_key = os.environ.get("VERTEX_API_KEY") or os.environ.get("GEMINI_API_KEY")
    
    if not api_key:
        yield "Error: No hay API key configurada"
        return
    
    print(f"💬 [STREAM] Chat con {model}...")
    
    try:
        # Usar endpoint de streaming
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse&key={api_key}"
        
        # Construir el contenido
        contents = []
        
        # Agregar historial si existe
        if history:
            for h in history[-20:]:
                role = "user" if h.get("role") == "user" else "model"
                contents.append({
                    "role": role,
                    "parts": [{"text": h.get("content", "")}]
                })
        
        # Construir el mensaje actual
        current_parts = []
        
        if image_base64:
            current_parts.append({
                "inlineData": {
                    "mimeType": "image/jpeg",
                    "data": image_base64
                }
            })
        
        if audio_base64:
            current_parts.append({
                "inlineData": {
                    "mimeType": "audio/webm",
                    "data": audio_base64
                }
            })
        
        current_parts.append({"text": message})
        
        contents.append({
            "role": "user",
            "parts": current_parts
        })
        
        payload = {
            "systemInstruction": {
                "parts": [{"text": MARKETING_SYSTEM_PROMPT}]
            },
            "contents": contents,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 8192
            }
        }
        
        # Hacer request con streaming
        response = requests.post(url, json=payload, stream=True, timeout=120)
        
        if response.status_code == 200:
            for line in response.iter_lines():
                if line:
                    line_str = line.decode('utf-8')
                    if line_str.startswith('data: '):
                        json_str = line_str[6:]  # Remover "data: "
                        try:
                            data = json.loads(json_str)
                            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                            if text:
                                yield text
                        except json.JSONDecodeError:
                            continue
            print(f"✅ [STREAM] Completado con {model}")
        else:
            yield f"Error {response.status_code}: {response.text[:200]}"
            
    except Exception as e:
        print(f"❌ Error en streaming: {e}")
        yield f"Error: {str(e)}"


def get_available_models() -> dict:
    """
    Retorna la lista de modelos disponibles para chat e imágenes.
    """
    return {
        "chat_models": CHAT_MODELS,
        "image_models": IMAGE_MODELS
    }


def generate_html_ad(
    image_base64: str,
    eyebrow: str = "",
    headline: str = "",
    subheadline: str = "",
    pills: list = None,
    price_label: str = "",
    price_value: str = "",
    cta_text: str = "",
    project_name: str = "",
    aspect_ratio: str = "1:1",
    style_notes: str = ""
) -> dict:
    """
    Genera código HTML/CSS para un anuncio publicitario basado en una imagen de fondo.
    Analiza la imagen para extraer colores y genera un diseño coherente.
    
    Args:
        image_base64: Imagen de fondo en base64
        eyebrow: Texto pequeño superior (ej: "Cancún · Zona Sur")
        headline: Título principal
        subheadline: Subtítulo opcional
        pills: Lista de textos para badges/pills (ej: ["0% Enganche", "Entrega Inmediata"])
        price_label: Etiqueta del precio (ej: "Departamentos desde")
        price_value: Valor del precio (ej: "$1,870,000 MXN")
        cta_text: Texto del botón CTA
        project_name: Nombre del proyecto
        aspect_ratio: Formato ("1:1", "9:16", "16:9")
        style_notes: Notas adicionales de estilo
    
    Returns:
        dict con HTML generado y colores extraídos
    """
    import requests
    
    api_key = os.environ.get("VERTEX_API_KEY") or os.environ.get("GEMINI_API_KEY")
    
    if not api_key:
        return {"error": "No hay API key configurada"}
    
    # Dimensiones según aspect ratio
    dimensions = {
        "1:1": {"width": 1080, "height": 1080},
        "9:16": {"width": 1080, "height": 1920},
        "16:9": {"width": 1920, "height": 1080},
        "4:3": {"width": 1440, "height": 1080}
    }
    dims = dimensions.get(aspect_ratio, dimensions["1:1"])
    
    # Preparar pills como JSON
    pills_json = json.dumps(pills or [])
    
    # Prompt para Gemini
    html_prompt = f"""Eres un diseñador web de publicidad inmobiliaria de ultra-lujo. Analiza esta imagen para EXTRAER SU PALETA DE COLORES y genera código HTML/CSS para un anuncio publicitario.

⚠️ MUY IMPORTANTE: La imagen es SOLO para analizar colores. El HTML NO debe tener imagen de fondo. El fondo debe ser un DEGRADADO OSCURO sólido.

ANALIZA LA IMAGEN:
1. Extrae los 5 colores dominantes
2. Identifica un color de acento vibrante (para CTA, highlights)
3. Determina colores para texto que combinen

DATOS DEL ANUNCIO:
- Proyecto: {project_name or "Desarrollo Inmobiliario"}
- Eyebrow (arriba del headline): {eyebrow}
- Headline principal: {headline}
- Subheadline: {subheadline}
- Pills/Badges: {pills_json}
- Etiqueta precio: {price_label}
- Precio: {price_value}
- Botón CTA: {cta_text}
- Notas de estilo: {style_notes}

FORMATO: {dims["width"]}x{dims["height"]}px (aspect ratio {aspect_ratio})

GENERA UN HTML COMPLETO:

1. FONDO (MUY IMPORTANTE):
   - SIN IMAGEN DE FONDO
   - Usar DEGRADADO OSCURO: negro (#0a0a0a) hacia gris muy oscuro (#1a1a1a)
   - Puede agregar un sutil resplandor radial del color de acento (muy sutil, opacidad baja)
   - El fondo debe verse elegante y moderno, no plano

2. ESTRUCTURA:
   - DOCTYPE html con charset UTF-8
   - Google Fonts: Cormorant Garamond + DM Sans
   - Body con dimensiones exactas: {dims["width"]}x{dims["height"]}px

3. COLORES:
   - Derivar color de acento de la imagen analizada (para CTA, palabras destacadas, glows)
   - Texto principal en BLANCO
   - Eyebrow en color dorado/acento
   - Usar variables CSS: --accent-color, --text-primary, etc.

4. TIPOGRAFÍA PREMIUM:
   - Eyebrow: DM Sans, uppercase, letter-spacing 3-4px, color acento
   - Headline: Cormorant Garamond, peso 300, tamaño grande (60-80px)
   - Usa <em> o <span class="accent"> para palabras en color de acento/italic
   - Pills con borde sutil y backdrop-filter blur

5. LAYOUT:
   - Flexbox centrado
   - Contenido en la mitad inferior
   - Pills en fila horizontal con separador (✦ o similar)
   - CTA como botón ancho con color de acento y glow sutil

6. EFECTOS:
   - Sombras de texto sutiles para legibilidad
   - Glow sutil en el botón CTA
   - No overstyling, mantener elegancia minimalista

RESPONDE SOLO CON UN BLOQUE JSON:
{{
    "html": "<!DOCTYPE html>... (código HTML completo SIN imagen de fondo)",
    "colors_extracted": {{
        "dominant": "#hexcolor",
        "secondary": "#hexcolor", 
        "accent": "#hexcolor",
        "text_primary": "#ffffff",
        "text_secondary": "#hexcolor"
    }},
    "mood": "descripción del mood detectado"
}}"""

    print(f"🎨 Generando HTML Ad Builder para {aspect_ratio}...")
    
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key={api_key}"
        
        payload = {
            "contents": [{
                "parts": [
                    {
                        "inlineData": {
                            "mimeType": "image/jpeg",
                            "data": image_base64
                        }
                    },
                    {"text": html_prompt}
                ]
            }],
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 16000
            }
        }
        
        response = requests.post(url, json=payload, timeout=120)
        
        if response.status_code == 200:
            data = response.json()
            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            
            # Limpiar y parsear JSON
            text = text.strip()
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
            
            try:
                result = json.loads(text.strip())
                print(f"✅ HTML generado exitosamente")
                return {"success": True, **result}
            except json.JSONDecodeError as e:
                # Si falla el JSON, intentar extraer solo el HTML
                if "<!DOCTYPE" in text or "<html" in text:
                    html_start = text.find("<!DOCTYPE") if "<!DOCTYPE" in text else text.find("<html")
                    html_end = text.rfind("</html>") + 7
                    html_code = text[html_start:html_end]
                    return {
                        "success": True,
                        "html": html_code,
                        "colors_extracted": {},
                        "mood": "extracted from raw",
                        "parse_warning": str(e)
                    }
                return {"error": f"Error parseando JSON: {e}", "raw_response": text[:500]}
        else:
            return {"error": f"Error API: {response.status_code}", "details": response.text[:300]}
            
    except Exception as e:
        print(f"❌ Error generando HTML: {e}")
        return {"error": str(e)}


# Exportar funciones necesarias
__all__ = [
    'chat_with_marketing_ai',
    'chat_with_marketing_ai_stream',
    'detect_image_request',
    'get_available_models',
    'generate_ai_image',
    'generate_html_ad',
    'CHAT_MODELS',
    'IMAGE_MODELS',
    'MARKETING_SYSTEM_PROMPT'
]
