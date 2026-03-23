# 🏝️ BRISA MAYA CAPITAL — Marketing Engine

## Plataforma de Generación de Material Publicitario con IA

---

## 📍 Descripción

**Marketing Engine** es una aplicación web profesional para crear material publicitario de bienes raíces de lujo en Riviera Maya. Integra múltiples APIs de IA (Google Gemini, Anthropic Claude, Imagen 4) para generar imágenes, copy y diseños HTML de alta calidad.

---

## 🛠️ Stack Tecnológico

### Backend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Python | 3.12+ | Runtime |
| FastAPI | Latest | Framework API REST |
| Pillow | Latest | Procesamiento de imágenes |
| google-genai | Latest | API Gemini (chat, imágenes) |
| anthropic | Latest | API Claude (Design Copilot) |
| uvicorn | Latest | Servidor ASGI |

### Frontend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 19.2.0 | UI Framework |
| Vite | 7.3.1 | Build tool |
| Firebase | 12.10.0 | Auth + Firestore |

### APIs de IA
| Servicio | Modelos | Uso |
|----------|---------|-----|
| **Google Gemini** | 2.5 Flash/Pro, 3 Flash/Pro, 3.1 Pro | Chat, análisis de imágenes |
| **Google Imagen 4** | Ultra, Standard, Fast | Generación de imágenes con texto |
| **Anthropic Claude** | Sonnet 4, Opus 4.5/4.6 | Design Copilot (edición HTML) |
| **Nano Banana** | Pro, 2 | Generación de imágenes artísticas |

---

## 🗂️ Estructura del Proyecto

```
Marketing_Engine/
├── backend/
│   ├── .venv/                  # Entorno virtual Python
│   ├── .env                    # API keys (NO subir a Git)
│   ├── main.py                 # Endpoints FastAPI
│   ├── ai_copywriter.py        # Lógica de IA
│   ├── image_processor.py      # Procesamiento 8K
│   ├── requirements.txt        # Dependencias Python
│   └── assets/
│       └── Database_Proyectos_BMC.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Componente principal
│   │   ├── pages/
│   │   │   └── ImageStudio.jsx  # Página principal (~5000 líneas)
│   │   ├── services/
│   │   │   ├── firestoreService.js
│   │   │   └── designsService.js
│   │   └── data/
│   │       └── initialProjects.js
│   ├── package.json
│   └── vite.config.js
│
├── temp_drive/                 # Archivos temporales
└── README.md                   # Este archivo
```

---

## ✨ Funcionalidades Implementadas

### 🖼️ Image Studio (4 Tabs)

#### 1. ✨ Generar Imágenes
- Generación con **Imagen 4** (soporta texto en imagen)
- Generación con **Nano Banana** (estilo artístico)
- Presets de estilo: Luxury Real Estate, Twilight, Golden Hour, etc.
- Aspect ratios: 1:1, 16:9, 9:16, 4:3
- Biblioteca de prompts profesionales

#### 2. 🖼️ Editar Imágenes
- Edición con instrucciones de IA
- Subir imagen de referencia
- Modificaciones específicas

#### 3. 🔧 Prompt Lab
- Extracción de prompts desde imágenes
- Adaptación de prompts a proyectos
- Biblioteca de prompts guardados

#### 4. 💬 Marketing AI Chat
- Chat conversacional con Gemini
- Adjuntar imágenes al chat
- Generación de copy publicitario
- Botones de acción: "Generar Imagen", "Usar Prompt", "Copiar"

### 🎨 Design Copilot
- Generación de anuncios HTML/CSS con IA
- **Claude Sonnet 4** para edición incremental
- **Gemini 3.1 Pro** para creación
- Preview en tiempo real
- Formatos: 1:1, 9:16, 16:9, 4:3
- Extracción de colores de imagen
- Guardado automático de diseños en Firestore
- Galería de diseños guardados

### 📝 Generación de Copy
- 5 tonos: Investment, Lifestyle, Urgency, Luxury, Balanced
- Posts para redes sociales
- Copy adaptado por proyecto
- Integración con base de datos de proyectos BMC

### 🏢 Base de Datos de Proyectos
- **VELMARI** - Heritage Navy + Gold
- **ALBA** - Heritage Navy + Gold
- **MISTRAL** - Obsidian Luxe + Platinum
- **CANDELA** - Obsidian Luxe + Platinum
- **COSTA RESIDENCES** - Earth Echo + Gold
- **ROSEWOOD** - Coastal Ivory + Gold
- **AMARES** - Modern Slate + Emerald
- **KULKANA** - Cancún Zona Sur
- Y más...

### 🔐 Autenticación
- Firebase Authentication
- Google Sign-In
- Datos por usuario en Firestore

---

## 📡 Endpoints API

### Imágenes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/studio/generate-image-v2` | Genera imagen con IA |
| POST | `/api/studio/edit-image` | Edita imagen con IA |
| POST | `/api/render-ad` | Renderiza anuncio 8K con overlays |

### Chat y Copy
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/chat` | Chat con Gemini |
| POST | `/api/chat-claude` | Chat con Claude (Design Copilot) |
| POST | `/api/generate-copy` | Genera copy publicitario |
| POST | `/api/social-copy` | Posts para redes sociales |

### Utilidades
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/models` | Lista modelos disponibles |
| GET | `/api/studio/prompts` | Biblioteca de prompts |
| POST | `/api/studio/extract-prompt` | Extrae prompt de imagen |
| POST | `/api/studio/extract-colors` | Extrae colores de imagen |
| POST | `/api/studio/generate-html-ad` | Genera HTML de anuncio |

---

## 🚀 Cómo Ejecutar en Local

### Requisitos
- Python 3.12+
- Node.js 18+
- Git Bash (Windows)

### 1. Configurar API Keys

Crear archivo `backend/.env`:
```env
# Google AI (Gemini + Imagen 4)
GEMINI_API_KEY=tu_api_key_aqui
VERTEX_API_KEY=tu_vertex_api_key

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Iniciar Backend (Puerto 8000)

```bash
cd backend

# Activar entorno virtual
source .venv/Scripts/activate

# Instalar dependencias (primera vez)
pip install -r requirements.txt

# Iniciar servidor
uvicorn main:app --reload --port 8000
```

**Verificar:** http://localhost:8000 → `{"message": "Brisa Maya Marketing Engine Backend is Running."}`

### 3. Iniciar Frontend (Puerto 5173)

```bash
cd frontend

# Instalar dependencias (primera vez)
npm install

# Iniciar servidor de desarrollo
npm run dev
```

**Abrir:** http://localhost:5173

---

## 🔑 Configuración Firebase

El proyecto usa Firebase para:
- **Authentication**: Google Sign-In
- **Firestore**: Almacenar diseños, proyectos, conversaciones

### Proyecto Firebase
- ID: `marketing-engine-web`
- Región: `us-central1`

La configuración está en `frontend/src/firebase.js`.

---

## 🎯 Modelos de IA Disponibles

### Chat (Design Copilot)
| Modelo | ID | Recomendado para |
|--------|-----|------------------|
| Claude Sonnet 4.6 | `claude-sonnet-4-6-20250311` | Edición incremental (default) |
| Claude Opus 4.5 | `claude-opus-4-5-20250215` | Tareas complejas |
| Gemini 3.1 Pro | `gemini-3.1-pro-preview` | Creación de diseños |
| Gemini 3 Pro | `gemini-3-pro-preview` | Balance calidad/velocidad |

### Generación de Imágenes
| Modelo | Texto en imagen | Velocidad |
|--------|-----------------|-----------|
| Imagen 4 Ultra | ✅ Sí (mejor) | Lento |
| Imagen 4 | ✅ Sí | Normal |
| Imagen 4 Fast | ✅ Sí | Rápido |
| Nano Banana Pro | ❌ No | Normal |

---

## 📋 Próximos Pasos

### 🎨 Pulir Diseño UI/UX
- [ ] Mejorar estilos CSS del Image Studio
- [ ] Diseño responsive para móvil
- [ ] Animaciones y transiciones
- [ ] Tema oscuro/claro
- [ ] Mejorar galería de diseños

### 🐛 Bugs Pendientes
- [ ] Consistencia preview ↔ render final
- [ ] Optimizar carga de imágenes grandes
- [ ] Mejorar manejo de errores de API

### 🚀 Deploy a Firebase
- [ ] **Frontend** → Firebase Hosting
- [ ] **Backend** → Cloud Run (Docker)
- [ ] Configurar dominio personalizado
- [ ] Variables de entorno en Cloud Run
- [ ] CORS para producción

### 💡 Mejoras Opcionales
- [ ] Templates predefinidos de anuncios
- [ ] Historial de versiones de diseños
- [ ] Exportar a formatos (PNG, PDF, PSD)
- [ ] Colaboración entre usuarios
- [ ] Dashboard de analytics

---

## 🔒 Seguridad

⚠️ **NUNCA subir a Git:**
- `backend/.env` (API keys)
- `frontend/.env` (si tiene secrets)
- `.venv/` (entorno virtual)

El archivo `.gitignore` ya está configurado para proteger estos archivos.

---

## 📅 Última Actualización

**Fecha:** Marzo 2026  
**Estado:** ✅ Funcional en desarrollo local  
**Versión:** 1.0.0

---

## 👥 Equipo

**Brisa Maya Capital** — Marketing Engine  
Plataforma interna para generación de material publicitario.
