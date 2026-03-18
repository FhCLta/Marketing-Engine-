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
