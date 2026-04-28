import { useState, useRef, useEffect, useCallback } from 'react'
import API_BASE_URL from '../config/api'

// ═══════════════════════════════════════════════════════════════════
// AI CHAT — UI estilo ChatGPT / Claude / Gemini
// Sidebar con conversaciones, persistencia local, responsive.
// ═══════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'aichat_conversations_v1'
const PREFS_KEY = 'aichat_preferences_v1'

const IMAGE_TRIGGERS = [
  'genera una imagen', 'generar una imagen', 'genera imagen',
  'crea una imagen', 'crear una imagen', 'créame una imagen', 'creame una imagen',
  'hazme una imagen', 'haz una imagen', 'hazme un',
  'dibuja', 'dibújame', 'dibujame',
  'quiero una imagen', 'quiero ver', 'necesito una imagen',
  'podrías generar', 'puedes generar',
  'imagina', 'imagíname', 'imaginame',
  'render', 'renderiza',
  'generate an image', 'create an image', 'make an image', 'draw',
]

const detectImageIntent = (text) => {
  const t = (text || '').toLowerCase()
  return IMAGE_TRIGGERS.some(tr => t.includes(tr))
}

const extractPromptFromMessage = (text) => {
  // Devolvemos el texto COMPLETO. El backend lo enriquece usando el historial
  // (estilo ChatGPT/Sora) — recortar pierde contexto valioso.
  return (text || '').trim()
}

const ASPECT_RATIOS = [
  { id: '1:1',  label: '◼ 1:1' },
  { id: '16:9', label: '▭ 16:9' },
  { id: '9:16', label: '▯ 9:16' },
  { id: '4:3',  label: '▭ 4:3' },
  { id: '3:4',  label: '▯ 3:4' },
]

const IMAGE_MODELS = [
  { id: 'nano-banana-pro-preview', name: 'Nano Banana Pro', desc: 'Artístico (sin texto)' },
  { id: 'gemini-3.1-flash-image-preview', name: 'Nano Banana 2', desc: 'Rápido (sin texto)' },
  { id: 'gemini-2.5-flash-image', name: 'Nano Banana', desc: 'Estable (sin texto)' },
  { id: 'imagen-4.0-ultra-generate-001', name: 'Imagen 4 Ultra', desc: '🏆 Calidad + texto' },
  { id: 'imagen-4.0-generate-001', name: 'Imagen 4', desc: 'Texto en imagen' },
  { id: 'imagen-4.0-fast-generate-001', name: 'Imagen 4 Fast', desc: '⚡ Texto + rápido' },
  { id: 'openrouter/google/gemini-2.5-flash-image-preview:free', name: 'Gemini Image (OR free)', desc: '🆓 OpenRouter' },
  { id: 'openrouter/google/gemini-2.5-flash-image-preview', name: 'Gemini Image (OR)', desc: '💳 OpenRouter' },
]

const CHAT_MODELS = [
  { id: 'gemini-2.5-flash',           name: 'Gemini 2.5 Flash',     desc: 'Rápido' },
  { id: 'gemini-2.5-pro',             name: 'Gemini 2.5 Pro',       desc: 'Recomendado' },
  { id: 'gemini-2.5-flash-lite',      name: 'Gemini 2.5 Flash Lite',desc: 'Ultra rápido' },
  { id: 'gemini-3-flash-preview',     name: 'Gemini 3 Flash',       desc: 'Nueva gen' },
  { id: 'gemini-3-pro-preview',       name: 'Gemini 3 Pro',         desc: 'Máxima calidad' },
  { id: 'gemini-3.1-pro-preview',     name: 'Gemini 3.1 Pro',       desc: '🏆 Última' },
  // ─── OpenRouter (gratis) ────────────────────────────────────────
  { id: 'openrouter/deepseek/deepseek-chat-v3.1:free',                 name: 'DeepSeek Chat v3.1',  desc: '🆓 OpenRouter' },
  { id: 'openrouter/deepseek/deepseek-r1:free',                        name: 'DeepSeek R1',         desc: '🆓 Reasoning' },
  { id: 'openrouter/meta-llama/llama-3.3-70b-instruct:free',           name: 'Llama 3.3 70B',       desc: '🆓 Meta' },
  { id: 'openrouter/qwen/qwen-2.5-72b-instruct:free',                  name: 'Qwen 2.5 72B',        desc: '🆓 Alibaba' },
  { id: 'openrouter/google/gemini-2.0-flash-exp:free',                 name: 'Gemini 2.0 Flash',    desc: '🆓 Google (OR)' },
  { id: 'openrouter/mistralai/mistral-small-3.2-24b-instruct:free',    name: 'Mistral Small 3.2',   desc: '🆓 Mistral' },
  { id: 'openrouter/meta-llama/llama-3.2-11b-vision-instruct:free',    name: 'Llama 3.2 Vision',    desc: '🆓 Visión' },
  { id: 'openrouter/nvidia/nemotron-nano-9b-v2:free',                  name: 'Nemotron Nano 9B',    desc: '🆓 NVIDIA' },
  { id: 'openrouter/microsoft/mai-ds-r1:free',                         name: 'MAI DS R1',           desc: '🆓 Microsoft' },
  // OpenRouter premium
  { id: 'openrouter/anthropic/claude-3.5-sonnet',                      name: 'Claude 3.5 Sonnet',   desc: '💳 OpenRouter' },
  { id: 'openrouter/openai/gpt-4o-mini',                               name: 'GPT-4o mini',         desc: '💳 OpenRouter' },
  { id: 'openrouter/openai/gpt-4o',                                    name: 'GPT-4o',              desc: '💳 OpenRouter' },
]

const API_ENDPOINTS = [
  { id: 'auto',       label: 'Auto (según modelo)' },
  { id: 'gemini',     label: 'Gemini API (AIza...)' },
  { id: 'vertex',     label: 'Vertex AI (AQ...)' },
  { id: 'openrouter', label: 'OpenRouter (sk-or-...)' },
]

const ENHANCE_STYLES = [
  { id: 'none',         label: '⚫ Sin estilo (puro)' },
  { id: 'viral',        label: '🔥 Viral / Redes' },
  { id: 'crypto',       label: '💰 Cripto / IA / Tech' },
  { id: 'real_estate',  label: '🏖️ Real Estate Lujo' },
]

const SYSTEM_GUIDE = `Eres un asistente creativo experto en generación de imágenes para marketing visual en MÚLTIPLES nichos:

🏝️ Real estate de lujo (Riviera Maya, Tulum, Cancún): fotografía arquitectónica, golden hour, lifestyle aspiracional.
💰 Cripto / IA / tech / trading: visuales virales para redes (estilo cinematográfico, neón, futurista, dark mode, gráficos, traders, robots, dinero, contraste alto).
📱 Contenido viral para redes sociales: hooks visuales, thumbnails de YouTube, posts de Instagram/TikTok/X, banners.
🎨 Cualquier otro tipo de imagen que el usuario pida (productos, retratos, paisajes, conceptual, etc.).

REGLAS:
- NUNCA limites tu ayuda a un solo nicho. Adapta el estilo al contexto que el usuario describa.
- Cuando te pidan refinar/mejorar un guion o prompt, devuélvelo MEJORADO con detalles visuales (composición, iluminación, paleta, ángulo de cámara, mood, estilo) listo para generar imagen.
- Si el usuario pide explícitamente generar una imagen, responde breve y deja que el sistema genere.
- Si te dan un guion narrado (tipo voz en off), sugiere 1-3 ideas visuales que acompañen ese guion.
- Sé conciso (máx 4-5 frases por respuesta) salvo cuando te pidan elaborar un prompt completo.`

// ─── Storage helpers ─────────────────────────────────────────────
const loadConversations = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch { return [] }
}

const saveConversations = (convos) => {
  try {
    // Limitar tamaño: si excede ~4MB, recortar imágenes viejas
    let json = JSON.stringify(convos)
    if (json.length > 4 * 1024 * 1024) {
      const trimmed = convos.map(c => ({
        ...c,
        messages: c.messages.map(m => {
          // Solo conservar imágenes de los últimos 5 mensajes de cada conversación
          return m
        })
      }))
      json = JSON.stringify(trimmed)
    }
    localStorage.setItem(STORAGE_KEY, json)
  } catch (e) {
    console.warn('No se pudo guardar conversaciones:', e)
  }
}

const loadPrefs = () => {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}
const savePrefs = (prefs) => {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)) } catch {}
}

const generateTitle = (text) => {
  const clean = (text || '').replace(/\s+/g, ' ').trim()
  if (!clean) return 'Nueva conversación'
  return clean.length > 40 ? clean.slice(0, 40) + '…' : clean
}

const newId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const newConversation = () => ({
  id: newId(),
  title: 'Nueva conversación',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [{
    id: 'welcome',
    role: 'assistant',
    type: 'text',
    content: '¡Hola! Soy tu asistente de generación de imágenes. Cuéntame qué quieres crear o pega un guion para refinarlo. También puedo generar imágenes al instante.',
  }],
})

// ═══════════════════════════════════════════════════════════════════

export default function AIChat({ onBack }) {
  // ─── Conversaciones ─────────────────────────────────────────────
  const [conversations, setConversations] = useState(() => {
    const stored = loadConversations()
    return stored.length > 0 ? stored : [newConversation()]
  })
  const [activeId, setActiveId] = useState(() => {
    const stored = loadConversations()
    return stored.length > 0 ? stored[0].id : null
  })

  // Inicializar activeId si no existe
  useEffect(() => {
    if (!activeId && conversations.length > 0) {
      setActiveId(conversations[0].id)
    }
  }, [activeId, conversations])

  // Persistir conversaciones cada vez que cambien
  useEffect(() => {
    saveConversations(conversations)
  }, [conversations])

  const activeConvo = conversations.find(c => c.id === activeId) || conversations[0]
  const messages = activeConvo?.messages || []

  // ─── Preferencias persistentes ──────────────────────────────────
  const initialPrefs = loadPrefs()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [model, setModel] = useState(initialPrefs.model || 'nano-banana-pro-preview')
  const [chatModel, setChatModel] = useState(initialPrefs.chatModel || 'gemini-2.5-pro')
  const [apiEndpoint, setApiEndpoint] = useState(initialPrefs.apiEndpoint || 'auto')
  const [aspectRatio, setAspectRatio] = useState(initialPrefs.aspectRatio || '1:1')
  const [enhanceStyle, setEnhanceStyle] = useState(initialPrefs.enhanceStyle || 'none')
  const [autoDetect, setAutoDetect] = useState(initialPrefs.autoDetect ?? true)
  const [refImage, setRefImage] = useState(null)
  const [showSettings, setShowSettings] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  useEffect(() => {
    savePrefs({ model, chatModel, apiEndpoint, aspectRatio, enhanceStyle, autoDetect })
  }, [model, chatModel, apiEndpoint, aspectRatio, enhanceStyle, autoDetect])

  // Auto-cerrar sidebar en móvil
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 768) setSidebarOpen(false)
      else setSidebarOpen(true)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const scrollRef = useRef(null)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length, loading])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }, [input])

  // ─── Mutaciones de conversaciones ───────────────────────────────
  const updateConversation = useCallback((id, updater) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...updater(c), updatedAt: Date.now() } : c))
  }, [])

  const pushMessage = (msg) => {
    const id = activeId
    updateConversation(id, c => ({
      ...c,
      messages: [...c.messages, { id: newId(), ...msg }],
    }))
  }

  const updateMessage = (msgId, patch) => {
    updateConversation(activeId, c => ({
      ...c,
      messages: c.messages.map(m => m.id === msgId ? { ...m, ...patch } : m),
    }))
  }

  const handleNewChat = () => {
    const c = newConversation()
    setConversations(prev => [c, ...prev])
    setActiveId(c.id)
    setRefImage(null)
    setInput('')
  }

  const handleSelectChat = (id) => {
    setActiveId(id)
    setRefImage(null)
    if (window.innerWidth < 768) setSidebarOpen(false)
  }

  const handleDeleteChat = (id, e) => {
    e?.stopPropagation()
    if (!confirm('¿Borrar esta conversación?')) return
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== id)
      if (filtered.length === 0) {
        const fresh = newConversation()
        setActiveId(fresh.id)
        return [fresh]
      }
      if (id === activeId) setActiveId(filtered[0].id)
      return filtered
    })
  }

  const handleStartRename = (id, currentTitle, e) => {
    e?.stopPropagation()
    setRenamingId(id)
    setRenameValue(currentTitle)
  }

  const handleConfirmRename = (id) => {
    if (renameValue.trim()) {
      updateConversation(id, c => ({ ...c, title: renameValue.trim() }))
    }
    setRenamingId(null)
    setRenameValue('')
  }

  const handleClearAll = () => {
    if (!confirm('¿Borrar TODAS las conversaciones? Esta acción no se puede deshacer.')) return
    const fresh = newConversation()
    setConversations([fresh])
    setActiveId(fresh.id)
  }

  // ─── Helpers ──────────────────────────────────────────────────────
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      const base64 = result.split(',')[1]
      resolve({ base64, mime: file.type, dataUrl: result })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const handleAttach = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { base64, mime, dataUrl } = await fileToBase64(file)
      setRefImage({ base64, mime, name: file.name, dataUrl })
    } catch (err) {
      console.error('Error leyendo imagen:', err)
    }
    e.target.value = ''
  }

  // ─── API ──────────────────────────────────────────────────────────
  const buildHistory = (msgs) => {
    return msgs
      .filter(m => m.id !== 'welcome')
      .map(m => {
        const entry = { role: m.role, content: '' }
        if (m.type === 'image' && m.status === 'done') {
          entry.content = `[Imagen generada con prompt: "${m.prompt || ''}"]`
          if (m.imageBase64) {
            entry.image_base64 = m.imageBase64
            entry.image_mime = m.mimeType || 'image/png'
          }
        } else if (m.type === 'text') {
          entry.content = m.content || ''
          if (m.attachedImageBase64) {
            entry.image_base64 = m.attachedImageBase64
            entry.image_mime = m.attachedImageMime || 'image/jpeg'
          }
        } else {
          return null
        }
        return entry
      })
      .filter(Boolean)
  }

  const callChat = async (userText, msgs) => {
    const res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userText,
        model: chatModel,
        history: buildHistory(msgs),
        image_base64: refImage?.base64 || null,
        system_prompt: SYSTEM_GUIDE,
        api_endpoint: apiEndpoint,
      }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    return data.response || ''
  }

  const callGenerateImage = async (prompt, history = []) => {
    const res = await fetch(`${API_BASE_URL}/api/studio/generate-image-v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        aspect_ratio: aspectRatio,
        model,
        api_endpoint: apiEndpoint,
        enhance_style: enhanceStyle,
        history,
        enrich: true,
      }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    return data
  }

  const callEditImage = async (imageBase64, prompt) => {
    const res = await fetch(`${API_BASE_URL}/api/studio/edit-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: imageBase64, prompt, style_preset: 'luxury_real_estate' }),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || 'Error editando imagen')
    return data
  }

  // ─── Acciones principales ─────────────────────────────────────────
  const handleSend = async (forceMode = null) => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = {
      role: 'user',
      type: 'text',
      content: text,
      attachedImage: refImage?.dataUrl || null,
      attachedImageBase64: refImage?.base64 || null,
      attachedImageMime: refImage?.mime || null,
    }

    // Auto-titular en el primer mensaje del usuario
    const isFirstUserMsg = !messages.some(m => m.role === 'user')
    updateConversation(activeId, c => ({
      ...c,
      title: isFirstUserMsg ? generateTitle(text) : c.title,
      messages: [...c.messages, { id: newId(), ...userMsg }],
    }))

    setInput('')
    setLoading(true)

    const shouldGenerate =
      forceMode === 'generate' ||
      (forceMode !== 'chat' && autoDetect && detectImageIntent(text))

    // Snapshot con el mensaje del usuario incluido (porque setState es async)
    const msgsForApi = [...messages, { id: 'pending', ...userMsg }]

    try {
      if (shouldGenerate) {
        const promptText = extractPromptFromMessage(text)
        const placeholderId = newId()
        updateConversation(activeId, c => ({
          ...c,
          messages: [...c.messages, {
            id: placeholderId,
            role: 'assistant',
            type: 'image',
            status: 'loading',
            prompt: promptText,
          }],
        }))

        let result
        if (refImage?.base64) {
          result = await callEditImage(refImage.base64, promptText)
        } else {
          result = await callGenerateImage(promptText, buildHistory(msgsForApi))
        }

        const dataUrl = `data:${result.mime_type || 'image/png'};base64,${result.image_base64}`
        updateMessage(placeholderId, {
          status: 'done',
          imageDataUrl: dataUrl,
          imageBase64: result.image_base64,
          mimeType: result.mime_type || 'image/png',
          modelUsed: result.model_used || model,
          aspectRatio,
        })
        setRefImage(null)
      } else {
        const reply = await callChat(text, msgsForApi)
        pushMessage({ role: 'assistant', type: 'text', content: reply })
      }
    } catch (err) {
      pushMessage({
        role: 'assistant',
        type: 'error',
        content: `❌ ${err.message || 'Error desconocido'}`,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = async (msg) => {
    if (loading || !msg.prompt) return
    setLoading(true)
    const placeholderId = newId()
    updateConversation(activeId, c => ({
      ...c,
      messages: [...c.messages, {
        id: placeholderId,
        role: 'assistant',
        type: 'image',
        status: 'loading',
        prompt: msg.prompt,
      }],
    }))
    try {
      const result = await callGenerateImage(msg.prompt, buildHistory(messages))
      updateMessage(placeholderId, {
        status: 'done',
        imageDataUrl: `data:${result.mime_type || 'image/png'};base64,${result.image_base64}`,
        imageBase64: result.image_base64,
        mimeType: result.mime_type || 'image/png',
        modelUsed: result.model_used || model,
        aspectRatio,
      })
    } catch (err) {
      updateMessage(placeholderId, { status: 'error', content: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleUseAsReference = (msg) => {
    if (!msg.imageBase64) return
    setRefImage({
      base64: msg.imageBase64,
      mime: msg.mimeType || 'image/png',
      dataUrl: msg.imageDataUrl,
      name: 'imagen-anterior.png',
    })
  }

  const handleDownload = (msg) => {
    if (!msg.imageDataUrl) return
    const a = document.createElement('a')
    a.href = msg.imageDataUrl
    a.download = `aichat-${Date.now()}.png`
    a.click()
  }

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text || '').catch(() => {})
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="aichat-root">
      <Styles />

      {/* SIDEBAR */}
      <aside className={`aichat-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="aichat-sidebar-header">
          <button className="aichat-icon-btn" onClick={onBack} title="Volver al menú principal">←</button>
          <div className="aichat-brand">AI Chat</div>
          <button className="aichat-icon-btn aichat-only-mobile" onClick={() => setSidebarOpen(false)} title="Cerrar">✕</button>
        </div>

        <button className="aichat-new-btn" onClick={handleNewChat}>
          <span style={{ fontSize: 18, marginRight: 8 }}>＋</span>
          Nueva conversación
        </button>

        <div className="aichat-convo-list">
          {conversations.map(c => (
            <div
              key={c.id}
              className={`aichat-convo-item ${c.id === activeId ? 'active' : ''}`}
              onClick={() => handleSelectChat(c.id)}
              onDoubleClick={(e) => handleStartRename(c.id, c.title, e)}
            >
              {renamingId === c.id ? (
                <input
                  className="aichat-rename-input"
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={() => handleConfirmRename(c.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleConfirmRename(c.id)
                    if (e.key === 'Escape') { setRenamingId(null); setRenameValue('') }
                  }}
                  autoFocus
                />
              ) : (
                <>
                  <div className="aichat-convo-title">
                    <span style={{ marginRight: 6 }}>💬</span>
                    {c.title}
                  </div>
                  <div className="aichat-convo-actions">
                    <button
                      className="aichat-mini-btn"
                      onClick={(e) => handleStartRename(c.id, c.title, e)}
                      title="Renombrar"
                    >✏️</button>
                    <button
                      className="aichat-mini-btn"
                      onClick={(e) => handleDeleteChat(c.id, e)}
                      title="Borrar"
                    >🗑️</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="aichat-sidebar-footer">
          <button className="aichat-text-btn" onClick={handleClearAll}>
            🗑️ Borrar todas
          </button>
          <div className="aichat-footer-info">
            {conversations.length} conversación{conversations.length !== 1 ? 'es' : ''}
          </div>
        </div>
      </aside>

      {/* OVERLAY móvil */}
      {sidebarOpen && (
        <div
          className="aichat-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN */}
      <main className="aichat-main">
        <header className="aichat-topbar">
          <button className="aichat-icon-btn" onClick={() => setSidebarOpen(s => !s)} title="Menú">
            ☰
          </button>
          <div className="aichat-topbar-title">
            <span style={{ fontWeight: 700 }}>{activeConvo?.title || 'AI Chat'}</span>
            <span className="aichat-topbar-sub">{CHAT_MODELS.find(m => m.id === chatModel)?.name} · {IMAGE_MODELS.find(m => m.id === model)?.name}</span>
          </div>
          <button className="aichat-icon-btn" onClick={() => setShowSettings(s => !s)} title="Ajustes">⚙️</button>
        </header>

        {/* SETTINGS */}
        {showSettings && (
          <div className="aichat-settings">
            <div className="aichat-setting-row">
              <label>Modelo de chat (texto)</label>
              <select value={chatModel} onChange={e => setChatModel(e.target.value)}>
                {CHAT_MODELS.map(m => <option key={m.id} value={m.id}>{m.name} — {m.desc}</option>)}
              </select>
            </div>
            <div className="aichat-setting-row">
              <label>Modelo de imagen</label>
              <select value={model} onChange={e => setModel(e.target.value)}>
                {IMAGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name} — {m.desc}</option>)}
              </select>
            </div>
            <div className="aichat-setting-row">
              <label>API Endpoint</label>
              <select value={apiEndpoint} onChange={e => setApiEndpoint(e.target.value)}>
                {API_ENDPOINTS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </div>
            <div className="aichat-setting-row">
              <label>Aspect ratio</label>
              <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)}>
                {ASPECT_RATIOS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </div>
            <div className="aichat-setting-row">
              <label>Estilo del prompt</label>
              <select value={enhanceStyle} onChange={e => setEnhanceStyle(e.target.value)}>
                {ENHANCE_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div className="aichat-setting-row aichat-checkbox-row">
              <label>
                <input type="checkbox" checked={autoDetect} onChange={e => setAutoDetect(e.target.checked)} />
                <span>Detectar automáticamente "hazme una imagen…"</span>
              </label>
            </div>
          </div>
        )}

        {/* MESSAGES */}
        <div ref={scrollRef} className="aichat-messages">
          <div className="aichat-messages-inner">
            {messages.map((m) => (
              <MessageRow
                key={m.id}
                msg={m}
                onRegenerate={() => handleRegenerate(m)}
                onUseAsReference={() => handleUseAsReference(m)}
                onDownload={() => handleDownload(m)}
                onCopy={() => handleCopyText(m.content)}
              />
            ))}
            {loading && (
              <div className="aichat-row assistant">
                <div className="aichat-avatar assistant-avatar">🤖</div>
                <div className="aichat-bubble assistant">
                  <div className="aichat-typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* REF IMAGE PREVIEW */}
        {refImage && (
          <div className="aichat-ref-strip">
            <img src={refImage.dataUrl} alt="ref" />
            <div className="aichat-ref-info">
              <strong>📎 Imagen de referencia</strong>
              <span>{refImage.name} — la próxima generación la editará</span>
            </div>
            <button className="aichat-icon-btn" onClick={() => setRefImage(null)}>✕</button>
          </div>
        )}

        {/* INPUT BAR */}
        <div className="aichat-input-wrap">
          <div className="aichat-input-bar">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleAttach}
            />
            <button
              className="aichat-attach-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Adjuntar imagen como referencia"
              disabled={loading}
            >📎</button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Escribe un mensaje… (Shift+Enter = nueva línea)'
              rows={1}
              disabled={loading}
            />

            <button
              className="aichat-send-btn aichat-generate"
              onClick={() => handleSend('generate')}
              disabled={loading || !input.trim()}
              title="Generar imagen ahora"
            >🎨</button>

            <button
              className="aichat-send-btn"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              title="Enviar (Enter)"
            >➤</button>
          </div>
          <div className="aichat-input-hint">
            <span>Modelo chat: <strong>{CHAT_MODELS.find(m => m.id === chatModel)?.name}</strong></span>
            <span>·</span>
            <span>Imagen: <strong>{IMAGE_MODELS.find(m => m.id === model)?.name}</strong> ({aspectRatio})</span>
            <span>·</span>
            <span>Estilo: <strong>{ENHANCE_STYLES.find(s => s.id === enhanceStyle)?.label}</strong></span>
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── Mensaje ─────────────────────────────────────────────────────
function MessageRow({ msg, onRegenerate, onUseAsReference, onDownload, onCopy }) {
  const isUser = msg.role === 'user'

  if (msg.type === 'error') {
    return (
      <div className={`aichat-row ${isUser ? 'user' : 'assistant'}`}>
        <div className="aichat-avatar assistant-avatar">⚠️</div>
        <div className="aichat-bubble error">{msg.content}</div>
      </div>
    )
  }

  return (
    <div className={`aichat-row ${isUser ? 'user' : 'assistant'}`}>
      {!isUser && <div className="aichat-avatar assistant-avatar">🎨</div>}
      <div className={`aichat-bubble ${isUser ? 'user' : 'assistant'}`}>
        {msg.type === 'image' ? (
          <ImageContent msg={msg} onRegenerate={onRegenerate} onUseAsReference={onUseAsReference} onDownload={onDownload} />
        ) : (
          <>
            {msg.attachedImage && (
              <img src={msg.attachedImage} alt="adjunto" className="aichat-attached" />
            )}
            <div className="aichat-text-content">{msg.content}</div>
            {!isUser && msg.content && (
              <div className="aichat-text-actions">
                <button className="aichat-mini-action" onClick={onCopy} title="Copiar">📋</button>
              </div>
            )}
          </>
        )}
      </div>
      {isUser && <div className="aichat-avatar user-avatar">👤</div>}
    </div>
  )
}

function ImageContent({ msg, onRegenerate, onUseAsReference, onDownload }) {
  if (msg.status === 'loading') {
    return (
      <div className="aichat-image-loader">
        <div className="aichat-spinner"></div>
        <div className="aichat-loader-text">
          Generando imagen…
          {msg.prompt && <div className="aichat-loader-prompt">"{(msg.prompt || '').slice(0, 100)}…"</div>}
        </div>
      </div>
    )
  }
  if (msg.status === 'error') {
    return <div className="aichat-error-inline">❌ {msg.content}</div>
  }
  return (
    <>
      <img src={msg.imageDataUrl} alt={msg.prompt} className="aichat-generated-img" />
      <div className="aichat-image-meta">
        <span>📐 {msg.aspectRatio}</span>
        <span>🤖 {msg.modelUsed}</span>
      </div>
      {msg.prompt && (
        <div className="aichat-prompt-box">
          <strong>Prompt:</strong> {msg.prompt}
        </div>
      )}
      <div className="aichat-image-actions">
        <button className="aichat-action-btn" onClick={onDownload}>⬇ Descargar</button>
        <button className="aichat-action-btn" onClick={onRegenerate}>🔄 Regenerar</button>
        <button className="aichat-action-btn" onClick={onUseAsReference}>📎 Usar como referencia</button>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// STYLES (CSS-in-JS via <style>) — responsive estilo ChatGPT/Claude
// ═══════════════════════════════════════════════════════════════════

function Styles() {
  return (
    <style>{`
      .aichat-root {
        position: fixed; inset: 0;
        display: flex;
        background: #0d0e12;
        color: #e9eaf0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        font-size: 14px;
        overflow: hidden;
      }

      /* SIDEBAR */
      .aichat-sidebar {
        width: 280px;
        background: #161821;
        border-right: 1px solid #262a36;
        display: flex; flex-direction: column;
        flex-shrink: 0;
        transition: transform 0.25s ease, width 0.25s ease;
        z-index: 20;
      }
      .aichat-sidebar.closed {
        width: 0;
        border-right: none;
      }
      .aichat-sidebar.closed > * { display: none; }

      .aichat-sidebar-header {
        display: flex; align-items: center; gap: 10px;
        padding: 12px 14px;
        border-bottom: 1px solid #262a36;
      }
      .aichat-brand {
        flex: 1; font-weight: 700; font-size: 15px;
        background: linear-gradient(135deg, #0ea5e9, #6366f1, #db2777);
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .aichat-new-btn {
        display: flex; align-items: center; justify-content: flex-start;
        margin: 12px;
        padding: 12px 14px;
        background: linear-gradient(135deg, #0ea5e9, #6366f1);
        color: #fff; border: none; border-radius: 10px;
        cursor: pointer; font-weight: 600; font-size: 14px;
        transition: transform 0.1s, box-shadow 0.2s;
      }
      .aichat-new-btn:hover { box-shadow: 0 4px 16px rgba(99,102,241,0.4); transform: translateY(-1px); }

      .aichat-convo-list {
        flex: 1; overflow-y: auto;
        padding: 0 8px 8px;
        display: flex; flex-direction: column; gap: 2px;
      }
      .aichat-convo-item {
        display: flex; align-items: center;
        padding: 10px 12px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        color: #c4c8d4;
        transition: background 0.15s;
        position: relative;
      }
      .aichat-convo-item:hover { background: #1f2330; }
      .aichat-convo-item.active { background: #262a36; color: #fff; }
      .aichat-convo-title {
        flex: 1;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        padding-right: 4px;
      }
      .aichat-convo-actions {
        display: none;
        gap: 4px;
      }
      .aichat-convo-item:hover .aichat-convo-actions,
      .aichat-convo-item.active .aichat-convo-actions {
        display: flex;
      }
      .aichat-mini-btn {
        background: transparent; border: none; color: #888;
        cursor: pointer; padding: 4px 6px; border-radius: 4px;
        font-size: 12px;
      }
      .aichat-mini-btn:hover { background: #333947; color: #fff; }
      .aichat-rename-input {
        flex: 1;
        background: #0d0e12; color: #fff;
        border: 1px solid #6366f1; border-radius: 6px;
        padding: 4px 8px; font-size: 13px; outline: none;
      }

      .aichat-sidebar-footer {
        padding: 10px 14px;
        border-top: 1px solid #262a36;
        display: flex; flex-direction: column; gap: 6px;
      }
      .aichat-text-btn {
        background: transparent; border: none; color: #888;
        cursor: pointer; padding: 6px 0; font-size: 12px; text-align: left;
      }
      .aichat-text-btn:hover { color: #fff; }
      .aichat-footer-info { font-size: 11px; color: #5a5e72; }

      /* MAIN */
      .aichat-main {
        flex: 1; display: flex; flex-direction: column; min-width: 0;
        background: #0d0e12;
      }
      .aichat-topbar {
        display: flex; align-items: center; gap: 12px;
        padding: 10px 16px;
        border-bottom: 1px solid #262a36;
        background: #11131a;
      }
      .aichat-topbar-title {
        flex: 1; min-width: 0;
        display: flex; flex-direction: column;
      }
      .aichat-topbar-title > span:first-child {
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .aichat-topbar-sub { font-size: 11px; color: #7b8095; margin-top: 2px; }

      .aichat-icon-btn {
        background: #1f2330; color: #e9eaf0;
        border: 1px solid #262a36;
        padding: 8px 12px; border-radius: 8px;
        cursor: pointer; font-size: 14px;
        transition: background 0.15s;
      }
      .aichat-icon-btn:hover { background: #262a36; }

      /* SETTINGS */
      .aichat-settings {
        background: #11131a;
        border-bottom: 1px solid #262a36;
        padding: 14px 20px;
        display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
      }
      .aichat-setting-row { display: flex; flex-direction: column; gap: 4px; }
      .aichat-setting-row label {
        font-size: 11px; color: #9ca0b4; font-weight: 600;
        text-transform: uppercase; letter-spacing: 0.5px;
      }
      .aichat-setting-row select {
        background: #0d0e12; color: #e9eaf0;
        border: 1px solid #262a36; border-radius: 8px;
        padding: 8px 10px; font-size: 13px; outline: none;
      }
      .aichat-setting-row select:focus { border-color: #6366f1; }
      .aichat-checkbox-row label {
        display: flex; align-items: center; gap: 8px;
        text-transform: none; letter-spacing: 0; font-size: 13px;
        color: #e9eaf0; cursor: pointer;
      }

      /* MESSAGES */
      .aichat-messages {
        flex: 1; overflow-y: auto;
      }
      .aichat-messages-inner {
        max-width: 820px;
        margin: 0 auto;
        padding: 24px 20px 8px;
        display: flex; flex-direction: column; gap: 18px;
      }

      .aichat-row {
        display: flex; gap: 12px;
        align-items: flex-start;
      }
      .aichat-row.user { flex-direction: row-reverse; }

      .aichat-avatar {
        width: 32px; height: 32px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 16px; flex-shrink: 0;
      }
      .assistant-avatar { background: linear-gradient(135deg, #6366f1, #db2777); }
      .user-avatar { background: #2a2f3e; }

      .aichat-bubble {
        max-width: calc(100% - 56px);
        padding: 12px 16px;
        border-radius: 14px;
        line-height: 1.6;
        word-wrap: break-word;
        position: relative;
      }
      .aichat-bubble.assistant { background: #1a1d28; border: 1px solid #262a36; }
      .aichat-bubble.user {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: #fff;
      }
      .aichat-bubble.error { background: #3a1f1f; border: 1px solid #ff4d4d; color: #ff8a8a; }

      .aichat-text-content { white-space: pre-wrap; }
      .aichat-attached {
        max-width: 240px; max-height: 240px;
        border-radius: 8px; margin-bottom: 8px; display: block;
      }
      .aichat-text-actions {
        display: flex; gap: 6px; margin-top: 8px;
        opacity: 0; transition: opacity 0.15s;
      }
      .aichat-bubble:hover .aichat-text-actions { opacity: 1; }
      .aichat-mini-action {
        background: transparent; border: 1px solid #333947;
        color: #888; cursor: pointer;
        padding: 4px 8px; border-radius: 6px; font-size: 11px;
      }
      .aichat-mini-action:hover { color: #fff; border-color: #6366f1; }

      /* IMAGE BUBBLE */
      .aichat-generated-img {
        max-width: 100%; border-radius: 10px;
        display: block; margin-bottom: 8px;
      }
      .aichat-image-meta {
        display: flex; gap: 12px; font-size: 11px; color: #888; margin-bottom: 8px;
      }
      .aichat-prompt-box {
        background: #0d0e12; padding: 8px 10px; border-radius: 6px;
        font-size: 12px; color: #aab; margin-bottom: 8px;
        border-left: 3px solid #6366f1;
      }
      .aichat-image-actions {
        display: flex; gap: 6px; flex-wrap: wrap;
      }
      .aichat-action-btn {
        background: #262a36; color: #e9eaf0;
        border: 1px solid #333947; padding: 6px 10px;
        border-radius: 6px; cursor: pointer; font-size: 12px;
      }
      .aichat-action-btn:hover { background: #333947; }

      .aichat-image-loader {
        display: flex; flex-direction: column; align-items: center;
        padding: 20px; min-width: 200px;
      }
      .aichat-spinner {
        width: 32px; height: 32px; border-radius: 50%;
        border: 3px solid #333; border-top-color: #db2777;
        animation: aichat-spin 0.8s linear infinite;
      }
      .aichat-loader-text { margin-top: 12px; font-size: 13px; opacity: 0.8; text-align: center; }
      .aichat-loader-prompt { margin-top: 6px; font-style: italic; font-size: 12px; }
      .aichat-error-inline { color: #ff8a8a; }

      /* TYPING */
      .aichat-typing {
        display: flex; gap: 4px; padding: 4px 0;
      }
      .aichat-typing span {
        width: 8px; height: 8px; border-radius: 50%;
        background: #888;
        animation: aichat-pulse 1.4s infinite ease-in-out;
      }
      .aichat-typing span:nth-child(2) { animation-delay: 0.2s; }
      .aichat-typing span:nth-child(3) { animation-delay: 0.4s; }

      /* REF STRIP */
      .aichat-ref-strip {
        max-width: 820px; margin: 0 auto;
        display: flex; align-items: center; gap: 12px;
        padding: 8px 16px; margin-bottom: 4px;
        background: #1a1d28; border-radius: 10px;
        border: 1px solid #262a36;
      }
      .aichat-ref-strip img {
        width: 44px; height: 44px; object-fit: cover; border-radius: 6px;
      }
      .aichat-ref-info { flex: 1; display: flex; flex-direction: column; gap: 2px; font-size: 12px; }
      .aichat-ref-info span { color: #888; font-size: 11px; }

      /* INPUT */
      .aichat-input-wrap {
        padding: 12px 16px 16px;
        background: linear-gradient(180deg, transparent, #0d0e12 30%);
      }
      .aichat-input-bar {
        max-width: 820px; margin: 0 auto;
        display: flex; gap: 8px; align-items: flex-end;
        background: #1a1d28; border: 1px solid #262a36;
        border-radius: 14px; padding: 8px;
        transition: border-color 0.15s;
      }
      .aichat-input-bar:focus-within { border-color: #6366f1; }
      .aichat-input-bar textarea {
        flex: 1; background: transparent; color: #e9eaf0;
        border: none; outline: none; resize: none;
        padding: 8px 4px; font-size: 14px; line-height: 1.5;
        font-family: inherit; max-height: 200px;
      }
      .aichat-attach-btn, .aichat-send-btn {
        background: #262a36; color: #e9eaf0;
        border: none; border-radius: 10px;
        cursor: pointer; padding: 0 12px; height: 38px;
        font-size: 16px; flex-shrink: 0;
        transition: background 0.15s, transform 0.1s;
      }
      .aichat-attach-btn:hover, .aichat-send-btn:hover { background: #333947; }
      .aichat-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .aichat-send-btn.aichat-generate {
        background: linear-gradient(135deg, #6366f1, #db2777);
        color: #fff;
      }
      .aichat-send-btn.aichat-generate:disabled { opacity: 0.4; }

      .aichat-input-hint {
        max-width: 820px; margin: 8px auto 0;
        display: flex; gap: 8px; flex-wrap: wrap;
        font-size: 11px; color: #5a5e72;
      }
      .aichat-input-hint strong { color: #888; font-weight: 600; }

      /* OVERLAY (mobile) */
      .aichat-overlay { display: none; }
      .aichat-only-mobile { display: none; }

      /* RESPONSIVE */
      @media (max-width: 767px) {
        .aichat-sidebar {
          position: fixed; top: 0; bottom: 0; left: 0;
          width: 85%; max-width: 320px;
          z-index: 30;
        }
        .aichat-sidebar.closed { transform: translateX(-100%); width: 85%; max-width: 320px; }
        .aichat-sidebar.closed > * { display: flex; }
        .aichat-sidebar.closed .aichat-sidebar-header,
        .aichat-sidebar.closed .aichat-convo-list,
        .aichat-sidebar.closed .aichat-sidebar-footer { display: flex; }

        .aichat-overlay {
          display: block;
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 25;
        }
        .aichat-sidebar.closed ~ .aichat-overlay,
        .aichat-sidebar.closed + .aichat-overlay { display: none; }

        .aichat-only-mobile { display: inline-flex; }

        .aichat-messages-inner { padding: 16px 12px 8px; }
        .aichat-input-wrap { padding: 8px 10px 12px; }
        .aichat-bubble { max-width: calc(100% - 48px); padding: 10px 14px; }
        .aichat-avatar { width: 28px; height: 28px; font-size: 14px; }
        .aichat-settings { grid-template-columns: 1fr; padding: 12px; }
        .aichat-input-hint { font-size: 10px; }
      }
      @media (min-width: 768px) {
        .aichat-overlay { display: none !important; }
      }

      @keyframes aichat-spin { to { transform: rotate(360deg); } }
      @keyframes aichat-pulse {
        0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
        40% { opacity: 1; transform: scale(1); }
      }

      /* Scrollbars */
      .aichat-messages::-webkit-scrollbar,
      .aichat-convo-list::-webkit-scrollbar { width: 8px; }
      .aichat-messages::-webkit-scrollbar-track,
      .aichat-convo-list::-webkit-scrollbar-track { background: transparent; }
      .aichat-messages::-webkit-scrollbar-thumb,
      .aichat-convo-list::-webkit-scrollbar-thumb {
        background: #262a36; border-radius: 4px;
      }
      .aichat-messages::-webkit-scrollbar-thumb:hover,
      .aichat-convo-list::-webkit-scrollbar-thumb:hover { background: #333947; }
    `}</style>
  )
}
