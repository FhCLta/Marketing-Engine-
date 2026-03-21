import { useState, useRef, useEffect } from 'react'

// ═══════════════════════════════════════════════════════════════════
// AI IMAGE STUDIO - Generador de Imágenes con IA
// Separado del Motor de Publicidad 8K
// ═══════════════════════════════════════════════════════════════════

export default function ImageStudio({ onBack }) {
  // Main Tab: 'generate', 'edit', or 'promptLab'
  const [mainTab, setMainTab] = useState('generate')
  
  // Mode for generate/edit
  const [mode, setMode] = useState('generate')
  
  // Image states
  const [generatedImage, setGeneratedImage] = useState(null)
  const [referenceImage, setReferenceImage] = useState(null)
  const [referenceImageBase64, setReferenceImageBase64] = useState(null)
  
  // Prompt & Settings
  const [prompt, setPrompt] = useState('')
  const [selectedPreset, setSelectedPreset] = useState('luxury_real_estate')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Prompt Library
  const [promptLibrary, setPromptLibrary] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [categories, setCategories] = useState([])
  const [stylePresets, setStylePresets] = useState([])
  
  // History
  const [history, setHistory] = useState([])
  
  // === PROMPT LAB STATES ===
  const [pinterestImage, setPinterestImage] = useState(null)
  const [pinterestImageBase64, setPinterestImageBase64] = useState(null)
  const [backgroundImage, setBackgroundImage] = useState(null)
  const [backgroundImageBase64, setBackgroundImageBase64] = useState(null)
  const [projectName, setProjectName] = useState('')
  const [extractedData, setExtractedData] = useState(null)
  const [extractedColors, setExtractedColors] = useState(null)
  const [adaptedPrompt, setAdaptedPrompt] = useState(null)
  const [promptLabStep, setPromptLabStep] = useState(1) // 1: upload, 2: analyze, 3: adapt
  
  // === MARKETING AI CHAT STATES ===
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatImage, setChatImage] = useState(null)
  const [chatImageBase64, setChatImageBase64] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  
  // === MODEL SELECTION STATES ===
  const [chatModels, setChatModels] = useState([])
  const [imageModels, setImageModels] = useState([])
  const [selectedChatModel, setSelectedChatModel] = useState('gemini-2.5-flash')
  const [selectedImageModel, setSelectedImageModel] = useState('nano-banana-pro-preview')
  
  const fileInputRef = useRef(null)
  const pinterestInputRef = useRef(null)
  const backgroundInputRef = useRef(null)
  const chatInputRef = useRef(null)
  const chatImageInputRef = useRef(null)
  const chatEndRef = useRef(null)
  const speechRecognitionRef = useRef(null)
  
  // Load prompts and presets on mount
  useEffect(() => {
    loadPromptLibrary()
    loadStylePresets()
    loadAvailableModels()
  }, [])
  
  // Scroll to bottom of chat when new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])
  
  const loadAvailableModels = async () => {
    try {
      const resp = await fetch('http://localhost:8000/api/models')
      const data = await resp.json()
      setChatModels(data.chat_models || [])
      setImageModels(data.image_models || [])
    } catch (err) {
      console.error('Error loading models:', err)
    }
  }
  
  const loadPromptLibrary = async () => {
    try {
      const resp = await fetch('http://localhost:8000/api/studio/prompts')
      const data = await resp.json()
      setPromptLibrary(data.prompts || [])
      setCategories(data.categories || [])
    } catch (err) {
      console.error('Error loading prompts:', err)
    }
  }
  
  const loadStylePresets = async () => {
    try {
      const resp = await fetch('http://localhost:8000/api/studio/style-presets')
      const data = await resp.json()
      setStylePresets(data.presets || [])
    } catch (err) {
      console.error('Error loading presets:', err)
    }
  }
  
  // Handle reference image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      setReferenceImage(event.target.result)
      // Extract base64 without the data:image/... prefix
      const base64 = event.target.result.split(',')[1]
      setReferenceImageBase64(base64)
    }
    reader.readAsDataURL(file)
  }
  
  // Generate image from scratch
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Escribe un prompt para generar la imagen')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Use v2 endpoint with model selection
      const resp = await fetch('http://localhost:8000/api/studio/generate-image-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          aspect_ratio: '1:1',
          model: selectedImageModel
        })
      })
      
      const data = await resp.json()
      
      if (data.image_base64) {
        const imageUrl = `data:${data.mime_type};base64,${data.image_base64}`
        setGeneratedImage(imageUrl)
        
        // Add to history
        setHistory(prev => [{
          type: 'generate',
          prompt: prompt,
          image: imageUrl,
          model: data.model_used || selectedImageModel,
          timestamp: new Date().toISOString()
        }, ...prev.slice(0, 9)])
      } else {
        setError(data.error || 'Error generando imagen')
      }
    } catch (err) {
      setError(`Error de conexión: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  // Edit existing image
  const handleEdit = async () => {
    if (!referenceImageBase64) {
      setError('Sube una imagen de referencia primero')
      return
    }
    if (!prompt.trim()) {
      setError('Escribe instrucciones para editar la imagen')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const resp = await fetch('http://localhost:8000/api/studio/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: referenceImageBase64,
          prompt: prompt,
          style_preset: selectedPreset
        })
      })
      
      const data = await resp.json()
      
      if (data.success && data.image_base64) {
        const imageUrl = `data:${data.mime_type};base64,${data.image_base64}`
        setGeneratedImage(imageUrl)
        
        // Add to history
        setHistory(prev => [{
          type: 'edit',
          prompt: prompt,
          preset: selectedPreset,
          image: imageUrl,
          reference: referenceImage,
          timestamp: new Date().toISOString()
        }, ...prev.slice(0, 9)])
      } else {
        setError(data.error || 'Error editando imagen')
      }
    } catch (err) {
      setError(`Error de conexión: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  // Apply prompt from library
  const applyPrompt = (promptItem) => {
    setPrompt(promptItem.prompt)
    setMode('generate')
  }
  
  // Download generated image
  const downloadImage = () => {
    if (!generatedImage) return
    
    const link = document.createElement('a')
    link.href = generatedImage
    link.download = `bmc-ai-studio-${Date.now()}.png`
    link.click()
  }
  
  // Filter prompts by category
  const filteredPrompts = selectedCategory 
    ? promptLibrary.filter(p => p.category === selectedCategory)
    : promptLibrary

  // === PROMPT LAB FUNCTIONS ===
  
  // Handle Pinterest/reference image upload
  const handlePinterestUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      setPinterestImage(event.target.result)
      setPinterestImageBase64(event.target.result.split(',')[1])
      setExtractedData(null) // Reset extracted data
    }
    reader.readAsDataURL(file)
  }
  
  // Handle background image upload
  const handleBackgroundUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      setBackgroundImage(event.target.result)
      setBackgroundImageBase64(event.target.result.split(',')[1])
      setExtractedColors(null) // Reset colors
    }
    reader.readAsDataURL(file)
  }
  
  // Extract prompt from Pinterest image
  const handleExtractPrompt = async () => {
    if (!pinterestImageBase64) {
      setError('Sube una imagen de referencia primero')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const resp = await fetch('http://localhost:8000/api/studio/extract-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: pinterestImageBase64 })
      })
      
      const data = await resp.json()
      
      if (data.success || data.extracted_prompt) {
        setExtractedData(data)
        setPromptLabStep(2)
      } else {
        setError(data.error || 'Error extrayendo prompt')
      }
    } catch (err) {
      setError(`Error de conexión: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  // Extract colors from background
  const handleExtractColors = async () => {
    if (!backgroundImageBase64) {
      setError('Sube una imagen de fondo primero')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const resp = await fetch('http://localhost:8000/api/studio/extract-colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: backgroundImageBase64 })
      })
      
      const data = await resp.json()
      
      if (data.success || data.colors) {
        setExtractedColors(data)
      } else {
        setError(data.error || 'Error extrayendo colores')
      }
    } catch (err) {
      setError(`Error de conexión: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  // Adapt prompt to project
  const handleAdaptPrompt = async () => {
    if (!extractedData?.extracted_prompt) {
      setError('Primero extrae un prompt de la imagen de referencia')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const colorPalette = extractedColors?.colors?.map(c => c.hex) || null
      
      const resp = await fetch('http://localhost:8000/api/studio/adapt-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_prompt: extractedData.extracted_prompt,
          project_name: projectName || null,
          color_palette: colorPalette
        })
      })
      
      const data = await resp.json()
      
      if (data.success || data.adapted_prompt) {
        setAdaptedPrompt(data)
        setPromptLabStep(3)
      } else {
        setError(data.error || 'Error adaptando prompt')
      }
    } catch (err) {
      setError(`Error de conexión: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  // Apply adapted prompt to generate image
  const applyPromptToGenerate = (promptText) => {
    setPrompt(promptText)
    setMainTab('generate')
    setMode('generate')
  }
  
  // Copy prompt to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('✅ Prompt copiado al portapapeles')
  }
  
  // === MARKETING AI CHAT FUNCTIONS ===
  
  // Handle chat image upload
  const handleChatImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      setChatImage(event.target.result)
      setChatImageBase64(event.target.result.split(',')[1])
    }
    reader.readAsDataURL(file)
  }
  
  // Remove chat image
  const removeChatImage = () => {
    setChatImage(null)
    setChatImageBase64(null)
  }
  
  // Send chat message
  const sendChatMessage = async () => {
    if (!chatInput.trim() && !chatImageBase64) return
    
    // Guardar valores ANTES de limpiar (fix closure bug)
    const messageToSend = chatInput.trim() || "Analiza esta imagen"
    const imageToSend = chatImageBase64
    const currentHistory = [...chatMessages]
    
    const userMessage = {
      role: 'user',
      content: messageToSend,
      image: chatImage,
      timestamp: new Date().toLocaleTimeString()
    }
    
    // Limpiar INMEDIATAMENTE
    setChatInput('')
    setChatImage(null)
    setChatImageBase64(null)
    setChatMessages(prev => [...prev, userMessage])
    setChatLoading(true)
    
    // Reset textarea height
    if (chatInputRef.current) {
      chatInputRef.current.style.height = '44px'
    }
    
    try {
      const resp = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          model: selectedChatModel,
          history: currentHistory.map(m => ({ role: m.role, content: m.content })),
          image_base64: imageToSend,
          audio_base64: null
        })
      })
      
      const data = await resp.json()
      
      if (data.success || data.response) {
        const aiMessage = {
          role: 'assistant',
          content: data.response,
          model: data.model_used,
          timestamp: new Date().toLocaleTimeString()
        }
        setChatMessages(prev => [...prev, aiMessage])
      } else {
        const errorMessage = {
          role: 'assistant',
          content: `Error: ${data.error || 'Sin respuesta'}`,
          timestamp: new Date().toLocaleTimeString()
        }
        setChatMessages(prev => [...prev, errorMessage])
      }
    } catch (err) {
      const errorMessage = {
        role: 'assistant',
        content: `Error de conexión: ${err.message}`,
        timestamp: new Date().toLocaleTimeString()
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setChatLoading(false)
    }
  }
  
  // Auto-resize textarea
  const handleTextareaChange = (e) => {
    setChatInput(e.target.value)
    // Auto-resize
    e.target.style.height = '44px'
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
  }
  
  // Start/stop speech-to-text recognition
  const toggleRecording = () => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.')
      return
    }
    
    if (isRecording) {
      // Stop recognition
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop()
        speechRecognitionRef.current = null
      }
      setIsRecording(false)
    } else {
      // Start recognition
      const recognition = new SpeechRecognition()
      recognition.lang = 'es-MX' // Spanish (Mexico)
      recognition.continuous = false // Single phrase mode
      recognition.interimResults = true // Show partial results as you speak
      
      recognition.onresult = (event) => {
        let transcript = ''
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        // Update input while speaking (live preview)
        setChatInput(prev => {
          // Remove old transcript and add new one
          const baseText = prev.replace(/\[🎤.*\]$/, '').trim()
          return baseText + (baseText ? ' ' : '') + transcript
        })
      }
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        if (event.error === 'not-allowed') {
          alert('Permiso de micrófono denegado. Habilítalo en tu navegador.')
        } else if (event.error !== 'aborted') {
          alert(`Error de reconocimiento: ${event.error}`)
        }
        setIsRecording(false)
        speechRecognitionRef.current = null
      }
      
      recognition.onend = () => {
        setIsRecording(false)
        speechRecognitionRef.current = null
      }
      
      try {
        speechRecognitionRef.current = recognition
        recognition.start()
        setIsRecording(true)
      } catch (err) {
        console.error('Error starting speech recognition:', err)
        alert('Error al iniciar reconocimiento de voz')
      }
    }
  }
  
  // Clear chat history
  const clearChat = () => {
    setChatMessages([])
    setChatImage(null)
    setChatImageBase64(null)
  }
  
  // Extraer prompt limpio del texto
  const extractPromptFromText = (text) => {
    let extractedPrompt = text
    
    // Buscar bloques de código
    const codeMatch = text.match(/```(?:prompt|text)?\s*([\s\S]*?)```/)
    if (codeMatch) {
      return codeMatch[1].trim()
    }
    
    // Buscar comillas
    const quoteMatch = text.match(/"([^"]{20,})"/)
    if (quoteMatch) {
      return quoteMatch[1].trim()
    }
    
    // Buscar líneas que parezcan prompts (empiezan con keywords de imagen)
    const lines = text.split('\n')
    for (const line of lines) {
      const cleanLine = line.trim()
      if (cleanLine.length > 30 && 
          (cleanLine.match(/^(A |An |The |Una |Un |El |La |Imagen |Image |Prompt:|Vista |Escena )/i) ||
           cleanLine.includes('luxury') || 
           cleanLine.includes('villa') ||
           cleanLine.includes('pool') ||
           cleanLine.includes('ocean') ||
           cleanLine.includes('lujo') ||
           cleanLine.includes('mar') ||
           cleanLine.includes('piscina'))) {
        return cleanLine
      }
    }
    
    return extractedPrompt
  }
  
  // Apply prompt from chat in generator (go to generate tab)
  const applyPromptFromChat = (text) => {
    const extractedPrompt = extractPromptFromText(text)
    setPrompt(extractedPrompt)
    setMainTab('generate')
    setMode('generate')
  }
  
  // Generar imagen directamente desde el chat
  const generateImageFromChat = async (text) => {
    const extractedPrompt = extractPromptFromText(text)
    setPrompt(extractedPrompt)
    setMainTab('generate')
    setMode('generate')
    
    // Esperar un momento para que se actualice el estado y luego generar
    setTimeout(() => {
      handleGenerate()
    }, 100)
  }
  
  // Aplicar prompt para editar imagen
  const applyPromptForEdit = (text) => {
    const extractedPrompt = extractPromptFromText(text)
    setPrompt(extractedPrompt)
    setMainTab('edit')
    setMode('edit')
  }

  return (
    <div className="image-studio">
      {/* Header */}
      <div className="studio-header">
        <button className="back-btn" onClick={onBack}>
          ← Volver al Motor
        </button>
        <div className="studio-title">
          <h1>🎨 AI Image Studio</h1>
          <p>Genera y edita imágenes con IA para tus proyectos</p>
        </div>
      </div>
      
      {/* Main Tabs */}
      <div className="main-tabs">
        <button 
          className={`main-tab ${mainTab === 'generate' ? 'active' : ''}`}
          onClick={() => setMainTab('generate')}
        >
          ✨ Generar
        </button>
        <button 
          className={`main-tab ${mainTab === 'edit' ? 'active' : ''}`}
          onClick={() => setMainTab('edit')}
        >
          🖼️ Editar
        </button>
        <button 
          className={`main-tab ${mainTab === 'promptLab' ? 'active' : ''}`}
          onClick={() => setMainTab('promptLab')}
        >
          🧪 Prompt Lab
        </button>
        <button 
          className={`main-tab ${mainTab === 'chat' ? 'active' : ''}`}
          onClick={() => setMainTab('chat')}
        >
          🤖 Marketing AI
        </button>
      </div>
      
      {/* MARKETING AI CHAT TAB */}
      {mainTab === 'chat' ? (
        <div className="chat-container">
          <div className="chat-sidebar">
            <div className="chat-sidebar-header">
              <h3>🤖 Director de Marketing AI</h3>
              <p>Tu asistente para crear prompts y analizar imágenes</p>
            </div>
            
            {/* Model Selector */}
            <div className="model-selector">
              <label>🧠 Modelo:</label>
              <select 
                value={selectedChatModel}
                onChange={(e) => setSelectedChatModel(e.target.value)}
              >
                {chatModels.map(m => (
                  <option key={m.id} value={m.id}>{m.name} - {m.desc}</option>
                ))}
              </select>
            </div>
            
            {/* Quick Actions */}
            <div className="quick-actions">
              <h4>⚡ Acciones Rápidas</h4>
              <button onClick={() => setChatInput('Ayúdame a crear un prompt para una imagen de piscina infinity con vista al mar')}>
                🏊 Piscina Infinity
              </button>
              <button onClick={() => setChatInput('Quiero un prompt para una villa de lujo al atardecer')}>
                🏠 Villa Atardecer
              </button>
              <button onClick={() => setChatInput('Crea un prompt para un anuncio de real estate exclusivo')}>
                📱 Anuncio Real Estate
              </button>
              <button onClick={() => setChatInput('Analiza esta imagen y dime cómo mejorarla')}>
                🔍 Analizar Imagen
              </button>
            </div>
            
            <button className="clear-chat-btn" onClick={clearChat}>
              🗑️ Limpiar Chat
            </button>
          </div>
          
          <div className="chat-main">
            {/* Chat Messages */}
            <div className="chat-messages">
              {chatMessages.length === 0 && (
                <div className="chat-welcome">
                  <span>🤖</span>
                  <h3>¡Hola! Soy tu Director de Marketing AI</h3>
                  <p>Puedo ayudarte a:</p>
                  <ul>
                    <li>✨ Crear prompts optimizados para imágenes</li>
                    <li>🔍 Analizar imágenes de referencia</li>
                    <li>🎨 Sugerir mejoras de composición y color</li>
                    <li>📝 Mejorar copy para anuncios</li>
                  </ul>
                  <p>Escribe tu pregunta o sube una imagen para comenzar</p>
                </div>
              )}
              
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`chat-message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="message-content">
                    {msg.image && (
                      <img src={msg.image} alt="Attached" className="message-image" />
                    )}
                    <div className="message-text">{msg.content}</div>
                    <div className="message-meta">
                      <span>{msg.timestamp}</span>
                      {msg.model && <span className="model-badge">{msg.model}</span>}
                    </div>
                    {msg.role === 'assistant' && (
                      <div className="message-actions">
                        <button onClick={() => copyToClipboard(msg.content)}>📋 Copiar</button>
                        <button onClick={() => applyPromptFromChat(msg.content)}>✏️ Usar Prompt</button>
                        <button onClick={() => generateImageFromChat(msg.content)} className="generate-btn">🎨 Generar Imagen</button>
                        <button onClick={() => applyPromptForEdit(msg.content)}>🖼️ Editar Imagen</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {chatLoading && (
                <div className="chat-message assistant">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
            
            {/* Chat Input */}
            <div className="chat-input-container">
              {chatImage && (
                <div className="chat-image-preview">
                  <img src={chatImage} alt="To send" />
                  <button onClick={removeChatImage}>✕</button>
                </div>
              )}
              
              <div className="chat-input-row">
                <button 
                  className="attach-btn"
                  onClick={() => chatImageInputRef.current?.click()}
                  title="Adjuntar imagen"
                >
                  📎
                </button>
                <input
                  ref={chatImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleChatImageUpload}
                  style={{ display: 'none' }}
                />
                
                <button 
                  className={`mic-btn ${isRecording ? 'recording' : ''}`}
                  onClick={toggleRecording}
                  title={isRecording ? 'Detener dictado' : 'Dictar mensaje (voz a texto)'}
                >
                  {isRecording ? '🔴' : '🎤'}
                </button>
                
                <textarea
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={handleTextareaChange}
                  placeholder="Escribe tu mensaje o sube una imagen..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendChatMessage()
                    }
                  }}
                  rows={1}
                  style={{ minHeight: '44px', maxHeight: '200px', resize: 'none' }}
                />
                
                <button 
                  className="send-btn"
                  onClick={sendChatMessage}
                  disabled={chatLoading || (!chatInput.trim() && !chatImageBase64)}
                >
                  {chatLoading ? '⏳' : '➤'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) :
      
      /* PROMPT LAB TAB */
      mainTab === 'promptLab' ? (
        <div className="prompt-lab">
          <div className="lab-header">
            <h2>🧪 Prompt Engineering Lab</h2>
            <p>Extrae prompts de Pinterest, adapta a tu proyecto y colores</p>
          </div>
          
          <div className="lab-layout">
            {/* Left Column - Inputs */}
            <div className="lab-inputs">
              {/* Step 1: Pinterest Image */}
              <div className="lab-card">
                <div className="card-header">
                  <span className="step-badge">1</span>
                  <h3>📌 Imagen de Referencia</h3>
                </div>
                <p className="card-desc">Sube una imagen de Pinterest o diseño que quieras replicar</p>
                
                <div 
                  className="upload-box"
                  onClick={() => pinterestInputRef.current?.click()}
                >
                  {pinterestImage ? (
                    <img src={pinterestImage} alt="Pinterest" className="upload-preview" />
                  ) : (
                    <div className="upload-placeholder">
                      <span>📤</span>
                      <p>Click para subir</p>
                    </div>
                  )}
                </div>
                <input
                  ref={pinterestInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePinterestUpload}
                  style={{ display: 'none' }}
                />
                
                <button 
                  className="lab-btn primary"
                  onClick={handleExtractPrompt}
                  disabled={!pinterestImageBase64 || loading}
                >
                  {loading && promptLabStep === 1 ? '⏳ Analizando...' : '🔍 Extraer Prompt'}
                </button>
              </div>
              
              {/* Step 2: Background & Colors */}
              <div className={`lab-card ${!extractedData ? 'disabled' : ''}`}>
                <div className="card-header">
                  <span className="step-badge">2</span>
                  <h3>🎨 Imagen de Fondo (Opcional)</h3>
                </div>
                <p className="card-desc">Sube la foto de tu proyecto para extraer colores</p>
                
                <div 
                  className="upload-box small"
                  onClick={() => backgroundInputRef.current?.click()}
                >
                  {backgroundImage ? (
                    <img src={backgroundImage} alt="Background" className="upload-preview" />
                  ) : (
                    <div className="upload-placeholder">
                      <span>🖼️</span>
                      <p>Subir fondo</p>
                    </div>
                  )}
                </div>
                <input
                  ref={backgroundInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundUpload}
                  style={{ display: 'none' }}
                />
                
                {backgroundImageBase64 && (
                  <button 
                    className="lab-btn secondary"
                    onClick={handleExtractColors}
                    disabled={loading}
                  >
                    🎨 Extraer Colores
                  </button>
                )}
                
                {/* Color Palette Display */}
                {extractedColors?.colors && (
                  <div className="color-palette">
                    {extractedColors.colors.map((color, i) => (
                      <div key={i} className="color-swatch" title={color.name}>
                        <div 
                          className="swatch" 
                          style={{ background: color.hex }}
                        />
                        <span className="color-hex">{color.hex}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Step 3: Project Selection */}
              <div className={`lab-card ${!extractedData ? 'disabled' : ''}`}>
                <div className="card-header">
                  <span className="step-badge">3</span>
                  <h3>🏠 Proyecto (Opcional)</h3>
                </div>
                <input
                  type="text"
                  className="project-input"
                  placeholder="Ej: VELMARI, ALBA, MISTRAL..."
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
                
                <button 
                  className="lab-btn primary large"
                  onClick={handleAdaptPrompt}
                  disabled={!extractedData || loading}
                >
                  {loading ? '⏳ Adaptando...' : '🚀 Adaptar Prompt'}
                </button>
              </div>
            </div>
            
            {/* Right Column - Results */}
            <div className="lab-results">
              {/* Error Display */}
              {error && (
                <div className="error-box">⚠️ {error}</div>
              )}
              
              {/* Extracted Prompt */}
              {extractedData && (
                <div className="result-card">
                  <h3>🔍 Prompt Extraído</h3>
                  <div className="prompt-display">
                    {extractedData.extracted_prompt}
                  </div>
                  <div className="result-actions">
                    <button onClick={() => copyToClipboard(extractedData.extracted_prompt)}>
                      📋 Copiar
                    </button>
                    <button onClick={() => applyPromptToGenerate(extractedData.extracted_prompt)}>
                      ✨ Usar para Generar
                    </button>
                  </div>
                  
                  {/* Extracted Details */}
                  {extractedData.style && (
                    <div className="extracted-details">
                      <div className="detail-row">
                        <span className="label">Estilo:</span>
                        <span>{extractedData.style}</span>
                      </div>
                      {extractedData.lighting && (
                        <div className="detail-row">
                          <span className="label">Iluminación:</span>
                          <span>{extractedData.lighting}</span>
                        </div>
                      )}
                      {extractedData.composition && (
                        <div className="detail-row">
                          <span className="label">Composición:</span>
                          <span>{extractedData.composition}</span>
                        </div>
                      )}
                      {extractedData.key_elements && (
                        <div className="detail-row">
                          <span className="label">Elementos:</span>
                          <span>{extractedData.key_elements.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Adapted Prompt */}
              {adaptedPrompt && (
                <div className="result-card highlight">
                  <h3>🎯 Prompt Adaptado</h3>
                  <div className="prompt-display large">
                    {adaptedPrompt.adapted_prompt}
                  </div>
                  <div className="result-actions">
                    <button onClick={() => copyToClipboard(adaptedPrompt.adapted_prompt)}>
                      📋 Copiar
                    </button>
                    <button className="primary" onClick={() => applyPromptToGenerate(adaptedPrompt.adapted_prompt)}>
                      ✨ Generar Imagen
                    </button>
                  </div>
                  
                  {/* Variants */}
                  {adaptedPrompt.variants && adaptedPrompt.variants.length > 0 && (
                    <div className="variants-section">
                      <h4>📦 Variantes</h4>
                      {adaptedPrompt.variants.map((v, i) => (
                        <div key={i} className="variant-card">
                          <div className="variant-name">{v.name}</div>
                          <div className="variant-prompt">{v.prompt}</div>
                          <button 
                            className="variant-btn"
                            onClick={() => applyPromptToGenerate(v.prompt)}
                          >
                            Usar →
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Empty State */}
              {!extractedData && !loading && (
                <div className="empty-state">
                  <span>🧪</span>
                  <h3>Prompt Engineering Lab</h3>
                  <p>1. Sube una imagen de Pinterest/diseño</p>
                  <p>2. Extraemos el prompt que la generaría</p>
                  <p>3. Lo adaptamos a tu proyecto y colores</p>
                </div>
              )}
              
              {loading && (
                <div className="loading-state">
                  <div className="spinner-large" />
                  <p>Procesando con IA...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
      
      <div className="studio-layout">
        {/* Left Panel - Controls */}
        <div className="studio-controls">
          {/* Mode Selector */}
          <div className="mode-selector">
            <button 
              className={`mode-btn ${mode === 'generate' ? 'active' : ''}`}
              onClick={() => setMode('generate')}
            >
              ✨ Generar desde Cero
            </button>
            <button 
              className={`mode-btn ${mode === 'edit' ? 'active' : ''}`}
              onClick={() => setMode('edit')}
            >
              🖼️ Editar Imagen
            </button>
          </div>
          
          {/* Edit Mode: Reference Image Upload */}
          {mode === 'edit' && (
            <div className="reference-section">
              <label className="section-label">📷 Imagen de Referencia</label>
              <div 
                className="upload-zone"
                onClick={() => fileInputRef.current?.click()}
              >
                {referenceImage ? (
                  <img src={referenceImage} alt="Reference" className="reference-preview" />
                ) : (
                  <div className="upload-placeholder">
                    <span>📤</span>
                    <p>Click para subir imagen</p>
                    <small>La IA mantendrá la estructura y colores</small>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              
              {/* Style Presets */}
              <label className="section-label">🎭 Estilo de Edición</label>
              <div className="presets-grid">
                {stylePresets.map(preset => (
                  <button
                    key={preset.id}
                    className={`preset-btn ${selectedPreset === preset.id ? 'active' : ''}`}
                    onClick={() => setSelectedPreset(preset.id)}
                    title={preset.desc}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Prompt Input */}
          <div className="prompt-section">
            <label className="section-label">
              {mode === 'generate' ? '✍️ Describe la imagen' : '✍️ Instrucciones de edición'}
            </label>
            <textarea
              className="prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={mode === 'generate' 
                ? "Ej: Luxury beachfront villa at golden hour, infinity pool, palm trees..."
                : "Ej: Mejorar iluminación a golden hour, hacer el cielo más dramático..."}
              rows={4}
            />
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="error-box">
              ⚠️ {error}
            </div>
          )}
          
          {/* Model Selector */}
          <div className="model-select-section">
            <label className="section-label">🧠 Modelo de IA</label>
            <select 
              className="model-select"
              value={selectedImageModel}
              onChange={(e) => setSelectedImageModel(e.target.value)}
            >
              {imageModels.map(m => (
                <option key={m.id} value={m.id}>{m.name} - {m.desc}</option>
              ))}
            </select>
          </div>
          
          {/* Action Button */}
          <button 
            className="generate-btn"
            onClick={mode === 'generate' ? handleGenerate : handleEdit}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Procesando magia de IA... (1-2 min)
              </>
            ) : mode === 'generate' ? (
              '✨ Generar Imagen'
            ) : (
              '🎨 Editar Imagen'
            )}
          </button>
          
          {/* Prompt Library */}
          <div className="library-section">
            <label className="section-label">📚 Biblioteca de Prompts</label>
            
            {/* Category Filter */}
            <div className="category-tabs">
              <button 
                className={`cat-tab ${!selectedCategory ? 'active' : ''}`}
                onClick={() => setSelectedCategory(null)}
              >
                Todos
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`cat-tab ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>
            
            {/* Prompt Cards */}
            <div className="prompts-list">
              {filteredPrompts.slice(0, 6).map((item, idx) => (
                <div key={idx} className="prompt-card" onClick={() => applyPrompt(item)}>
                  <div className="prompt-card-name">{item.name}</div>
                  <div className="prompt-card-text">{item.prompt.slice(0, 80)}...</div>
                  <div className="prompt-card-tags">
                    {item.tags?.slice(0, 3).map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right Panel - Result */}
        <div className="studio-result">
          <div className="result-container">
            {loading ? (
              <div className="loading-state">
                <div className="flask-animation">
                  <div className="flask">🧪</div>
                </div>
                <p>Generando imagen con IA...</p>
                <small>Esto puede tomar 1-2 minutos</small>
              </div>
            ) : generatedImage ? (
              <>
                <img src={generatedImage} alt="Generated" className="result-image" />
                <div className="result-actions">
                  <button className="action-btn" onClick={downloadImage}>
                    📥 Descargar
                  </button>
                  <button className="action-btn" onClick={() => {
                    setReferenceImage(generatedImage)
                    setReferenceImageBase64(generatedImage.split(',')[1])
                    setMode('edit')
                  }}>
                    🔄 Usar como Referencia
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">🎨</span>
                <p>Tu imagen aparecerá aquí</p>
                <small>Escribe un prompt y haz click en generar</small>
              </div>
            )}
          </div>
          
          {/* History */}
          {history.length > 0 && (
            <div className="history-section">
              <label className="section-label">📜 Historial</label>
              <div className="history-grid">
                {history.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="history-item"
                    onClick={() => setGeneratedImage(item.image)}
                  >
                    <img src={item.image} alt={`History ${idx}`} />
                    <div className="history-badge">
                      {item.type === 'generate' ? '✨' : '🖼️'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      )}
      
      {/* Styles */}
      <style>{`
        .image-studio {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%);
          color: #fff;
          padding: 20px;
        }
        
        .studio-header {
          display: flex;
          align-items: center;
          gap: 30px;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(212, 175, 55, 0.3);
        }
        
        .back-btn {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .back-btn:hover {
          background: rgba(212, 175, 55, 0.2);
          border-color: #d4af37;
        }
        
        .studio-title h1 {
          margin: 0;
          font-size: 1.8rem;
          background: linear-gradient(90deg, #d4af37, #f4d03f);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .studio-title p {
          margin: 5px 0 0;
          opacity: 0.7;
          font-size: 0.9rem;
        }
        
        .studio-layout {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 30px;
          max-width: 1600px;
          margin: 0 auto;
        }
        
        .studio-controls {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .mode-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        
        .mode-btn {
          padding: 15px;
          border: 2px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.05);
          color: #fff;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.9rem;
        }
        
        .mode-btn:hover {
          border-color: rgba(212, 175, 55, 0.5);
        }
        
        .mode-btn.active {
          border-color: #d4af37;
          background: rgba(212, 175, 55, 0.15);
        }
        
        .section-label {
          display: block;
          font-weight: 600;
          margin-bottom: 10px;
          color: #d4af37;
        }
        
        .upload-zone {
          border: 2px dashed rgba(255,255,255,0.3);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          min-height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .upload-zone:hover {
          border-color: #d4af37;
          background: rgba(212, 175, 55, 0.05);
        }
        
        .upload-placeholder {
          opacity: 0.7;
        }
        
        .upload-placeholder span {
          font-size: 2rem;
        }
        
        .reference-preview {
          max-width: 100%;
          max-height: 200px;
          border-radius: 8px;
        }
        
        .presets-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        
        .preset-btn {
          padding: 8px 12px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.05);
          color: #fff;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.75rem;
          transition: all 0.2s;
        }
        
        .preset-btn:hover {
          border-color: rgba(212, 175, 55, 0.5);
        }
        
        .preset-btn.active {
          border-color: #d4af37;
          background: rgba(212, 175, 55, 0.2);
        }
        
        .prompt-input {
          width: 100%;
          padding: 15px;
          border: 2px solid rgba(255,255,255,0.2);
          background: rgba(0,0,0,0.3);
          color: #fff;
          border-radius: 10px;
          font-size: 0.95rem;
          resize: vertical;
          font-family: inherit;
        }
        
        .prompt-input:focus {
          outline: none;
          border-color: #d4af37;
        }
        
        .error-box {
          background: rgba(255, 50, 50, 0.2);
          border: 1px solid rgba(255, 50, 50, 0.5);
          padding: 12px;
          border-radius: 8px;
          font-size: 0.85rem;
        }
        
        .generate-btn {
          width: 100%;
          padding: 18px;
          border: none;
          background: linear-gradient(135deg, #d4af37, #b8860b);
          color: #000;
          font-weight: bold;
          font-size: 1.1rem;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        
        .generate-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(212, 175, 55, 0.3);
        }
        
        .generate-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .category-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }
        
        .cat-tab {
          padding: 6px 12px;
          border: 1px solid rgba(255,255,255,0.2);
          background: transparent;
          color: #fff;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.75rem;
          text-transform: capitalize;
        }
        
        .cat-tab.active {
          background: #d4af37;
          color: #000;
          border-color: #d4af37;
        }
        
        .prompts-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .prompt-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .prompt-card:hover {
          border-color: #d4af37;
          background: rgba(212, 175, 55, 0.1);
        }
        
        .prompt-card-name {
          font-weight: 600;
          margin-bottom: 5px;
        }
        
        .prompt-card-text {
          font-size: 0.8rem;
          opacity: 0.7;
          margin-bottom: 8px;
        }
        
        .prompt-card-tags {
          display: flex;
          gap: 5px;
        }
        
        .tag {
          background: rgba(212, 175, 55, 0.2);
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 0.7rem;
          color: #d4af37;
        }
        
        .studio-result {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .result-container {
          background: rgba(0,0,0,0.3);
          border: 2px solid rgba(255,255,255,0.1);
          border-radius: 15px;
          min-height: 500px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .loading-state {
          text-align: center;
        }
        
        .flask-animation {
          font-size: 4rem;
          animation: bubble 2s ease-in-out infinite;
        }
        
        @keyframes bubble {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        
        .empty-state {
          text-align: center;
          opacity: 0.5;
        }
        
        .empty-icon {
          font-size: 4rem;
        }
        
        .result-image {
          max-width: 100%;
          max-height: 600px;
          border-radius: 10px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        
        .result-actions {
          display: flex;
          gap: 15px;
          margin-top: 20px;
        }
        
        .action-btn {
          padding: 12px 24px;
          border: 1px solid rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.1);
          color: #fff;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .action-btn:hover {
          background: rgba(212, 175, 55, 0.2);
          border-color: #d4af37;
        }
        
        .history-section {
          background: rgba(0,0,0,0.2);
          border-radius: 10px;
          padding: 15px;
        }
        
        .history-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
        }
        
        .history-item {
          position: relative;
          cursor: pointer;
          border-radius: 8px;
          overflow: hidden;
          aspect-ratio: 1;
          transition: all 0.2s;
        }
        
        .history-item:hover {
          transform: scale(1.05);
        }
        
        .history-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .history-badge {
          position: absolute;
          top: 5px;
          right: 5px;
          background: rgba(0,0,0,0.7);
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 0.7rem;
        }
        
        @media (max-width: 1000px) {
          .studio-layout {
            grid-template-columns: 1fr;
          }
        }
        
        /* === PROMPT LAB STYLES === */
        .main-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 25px;
        }
        
        .main-tab {
          padding: 12px 24px;
          border: 2px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.05);
          color: #fff;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .main-tab:hover {
          border-color: rgba(212, 175, 55, 0.5);
        }
        
        .main-tab.active {
          border-color: #d4af37;
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(184, 134, 11, 0.1));
          color: #d4af37;
        }
        
        .prompt-lab {
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .lab-header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .lab-header h2 {
          font-size: 1.8rem;
          background: linear-gradient(90deg, #d4af37, #f4d03f);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0 0 8px;
        }
        
        .lab-header p {
          opacity: 0.7;
          margin: 0;
        }
        
        .lab-layout {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 30px;
        }
        
        .lab-inputs {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .lab-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 20px;
        }
        
        .lab-card.disabled {
          opacity: 0.5;
          pointer-events: none;
        }
        
        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }
        
        .step-badge {
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #d4af37, #b8860b);
          color: #000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.9rem;
        }
        
        .card-header h3 {
          margin: 0;
          font-size: 1rem;
        }
        
        .card-desc {
          font-size: 0.85rem;
          opacity: 0.7;
          margin: 0 0 15px;
        }
        
        .upload-box {
          border: 2px dashed rgba(255,255,255,0.3);
          border-radius: 10px;
          padding: 25px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 15px;
        }
        
        .upload-box.small {
          min-height: 80px;
          padding: 15px;
        }
        
        .upload-box:hover {
          border-color: #d4af37;
          background: rgba(212, 175, 55, 0.05);
        }
        
        .upload-preview {
          max-width: 100%;
          max-height: 150px;
          border-radius: 8px;
        }
        
        .upload-placeholder span {
          font-size: 2rem;
        }
        
        .upload-placeholder p {
          margin: 8px 0 0;
          font-size: 0.85rem;
          opacity: 0.7;
        }
        
        .lab-btn {
          width: 100%;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .lab-btn.primary {
          background: linear-gradient(135deg, #d4af37, #b8860b);
          color: #000;
        }
        
        .lab-btn.primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(212, 175, 55, 0.3);
        }
        
        .lab-btn.secondary {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.3);
          color: #fff;
        }
        
        .lab-btn.large {
          padding: 16px 24px;
          font-size: 1.1rem;
        }
        
        .lab-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .color-palette {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 15px;
        }
        
        .color-swatch {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        
        .swatch {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 2px solid rgba(255,255,255,0.2);
        }
        
        .color-hex {
          font-size: 0.65rem;
          opacity: 0.7;
        }
        
        .project-input {
          width: 100%;
          padding: 12px 15px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(0,0,0,0.3);
          color: #fff;
          border-radius: 8px;
          font-size: 0.95rem;
          margin-bottom: 15px;
        }
        
        .project-input:focus {
          outline: none;
          border-color: #d4af37;
        }
        
        .lab-results {
          min-height: 400px;
        }
        
        .result-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .result-card.highlight {
          border-color: #d4af37;
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(184, 134, 11, 0.05));
        }
        
        .result-card h3 {
          margin: 0 0 15px;
          font-size: 1.1rem;
        }
        
        .prompt-display {
          background: rgba(0,0,0,0.4);
          border-radius: 8px;
          padding: 15px;
          font-size: 0.9rem;
          line-height: 1.5;
          margin-bottom: 15px;
          max-height: 200px;
          overflow-y: auto;
        }
        
        .prompt-display.large {
          font-size: 1rem;
          max-height: 250px;
        }
        
        .result-actions button {
          padding: 10px 18px;
          border: 1px solid rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.1);
          color: #fff;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          margin-right: 10px;
          transition: all 0.2s;
        }
        
        .result-actions button:hover {
          background: rgba(212, 175, 55, 0.2);
          border-color: #d4af37;
        }
        
        .result-actions button.primary {
          background: #d4af37;
          color: #000;
          border-color: #d4af37;
          font-weight: 500;
        }
        
        .extracted-details {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .detail-row {
          display: flex;
          gap: 10px;
          margin-bottom: 8px;
          font-size: 0.85rem;
        }
        
        .detail-row .label {
          color: #d4af37;
          font-weight: 500;
          min-width: 100px;
        }
        
        .variants-section {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .variants-section h4 {
          margin: 0 0 15px;
          font-size: 0.95rem;
        }
        
        .variant-card {
          background: rgba(0,0,0,0.3);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 10px;
        }
        
        .variant-name {
          font-weight: 600;
          margin-bottom: 6px;
          color: #d4af37;
        }
        
        .variant-prompt {
          font-size: 0.8rem;
          opacity: 0.8;
          margin-bottom: 10px;
          line-height: 1.4;
        }
        
        .variant-btn {
          padding: 6px 12px;
          background: rgba(212, 175, 55, 0.2);
          border: 1px solid #d4af37;
          color: #d4af37;
          border-radius: 5px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.2s;
        }
        
        .variant-btn:hover {
          background: #d4af37;
          color: #000;
        }
        
        .empty-state span {
          font-size: 4rem;
          display: block;
          margin-bottom: 15px;
        }
        
        .empty-state h3 {
          margin: 0 0 15px;
        }
        
        .empty-state p {
          margin: 5px 0;
          opacity: 0.7;
          font-size: 0.9rem;
        }
        
        .loading-state {
          text-align: center;
          padding: 40px;
        }
        
        .spinner-large {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(212, 175, 55, 0.2);
          border-top-color: #d4af37;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        
        @media (max-width: 900px) {
          .lab-layout {
            grid-template-columns: 1fr;
          }
        }
        
        /* === MODEL SELECTOR STYLES === */
        .model-select-section {
          margin-bottom: 15px;
        }
        
        .model-select {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid rgba(255,255,255,0.2);
          background: rgba(0,0,0,0.3);
          color: #fff;
          border-radius: 8px;
          font-size: 0.9rem;
          cursor: pointer;
        }
        
        .model-select:focus {
          outline: none;
          border-color: #d4af37;
        }
        
        .model-select option {
          background: #1a1a2e;
          color: #fff;
        }
        
        /* === MARKETING AI CHAT STYLES === */
        .chat-container {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 20px;
          height: calc(100vh - 200px);
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .chat-sidebar {
          background: rgba(0,0,0,0.3);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .chat-sidebar-header h3 {
          margin: 0 0 8px;
          font-size: 1.1rem;
          color: #d4af37;
        }
        
        .chat-sidebar-header p {
          margin: 0;
          font-size: 0.85rem;
          opacity: 0.7;
        }
        
        .model-selector label {
          display: block;
          font-size: 0.85rem;
          color: #d4af37;
          margin-bottom: 8px;
        }
        
        .model-selector select {
          width: 100%;
          padding: 10px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(0,0,0,0.4);
          color: #fff;
          border-radius: 6px;
          font-size: 0.85rem;
        }
        
        .quick-actions h4 {
          margin: 0 0 10px;
          font-size: 0.9rem;
          color: #d4af37;
        }
        
        .quick-actions button {
          width: 100%;
          padding: 10px 12px;
          margin-bottom: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: #fff;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          text-align: left;
          transition: all 0.2s;
        }
        
        .quick-actions button:hover {
          border-color: #d4af37;
          background: rgba(212, 175, 55, 0.1);
        }
        
        .clear-chat-btn {
          margin-top: auto;
          padding: 10px;
          border: 1px solid rgba(255,100,100,0.3);
          background: rgba(255,100,100,0.1);
          color: #ff6b6b;
          border-radius: 6px;
          cursor: pointer;
        }
        
        .chat-main {
          display: flex;
          flex-direction: column;
          background: rgba(0,0,0,0.2);
          border-radius: 12px;
          overflow: hidden;
        }
        
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .chat-welcome {
          text-align: center;
          padding: 40px;
          opacity: 0.8;
        }
        
        .chat-welcome span {
          font-size: 4rem;
        }
        
        .chat-welcome h3 {
          margin: 15px 0;
        }
        
        .chat-welcome ul {
          list-style: none;
          padding: 0;
          margin: 20px 0;
        }
        
        .chat-welcome li {
          margin: 8px 0;
        }
        
        .chat-message {
          display: flex;
          gap: 12px;
          max-width: 85%;
        }
        
        .chat-message.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        
        .message-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(212, 175, 55, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
        }
        
        .chat-message.user .message-avatar {
          background: rgba(255,255,255,0.1);
        }
        
        .message-content {
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 12px 16px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        
        .chat-message.user .message-content {
          background: rgba(212, 175, 55, 0.15);
          border-color: rgba(212, 175, 55, 0.3);
        }
        
        .message-image {
          max-width: 200px;
          border-radius: 8px;
          margin-bottom: 10px;
        }
        
        .message-text {
          font-size: 0.95rem;
          line-height: 1.5;
          white-space: pre-wrap;
        }
        
        .message-meta {
          display: flex;
          gap: 10px;
          margin-top: 8px;
          font-size: 0.75rem;
          opacity: 0.6;
        }
        
        .model-badge {
          background: rgba(212, 175, 55, 0.2);
          padding: 2px 6px;
          border-radius: 4px;
          color: #d4af37;
        }
        
        .message-actions {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }
        
        .message-actions button {
          padding: 5px 10px;
          border: 1px solid rgba(255,255,255,0.2);
          background: transparent;
          color: #fff;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
        }
        
        .message-actions button:hover {
          background: rgba(212, 175, 55, 0.2);
          border-color: #d4af37;
        }
        
        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 5px 0;
        }
        
        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: #d4af37;
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;
        }
        
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        
        .chat-input-container {
          border-top: 1px solid rgba(255,255,255,0.1);
          padding: 15px;
          background: rgba(0,0,0,0.2);
        }
        
        .chat-image-preview {
          position: relative;
          display: inline-block;
          margin-bottom: 10px;
        }
        
        .chat-image-preview img {
          max-width: 100px;
          max-height: 100px;
          border-radius: 8px;
        }
        
        .chat-image-preview button {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ff4444;
          border: none;
          color: #fff;
          cursor: pointer;
          font-size: 0.8rem;
        }
        
        .chat-input-row {
          display: flex;
          gap: 10px;
          align-items: flex-end;
        }
        
        .attach-btn, .mic-btn, .send-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.05);
          color: #fff;
          cursor: pointer;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        
        .attach-btn:hover, .mic-btn:hover {
          border-color: #d4af37;
          background: rgba(212, 175, 55, 0.1);
        }
        
        .mic-btn.recording {
          background: #ff4444;
          border-color: #ff4444;
          animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        .send-btn {
          background: linear-gradient(135deg, #d4af37, #b8860b);
          border: none;
          color: #000;
        }
        
        .send-btn:hover:not(:disabled) {
          transform: scale(1.05);
        }
        
        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .chat-input-row textarea {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(0,0,0,0.3);
          color: #fff;
          border-radius: 22px;
          font-size: 0.95rem;
          resize: none;
          max-height: 120px;
          min-height: 44px;
          font-family: inherit;
        }
        
        .chat-input-row textarea:focus {
          outline: none;
          border-color: #d4af37;
        }
        
        @media (max-width: 900px) {
          .chat-container {
            grid-template-columns: 1fr;
            height: auto;
          }
          
          .chat-sidebar {
            order: 2;
          }
          
          .chat-main {
            height: 60vh;
          }
        }
      `}</style>
    </div>
  )
}
