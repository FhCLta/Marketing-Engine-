# 🏗️ BRISA MAYA CAPITAL — Marketing Engine AI

## 📋 Resumen Ejecutivo

**Marketing Engine** es una aplicación web para generar anuncios visuales de alta calidad (8K) para proyectos inmobiliarios de lujo en la Riviera Maya. Combina un backend Python (FastAPI + Pillow + Google Gemini) con un frontend React (Vite) y está preparada para integrarse con Firebase.

---

## 🏛️ Arquitectura

```
Marketing_Engine/
├── backend/                    # FastAPI + Python
│   ├── main.py                 # Endpoints API
│   ├── image_processor.py      # Motor 8K LANCZOS
│   ├── ai_copywriter.py        # Generador de copy con Gemini
│   ├── requirements.txt        # Dependencias Python
│   └── assets/
│       ├── logo_transparent.png
│       └── Database_Proyectos_BMC.json
│
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── App.jsx             # Componente principal
│   │   ├── App.css             # Estilos
│   │   └── main.jsx            # Entry point
│   ├── package.json
│   └── .env                    # Variables de entorno (Firebase)
│
└── temp_drive/                 # Carpeta temporal
```

---

## ⚙️ Funcionalidades Implementadas

### Backend (FastAPI)

| Endpoint | Función |
|----------|---------|
| `POST /api/render-ad` | Renderiza imagen con texto overlay en 8K |
| `POST /api/generate-copy` | Genera variantes de copy con Gemini AI |
| `POST /api/generate-social` | Genera posts para redes sociales |
| `POST /api/enhance-image` | Solo mejora la imagen sin texto |

### Motor de Imagen 8K (`image_processor.py`)

- **Upscaling LANCZOS** a resolución 8K/4K
- **Aspect ratios**: 16:9, 1:1, 9:16, 4:5, original
- **Gradiente cinematográfico** en la parte inferior
- **Logo BMC** con círculo dorado
- **Jerarquía de texto** (Layout v2):
  1. Location (opcional, gris sutil)
  2. Super Headline / Badge (opcional, color acento)
  3. Línea decorativa (solo si hay badge)
  4. **Project Name (HERO)** — el más grande
  5. Main Headline (tagline)
  6. Body Text (opcional)

### Frontend (React)

- **Selector de proyectos** desde Firestore
- **Generador de Copy AI** con 5 tonos: Inversión, Lifestyle, Urgencia, Ultra Lujo, Balanceado
- **Preview CSS en tiempo real** antes de renderizar
- **Controles de tamaño de texto**: Badge, Proyecto, Tagline, Body
- **Controles de color individuales**: Logo, Acento, Línea, Proyecto, Texto, Body
- **Selector de aspect ratio**
- **Layout**: izquierda, centro, derecha

---

## 🎨 Parámetros de Diseño Actuales

### Tamaños de Texto (vh → % de altura de imagen)

| Elemento | Default | Rango |
|----------|---------|-------|
| Badge (Super Headline) | 1.4vh | 0.8 - 3.0 |
| Project Name (HERO) | 4.0vh | 2.0 - 7.0 |
| Tagline | 2.8vh | 1.5 - 5.0 |
| Body | 1.8vh | 1.0 - 3.0 |

### Colores (BMC Palette)

- **Gold**: `#d4af37` (acento principal)
- **Platinum**: `#e5e4e2`
- **White**: `#ffffff`
- **Onyx**: `#1a1a1a`
- **Silver**: `#a0aec0`
- **Emerald**: `#10b981`
- **Auburn**: `#8b4513`
- **Teal**: `#005f73`

---

## 📦 Estado Actual de la Sesión

### ✅ Completado

- [x] Integración Firebase (Firestore para proyectos)
- [x] Selector de tono para generación de copy
- [x] Motor 8K con LANCZOS upscaling
- [x] Layout v2 con jerarquía de texto separada
- [x] Project Name como elemento HERO independiente
- [x] Location como campo opcional
- [x] Super Headline y línea decorativa opcionales
- [x] Preview CSS que refleja la estructura antes de renderizar
- [x] Controles de tamaño de texto con sliders
- [x] Control de color independiente para Project Name
- [x] Ajuste de font_scale para formatos cuadrado/vertical

### ⏳ Pendientes / Ajustes

- [ ] **Ajustar consistencia preview ↔ render**: Los tamaños en preview CSS no coinciden 100% con el render final
- [ ] **Deploy a Firebase**:
  - Frontend → Firebase Hosting
  - Backend → Cloud Run (con Docker)
- [ ] **Opcional**: Agregar más tonos de copy o templates predefinidos
- [ ] **Opcional**: Guardar configuraciones de anuncios en Firestore

---

## 🚀 Instrucciones para Ejecutar

### Backend

```bash
cd backend
# Activar entorno virtual (Windows)
source .venv/Scripts/activate
# o en PowerShell: .venv\Scripts\Activate.ps1

# Instalar dependencias (si es necesario)
pip install -r requirements.txt

# Ejecutar servidor
python main.py
# → http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Variables de Entorno

**Backend** (`backend/.env` o variables de sistema):
```
GOOGLE_API_KEY=tu_api_key_de_gemini
```

**Frontend** (`frontend/.env`):
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## 🔥 Plan de Deploy a Firebase

### Frontend (Firebase Hosting)

```bash
cd frontend
npm run build
firebase deploy --only hosting
```

### Backend (Cloud Run)

1. Crear `Dockerfile` en `/backend`
2. Build y push a Container Registry
3. Deploy a Cloud Run
4. Actualizar URL del backend en frontend

```dockerfile
# backend/Dockerfile (ejemplo)
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

---

## 📁 Archivos Clave para Modificar

| Archivo | Propósito |
|---------|-----------|
| `backend/image_processor.py` | Lógica de renderizado, fuentes, posiciones |
| `backend/ai_copywriter.py` | Prompts de Gemini, tonos de copy |
| `backend/main.py` | Endpoints API, parámetros Form |
| `frontend/src/App.jsx` | UI completa, estados, llamadas API |
| `frontend/src/App.css` | Estilos del preview y controles |

---

## 🧠 Notas Técnicas Importantes

### Diferencia Preview vs Render

- **Preview CSS**: Usa `vh` (viewport height del navegador)
- **Backend**: Usa `%` de la altura de la imagen × `font_scale`
- El `font_scale` reduce tamaños para formatos cuadrados (0.85) y verticales (0.80)
- Hay un multiplicador de 1.1 para compensar diferencias

### Estructura de Texto Condicional

```python
# Solo se muestran si tienen contenido:
if params.location:           # → Location
if params.super_headline:     # → Badge + Línea
if params.project_name:       # → HERO
# Siempre se muestra:
params.main_headline          # → Tagline
if params.body_text:          # → Body
```

### AdParameters (Backend)

```python
class AdParameters(BaseModel):
    project_name: str = ""
    location: str = ""
    super_headline: str = ""
    main_headline: str
    body_text: str = ""
    layout: str = "left"
    theme: str = "GOLDEN_LEGACY"
    output_quality: str = "8k"
    output_format: str = "jpeg"
    aspect_ratio: str = "original"
    # Colores
    accent_color_hex, project_color_hex, text_color_hex, body_color_hex, logo_color_hex, line_color_hex
    # Tamaños
    super_font_size: float = 1.4
    project_font_size: float = 4.0
    headline_font_size: float = 2.8
    body_font_size: float = 1.8
```

---

## 💬 Contexto de Decisiones

1. **¿Por qué separar Project Name del Main Headline?**
   - El nombre del proyecto debe ser el elemento HERO más grande
   - El tagline es secundario y complementa

2. **¿Por qué hacer el Super Headline opcional?**
   - Para campañas minimalistas solo nombre + tagline
   - La línea decorativa solo tiene sentido con el badge

3. **¿Por qué usar LANCZOS para upscaling?**
   - Es el algoritmo de interpolación con mejor calidad para texto
   - Evita bordes pixelados en resoluciones altas

---

## 🎯 Próximos Pasos Sugeridos

1. Probar diferentes configuraciones y ajustar los multiplicadores de tamaño si es necesario
2. Crear Dockerfile para el backend
3. Configurar Firebase Hosting y Cloud Run
4. Actualizar frontend para usar URL de producción del backend
5. Probar en producción con imágenes reales de proyectos

---

*Última actualización: 19 de Marzo 2026*
