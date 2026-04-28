# 🧭 CONTEXT.md — Marketing Engine (Brisa Maya Capital)

> Documento de contexto técnico para acelerar futuras conversaciones con Copilot / IA.
> Resume **qué es**, **cómo está construido**, **dónde vive cada cosa** y **cómo se corre / despliega**.

---

## 1. Visión general

**Marketing Engine** es una webapp interna de Brisa Maya Capital para producir material publicitario de bienes raíces de lujo (Riviera Maya / Cancún) usando IA generativa.

Funciones principales:
- Generar imágenes con IA (Imagen 4, Nano Banana).
- Editar imágenes con IA (instrucciones en lenguaje natural).
- Renderizar anuncios 8K con overlays de texto/branding (Pillow).
- Generar **copy publicitario** y **posts sociales** en varios tonos.
- **Design Copilot**: chat con Claude/Gemini que genera y edita HTML/CSS de anuncios.
- **AI Chat**: chat estilo ChatGPT con generación de imágenes inline + storyboard.
- **🎬 Storyboard automático Guion → Imágenes en cadena**: divide guion narrado en N escenas, genera Visual Bible coherente y produce N imágenes cinematográficas consistentes con costo USD/MXN.
- Biblioteca de prompts + extracción de prompts/colores desde imágenes.
- Auth con Google + persistencia en Firestore (proyectos, conversaciones, diseños).

Estado: **Funcional en local** y **desplegado en producción**.

---

## 2. URLs

| Entorno | Frontend | Backend |
|---|---|---|
| Local | http://localhost:5173 | http://localhost:8000 |
| Producción | https://marketing-engine-web.web.app | https://marketing-engine-api-740794505815.us-central1.run.app |

---

## 3. Stack

### Backend (`backend/`)
- **Python 3.12+**, FastAPI, Uvicorn.
- **Pillow** para composición de anuncios 8K.
- **google-genai** (Gemini, Imagen 4, Nano Banana).
- **anthropic** (Claude Sonnet/Opus para Design Copilot).
- Empaquetado en **Dockerfile** → Google **Cloud Run** (`us-central1`).
- Carga manual de `.env` al inicio de [main.py](backend/main.py#L9-L16).

### Frontend (`frontend/`)
- **React 19** + **Vite 7** (JS, no TS).
- **Firebase 12**: Auth (Google) + Firestore + Storage.
- Sin librería de UI: CSS propio (`App.css`, `index.css`).
- Hosting: **Firebase Hosting** (config en [firebase.json](firebase.json)).

### Servicios externos
- Google AI (Gemini 2.5/3/3.1, Imagen 4 ultra/standard/fast, Nano Banana).
- Anthropic Claude Sonnet 4 / Opus 4.x.
- Firebase (`marketing-engine-web`).

---

## 4. Estructura de carpetas

```
Marketing_Engine/
├── firebase.json                  # Config Firebase Hosting (sirve frontend/dist)
├── INICIAR_APP.bat                # Atajo Windows: levanta backend + frontend
├── README.md                      # Doc original (descripción + endpoints)
├── SESION_NUEVA_README.md         # Doc para retomar sesiones (incluye URLs prod, deploy)
├── context.md                     # ESTE archivo
│
├── backend/
│   ├── main.py                    # Endpoints FastAPI (~512 líneas)
│   ├── ai_copywriter.py           # Lógica IA: copy, chat, imágenes (~2580 líneas)
│   ├── image_processor.py         # Render 8K con Pillow (~596 líneas)
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env                       # API keys (NO se sube)
│   ├── assets/
│   │   └── Database_Proyectos_BMC.json  # Proyectos BMC + paletas
│   ├── list_models.py             # Util: listar modelos disponibles
│   └── test_*.py                  # Scripts manuales de pruebas
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                # Engine clásico: render anuncio 8K (~1175 líneas)
        ├── firebase.js            # Init Firebase (lee VITE_FIREBASE_*)
        ├── App.css / index.css
        ├── config/
        │   └── api.js             # API_BASE_URL = VITE_API_URL || localhost:8000
        ├── data/
        │   └── initialProjects.js # Seed inicial de proyectos
        ├── pages/
        │   ├── ImageStudio.jsx    # UI principal: 4 tabs + Design Copilot (~4641 líneas)
        │   └── AIChat.jsx         # Chat estilo ChatGPT + Storyboard 🎬 (~1700 líneas)
        ├── services/
        │   ├── authService.js     # signInWithGoogle, logOut, onAuthChange
        │   ├── firestoreService.js# Proyectos CRUD
        │   ├── designsService.js  # Diseños guardados + compresión imagen + AI learning
        │   └── conversationsService.js # Conversaciones del chat
        └── scripts/
            └── syncMacondoToFirestore.js
```

---

## 5. Backend — Endpoints

Todos en [backend/main.py](backend/main.py). CORS abierto (`allow_origins=["*"]`).

| Método | Endpoint | Descripción |
|---|---|---|
| GET  | `/`                              | Health check |
| POST | `/api/render-ad`                 | Renderiza anuncio 8K (Pillow) sobre imagen subida |
| POST | `/api/enhance-image`             | Mejora imagen |
| POST | `/api/generate-copy`             | Copy publicitario (super_headline / main_headline / body) |
| POST | `/api/color-scheme`              | Paleta por proyecto |
| POST | `/api/social-copy`               | Posts sociales |
| POST | `/api/generate-ai-image`         | Versión legacy de generación |
| POST | `/api/studio/generate-image-v2`  | **Generación principal** (Imagen 4 / Nano Banana) |
| POST | `/api/studio/edit-image`         | Edición con IA |
| GET  | `/api/studio/prompts`            | Biblioteca de prompts |
| GET  | `/api/studio/style-presets`      | Style presets |
| POST | `/api/studio/extract-prompt`     | Extrae prompt desde imagen |
| POST | `/api/studio/extract-colors`     | Extrae colores desde imagen |
| POST | `/api/studio/adapt-prompt`       | Adapta prompt a un proyecto |
| POST | `/api/studio/create-ad-prompt`   | Crea prompt de anuncio desde referencia |
| POST | `/api/studio/generate-html-ad`   | Genera HTML/CSS del anuncio |
| POST | `/api/studio/visual-bible`       | **🎬 Genera Visual Bible** (paleta, cámara, mood) desde guion |
| POST | `/api/studio/plan-script`        | **🎬 Storyboard**: guion → N escenas con prompts cinematográficos + tabla de costos USD/MXN |
| GET  | `/api/studio/pricing`            | Tabla de precios por modelo de imagen |
| GET  | `/api/models`                    | Lista de modelos disponibles |
| POST | `/api/chat`                      | Chat con Gemini |
| POST | `/api/chat-claude`               | Chat con Claude (Design Copilot) |

### Modelos (en [ai_copywriter.py](backend/ai_copywriter.py#L21-L40))
- **Chat**: `gemini-2.5-flash` (default), `gemini-2.5-pro`, `gemini-2.5-flash-lite`, `gemini-3-flash-preview`, `gemini-3-pro-preview`, `gemini-3.1-flash-lite-preview`, `gemini-3.1-pro-preview`.
- **Imagen** (con texto): `imagen-4.0-ultra-generate-001`, `imagen-4.0-generate-001`, `imagen-4.0-fast-generate-001`.
- **Imagen** (sin texto): `nano-banana-pro-preview`, `gemini-3.1-flash-image-preview`, `gemini-2.5-flash-image`.
- **Design Copilot (Claude)**: Sonnet 4 / Opus 4.5–4.6 (vía Anthropic SDK).

### Diferencia clave
- **Imagen 4** usa endpoint `:predict` → soporta texto en imagen.
- **Nano Banana** usa `:generateContent` → NO renderiza texto fiable.

---

## 6. Frontend — Páginas y estado

### `App.jsx` (engine de render clásico)
- Sube imagen → la envía a `/api/render-ad` con todos los parámetros (headlines, fuentes, colores granulares: `accent`, `project`, `text`, `body`, `logo`, `line`).
- Compresión local de imagen antes de subir (`compressImageForUpload`, max 25MB / 4000px) para evitar 413.
- Carga proyectos desde Firestore + permite agregar.
- Selector de tono de copy: `investment`, `lifestyle`, `urgency`, `luxury`, `balanced`.

### `pages/ImageStudio.jsx` (UI principal)
4 tabs:
1. **✨ Generar** — Imagen 4 / Nano Banana, presets, aspect ratios.
2. **🖼️ Editar** — edición con IA sobre referencia.
3. **🔧 Prompt Lab** — extrae/adapta prompts.
4. **💬 Marketing AI** — chat con Gemini + Design Copilot (Claude) para HTML/CSS.

Maneja: auth, conversaciones, galería de diseños guardados, AI learning context (historial → prompt enrichment).

### `pages/AIChat.jsx` (chat estilo ChatGPT + Storyboard)
- Chat tipo ChatGPT con persistencia en Firestore (vía `conversationsService`).
- Generación de imágenes inline con enriquecimiento automático del prompt usando contexto de la conversación.
- Soporta: Gemini (chat), Imagen 4 / Nano Banana / OpenRouter (imagen).
- Configurable: aspect ratio, estilo (viral / crypto / real_estate / none), modelo, endpoint.
- Botón **🎬 Storyboard** en topbar abre modal `StoryboardPanel`:
  - Pega guion → infiere `n_scenes = ceil(words/2.5/seconds_per_image)` (español ≈ 2.5 palabras/seg).
  - Pipeline 2 etapas en backend:
    1. **`build_visual_bible(script, style_hint)`** → infiere tema, universo, mood, paleta hex (3 colores), cámara/lente, grano, dirección de arte, kit simbólico.
    2. **`split_script_into_scenes(..., bible)`** → genera N prompts cinematográficos en inglés siguiendo estructura jerárquica fija + bible idéntica para garantizar consistencia.
  - UI muestra **Visual Bible Card** (paleta como chips, cámara, mood, símbolos) con botón **🔄 Regenerar dirección visual** (re-planifica sin gastar imágenes).
  - Tabla de costos USD/MXN por modelo (`IMAGE_MODEL_PRICING` en `main.py`, USD→MXN = 17.5).
  - Generación en cadena (serial) con barra de progreso, estados por tarjeta (pending/loading/done/error), descarga individual de cada escena.
  - Cada escena devuelve: `narration`, `duration`, `shot_type`, `emotion`, `visual_hook`, `prompt`.

### Servicios Firestore
- `firestoreService.js`: colección `projects`.
- `designsService.js`: colección `designs` + `project_research`. Comprime imágenes (≤500KB / 600px) antes de guardar.
- `conversationsService.js`: historial de chats.
- `authService.js`: Google Sign-In.

---

## 7. Variables de entorno

### Backend (`backend/.env`, **no commit**)
```env
GEMINI_API_KEY=AIza...
VERTEX_API_KEY=AQ.Ab8RN6...
ANTHROPIC_API_KEY=sk-ant-...
```
En producción se setean en Cloud Run con `gcloud run services update --set-env-vars`.

### Frontend
- `frontend/.env` (dev) y `frontend/.env.production`:
  ```env
  VITE_API_URL=...                    # default: http://localhost:8000
  VITE_FIREBASE_API_KEY=...
  VITE_FIREBASE_AUTH_DOMAIN=...
  VITE_FIREBASE_PROJECT_ID=...
  VITE_FIREBASE_STORAGE_BUCKET=...
  VITE_FIREBASE_MESSAGING_SENDER_ID=...
  VITE_FIREBASE_APP_ID=...
  VITE_FIREBASE_MEASUREMENT_ID=...
  ```

---

## 8. Cómo correr en local

### Opción rápida (Windows)
Doble click en [INICIAR_APP.bat](INICIAR_APP.bat) — levanta backend y frontend en ventanas separadas y abre el navegador.

### Manual
**Backend** (Git Bash):
```bash
cd backend
source .venv/Scripts/activate
pip install -r requirements.txt   # solo primera vez
uvicorn main:app --reload --port 8000
```
**Frontend**:
```bash
cd frontend
npm install   # solo primera vez
npm run dev
```

---

## 9. Deploy a producción

**Frontend** → Firebase Hosting:
```bash
cd frontend && npm run build && cd ..
firebase deploy --only hosting
```

**Backend** → Cloud Run (PowerShell):
```powershell
cd "D:\Brisa Maya Capital\Marketing_Engine\backend"
gcloud run deploy marketing-engine-api --source . --region us-central1 --allow-unauthenticated
```

---

## 10. Base de datos de proyectos

Archivo seed: [backend/assets/Database_Proyectos_BMC.json](backend/assets/Database_Proyectos_BMC.json).
Proyectos: VELMARI, ALBA, MISTRAL, CANDELA, COSTA RESIDENCES, ROSEWOOD, AMARES, MELIORA, KULKANA, MACONDO_PLAYACAR, etc.
Cada uno trae paleta (Heritage Navy, Obsidian Luxe, Earth Echo, Coastal Ivory, Modern Slate…) y acento (Gold/Platinum/Emerald).

---

## 11. Convenciones / cosas que recordar

- `.env` y `.venv/` **siempre** en `.gitignore`. Nunca commitear API keys.
- En Windows usar **Git Bash** para activar venv (`source .venv/Scripts/activate`).
- Imágenes que se suben al backend → **comprimirlas en cliente** antes (ya hecho en `App.jsx` y `designsService.js`).
- Para que **Imagen 4 escriba texto** en la imagen, el prompt debe incluir una sección explícita `TEXT POSITIONING:` con cada elemento y su zona (ver ejemplos en [SESION_NUEVA_README.md](SESION_NUEVA_README.md)).
- En desarrollo el frontend cae a `localhost:8000` automáticamente vía [config/api.js](frontend/src/config/api.js).
- `ImageStudio.jsx` es muy grande (~4600 líneas): al editar, buscar por sección con grep antes de leer todo.

---

## 12. 🎬 Sistema Storyboard (guion → imágenes en cadena)

Implementado en `backend/ai_copywriter.py` + `backend/main.py` + `frontend/src/pages/AIChat.jsx` (componente `StoryboardPanel`).

### Pipeline 2 etapas

**Etapa 1 — `build_visual_bible(script, style_hint, aspect_ratio, model)`**
1 llamada a Gemini Flash (con `thinkingBudget=0`, `responseMimeType=application/json`, `temperature=0.7`).
Devuelve un JSON "biblia visual" deducido del guion:
```json
{
  "theme": "...",
  "visual_universe": "...",
  "mood": "...",
  "palette": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "description": "..." },
  "lighting": "...",
  "camera": "...",
  "film_grain": "...",
  "art_direction": "...",
  "symbolic_kit": ["...", "...", "..."],
  "quality_tags": "...",
  "negative_prompt": "..."
}
```
Costo: ~$0.0005 USD por bible. Tiempo: ~2-4s.

**Etapa 2 — `split_script_into_scenes(script, seconds_per_image, ..., bible=None)`**
Si no recibe `bible`, la genera internamente. Llamada Gemini Flash (`temperature=0.9`, `maxOutputTokens=16384`) que construye N prompts cinematográficos siguiendo estructura jerárquica fija:
```
[SHOT TYPE] of [HERO performing ACTION] in [LOCATION], [secondary], [bg], [particles], [LIGHTING from bible], [PALETTE from bible], [CAMERA from bible], [GRAIN from bible], [ART DIRECTION], [QUALITY TAGS], vertical {ar} aspect ratio.
```
Cada escena: `index, narration, duration, shot_type, emotion, visual_hook, prompt`.

### Endpoints

- `POST /api/studio/visual-bible` → solo bible (rápido, barato)
- `POST /api/studio/plan-script` → bible + escenas + tabla de costos por modelo

### Tabla de precios (`IMAGE_MODEL_PRICING` en `main.py`)

| Modelo | USD/img |
|---|---|
| `imagen-4.0-ultra-generate-001` | $0.060 |
| `imagen-4.0-generate-001` | $0.040 |
| `imagen-4.0-fast-generate-001` | $0.020 |
| `nano-banana-pro-preview` | $0.039 |
| `gemini-3.1-flash-image-preview` | $0.039 |
| `gemini-2.5-flash-image` | $0.030 |
| `openrouter/google/gemini-2.5-flash-image-preview:free` | $0.000 |

USD→MXN = 17.5 (`USD_TO_MXN` en `main.py`).

### Frontend UX

- Topbar 🎬 abre modal `StoryboardPanel`.
- Tarjeta **Visual Bible** muestra paleta como chips de color, cámara, mood, símbolos.
- Botón **🔄 Regenerar dirección visual** → re-planifica sin gastar imágenes ($0.001 vs $0.35 de las imágenes).
- Tarjetas de escena con: chip 🎥 shot_type, chip 💥 emotion, hook 🪝, prompt completo desplegable, descarga individual.
- Generación en serie con barra de progreso `done/total`, estados pending/loading/done/error.

### Lógica de partición

```python
word_count = len(re.findall(r"\b\w+\b", script))
total_seconds = word_count / 2.5      # español ≈ 2.5 palabras/seg
n_scenes = ceil(total_seconds / seconds_per_image)
```

### Aprendizajes clave

- Gemini 2.5+ requiere `"thinkingConfig":{"thinkingBudget":0}` para no truncar outputs (sin esto, los prompts enriquecidos salían a 87 chars).
- Nano Banana requiere `generationConfig.imageConfig.aspectRatio` (no acepta el campo en la raíz).
- `responseMimeType="application/json"` evita los markdown fences ` ```json `, pero se mantiene un strip defensivo por si acaso.
- Estructura jerárquica fija en el prompt produce imágenes consistentes; estructura libre produce caos visual entre escenas.
- Pasar la bible idéntica a cada prompt resuelve el problema #1 de los storyboards IA: la inconsistencia visual entre escenas.

---

## 13. Pendientes conocidos (del README)

- Pulir UI/UX (responsive, animaciones, dark/light, galería).
- Consistencia preview ↔ render final.
- Optimizar carga de imágenes grandes.
- Mejor manejo de errores de API.
- Templates predefinidos, historial de versiones, exportar a PNG/PDF, dashboard analytics.
- **Storyboard**: regenerar escena individual sin tocar las demás · editar prompt manual antes de generar · exportar Bible como JSON · exportar storyboard como ZIP de PNGs · medir y mostrar tiempo real de generación por escena.

---

_Última actualización del contexto: 27 abril 2026 — agregado sistema Storyboard 🎬 (guion → Visual Bible → N imágenes en cadena con costo USD/MXN)._
