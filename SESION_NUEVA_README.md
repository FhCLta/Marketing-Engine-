# 🏝️ BRISA MAYA CAPITAL — Marketing Engine

## Documentación Completa para Nueva Sesión de Chat

---

## 📍 RESUMEN DE LA APLICACIÓN

**Marketing Engine** es una aplicación web para generar material publicitario de bienes raíces de lujo en Riviera Maya. Combina:

- **Generación de imágenes con IA** (Imagen 4, Nano Banana)
- **Edición de imágenes con IA**
- **Chat con IA de marketing** (Gemini)
- **Generación de copy publicitario**
- **Renderizado de anuncios con overlays de texto**

---

## 🗂️ ESTRUCTURA DEL PROYECTO

```
Marketing_Engine/
├── backend/                    # FastAPI Python
│   ├── .venv/                  # Entorno virtual Python
│   ├── .env                    # Variables de entorno (API keys)
│   ├── main.py                 # Endpoints FastAPI
│   ├── ai_copywriter.py        # Lógica de IA (chat, imágenes, copy)
│   ├── image_processor.py      # Procesamiento de imágenes
│   ├── requirements.txt        # Dependencias Python
│   └── assets/
│       └── Database_Proyectos_BMC.json  # Base de datos de proyectos
│
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── App.jsx            # Componente principal
│   │   ├── pages/
│   │   │   └── ImageStudio.jsx  # Página principal del studio
│   │   ├── services/
│   │   │   └── firestoreService.js
│   │   └── data/
│   │       └── initialProjects.js
│   ├── package.json
│   └── vite.config.js
│
├── temp_drive/                 # Archivos temporales
└── SESION_NUEVA_README.md      # Este archivo
```

---

## 🔑 CONFIGURACIÓN — API KEY

El proyecto usa la **Google AI API** con una sola API key para todo:

### Archivo: `backend/.env`
```env
VERTEX_API_KEY=tu_api_key_aqui
```

> ⚠️ **NUNCA subas tu API key a GitHub.** Genera tu key en [Google Cloud Console](https://console.cloud.google.com/) → API & Services → Credentials

---

## 🚀 CÓMO INICIAR LA APLICACIÓN

### 1. Backend (FastAPI - Puerto 8000)

```bash
# Navegar al backend
cd "D:\Brisa Maya Capital\Marketing_Engine\backend"

# Activar entorno virtual (Git Bash en Windows)
source .venv/Scripts/activate

# Iniciar servidor con auto-reload
uvicorn main:app --reload --port 8000
```

**Verificar:** http://localhost:8000 → `{"message": "Brisa Maya Marketing Engine Backend is Running."}`

### 2. Frontend (React/Vite - Puerto 5173)

```bash
# En otra terminal, navegar al frontend
cd "D:\Brisa Maya Capital\Marketing_Engine\frontend"

# Instalar dependencias (solo primera vez)
npm install

# Iniciar servidor de desarrollo
npm run dev
```

**Abrir:** http://localhost:5173

---

## 🤖 MODELOS DE IA DISPONIBLES

### Modelos de Chat (Gemini)
| ID | Nombre | Descripción |
|----|--------|-------------|
| `gemini-2.5-flash` | Gemini 2.5 Flash | Rápido y eficiente |
| `gemini-2.5-pro` | Gemini 2.5 Pro | Más preciso y detallado |
| `gemini-3-flash-preview` | Gemini 3 Flash | Nueva generación |
| `gemini-3-pro-preview` | Gemini 3 Pro | Máxima calidad |

### Modelos de Imagen
| ID | Nombre | Texto en imagen | Endpoint |
|----|--------|-----------------|----------|
| `imagen-4.0-ultra-generate-001` | **Imagen 4 Ultra** | ✅ SÍ (mejor) | `predict` |
| `imagen-4.0-generate-001` | Imagen 4 | ✅ SÍ | `predict` |
| `imagen-4.0-fast-generate-001` | Imagen 4 Fast | ✅ SÍ (rápido) | `predict` |
| `nano-banana-pro-preview` | Nano Banana Pro | ❌ NO | `generateContent` |
| `gemini-3.1-flash-image-preview` | Nano Banana 2 | ❌ NO | `generateContent` |
| `gemini-2.5-flash-image` | Nano Banana | ❌ NO | `generateContent` |

> **IMPORTANTE:** Solo Imagen 4 puede escribir texto directamente en las imágenes.

---

## 📡 ENDPOINTS DEL BACKEND

### Generación de Imágenes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/studio/generate-image-v2` | Genera imagen con IA (soporta Imagen 4) |
| POST | `/api/studio/edit-image` | Edita imagen existente con IA |
| POST | `/api/generate-ai-image` | Genera imagen (legacy) |

### Chat y Copy
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/chat` | Chat con Marketing AI |
| POST | `/api/generate-copy` | Genera copy publicitario |
| POST | `/api/social-copy` | Genera posts para redes sociales |

### Utilidades
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/models` | Lista modelos disponibles |
| GET | `/api/studio/prompts` | Biblioteca de prompts de diseño |
| GET | `/api/studio/style-presets` | Presets de estilo |
| POST | `/api/studio/extract-prompt` | Extrae prompt de imagen |
| POST | `/api/studio/extract-colors` | Extrae colores de imagen |
| POST | `/api/render-ad` | Renderiza anuncio con texto overlay |

---

## 🖼️ FUNCIONALIDADES DEL IMAGE STUDIO

El frontend tiene **4 tabs principales**:

### 1. ✨ Generar
- Genera imágenes desde cero o edita existentes
- Selector de modelo (Imagen 4 recomendado para texto)
- Estilos predefinidos: Luxury Real Estate, Twilight, Golden Hour, etc.
- Aspect ratios: 1:1, 16:9, 9:16, 4:3

### 2. 🖼️ Editar
- Sube imagen de referencia
- Aplica instrucciones de edición con IA

### 3. 🔧 Prompt Lab
- Biblioteca de prompts profesionales
- Extracción de prompts desde imágenes
- Adaptación de prompts a proyectos específicos

### 4. 💬 Marketing AI
- Chat conversacional con IA especializada en marketing inmobiliario
- Puede adjuntar imágenes al chat
- Genera código HTML/CSS para publicidad
- Botones de acción: "Generar Imagen", "Usar Prompt", "Copiar"

---

## 🎯 PROMPTS PARA IMAGEN 4 CON TEXTO

### Prompt de Ejemplo (Kulkana)
```
Luxury real estate advertisement with professional centered layout.

TEXT POSITIONING:
- Top center: "KULKANA" logo in elegant white serif, horizontally centered
- Top right corner only: small badge "50% ESCRITURACIÓN"
- Bottom section (lower 30% of image) with centered text stack:
  - "CANCÚN ZONA SUR" small text, centered
  - "Entrega Inmediata" large headline, centered, "Inmediata" in gold italic
  - "Vive o invierte a minutos del aeropuerto" centered below
  - "DESDE $1.87 MDP" price, centered
  - "AGENDA TU VISITA" white button, centered at bottom

All bottom text vertically stacked and horizontally centered.
Dark gradient overlay on bottom 35% for text readability.

Scene: Modern beige architecture, turquoise pool, palm trees, blue sky.
Professional advertising composition, 8K, clean typography.
```

### Técnicas de Posicionamiento de Texto
```
# Por zonas
"Text at top center"
"Text in bottom right quadrant"

# Por tercios
"Upper third: logo"
"Lower third: all pricing info"

# Por porcentajes
"bottom 25% of image"
"10% from edge"

# Alineación
"horizontally centered"
"vertically stacked"
"aligned to right side"
```

### Para Imagen Brillante (sin oscurecer)
```
TEXT STYLING: All text has subtle drop shadow for readability instead of dark background.
Keep image bright and vibrant, minimal darkening, gradient opacity only 15-20%.
```

---

## 🏢 PROYECTOS DE BRISA MAYA CAPITAL

La base de datos incluye estos proyectos con sus paletas de color:

- **VELMARI** - Heritage Navy + Gold
- **ALBA** - Heritage Navy + Gold
- **MISTRAL** - Obsidian Luxe + Platinum
- **CANDELA** - Obsidian Luxe + Platinum
- **COSTA RESIDENCES** - Earth Echo + Gold
- **ROSEWOOD** - Coastal Ivory + Gold
- **AMARES** - Modern Slate + Emerald
- **MACONDO** - Heritage Navy + Gold
- **MELIORA** - Obsidian Luxe + Platinum
- **KULKANA** - (Cancún Zona Sur)
- Y más...

---

## 🛠️ DEPENDENCIAS

### Backend (Python)
```
fastapi
uvicorn
Pillow
google-genai
python-multipart
pydantic
python-dotenv
```

### Frontend (Node.js)
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "firebase": "^12.10.0",
  "vite": "^7.3.1"
}
```

---

## 📝 TONOS DE COPY DISPONIBLES

| Tono | Enfoque | Palabras clave |
|------|---------|----------------|
| **investment** | ROI, plusvalía, patrimonio | plusvalía, activo, rendimiento |
| **lifestyle** | Experiencia, bienestar, legado | refugio, santuario, vida plena |
| **urgency** | Escasez, FOMO, oportunidad | últimas, ahora, no espere |
| **luxury** | Exclusividad, privacidad, estatus | exclusivo, élite, incomparable |
| **balanced** | Mix equilibrado | refugio, plusvalía, diseño |

---

## ⚙️ CONFIGURACIÓN TÉCNICA IMPORTANTE

### Imagen 4 vs Nano Banana

```python
# En ai_copywriter.py - generate_ai_image()

# Imagen 4 usa endpoint PREDICT
if model.startswith("imagen-4"):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:predict?key={api_key}"
    payload = {
        "instances": [{"prompt": prompt}],
        "parameters": {"sampleCount": 1, "aspectRatio": "1:1"}
    }

# Nano Banana usa endpoint GENERATECONTENT
else:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]}
    }
```

---

## 🐛 PROBLEMAS COMUNES Y SOLUCIONES

### "Imagen 4 no escribe texto"
**Causa:** El prompt no incluye instrucciones explícitas de texto.
**Solución:** Agregar sección `TEXT POSITIONING:` con cada texto y su ubicación.

### "Error activando venv en Windows"
**Causa:** PowerShell vs Git Bash.
**Solución:** Usar `source .venv/Scripts/activate` en Git Bash.

### "CORS error en frontend"
**Causa:** Backend no corriendo.
**Solución:** Verificar que uvicorn esté activo en puerto 8000.

### "Modelo no encontrado"
**Causa:** API key no tiene acceso a ese modelo.
**Solución:** Usar modelos verificados (Imagen 4 Ultra confirmado funcional).

---

## 📋 CHECKLIST PARA NUEVA SESIÓN

- [ ] Activar venv: `source backend/.venv/Scripts/activate`
- [ ] Iniciar backend: `uvicorn main:app --reload --port 8000`
- [ ] Iniciar frontend: `cd frontend && npm run dev`
- [ ] Verificar http://localhost:8000
- [ ] Abrir http://localhost:5173
- [ ] API key en `.env` configurada

---

## 🔗 ARCHIVOS CLAVE PARA EDITAR

| Archivo | Propósito |
|---------|-----------|
| `backend/ai_copywriter.py` | Lógica de IA, modelos, prompts |
| `backend/main.py` | Endpoints FastAPI |
| `frontend/src/pages/ImageStudio.jsx` | UI principal del studio |
| `backend/.env` | API key |

---

## 📅 Última actualización: Marzo 2026

**Estado:** ✅ Funcional con Imagen 4 Ultra para generación de publicidad con texto.
