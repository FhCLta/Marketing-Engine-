# 🏝️ BRISA MAYA CAPITAL — Marketing Engine

## Documentación para Continuar Desarrollo

---

## 🌐 URLS DE PRODUCCIÓN (LIVE)

| Componente | URL |
|------------|-----|
| **Frontend** | https://marketing-engine-web.web.app |
| **Backend API** | https://marketing-engine-api-740794505815.us-central1.run.app |

---

## 📍 RESUMEN DE LA APLICACIÓN

**Marketing Engine** es una aplicación web para generar material publicitario de bienes raíces de lujo en Riviera Maya. Combina:

- **Generación de imágenes con IA** (Imagen 4, Nano Banana)
- **Edición de imágenes con IA**
- **Chat con IA de marketing** (Gemini + Claude)
- **Generación de copy publicitario**
- **Design Copilot** (Claude Sonnet 4)

---

## 🗂️ ESTRUCTURA DEL PROYECTO

```
Marketing_Engine/
├── backend/                    # FastAPI Python → Cloud Run
│   ├── .venv/                  # Entorno virtual (local)
│   ├── .env                    # API keys (NO se sube a git)
│   ├── main.py                 # Endpoints FastAPI
│   ├── ai_copywriter.py        # Lógica de IA
│   ├── image_processor.py      # Procesamiento de imágenes
│   ├── requirements.txt        # Dependencias Python
│   ├── Dockerfile              # Para Cloud Run
│   └── assets/
│       └── Database_Proyectos_BMC.json
│
├── frontend/                   # React + Vite → Firebase Hosting
│   ├── src/
│   │   ├── App.jsx
│   │   ├── config/api.js       # URL del backend (env variable)
│   │   ├── pages/ImageStudio.jsx
│   │   └── services/
│   ├── .env.production         # VITE_API_URL para producción
│   ├── package.json
│   └── vite.config.js
│
├── firebase.json               # Config Firebase Hosting
├── .firebaserc                 # Proyecto: marketing-engine-web
└── .gitignore                  # Protege .env y API keys
```

---

## 🔑 API KEYS (Seguridad)

Las API keys están en **dos lugares**:

### 1. Local (`backend/.env`) — Para desarrollo
```env
GEMINI_API_KEY=AIzaSy...
VERTEX_API_KEY=AQ.Ab8RN6...
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### 2. Cloud Run — Para producción
Las keys están configuradas como variables de entorno en Cloud Run.
Para actualizarlas:
```powershell
gcloud run services update marketing-engine-api --region us-central1 --set-env-vars="GEMINI_API_KEY=xxx,VERTEX_API_KEY=xxx,ANTHROPIC_API_KEY=xxx"
```

> ⚠️ El archivo `.env` está en `.gitignore` — NUNCA se sube a GitHub.

---

## 🚀 DESARROLLO LOCAL

### 1. Backend (Puerto 8000)
```bash
cd "D:\Brisa Maya Capital\Marketing_Engine\backend"
source .venv/Scripts/activate
uvicorn main:app --reload --port 8000
```

### 2. Frontend (Puerto 5173)
```bash
cd "D:\Brisa Maya Capital\Marketing_Engine\frontend"
npm run dev
```

**URLs locales:**
- Backend: http://localhost:8000
- Frontend: http://localhost:5173

El frontend en desarrollo usa `localhost:8000` automáticamente (fallback en `config/api.js`).

---

## ☁️ DEPLOY A PRODUCCIÓN

### Deploy Frontend (Firebase Hosting)
```bash
cd "D:\Brisa Maya Capital\Marketing_Engine\frontend"
npm run build
cd ..
firebase deploy --only hosting
```

### Deploy Backend (Cloud Run)
```powershell
# En PowerShell
cd "D:\Brisa Maya Capital\Marketing_Engine\backend"
gcloud run deploy marketing-engine-api --source . --region us-central1 --allow-unauthenticated
```

### Deploy Completo (ambos)
```bash
# Frontend
cd frontend && npm run build && cd ..
firebase deploy --only hosting

# Backend (PowerShell)
powershell -Command "cd 'D:\Brisa Maya Capital\Marketing_Engine\backend'; gcloud run deploy marketing-engine-api --source . --region us-central1 --allow-unauthenticated"
```

---

## 🤖 MODELOS DE IA DISPONIBLES

### Chat
| ID | Descripción |
|----|-------------|
| `gemini-2.5-flash` | Rápido (default) |
| `gemini-2.5-pro` | Más preciso |
| `claude-sonnet-4-20250514` | Design Copilot |

### Imágenes
| ID | Texto en imagen |
|----|-----------------|
| `imagen-4.0-ultra-generate-001` | ✅ SÍ (mejor) |
| `imagen-4.0-generate-001` | ✅ SÍ |
| `nano-banana-pro-preview` | ❌ NO |

---

## 📡 ENDPOINTS PRINCIPALES

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/studio/generate-image-v2` | Genera imagen |
| POST | `/api/studio/edit-image` | Edita imagen |
| POST | `/api/chat` | Chat Gemini |
| POST | `/api/chat-claude` | Chat Claude (Design Copilot) |
| POST | `/api/generate-copy` | Genera copy |
| POST | `/api/social-copy` | Posts para redes sociales |
| POST | `/api/render-ad` | Renderiza anuncio con overlay |
| GET | `/api/models` | Lista modelos |
| GET | `/api/studio/prompts` | Biblioteca de prompts |
| GET | `/api/studio/style-presets` | Presets de estilo |
| POST | `/api/studio/extract-prompt` | Extrae prompt de imagen |
| POST | `/api/studio/extract-colors` | Extrae colores de imagen |

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
- **Design Copilot** (Claude) para diseño avanzado

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

## 📝 TONOS DE COPY DISPONIBLES

| Tono | Enfoque | Palabras clave |
|------|---------|----------------|
| **investment** | ROI, plusvalía, patrimonio | plusvalía, activo, rendimiento |
| **lifestyle** | Experiencia, bienestar, legado | refugio, santuario, vida plena |
| **urgency** | Escasez, FOMO, oportunidad | últimas, ahora, no espere |
| **luxury** | Exclusividad, privacidad, estatus | exclusivo, élite, incomparable |
| **balanced** | Mix equilibrado | refugio, plusvalía, diseño |

---

## ⚙️ CONFIGURACIÓN TÉCNICA — Imagen 4 vs Nano Banana

```python
# En ai_copywriter.py - generate_ai_image()

# Imagen 4 usa endpoint PREDICT (soporta texto en imagen)
if model.startswith("imagen-4"):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:predict?key={api_key}"
    payload = {
        "instances": [{"prompt": prompt}],
        "parameters": {"sampleCount": 1, "aspectRatio": "1:1"}
    }

# Nano Banana usa endpoint GENERATECONTENT (NO soporta texto)
else:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]}
    }
```

> **IMPORTANTE:** Solo Imagen 4 puede escribir texto directamente en las imágenes.

---

## 🏢 PROYECTOS EN BASE DE DATOS

Los proyectos tienen paletas de color y configuración de marca:

| Proyecto | Paleta | Acento |
|----------|--------|--------|
| VELMARI | Heritage Navy | Gold |
| ALBA | Heritage Navy | Gold |
| MISTRAL | Obsidian Luxe | Platinum |
| CANDELA | Obsidian Luxe | Platinum |
| COSTA RESIDENCES | Earth Echo | Gold |
| ROSEWOOD | Coastal Ivory | Gold |
| AMARES | Modern Slate | Emerald |
| MELIORA | Obsidian Luxe | Platinum |
| KULKANA | Cancún Zona Sur | - |

### MACONDO_PLAYACAR (Información Completa)
- **Ubicación:** Playacar, Playa del Carmen
- **Marcas aliadas:** Porcelanosa, SMEG, Eurovent
- **Tipos de unidad:** 1BR (77.89m²) hasta PH_3BR (293.25m²)
- **Precios:** $7.1M - $15.7M MXN
- **Tagline:** "The heartbeat of luxury"

---

## 🛠️ DEPENDENCIAS

### Backend (Python)
```
fastapi
uvicorn
Pillow
google-genai
anthropic
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

## 🐛 TROUBLESHOOTING

### "Imagen 4 no escribe texto"
**Causa:** El prompt no incluye instrucciones explícitas de texto.
**Solución:** Agregar sección `TEXT POSITIONING:` con cada texto y su ubicación exacta.

### "CORS error"
- **Local:** Verificar backend corriendo en puerto 8000
- **Producción:** El backend en Cloud Run ya tiene CORS habilitado

### "Error de API key"
- **Local:** Verificar `backend/.env`
- **Cloud Run:** `gcloud run services describe marketing-engine-api --region us-central1`

### "Frontend no conecta al backend"
- Verificar `frontend/src/config/api.js`
- En producción usa `VITE_API_URL` de `.env.production`

### "Error activando venv en Windows"
**Causa:** PowerShell vs Git Bash.
**Solución:** Usar `source .venv/Scripts/activate` en Git Bash.

### "Modelo no encontrado"
**Causa:** API key no tiene acceso a ese modelo.
**Solución:** Usar modelos verificados (Imagen 4 Ultra confirmado funcional).

---

## 📋 WORKFLOW DE DESARROLLO

1. **Hacer cambios** en local
2. **Probar** en http://localhost:5173
3. **Commit** a GitHub (seguro, .env ignorado)
4. **Deploy** según lo que cambió:
   - Solo frontend: `firebase deploy --only hosting`
   - Solo backend: `gcloud run deploy...`
   - Ambos: los dos comandos

---

## 🔧 ARCHIVOS CLAVE

| Archivo | Propósito |
|---------|-----------|
| `backend/main.py` | Endpoints FastAPI |
| `backend/ai_copywriter.py` | Lógica de IA |
| `frontend/src/pages/ImageStudio.jsx` | UI principal |
| `frontend/src/config/api.js` | URL del backend |
| `backend/.env` | API keys (local) |

---

## 📅 Última actualización: 24 Marzo 2026

**Estado:** ✅ Desplegado en producción
- Frontend: Firebase Hosting
- Backend: Google Cloud Run
- APIs: Gemini, Imagen 4, Claude integrados
