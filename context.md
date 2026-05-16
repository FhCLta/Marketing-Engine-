# ðŸ§­ CONTEXT.md â€” Marketing Engine (Brisa Maya Capital)

> Documento de contexto tÃ©cnico para acelerar futuras conversaciones con Copilot / IA.
> Resume **quÃ© es**, **cÃ³mo estÃ¡ construido**, **dÃ³nde vive cada cosa** y **cÃ³mo se corre / despliega**.

---

## 1. VisiÃ³n general

**Marketing Engine** es una webapp interna de Brisa Maya Capital para producir material publicitario de bienes raÃ­ces de lujo (Riviera Maya / CancÃºn) usando IA generativa.

Funciones principales:
- Generar imÃ¡genes con IA (OpenAI GPT Image 2/1.5/1, Imagen 4, Nano Banana).
- Editar imÃ¡genes con IA (instrucciones en lenguaje natural).
- Renderizar anuncios 8K con overlays de texto/branding (Pillow).
- Generar **copy publicitario** y **posts sociales** en varios tonos.
- **Design Copilot**: chat con Claude/Gemini que genera y edita HTML/CSS de anuncios.
- **AI Chat**: chat estilo ChatGPT con generaciÃ³n de imÃ¡genes inline + storyboard.
- **OpenAI integrado**: chat con GPT-5/GPT-4.1 y generaciÃ³n de imÃ¡genes con GPT Image 2 / GPT Image 1.5 / GPT Image 1.
- **ðŸŽ¬ Storyboard automÃ¡tico Guion â†’ ImÃ¡genes en cadena**: divide guion narrado en N escenas, genera Visual Bible coherente y produce N imÃ¡genes cinematogrÃ¡ficas consistentes con costo USD/MXN.
- **Storyboard V2**: permite generar escenas una por una, regenerar una escena, escoger modelo/API por escena, usar plantilla Reel editable o solo dividir guion sin generar imÃ¡genes.
- Biblioteca de prompts + extracciÃ³n de prompts/colores desde imÃ¡genes.
- Auth con Google + persistencia en Firestore (proyectos, conversaciones, diseÃ±os).

Estado: **Funcional en local** y **desplegado en producciÃ³n**.

---

## 2. URLs

| Entorno | Frontend | Backend |
|---|---|---|
| Local | http://localhost:5173 | http://localhost:8000 |
| ProducciÃ³n | https://marketing-engine-web.web.app | https://marketing-engine-api-740794505815.us-central1.run.app |

---

## 3. Stack

### Backend (`backend/`)
- **Python 3.12+**, FastAPI, Uvicorn.
- **Pillow** para composiciÃ³n de anuncios 8K.
- **google-genai** (Gemini, Imagen 4, Nano Banana).
- **OpenAI API** (GPT-5 para texto/chat y GPT Image 2/1.5/1 para imÃ¡genes).
- **anthropic** (Claude Sonnet/Opus para Design Copilot).
- Empaquetado en **Dockerfile** â†’ Google **Cloud Run** (`us-central1`).
- Carga manual de `.env` al inicio de [main.py](backend/main.py#L9-L16).

### Frontend (`frontend/`)
- **React 19** + **Vite 7** (JS, no TS).
- **Firebase 12**: Auth (Google) + Firestore + Storage.
- Sin librerÃ­a de UI: CSS propio (`App.css`, `index.css`).
- Hosting: **Firebase Hosting** (config en [firebase.json](firebase.json)).

### Servicios externos
- Google AI (Gemini 2.5/3/3.1, Imagen 4 ultra/standard/fast, Nano Banana).
- OpenAI (GPT-5, GPT-4.1, GPT Image 2, GPT Image 1.5, GPT Image 1).
- Anthropic Claude Sonnet 4 / Opus 4.x.
- Firebase (`marketing-engine-web`).

---

## 4. Estructura de carpetas

```
Marketing_Engine/
â”œâ”€â”€ firebase.json                  # Config Firebase Hosting (sirve frontend/dist)
â”œâ”€â”€ INICIAR_APP.bat                # Atajo Windows: levanta backend + frontend
â”œâ”€â”€ README.md                      # Doc original (descripciÃ³n + endpoints)
â”œâ”€â”€ SESION_NUEVA_README.md         # Doc para retomar sesiones (incluye URLs prod, deploy)
â”œâ”€â”€ context.md                     # ESTE archivo
â”‚
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ main.py                    # Endpoints FastAPI (~512 lÃ­neas)
â”‚   â”œâ”€â”€ ai_copywriter.py           # LÃ³gica IA: copy, chat, imÃ¡genes (~2580 lÃ­neas)
â”‚   â”œâ”€â”€ image_processor.py         # Render 8K con Pillow (~596 lÃ­neas)
â”‚   â”œâ”€â”€ requirements.txt
â”‚   â”œâ”€â”€ Dockerfile
â”‚   â”œâ”€â”€ .env                       # API keys (NO se sube)
â”‚   â”œâ”€â”€ assets/
â”‚   â”‚   â””â”€â”€ Database_Proyectos_BMC.json  # Proyectos BMC + paletas
â”‚   â”œâ”€â”€ list_models.py             # Util: listar modelos disponibles
â”‚   â””â”€â”€ test_*.py                  # Scripts manuales de pruebas
â”‚
â””â”€â”€ frontend/
    â”œâ”€â”€ package.json
    â”œâ”€â”€ vite.config.js
    â”œâ”€â”€ index.html
    â””â”€â”€ src/
        â”œâ”€â”€ main.jsx
        â”œâ”€â”€ App.jsx                # Engine clÃ¡sico: render anuncio 8K (~1175 lÃ­neas)
        â”œâ”€â”€ firebase.js            # Init Firebase (lee VITE_FIREBASE_*)
        â”œâ”€â”€ App.css / index.css
        â”œâ”€â”€ config/
        â”‚   â””â”€â”€ api.js             # API_BASE_URL = VITE_API_URL || localhost:8000
        â”œâ”€â”€ data/
        â”‚   â””â”€â”€ initialProjects.js # Seed inicial de proyectos
        â”œâ”€â”€ pages/
        â”‚   â”œâ”€â”€ ImageStudio.jsx    # UI principal: 4 tabs + Design Copilot (~4641 lÃ­neas)
        â”‚   â””â”€â”€ AIChat.jsx         # Chat estilo ChatGPT + Storyboard ðŸŽ¬ (~1700 lÃ­neas)
        â”œâ”€â”€ services/
        â”‚   â”œâ”€â”€ authService.js     # signInWithGoogle, logOut, onAuthChange
        â”‚   â”œâ”€â”€ firestoreService.js# Proyectos CRUD
        â”‚   â”œâ”€â”€ designsService.js  # DiseÃ±os guardados + compresiÃ³n imagen + AI learning
        â”‚   â””â”€â”€ conversationsService.js # Conversaciones del chat
        â””â”€â”€ scripts/
            â””â”€â”€ syncMacondoToFirestore.js
```

---

## 5. Backend â€” Endpoints

Todos en [backend/main.py](backend/main.py). CORS abierto (`allow_origins=["*"]`).

| MÃ©todo | Endpoint | DescripciÃ³n |
|---|---|---|
| GET  | `/`                              | Health check |
| POST | `/api/render-ad`                 | Renderiza anuncio 8K (Pillow) sobre imagen subida |
| POST | `/api/enhance-image`             | Mejora imagen |
| POST | `/api/generate-copy`             | Copy publicitario (super_headline / main_headline / body) |
| POST | `/api/color-scheme`              | Paleta por proyecto |
| POST | `/api/social-copy`               | Posts sociales |
| POST | `/api/generate-ai-image`         | VersiÃ³n legacy de generaciÃ³n |
| POST | `/api/studio/generate-image-v2`  | **GeneraciÃ³n principal** (Imagen 4 / Nano Banana) |
| POST | `/api/studio/edit-image`         | EdiciÃ³n con IA |
| GET  | `/api/studio/prompts`            | Biblioteca de prompts |
| GET  | `/api/studio/style-presets`      | Style presets |
| POST | `/api/studio/extract-prompt`     | Extrae prompt desde imagen |
| POST | `/api/studio/extract-colors`     | Extrae colores desde imagen |
| POST | `/api/studio/adapt-prompt`       | Adapta prompt a un proyecto |
| POST | `/api/studio/create-ad-prompt`   | Crea prompt de anuncio desde referencia |
| POST | `/api/studio/generate-html-ad`   | Genera HTML/CSS del anuncio |
| POST | `/api/studio/visual-bible`       | **ðŸŽ¬ Genera Visual Bible** (paleta, cÃ¡mara, mood) desde guion |
| POST | `/api/studio/plan-script`        | **ðŸŽ¬ Storyboard**: guion â†’ N escenas con prompts cinematogrÃ¡ficos + tabla de costos USD/MXN |
| GET  | `/api/studio/pricing`            | Tabla de precios por modelo de imagen |
| GET  | `/api/models`                    | Lista de modelos disponibles |
| POST | `/api/chat`                      | Chat con Gemini |
| POST | `/api/chat-claude`               | Chat con Claude (Design Copilot) |

### Modelos (en [ai_copywriter.py](backend/ai_copywriter.py#L21-L40))
- **Chat**: `gemini-2.5-flash` (default), `gemini-2.5-pro`, `gemini-2.5-flash-lite`, `gemini-3-flash-preview`, `gemini-3-pro-preview`, `gemini-3.1-flash-lite-preview`, `gemini-3.1-pro-preview`.
- **Chat OpenAI**: `openai/gpt-5-mini`, `openai/gpt-5`, `openai/gpt-4.1-mini`.
- **Imagen OpenAI**: `openai/gpt-image-2` (actual/recomendado, requiere organizaciÃ³n verificada), `openai/gpt-image-1.5`, `openai/gpt-image-1`, `openai/gpt-image-1-mini`.
- **Imagen** (con texto): `imagen-4.0-ultra-generate-001`, `imagen-4.0-generate-001`, `imagen-4.0-fast-generate-001`.
- **Imagen** (sin texto): `nano-banana-pro-preview`, `gemini-3.1-flash-image-preview`, `gemini-2.5-flash-image`.
- **Design Copilot (Claude)**: Sonnet 4 / Opus 4.5â€“4.6 (vÃ­a Anthropic SDK).

### Diferencia clave
- **Imagen 4** usa endpoint `:predict` â†’ soporta texto en imagen.
- **Nano Banana** usa `:generateContent` â†’ NO renderiza texto fiable.
- **OpenAI** usa `/v1/responses` para chat y `/v1/images/generations` para imÃ¡genes. Si `gpt-image-2` devuelve 403, verificar la organizaciÃ³n en OpenAI Platform; `gpt-image-1.5` suele funcionar como fallback.

---

## 6. Frontend â€” PÃ¡ginas y estado

### `App.jsx` (engine de render clÃ¡sico)
- Sube imagen â†’ la envÃ­a a `/api/render-ad` con todos los parÃ¡metros (headlines, fuentes, colores granulares: `accent`, `project`, `text`, `body`, `logo`, `line`).
- CompresiÃ³n local de imagen antes de subir (`compressImageForUpload`, max 25MB / 4000px) para evitar 413.
- Carga proyectos desde Firestore + permite agregar.
- Selector de tono de copy: `investment`, `lifestyle`, `urgency`, `luxury`, `balanced`.

### `pages/ImageStudio.jsx` (UI principal)
4 tabs:
1. **âœ¨ Generar** â€” Imagen 4 / Nano Banana, presets, aspect ratios.
2. **ðŸ–¼ï¸ Editar** â€” ediciÃ³n con IA sobre referencia.
3. **ðŸ”§ Prompt Lab** â€” extrae/adapta prompts.
4. **ðŸ’¬ Marketing AI** â€” chat con Gemini + Design Copilot (Claude) para HTML/CSS.

Maneja: auth, conversaciones, galerÃ­a de diseÃ±os guardados, AI learning context (historial â†’ prompt enrichment).

### `pages/AIChat.jsx` (chat estilo ChatGPT + Storyboard)
- Chat tipo ChatGPT con persistencia en Firestore (vÃ­a `conversationsService`).
- GeneraciÃ³n de imÃ¡genes inline con enriquecimiento automÃ¡tico del prompt usando contexto de la conversaciÃ³n.
- Soporta: Gemini/OpenAI/OpenRouter (chat), OpenAI GPT Image / Imagen 4 / Nano Banana / OpenRouter (imagen).
- Configurable: aspect ratio, estilo (viral / crypto / real_estate / none), modelo, endpoint.
- BotÃ³n **ðŸŽ¬ Storyboard** en topbar abre modal `StoryboardPanel`:
  - Pega guion â†’ infiere `n_scenes = ceil(words/2.5/seconds_per_image)` (espaÃ±ol â‰ˆ 2.5 palabras/seg).
  - Pipeline 2 etapas en backend:
    1. **`build_visual_bible(script, style_hint)`** â†’ infiere tema, universo, mood, paleta hex (3 colores), cÃ¡mara/lente, grano, direcciÃ³n de arte, kit simbÃ³lico.
    2. **`split_script_into_scenes(..., bible)`** â†’ genera N prompts cinematogrÃ¡ficos en inglÃ©s siguiendo estructura jerÃ¡rquica fija + bible idÃ©ntica para garantizar consistencia.
  - UI muestra **Visual Bible Card** (paleta como chips, cÃ¡mara, mood, sÃ­mbolos) con botÃ³n **ðŸ”„ Regenerar direcciÃ³n visual** (re-planifica sin gastar imÃ¡genes).
  - Tabla de costos USD/MXN por modelo (`IMAGE_MODEL_PRICING` en `main.py`, USDâ†’MXN = 17.5).
  - GeneraciÃ³n en cadena (serial) con barra de progreso, estados por tarjeta (pending/loading/done/error), descarga individual de cada escena.
  - Cada escena devuelve: `narration`, `duration`, `shot_type`, `emotion`, `visual_hook`, `prompt`.
  - Storyboard V2:
    - Selector **Storyboard visual / Solo dividir guion**.
    - **Solo dividir guion** corta localmente el guion en escenas por segundos sin gastar IA ni generar imÃ¡genes.
    - **Prompt cinematogrÃ¡fico IA / Plantilla Reel**: se puede usar el prompt generado por Gemini o una plantilla editable con variables (`{{narration}}`, `{{prompt}}`, `{{visual_hook}}`, `{{shot_type}}`, `{{emotion}}`).
    - Cada escena puede sobrescribir `model`, `apiEndpoint`, `promptMode` y `customPrompt`.
    - Cada tarjeta tiene botÃ³n **Generar/Regenerar** individual, ademÃ¡s de mantener **Generar todas**.

### Servicios Firestore
- `firestoreService.js`: colecciÃ³n `projects`.
- `designsService.js`: colecciÃ³n `designs` + `project_research`. Comprime imÃ¡genes (â‰¤500KB / 600px) antes de guardar.
- `conversationsService.js`: historial de chats.
- `authService.js`: Google Sign-In.

---

## 7. Variables de entorno

### Backend (`backend/.env`, **no commit**)
```env
GEMINI_API_KEY=AIza...
VERTEX_API_KEY=AQ.Ab8RN6...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
```
En producciÃ³n se setean en Cloud Run con `gcloud run services update --set-env-vars`.

Notas OpenAI:
- La API key debe estar solo en `backend/.env`; nunca en frontend.
- Reiniciar backend despuÃ©s de editar `.env`, porque `main.py` carga variables al iniciar.
- `gpt-image-2` puede requerir organizaciÃ³n verificada en OpenAI Platform. Error tÃ­pico: `Your organization must be verified to use the model gpt-image-2`.

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

## 8. CÃ³mo correr en local

### OpciÃ³n rÃ¡pida (Windows)
Doble click en [INICIAR_APP.bat](INICIAR_APP.bat) â€” levanta backend y frontend en ventanas separadas y abre el navegador.

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

## 9. Deploy a producciÃ³n

**Frontend** â†’ Firebase Hosting:
```bash
cd frontend && npm run build && cd ..
firebase deploy --only hosting
```

**Backend** â†’ Cloud Run (PowerShell):
```powershell
cd "D:\Brisa Maya Capital\Marketing_Engine\backend"
gcloud run deploy marketing-engine-api --source . --region us-central1 --allow-unauthenticated
```

---

## 10. Base de datos de proyectos

Archivo seed: [backend/assets/Database_Proyectos_BMC.json](backend/assets/Database_Proyectos_BMC.json).
Proyectos: VELMARI, ALBA, MISTRAL, CANDELA, COSTA RESIDENCES, ROSEWOOD, AMARES, MELIORA, KULKANA, MACONDO_PLAYACAR, etc.
Cada uno trae paleta (Heritage Navy, Obsidian Luxe, Earth Echo, Coastal Ivory, Modern Slateâ€¦) y acento (Gold/Platinum/Emerald).

---

## 11. Convenciones / cosas que recordar

- `.env` y `.venv/` **siempre** en `.gitignore`. Nunca commitear API keys.
- En Windows usar **Git Bash** para activar venv (`source .venv/Scripts/activate`).
- ImÃ¡genes que se suben al backend â†’ **comprimirlas en cliente** antes (ya hecho en `App.jsx` y `designsService.js`).
- Para que **Imagen 4 escriba texto** en la imagen, el prompt debe incluir una secciÃ³n explÃ­cita `TEXT POSITIONING:` con cada elemento y su zona (ver ejemplos en [SESION_NUEVA_README.md](SESION_NUEVA_README.md)).
- En desarrollo el frontend cae a `localhost:8000` automÃ¡ticamente vÃ­a [config/api.js](frontend/src/config/api.js).
- `ImageStudio.jsx` es muy grande (~4600 lÃ­neas): al editar, buscar por secciÃ³n con grep antes de leer todo.

---

## 12. ðŸŽ¬ Sistema Storyboard (guion â†’ imÃ¡genes en cadena)

Implementado en `backend/ai_copywriter.py` + `backend/main.py` + `frontend/src/pages/AIChat.jsx` (componente `StoryboardPanel`).

### Pipeline 2 etapas

**Etapa 1 â€” `build_visual_bible(script, style_hint, aspect_ratio, model)`**
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

**Etapa 2 â€” `split_script_into_scenes(script, seconds_per_image, ..., bible=None)`**
Si no recibe `bible`, la genera internamente. Llamada Gemini Flash (`temperature=0.9`, `maxOutputTokens=16384`) que construye N prompts cinematogrÃ¡ficos siguiendo estructura jerÃ¡rquica fija:
```
[SHOT TYPE] of [HERO performing ACTION] in [LOCATION], [secondary], [bg], [particles], [LIGHTING from bible], [PALETTE from bible], [CAMERA from bible], [GRAIN from bible], [ART DIRECTION], [QUALITY TAGS], vertical {ar} aspect ratio.
```
Cada escena: `index, narration, duration, shot_type, emotion, visual_hook, prompt`.

### Endpoints

- `POST /api/studio/visual-bible` â†’ solo bible (rÃ¡pido, barato)
- `POST /api/studio/plan-script` â†’ bible + escenas + tabla de costos por modelo

### Tabla de precios (`IMAGE_MODEL_PRICING` en `main.py`)

| Modelo | USD/img |
|---|---|
| `openai/gpt-image-2` | $0.053 |
| `openai/gpt-image-1.5` | $0.034 |
| `openai/gpt-image-1` | $0.042 |
| `openai/gpt-image-1-mini` | $0.011 |
| `imagen-4.0-ultra-generate-001` | $0.060 |
| `imagen-4.0-generate-001` | $0.040 |
| `imagen-4.0-fast-generate-001` | $0.020 |
| `nano-banana-pro-preview` | $0.039 |
| `gemini-3.1-flash-image-preview` | $0.039 |
| `gemini-2.5-flash-image` | $0.030 |
| `openrouter/google/gemini-2.5-flash-image-preview:free` | $0.000 |

USDâ†’MXN = 17.5 (`USD_TO_MXN` en `main.py`).

### Frontend UX

- Topbar ðŸŽ¬ abre modal `StoryboardPanel`.
- Tarjeta **Visual Bible** muestra paleta como chips de color, cÃ¡mara, mood, sÃ­mbolos.
- BotÃ³n **ðŸ”„ Regenerar direcciÃ³n visual** â†’ re-planifica sin gastar imÃ¡genes ($0.001 vs $0.35 de las imÃ¡genes).
- Tarjetas de escena con: chip ðŸŽ¥ shot_type, chip ðŸ’¥ emotion, hook ðŸª, prompt completo desplegable, descarga individual.
- GeneraciÃ³n en serie con barra de progreso `done/total`, estados pending/loading/done/error.
- Cada escena puede generarse o regenerarse de forma individual.
- Cada escena puede usar un modelo/API distinto (ej. escena 1 con OpenAI GPT Image 1.5, escena 2 con Gemini/Nano Banana, escena 3 con Imagen 4).
- Modo **Plantilla Reel**: usa una plantilla editable por narraciÃ³n y evita depender del prompt cinematogrÃ¡fico generado automÃ¡ticamente.
- Modo **Solo dividir guion**: corta el guion localmente en escenas por tiempo, muestra timestamps aproximados y permite copiar escena o copiar todo.

### LÃ³gica de particiÃ³n

```python
word_count = len(re.findall(r"\b\w+\b", script))
total_seconds = word_count / 2.5      # espaÃ±ol â‰ˆ 2.5 palabras/seg
n_scenes = ceil(total_seconds / seconds_per_image)
```

### Aprendizajes clave

- Gemini 2.5+ requiere `"thinkingConfig":{"thinkingBudget":0}` para no truncar outputs (sin esto, los prompts enriquecidos salÃ­an a 87 chars).
- Nano Banana requiere `generationConfig.imageConfig.aspectRatio` (no acepta el campo en la raÃ­z).
- `responseMimeType="application/json"` evita los markdown fences ` ```json `, pero se mantiene un strip defensivo por si acaso.
- Estructura jerÃ¡rquica fija en el prompt produce imÃ¡genes consistentes; estructura libre produce caos visual entre escenas.
- Pasar la bible idÃ©ntica a cada prompt resuelve el problema #1 de los storyboards IA: la inconsistencia visual entre escenas.
- Para iterar barato, usar primero **Solo dividir guion**, luego **Plantilla Reel** o prompts IA por escena, y generar una escena a la vez.
- Si hay problemas de encoding/mojibake en `AIChat.jsx`, restaurar desde Git antes de aplicar cambios; no reescribir el archivo completo con PowerShell.

---

## 13. Pendientes conocidos (del README)

- Pulir UI/UX (responsive, animaciones, dark/light, galerÃ­a).
- Consistencia preview â†” render final.
- Optimizar carga de imÃ¡genes grandes.
- Mejor manejo de errores de API.
- Templates predefinidos, historial de versiones, exportar a PNG/PDF, dashboard analytics.
- **Storyboard**: exportar Bible como JSON Â· exportar storyboard como ZIP de PNGs Â· medir y mostrar tiempo real de generaciÃ³n por escena Â· persistir variantes por escena en Firestore.

---

## 14. Altta Homes Product Ad Builder (flujo principal actual)

El flujo principal de publicaciones inmobiliarias está enfocado en **Altta Homes**. La estructura vieja de Brisa Maya/BMC sigue existiendo como base técnica, pero el render de producto actual debe producir artes para desarrollos/modelos de Altta Homes con salida consistente en `1:1`, `9:16` y `16:9`.

### Estructura visual vigente

Sobre la imagen base solo deben aparecer estos elementos:

- Logo seleccionado.
- Modelo.
- Frase gancho generada o editable.
- Precio, normalmente con prefijo **Desde**.
- CTA con teléfono.

Se eliminaron del arte final las líneas decorativas, badges antiguos, cajas de datos innecesarias, paneles azules y fondos artificiales. La intención es texto limpio sobre la imagen subida por el usuario, con apariencia premium.

### Catálogo Altta Homes

Catálogo editable por defecto: `frontend/src/data/alttaHomesCatalog.js`.

Desarrollos/modelos cargados:

- **Jardines del Sur 6**: Capua, Cedro Plus, Flamboyán, Ceiba, Tabachín, Noni.
- **La Rioja Residencial 2**: Noni Elite, Noni, Álamo, Fresno Elite.
- **Lirios Residencial 2**: Cedro Plus.

Notas de datos:

- Los precios se normalizan para render con `Desde` cuando aplica, pero el input de precio ya no fuerza `Desde` mientras el usuario escribe.
- En La Rioja 2 se asumieron los precios corregidos `$4,436,025 MXN` y `$4,294,950 MXN`.
- En Lirios 2 quedó `Desde preventa` cuando no hay precio cerrado.

### Logos por desarrollo

Carpeta fuente local usada por el usuario: `Logos Altta Homes/`.

Carpeta pública servida por Vite: `frontend/public/logos/`.

Logos conectados en `frontend/src/data/alttaHomesCatalog.js`:

- `Altta Homes` -> `/logos/altta-homes.png`
- `Jardines del Sur 6` -> `/logos/jardines-del-sur-6.png`
- `Lirios Residencial 2` -> `/logos/lirios-residencial-2.png`
- `La Rioja Residencial 2` -> `/logos/la-rioja-residencial-2.svg`

Nota: se dejó La Rioja 2 apuntando al SVG porque esa versión funcionaba correctamente. Si se reemplaza después por PNG, validar que no esté corrupto y actualizar `ALTTA_LOGO_OPTIONS`.

El editor incluye selector de logo. El logo es una capa movible (`logo`) y su ancho se controla con `W-` / `W+` o con el slider de tamaño de logo.

### Motor canvas unificado (Fase 1)

Para resolver la diferencia entre preview y export, el flujo Altta migró a un **renderer canvas único** en `frontend/src/App.jsx`.

Puntos clave:

- La vista principal usa `<canvas ref={designCanvasRef}>` dentro de `.altta-stage`.
- La exportación usa la misma función `renderAlttaDesign(canvas, width, height)` que el preview.
- El DOM/HTML de `.altta-preview-overlay` quedó como capa de hitboxes para selección/drag, no como render visual final.
- Los hitboxes tienen clase `.altta-canvas-hitboxes`; deben ser transparentes y no aplicar `backdrop-filter`, sombras o fondos que tapen el canvas.
- Las capas movibles siguen siendo `logo`, `model`, `headline`, `price`, `cta`.
- Las posiciones se guardan en porcentaje dentro de `alttaLayout`.
- Hay snap suave al centro si la capa queda cerca del 50%.
- Existe botón **Aplicar estilo premium** para forzar tamaños/posiciones actuales aunque React/Vite conserve estado viejo por hot reload.
- Existe botón **Resetear posiciones** para restaurar `ALTTA_PREMIUM_LAYOUT`.

Importante sobre estabilidad:

- `renderAlttaDesign()` carga imagen base y logo antes de limpiar/dibujar el canvas.
- `imageCacheRef` cachea imágenes/logos para evitar recargas en cada drag.
- El preview se renderiza primero en un canvas temporal/offscreen y solo se copia al canvas visible cuando el frame ya terminó.
- `previewRenderIdRef` ignora renders viejos que terminan tarde.
- Esto evita pestañeo, imagen perdida y carreras visuales al mover capas.

No volver a usar `foreignObject` para exportar HTML a canvas: en Chrome puede taintar el canvas y bloquear `toBlob()` con `SecurityError`. La dirección correcta es mantener un documento de diseño + renderer único, como Canva/Figma conceptualmente.

### Editor tipo Canva

El toolbar de edición fijo (`altta-fixed-toolbar`) permite editar la capa seleccionada:

- Texto.
- Color.
- Tamaño con `-` / `+`.
- Ancho de caja con `W-` / `W+`.
- Nudge arriba, abajo, izquierda y derecha.

Además, el panel lateral incluye controles de tamaño para logo/modelo/frase/precio/CTA, selector de logo, selector de aspecto y botones de descarga.

### Frontend actualizado

Archivo principal: `frontend/src/App.jsx`.

Cambios relevantes:

- Importa `ALTTA_HOMES_CATALOG`, `ALTTA_LOGO_OPTIONS`, `getAlttaLogoOptionById` y `getAlttaProductById`.
- Nuevo estado para producto, desarrollo, modelo, precio, specs, CTA, teléfono, logo seleccionado, variantes IA y layout libre.
- `renderAlttaDesign(canvas, width, height)` es la fuente de verdad para preview y export.
- `appendRenderFields()` todavía envía campos Altta al backend para compatibilidad, aunque el flujo actual de descarga usa renderer frontend.
- El selector de aspecto queda enfocado en `1:1`, `9:16` y `16:9`.
- La descarga usa canvas local a 4K/8K y respeta el mismo renderer del preview.
- Se mantiene la capacidad de editar manualmente lo cargado desde catálogo.
- Se ocultaron controles antiguos que ya no forman parte del flujo principal, pero no se eliminaron por completo.

Archivo de estilos: `frontend/src/index.css`.

Cambios relevantes:

- `.altta-design-canvas` renderiza la vista visual real.
- `.altta-canvas-hitboxes` deja el overlay HTML como capa transparente de interacción.
- `.altta-draggable`, `.altta-center-guide`, `.altta-fixed-toolbar` siguen controlando selección/drag/edición.
- Toolbar flotante viejo `.altta-layer-toolbar` queda oculto.
- Guías de centro son solo de edición y no aparecen en export.

### Backend actualizado

Archivos tocados históricamente:

- `backend/main.py`
- `backend/image_processor.py`
- `backend/ai_copywriter.py`

`backend/main.py`:

- `render_ad` acepta campos Altta:
  - `brand_name`
  - `developer_name`
  - `development_name`
  - `model_name`
  - `product_type`
  - `price_text`
  - `specs_text`
  - `cta_text`
  - `phone_text`
  - `cta_font_size`
  - `altta_layout_json`
- Endpoint `POST /api/altta/product-copy`.
- Modelo `AlttaProductCopyRequest`.

`backend/ai_copywriter.py`:

- Función `generate_altta_product_copy(...)`.
- Usa Gemini `gemini-2.5-flash`.
- Devuelve `hooks` y `social_posts`.
- Reglas del prompt:
  - Hook máximo 9 palabras.
  - Sin emojis.
  - No meter precio/specs dentro del hook.
  - Copy máximo 450 caracteres.
  - Respetar el precio escrito y el prefijo `Desde`.
- Tiene fallback local si falta Gemini o falla la API.

`backend/image_processor.py`:

- Tema `ALTTA_PRODUCT_CARD` sigue disponible como compatibilidad backend/Pillow.
- Lee posiciones `x`, `y`, `width` desde `altta_layout_json`.
- Usa colores/tamaños configurables por campo.
- Ojo: para evitar diferencias preview/export, el flujo principal actual debe preferir el renderer canvas frontend.

### Validaciones realizadas

Se validó varias veces durante la implementación:

- `npm.cmd run build` pasa. Vite conserva warning de chunk grande mayor a 500 kB.
- `npm.cmd run lint` pasa.
- `python -m py_compile backend\main.py backend\ai_copywriter.py backend\image_processor.py` pasa cuando se tocaron backend.

Servidores usados durante pruebas:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

### Pendientes del flujo Altta

- Mejorar resize directo desde esquinas del cuadro selector, estilo Canva.
- Guardar presets de layout por formato (`1:1`, `9:16`, `16:9`).
- Afinar presets visuales por desarrollo/modelo.
- Mantener una sola fuente de verdad: si se cambia un estilo visual, actualizar `renderAlttaDesign()` primero.
- Si se agrega un nuevo logo, copiarlo a `frontend/public/logos/` y agregarlo a `ALTTA_LOGO_OPTIONS`.

---

_Última actualización del contexto: 16 mayo 2026 - flujo Altta migrado a renderer canvas único para preview/export, selector de logos por desarrollo, logos Altta/Jardines/Lirios conectados, La Rioja 2 conservada, cache/offscreen render para evitar pestañeo._
