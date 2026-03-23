import { useState, useRef, useEffect } from 'react'

// Auth & Database Services
import { signInWithGoogle, logOut, onAuthChange } from '../services/authService'
import { 
  saveDesign, 
  getUserDesigns, 
  deleteDesign,
  toggleFavorite,
  rateDesign,
  getAILearningContext,
  formatContextForPrompt
} from '../services/designsService'
import {
  createConversation,
  getUserConversations,
  getConversation,
  updateConversation,
  deleteConversation,
  renameConversation
} from '../services/conversationsService'

// ═══════════════════════════════════════════════════════════════════
// AI IMAGE STUDIO - Generador de Imágenes con IA
// Con sistema de usuarios, guardado de diseños y aprendizaje de IA
// ═══════════════════════════════════════════════════════════════════

export default function ImageStudio({ onBack }) {
  // === AUTH STATES ===
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  
  // === CONVERSATIONS STATES ===
  const [conversations, setConversations] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [showConversationsSidebar, setShowConversationsSidebar] = useState(true)
  const [editingConversationId, setEditingConversationId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  
  // === DESIGNS GALLERY STATES ===
  const [savedDesigns, setSavedDesigns] = useState([])
  const [loadingDesigns, setLoadingDesigns] = useState(false)
  const [aiLearningContext, setAiLearningContext] = useState(null)
  const [selectedDesignForView, setSelectedDesignForView] = useState(null)
  // savingDesign and lastSavedId - used for UI feedback
  const [savingDesign, setSavingDesign] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [, setLastSavedId] = useState(null)
  
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
  
  // === API ENDPOINT SELECTION ===
  const [selectedApiEndpoint, setSelectedApiEndpoint] = useState('auto') // 'auto', 'gemini', 'vertex'
  
  // === HTML AD BUILDER STATES (Design Copilot) ===
  const [htmlBuilderImage, setHtmlBuilderImage] = useState(null)
  const [htmlBuilderImageBase64, setHtmlBuilderImageBase64] = useState(null)
  const [htmlAdFormat, setHtmlAdFormat] = useState('1:1')
  const [htmlPreviewBg, setHtmlPreviewBg] = useState('dark')
  const [generatedHtml, setGeneratedHtml] = useState(null)
  
  // Design Copilot Chat states
  const [designChatMessages, setDesignChatMessages] = useState([])
  const [designChatInput, setDesignChatInput] = useState('')
  const [designChatLoading, setDesignChatLoading] = useState(false)
  const [designChatImage, setDesignChatImage] = useState(null) // Image for AI review
  const [designChatImageBase64, setDesignChatImageBase64] = useState(null)
  const [isDesignRecording, setIsDesignRecording] = useState(false) // Voice recording for Design Copilot
  const [designCopilotModel, setDesignCopilotModel] = useState('claude-sonnet-4-20250514') // Model for Design Copilot - Claude default for better editing
  
  const fileInputRef = useRef(null)
  const pinterestInputRef = useRef(null)
  const backgroundInputRef = useRef(null)
  const chatInputRef = useRef(null)
  const chatImageInputRef = useRef(null)
  const chatEndRef = useRef(null)
  const speechRecognitionRef = useRef(null)
  const designSpeechRecognitionRef = useRef(null) // For Design Copilot voice
  const htmlBuilderInputRef = useRef(null)
  const designChatEndRef = useRef(null)
  const designChatInputRef = useRef(null)
  const designChatImageInputRef = useRef(null)
  
  // Load prompts and presets on mount
  useEffect(() => {
    loadPromptLibrary()
    loadStylePresets()
    loadAvailableModels()
  }, [])
  
  // === AUTH LISTENER ===
  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      setUser(authUser)
      setAuthLoading(false)
      if (authUser) {
        // Load user's designs
        loadUserDesigns(authUser.uid)
        // Load AI learning context
        loadAIContext(authUser.uid)
        // Load user's conversations
        loadUserConversations(authUser.uid)
      } else {
        setSavedDesigns([])
        setAiLearningContext(null)
        setConversations([])
        setCurrentConversationId(null)
      }
    })
    return () => unsubscribe()
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
  
  // ═══════════════════════════════════════════════════════════════════
  // AUTH & USER FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════
  
  const handleLogin = async () => {
    const { error: authError } = await signInWithGoogle()
    if (authError) {
      setError('Error iniciando sesión: ' + authError)
    } else {
      setShowLoginModal(false)
    }
  }
  
  const handleLogout = async () => {
    await logOut()
    setUser(null)
    setSavedDesigns([])
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // CONVERSATIONS MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════
  
  const loadUserConversations = async (userId) => {
    setLoadingConversations(true)
    const { conversations: convos, error: loadError } = await getUserConversations(userId, 50)
    if (!loadError) {
      setConversations(convos)
    }
    setLoadingConversations(false)
  }
  
  const handleNewConversation = async () => {
    if (!user) {
      setShowLoginModal(true)
      return
    }
    
    // Clear current chat
    setDesignChatMessages([])
    setGeneratedHtml(null)
    setCurrentConversationId(null)
    
    // Will create conversation on first message
  }
  
  const handleSelectConversation = async (conversationId) => {
    const { conversation, error: loadError } = await getConversation(conversationId)
    if (loadError || !conversation) {
      setError('Error cargando conversación')
      return
    }
    
    setCurrentConversationId(conversationId)
    setDesignChatMessages(conversation.messages || [])
    setGeneratedHtml(conversation.lastHtml || null)
    setHtmlAdFormat(conversation.format || '1:1')
  }
  
  const handleDeleteConversation = async (conversationId) => {
    if (!confirm('¿Eliminar esta conversación?')) return
    
    const { error: deleteError } = await deleteConversation(conversationId)
    if (!deleteError) {
      setConversations(prev => prev.filter(c => c.id !== conversationId))
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null)
        setDesignChatMessages([])
        setGeneratedHtml(null)
      }
    }
  }
  
  const handleRenameConversation = async (conversationId, newTitle) => {
    const { error: renameError } = await renameConversation(conversationId, newTitle)
    if (!renameError) {
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, title: newTitle } : c
      ))
    }
    setEditingConversationId(null)
  }
  
  const saveCurrentConversation = async (messages, html = null) => {
    if (!user) return
    
    if (currentConversationId) {
      // Update existing conversation
      await updateConversation(currentConversationId, {
        messages,
        lastHtml: html || generatedHtml,
        format: htmlAdFormat
      })
    } else if (messages.length > 0) {
      // Create new conversation
      const firstUserMsg = messages.find(m => m.role === 'user')
      const { id, error: createError } = await createConversation(user.uid, firstUserMsg)
      if (!createError && id) {
        setCurrentConversationId(id)
        // Update with all messages
        await updateConversation(id, {
          messages,
          lastHtml: html,
          format: htmlAdFormat
        })
        // Refresh list
        loadUserConversations(user.uid)
      }
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // DESIGNS MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════
  
  const loadUserDesigns = async (userId) => {
    setLoadingDesigns(true)
    const { designs, error: loadError } = await getUserDesigns(userId, 100)
    if (!loadError) {
      setSavedDesigns(designs)
      console.log(`Loaded ${designs.length} designs`)
    } else {
      console.error('Error loading designs:', loadError)
      // Show error to user if it's an index error
      if (loadError.includes('index')) {
        setError('Firestore necesita un índice. Abre la consola del navegador (F12) para ver el link de creación.')
      }
    }
    setLoadingDesigns(false)
  }
  
  const loadAIContext = async (userId) => {
    const { context } = await getAILearningContext(userId)
    setAiLearningContext(context)
  }
  
  const handleSaveDesign = async (html, projectName = '', description = '') => {
    if (!user) {
      setShowLoginModal(true)
      return { saved: false }
    }
    
    if (!html || html.trim().length < 50) {
      console.log('Skipping save - HTML too short or empty')
      return { saved: false }
    }
    
    setSavingDesign(true)
    setError(null) // Clear previous errors
    
    // Extract project name from chat if not provided
    const extractedProject = extractProjectNameFromChat()
    const finalProjectName = projectName || extractedProject || 'Sin nombre'
    
    // Extract description from chat if not provided
    const finalDescription = description || designChatMessages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .slice(-3)
      .join(' | ')
    
    console.log('Saving design:', { projectName: finalProjectName, format: htmlAdFormat })
    
    const { id, error: saveError } = await saveDesign(user.uid, {
      html,
      format: htmlAdFormat,
      projectName: finalProjectName,
      description: finalDescription,
      chatContext: designChatMessages.slice(-10), // Last 10 messages for context
      imageBase64: htmlBuilderImageBase64
    })
    
    setSavingDesign(false)
    
    if (saveError) {
      console.error('Save error:', saveError)
      setError('Error guardando diseño: ' + saveError)
      return { saved: false }
    }
    
    console.log('Design saved with ID:', id)
    setLastSavedId(id)
    // Show success indicator briefly
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
    // Refresh designs list
    await loadUserDesigns(user.uid)
    return { saved: true, id }
  }
  
  const extractProjectNameFromChat = () => {
    // Try to extract project name from user messages
    for (const msg of designChatMessages.filter(m => m.role === 'user')) {
      const content = msg.content.toLowerCase()
      // Common patterns
      const patterns = [
        /(?:proyecto|development|residencias?|departamentos?)\s+([\w\s]+)/i,
        /(kulkana|velmari|alba|mistral|candela|costa|rosewood|amares|macondo|meliora)/i
      ]
      for (const pattern of patterns) {
        const match = content.match(pattern)
        if (match) return match[1].trim()
      }
    }
    return ''
  }
  
  const handleDeleteDesign = async (designId) => {
    if (!confirm('¿Eliminar este diseño?')) return
    
    const { error: deleteError } = await deleteDesign(designId)
    if (!deleteError) {
      setSavedDesigns(prev => prev.filter(d => d.id !== designId))
      if (selectedDesignForView?.id === designId) {
        setSelectedDesignForView(null)
      }
    }
  }
  
  const handleToggleFavorite = async (designId, isFavorite) => {
    await toggleFavorite(designId, !isFavorite)
    setSavedDesigns(prev => prev.map(d => 
      d.id === designId ? { ...d, isFavorite: !isFavorite } : d
    ))
  }
  
  const handleRateDesign = async (designId, rating) => {
    await rateDesign(designId, rating)
    setSavedDesigns(prev => prev.map(d => 
      d.id === designId ? { ...d, rating } : d
    ))
    // Refresh AI context after rating
    if (user) loadAIContext(user.uid)
  }
  
  const loadDesignToEditor = (design) => {
    // Si es imagen generada/editada, cargar en la pestaña de generación
    if (design.type === 'generated-image' || design.type === 'edited-image') {
      if (design.imageBase64) {
        setGeneratedImage(design.imageBase64)
      }
      if (design.description) {
        setPrompt(design.description)
      }
      setMainTab('imageGenerator')
    } else {
      // Es diseño HTML, cargar en editor
      setGeneratedHtml(design.html)
      setHtmlAdFormat(design.format || '1:1')
      setMainTab('htmlBuilder')
    }
    setSelectedDesignForView(null)
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
      // Use v2 endpoint with model selection and API endpoint
      const resp = await fetch('http://localhost:8000/api/studio/generate-image-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          aspect_ratio: '1:1',
          model: selectedImageModel,
          api_endpoint: selectedApiEndpoint
        })
      })
      
      const data = await resp.json()
      
      if (data.image_base64) {
        const imageUrl = `data:${data.mime_type};base64,${data.image_base64}`
        setGeneratedImage(imageUrl)
        
        // Add to history with API info
        setHistory(prev => [{
          type: 'generate',
          prompt: prompt,
          image: imageUrl,
          model: data.model_used || selectedImageModel,
          api: data.api_used || 'Unknown',
          timestamp: new Date().toISOString()
        }, ...prev.slice(0, 9)])
        
        // Auto-save generated image if user is logged in
        if (user) {
          const { id, error: saveErr } = await saveDesign(user.uid, {
            html: '', // No HTML for generated images
            format: '1:1',
            projectName: 'Imagen Generada',
            description: prompt.substring(0, 200),
            tags: ['imagen-generada', selectedImageModel],
            imageBase64: data.image_base64,
            type: 'generated-image'
          })
          if (id) {
            console.log('✅ Imagen generada guardada:', id)
            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 3000)
            loadUserDesigns(user.uid)
          } else if (saveErr) {
            console.log('Imagen no guardada (posiblemente muy grande):', saveErr)
          }
        }
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
        
        // Auto-save edited image if user is logged in
        if (user) {
          const { id, error: saveErr } = await saveDesign(user.uid, {
            html: '',
            format: '1:1',
            projectName: 'Imagen Editada',
            description: `${selectedPreset}: ${prompt.substring(0, 150)}`,
            tags: ['imagen-editada', selectedPreset],
            imageBase64: data.image_base64,
            type: 'edited-image'
          })
          if (id) {
            console.log('✅ Imagen editada guardada:', id)
            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 3000)
            loadUserDesigns(user.uid)
          } else if (saveErr) {
            console.log('Imagen no guardada (posiblemente muy grande):', saveErr)
          }
        }
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

  // === HTML AD BUILDER FUNCTIONS ===
  
  // Handle HTML Builder image upload
  const handleHtmlBuilderImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      setHtmlBuilderImage(event.target.result)
      setHtmlBuilderImageBase64(event.target.result.split(',')[1])
    }
    reader.readAsDataURL(file)
  }
  
  // Copy HTML to clipboard
  const copyHtmlToClipboard = () => {
    if (generatedHtml) {
      navigator.clipboard.writeText(generatedHtml)
      alert('✅ HTML copiado al portapapeles')
    }
  }
  
  // Download HTML file
  const downloadHtml = () => {
    if (generatedHtml) {
      const blob = new Blob([generatedHtml], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `anuncio_${htmlAdFormat}.html`
      a.click()
      URL.revokeObjectURL(url)
    }
  }
  
  // Get REAL dimensions for the HTML (what it's designed for)
  const getRealDimensions = () => {
    const dims = {
      '1:1': { width: 1080, height: 1080 },
      '9:16': { width: 1080, height: 1920 },
      '16:9': { width: 1920, height: 1080 },
      '4:3': { width: 1440, height: 1080 }
    }
    return dims[htmlAdFormat] || dims['1:1']
  }
  
  // Get scale factor to fit preview in container (max 450px)
  const getPreviewScale = () => {
    const real = getRealDimensions()
    const maxSize = 450
    const scaleW = maxSize / real.width
    const scaleH = maxSize / real.height
    return Math.min(scaleW, scaleH)
  }
  
  // Get preview container size (after scaling)
  const getPreviewDimensions = () => {
    const real = getRealDimensions()
    const scale = getPreviewScale()
    return {
      width: real.width * scale,
      height: real.height * scale
    }
  }

  // === DESIGN COPILOT FUNCTIONS ===
  
  // Scroll design chat to bottom
  useEffect(() => {
    designChatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [designChatMessages])
  
  // Handle paste event for images in design chat
  const handleDesignChatPaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onload = (event) => {
            setDesignChatImage(event.target.result)
            setDesignChatImageBase64(event.target.result.split(',')[1])
          }
          reader.readAsDataURL(file)
        }
        break
      }
    }
  }
  
  // Handle image upload for design chat
  const handleDesignChatImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      setDesignChatImage(event.target.result)
      setDesignChatImageBase64(event.target.result.split(',')[1])
    }
    reader.readAsDataURL(file)
  }
  
  // Clear design chat image
  const clearDesignChatImage = () => {
    setDesignChatImage(null)
    setDesignChatImageBase64(null)
  }
  
  // Voice-to-text for Design Copilot chat
  const toggleDesignRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.')
      return
    }
    
    if (isDesignRecording) {
      // Stop recording
      if (designSpeechRecognitionRef.current) {
        designSpeechRecognitionRef.current.stop()
        designSpeechRecognitionRef.current = null
      }
      setIsDesignRecording(false)
    } else {
      // Start recording
      const recognition = new SpeechRecognition()
      recognition.lang = 'es-MX'
      recognition.continuous = true // Allow longer dictation
      recognition.interimResults = true
      
      recognition.onresult = (event) => {
        let transcript = ''
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        setDesignChatInput(transcript)
      }
      
      recognition.onerror = (event) => {
        console.error('Design speech error:', event.error)
        if (event.error === 'not-allowed') {
          alert('Permiso de micrófono denegado. Habilítalo en tu navegador.')
        }
        setIsDesignRecording(false)
        designSpeechRecognitionRef.current = null
      }
      
      recognition.onend = () => {
        setIsDesignRecording(false)
        designSpeechRecognitionRef.current = null
      }
      
      try {
        designSpeechRecognitionRef.current = recognition
        recognition.start()
        setIsDesignRecording(true)
      } catch (err) {
        console.error('Error starting design speech:', err)
        alert('Error al iniciar reconocimiento de voz')
      }
    }
  }
  
  // Send message to Design Copilot chat - SMART VERSION
  const sendDesignChatMessage = async () => {
    if (!designChatInput.trim() && !designChatImageBase64) return
    
    // Determine if this is an image review request
    const hasReviewImage = !!designChatImageBase64
    
    const userMessage = {
      role: 'user',
      content: designChatInput || (hasReviewImage ? '📷 Revisa esta captura y sugiere mejoras' : ''),
      timestamp: new Date().toLocaleTimeString(),
      hasImage: hasReviewImage
    }
    
    const messageToSend = designChatInput || (hasReviewImage ? 'Revisa esta captura del diseño actual y sugiere qué se puede mejorar.' : '')
    setDesignChatInput('')
    
    // Clear the review image after sending
    const imageForReview = designChatImageBase64
    clearDesignChatImage()
    
    setDesignChatMessages(prev => [...prev, userMessage])
    setDesignChatLoading(true)
    
    try {
      // Get dimensions for format
      const dimensions = {
        "1:1": { width: 1080, height: 1080 },
        "9:16": { width: 1080, height: 1920 },
        "16:9": { width: 1920, height: 1080 },
        "4:3": { width: 1440, height: 1080 }
      }
      const dims = dimensions[htmlAdFormat] || dimensions["1:1"]
      
      // Get AI learning context if available
      const aiContextPrompt = aiLearningContext 
        ? formatContextForPrompt(aiLearningContext)
        : ''

      // Check if we're in edit mode (existing HTML)
      const isEditMode = !!generatedHtml && generatedHtml.length > 100
      
      // For edit mode, prepend instruction to user message
      const finalMessage = isEditMode 
        ? `[MODO EDICIÓN - SOLO MODIFICA LO QUE PIDO]\n\nMi solicitud: ${messageToSend}\n\nIMPORTANTE: NO regeneres todo. Solo aplica este cambio al HTML existente.`
        : messageToSend
      
      console.log('🎨 Design Copilot:', isEditMode ? 'MODO EDICIÓN' : 'MODO CREACIÓN')
      console.log('📝 HTML actual:', generatedHtml ? `${generatedHtml.length} caracteres` : 'ninguno')

      const systemPrompt = `Eres un Design Copilot experto en crear anuncios HTML para bienes raíces de lujo.

FORMATO: ${dims.width}x${dims.height}px (${htmlAdFormat})

⚠️ REGLA FONDO: SOLO gradientes CSS, NUNCA url()
background: radial-gradient(ellipse at center top, #1a1a2e 0%, #0a0a0a 50%, #000000 100%);

${isEditMode ? `
🔴🔴🔴 MODO EDICIÓN ACTIVO 🔴🔴🔴

TIENES UN HTML EXISTENTE. TU ÚNICA TAREA ES:
1. Leer el HTML actual (abajo)
2. Aplicar SOLO el cambio que pide el usuario
3. Devolver el HTML COMPLETO con ese único cambio

❌ NO hagas un diseño nuevo
❌ NO cambies estructura, colores o estilos que no te pidieron
❌ NO "mejores" nada que no te pidieron
✅ SOLO modifica exactamente lo solicitado

HTML ACTUAL (MODIFICA ESTE):
\`\`\`html
${generatedHtml}
\`\`\`

RESPONDE CON:
1. "Cambié [X] a [Y]" (una línea)
2. El HTML completo modificado en \`\`\`html ... \`\`\`
` : `
🆕 MODO CREACIÓN - Genera HTML nuevo con:
- Gradiente CSS de fondo (NO imágenes)
- Colores dorado (#d4af37) como acento
- Fuentes: Cormorant Garamond, DM Sans
- Estructura: logo, headline, precio, CTA
`}
${aiContextPrompt}`

      // Use Claude API for Claude models, Gemini API otherwise
      const isClaudeModel = designCopilotModel.startsWith('claude')
      const apiEndpoint = isClaudeModel 
        ? 'http://localhost:8000/api/chat-claude'
        : 'http://localhost:8000/api/chat'
      
      const requestBody = isClaudeModel 
        ? {
            message: messageToSend,
            model: designCopilotModel,
            system_prompt: systemPrompt,
            current_html: isEditMode ? generatedHtml : null,
            history: []
          }
        : {
            message: finalMessage,
            model: designCopilotModel,
            history: [],
            system_prompt: systemPrompt,
            image_base64: imageForReview || htmlBuilderImageBase64
          }
      
      console.log('🤖 Usando:', isClaudeModel ? 'Claude API' : 'Gemini API')
      
      const resp = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      const data = await resp.json()
      
      if (data.success || data.response) {
        const aiResponse = data.response
        
        // Try to extract HTML from response
        const htmlMatch = aiResponse.match(/```html\s*([\s\S]*?)\s*```/)
        let extractedHtml = null
        
        if (htmlMatch) {
          extractedHtml = htmlMatch[1].trim()
          // Set the HTML to the preview
          setGeneratedHtml(extractedHtml)
          
          // Auto-save design if user is logged in
          if (user) {
            handleSaveDesign(extractedHtml)
          }
        }
        
        // Clean response for display (remove HTML block for chat)
        let cleanResponse = aiResponse.replace(/```html[\s\S]*?```/g, '').trim()
        
        // If we extracted HTML, add a note
        if (extractedHtml) {
          cleanResponse = cleanResponse || '✅ HTML generado'
          cleanResponse += '\n\n📄 *HTML actualizado en el preview*'
          if (user) {
            cleanResponse += '\n💾 *Guardado automáticamente*'
          }
        }
        
        const aiMessage = {
          role: 'assistant',
          content: cleanResponse,
          timestamp: new Date().toLocaleTimeString(),
          hasHtml: !!extractedHtml
        }
        
        // Update messages and save conversation
        setDesignChatMessages(prev => {
          const newMessages = [...prev, aiMessage]
          // Save conversation asynchronously
          saveCurrentConversation(newMessages, extractedHtml)
          return newMessages
        })
      }
    } catch (err) {
      setDesignChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${err.message}`,
        timestamp: new Date().toLocaleTimeString()
      }])
    } finally {
      setDesignChatLoading(false)
    }
  }
  
  return (
    <div className="image-studio">
      {/* Login Modal */}
      {showLoginModal && (
        <div className="login-modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="login-modal" onClick={e => e.stopPropagation()}>
            <h2>🔐 Iniciar Sesión</h2>
            <p>Inicia sesión para guardar tus diseños y que la IA aprenda de tu estilo</p>
            <button className="google-login-btn" onClick={handleLogin}>
              <span>G</span> Continuar con Google
            </button>
            <button className="close-modal-btn" onClick={() => setShowLoginModal(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="studio-header">
        <button className="back-btn" onClick={onBack}>
          ← Volver al Motor
        </button>
        <div className="studio-title">
          <h1>🎨 AI Image Studio</h1>
          <p>Genera y edita imágenes con IA para tus proyectos</p>
        </div>
        
        {/* User Profile / Login */}
        <div className="user-section">
          {authLoading ? (
            <span className="auth-loading">...</span>
          ) : user ? (
            <div className="user-profile">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'U'}`} 
                alt="Profile" 
                className="user-avatar"
              />
              <div className="user-info">
                <span className="user-name">{user.displayName || user.email}</span>
                <span className="user-designs">{savedDesigns.length} diseños</span>
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                Salir
              </button>
            </div>
          ) : (
            <button className="login-btn" onClick={() => setShowLoginModal(true)}>
              🔐 Iniciar sesión
            </button>
          )}
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
        <button 
          className={`main-tab ${mainTab === 'htmlBuilder' ? 'active' : ''}`}
          onClick={() => setMainTab('htmlBuilder')}
        >
          🎨 Design Copilot
        </button>
        <button 
          className={`main-tab ${mainTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setMainTab('gallery')}
          style={{ marginLeft: 'auto' }}
        >
          📚 Mis Diseños {savedDesigns.length > 0 && <span className="badge">{savedDesigns.length}</span>}
        </button>
      </div>
      
      {/* GALLERY TAB */}
      {mainTab === 'gallery' ? (
        <div className="designs-gallery">
          <div className="gallery-header">
            <div>
              <h2>📚 Mis Diseños Guardados</h2>
              <p>Todos tus diseños HTML • La IA aprende de los mejor calificados ⭐</p>
            </div>
            {aiLearningContext && aiLearningContext.totalDesigns > 0 && (
              <div className="ai-learning-status">
                <span>🧠</span>
                <span>IA aprendiendo de {aiLearningContext.totalDesigns} diseños favoritos</span>
              </div>
            )}
          </div>
          
          {!user ? (
            <div className="gallery-login-prompt">
              <span>🔐</span>
              <h3>Inicia sesión para ver tus diseños</h3>
              <p>Guarda tus diseños y permite que la IA aprenda de tu estilo</p>
              <button onClick={() => setShowLoginModal(true)}>
                Iniciar sesión con Google
              </button>
            </div>
          ) : loadingDesigns ? (
            <div className="gallery-loading">
              <span>⏳</span>
              <p>Cargando diseños...</p>
            </div>
          ) : savedDesigns.length === 0 ? (
            <div className="gallery-empty">
              <span>🎨</span>
              <h3>Aún no tienes diseños guardados</h3>
              <p>Ve a Design Copilot y crea tu primer anuncio HTML</p>
              <button onClick={() => setMainTab('htmlBuilder')}>
                Ir a Design Copilot
              </button>
            </div>
          ) : (
            <div className="designs-grid">
              {savedDesigns.map(design => (
                <div key={design.id} className="design-card">
                  <div className="design-preview-mini">
                    {/* Mostrar imagen generada o HTML según el tipo */}
                    {design.imageBase64 ? (
                      <img 
                        src={design.imageBase64}
                        alt={design.projectName || 'Diseño'}
                        className="design-preview-img"
                      />
                    ) : design.html ? (
                      <iframe
                        srcDoc={design.html}
                        title={design.projectName}
                        style={{
                          width: '1080px',
                          height: '1080px',
                          border: 'none',
                          transform: 'scale(0.2)',
                          transformOrigin: 'top left',
                          pointerEvents: 'none'
                        }}
                      />
                    ) : (
                      <div className="design-no-preview">
                        <span>🖼️</span>
                        <p>Sin preview</p>
                      </div>
                    )}
                    {/* Badge de tipo */}
                    <div className={`design-type-badge ${design.type || 'html-design'}`}>
                      {design.type === 'generated-image' ? '🤖 IA' : 
                       design.type === 'edited-image' ? '✏️ Edit' : '📝 HTML'}
                    </div>
                  </div>
                  
                  <div className="design-card-info">
                    <h4>{design.projectName || 'Sin nombre'}</h4>
                    <p className="design-format">
                      {design.format || 'custom'} • {design.createdAt ? new Date(design.createdAt).toLocaleDateString() : 'Sin fecha'}
                    </p>
                    <p className="design-desc">{design.description?.slice(0, 80) || 'Sin descripción'}...</p>
                  </div>
                  
                  <div className="design-card-actions">
                    <button 
                      className={`fav-btn ${design.isFavorite ? 'active' : ''}`}
                      onClick={() => handleToggleFavorite(design.id, design.isFavorite)}
                    >
                      {design.isFavorite ? '❤️' : '🤍'}
                    </button>
                    
                    <div className="rating">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          className={`star ${(design.rating || 0) >= star ? 'active' : ''}`}
                          onClick={() => handleRateDesign(design.id, star)}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                    
                    <button className="edit-btn" onClick={() => loadDesignToEditor(design)}>
                      ✏️ Editar
                    </button>
                    <button className="delete-btn" onClick={() => handleDeleteDesign(design.id)}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) :
      
      /* MARKETING AI CHAT TAB */
      mainTab === 'chat' ? (
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
      
      /* HTML AD BUILDER TAB - DESIGN COPILOT */
      mainTab === 'htmlBuilder' ? (
        <div className="design-copilot">
          {/* Conversations Sidebar */}
          {user && (
            <div className={`conversations-sidebar ${showConversationsSidebar ? 'open' : 'collapsed'}`}>
              <div className="sidebar-header">
                <button 
                  className="toggle-sidebar"
                  onClick={() => setShowConversationsSidebar(!showConversationsSidebar)}
                >
                  {showConversationsSidebar ? '◀' : '▶'}
                </button>
                {showConversationsSidebar && (
                  <>
                    <span>💬 Conversaciones</span>
                    <button className="new-chat-btn" onClick={handleNewConversation}>
                      ＋
                    </button>
                  </>
                )}
              </div>
              
              {showConversationsSidebar && (
                <div className="conversations-list">
                  {loadingConversations ? (
                    <div className="loading-convos">Cargando...</div>
                  ) : conversations.length === 0 ? (
                    <div className="no-convos">
                      <p>Sin conversaciones</p>
                      <small>Empieza una nueva</small>
                    </div>
                  ) : (
                    conversations.map(convo => (
                      <div 
                        key={convo.id}
                        className={`convo-item ${currentConversationId === convo.id ? 'active' : ''}`}
                        onClick={() => handleSelectConversation(convo.id)}
                      >
                        {editingConversationId === convo.id ? (
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => handleRenameConversation(convo.id, editingTitle)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameConversation(convo.id, editingTitle)
                              if (e.key === 'Escape') setEditingConversationId(null)
                            }}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <>
                            <div className="convo-info">
                              <span className="convo-title">{convo.title}</span>
                              <span className="convo-date">
                                {convo.updatedAt?.toLocaleDateString?.() || ''}
                              </span>
                            </div>
                            <div className="convo-actions">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingConversationId(convo.id)
                                  setEditingTitle(convo.title)
                                }}
                              >
                                ✏️
                              </button>
                              <button onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteConversation(convo.id)
                              }}>
                                🗑️
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Left Panel - Chat & Controls */}
          <div className="copilot-left">
            {/* Header with Image Upload */}
            <div className="copilot-header">
              <div className="copilot-title">
                <span>🎨</span>
                <div>
                  <h2>Design Copilot</h2>
                  <p>Crea anuncios HTML con IA</p>
                </div>
              </div>
              
              {/* Model Selector */}
              <select 
                className="copilot-model-select"
                value={designCopilotModel}
                onChange={(e) => setDesignCopilotModel(e.target.value)}
              >
                <optgroup label="🟣 Claude (mejor para edición)">
                  <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                  <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                </optgroup>
                <optgroup label="🔵 Gemini">
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                  <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
                  <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                </optgroup>
              </select>
              
              {/* Compact Image Upload */}
              <div 
                className={`copilot-image-upload ${htmlBuilderImage ? 'has-image' : ''}`}
                onClick={() => htmlBuilderInputRef.current?.click()}
              >
                {htmlBuilderImage ? (
                  <>
                    <img src={htmlBuilderImage} alt="Fondo" />
                    <span className="change-badge">Cambiar</span>
                  </>
                ) : (
                  <>
                    <span>📷</span>
                    <span>Subir imagen</span>
                    <span className="upload-hint">Para análisis de colores</span>
                  </>
                )}
              </div>
              <input
                ref={htmlBuilderInputRef}
                type="file"
                accept="image/*"
                onChange={handleHtmlBuilderImageUpload}
                style={{ display: 'none' }}
              />
            </div>
            
            {/* Format Selector - Compact */}
            <div className="copilot-formats">
              {['1:1', '9:16', '16:9', '4:3'].map(fmt => (
                <button
                  key={fmt}
                  className={`format-chip ${htmlAdFormat === fmt ? 'active' : ''}`}
                  onClick={() => setHtmlAdFormat(fmt)}
                >
                  {fmt}
                </button>
              ))}
            </div>
            
            {/* Mode Indicator */}
            <div className={`copilot-mode-indicator ${generatedHtml ? 'edit' : 'create'}`}>
              {generatedHtml ? (
                <>
                  <span>✏️</span>
                  <span>Modo Edición</span>
                  <span className="mode-hint">Solo modifico lo que pidas</span>
                  <button 
                    className="reset-btn"
                    onClick={() => { setGeneratedHtml(null); setDesignChatMessages([]); }}
                    title="Empezar desde cero"
                  >
                    🔄 Nuevo
                  </button>
                </>
              ) : (
                <>
                  <span>🆕</span>
                  <span>Modo Creación</span>
                  <span className="mode-hint">Describe tu proyecto</span>
                </>
              )}
            </div>
            
            {/* Design Chat - MAIN CONTROLLER */}
            <div className="design-chat main-chat">
              <div className="chat-messages-area">
                {designChatMessages.length === 0 ? (
                  <div className="chat-empty">
                    <span>🎨</span>
                    <h3>Design Copilot</h3>
                    <p>Describe tu proyecto y generaré el anuncio HTML</p>
                    <div className="quick-suggestions">
                      <button onClick={() => setDesignChatInput('Proyecto en Cancún zona sur, departamentos desde $2.5M MXN, entrega inmediata, 0% de enganche')}>
                        🏠 Ejemplo: Cancún
                      </button>
                      <button onClick={() => setDesignChatInput('Residencias de lujo en Tulum, preventa desde $4.8M MXN, amenidades premium, ROI garantizado')}>
                        🌴 Ejemplo: Tulum
                      </button>
                      <button onClick={() => setDesignChatInput('Penthouses frente al mar en Puerto Aventuras, desde $8M MXN, vista al Caribe')}>
                        🌊 Ejemplo: Penthouse
                      </button>
                    </div>
                  </div>
                ) : (
                  designChatMessages.map((msg, idx) => (
                    <div key={idx} className={`design-message ${msg.role}`}>
                      <span className="msg-icon">{msg.role === 'user' ? '👤' : '🤖'}</span>
                      <div className="msg-content">
                        {msg.hasImage && <span className="image-badge">📷 Imagen adjunta</span>}
                        <p>{msg.content}</p>
                        {msg.hasHtml && (
                          <span className="html-badge">
                            ✅ HTML actualizado en preview
                          </span>
                        )}
                        <span className="msg-time">{msg.timestamp}</span>
                      </div>
                    </div>
                  ))
                )}
                {designChatLoading && (
                  <div className="design-message assistant">
                    <span className="msg-icon">🤖</span>
                    <div className="msg-content typing">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                )}
                <div ref={designChatEndRef} />
              </div>
              
              {/* Image Preview (if pasted/uploaded) */}
              {designChatImage && (
                <div className="chat-image-preview">
                  <img src={designChatImage} alt="Para revisión" />
                  <button className="remove-image" onClick={clearDesignChatImage}>✕</button>
                  <span className="preview-label">📷 Imagen para revisión</span>
                </div>
              )}
              
              {/* Chat Input */}
              <div className="design-chat-input">
                <button 
                  className="upload-image-btn"
                  onClick={() => designChatImageInputRef.current?.click()}
                  title="Subir captura para revisión"
                >
                  📷
                </button>
                <input
                  ref={designChatImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleDesignChatImageUpload}
                  style={{ display: 'none' }}
                />
                <button 
                  className={`mic-btn ${isDesignRecording ? 'recording' : ''}`}
                  onClick={toggleDesignRecording}
                  title={isDesignRecording ? 'Detener dictado' : 'Dictar mensaje (voz a texto)'}
                >
                  {isDesignRecording ? '⏹️' : '🎤'}
                </button>
                <textarea
                  ref={designChatInputRef}
                  placeholder={designChatImage ? "Describe qué quieres mejorar..." : "Describe el proyecto o dicta con 🎤... (Ctrl+V para captura)"}
                  value={designChatInput}
                  onChange={(e) => setDesignChatInput(e.target.value)}
                  onPaste={handleDesignChatPaste}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendDesignChatMessage()
                    }
                  }}
                  rows={1}
                  onInput={(e) => {
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                  }}
                />
                <button 
                  onClick={sendDesignChatMessage}
                  disabled={designChatLoading || (!designChatInput.trim() && !designChatImageBase64)}
                >
                  {designChatLoading ? '⏳' : '➤'}
                </button>
              </div>
            </div>
            
            {/* Status messages */}
            {savingDesign && (
              <div className="saving-indicator">💾 Guardando diseño...</div>
            )}
            {saveSuccess && (
              <div className="save-success">✅ Diseño guardado ({savedDesigns.length} en total)</div>
            )}
            {error && <div className="error-msg">{error}</div>}
          </div>
          
          {/* Right Panel - Live Preview */}
          <div className="copilot-right">
            <div className="preview-toolbar">
              <div className="preview-title">
                <span>👁️</span>
                <span>Vista Previa</span>
              </div>
              <div className="preview-bg-toggle">
                {[
                  { id: 'dark', icon: '🌙', label: 'Oscuro' },
                  { id: 'light', icon: '☀️', label: 'Claro' },
                  { id: 'checker', icon: '🔲', label: 'Checker' }
                ].map(bg => (
                  <button
                    key={bg.id}
                    className={htmlPreviewBg === bg.id ? 'active' : ''}
                    onClick={() => setHtmlPreviewBg(bg.id)}
                    title={bg.label}
                  >
                    {bg.icon}
                  </button>
                ))}
              </div>
            </div>
            
            <div className={`preview-canvas bg-${htmlPreviewBg}`}>
              {generatedHtml ? (
                <div 
                  className="preview-frame-container"
                  style={{
                    width: getPreviewDimensions().width,
                    height: getPreviewDimensions().height,
                    overflow: 'hidden',
                    borderRadius: '12px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                  }}
                >
                  <iframe
                    srcDoc={generatedHtml}
                    title="HTML Preview"
                    style={{
                      width: getRealDimensions().width,
                      height: getRealDimensions().height,
                      border: 'none',
                      transform: `scale(${getPreviewScale()})`,
                      transformOrigin: 'top left'
                    }}
                  />
                </div>
              ) : (
                <div className="preview-empty">
                  <span>🎨</span>
                  <p>Tu anuncio aparecerá aquí</p>
                  <small>Describe tu proyecto en el chat para generar el HTML</small>
                </div>
              )}
            </div>
            
            {generatedHtml && (
              <div className="preview-actions">
                <button className="action-btn" onClick={copyHtmlToClipboard}>
                  📋 Copiar
                </button>
                <button className="action-btn" onClick={downloadHtml}>
                  💾 Descargar
                </button>
                <button className="action-btn secondary" onClick={() => {
                  // Open code view
                  const w = window.open('', '_blank')
                  w.document.write(`<pre style="background:#1a1a2e;color:#fff;padding:20px;white-space:pre-wrap;">${generatedHtml.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`)
                }}>
                  {'</>'} Ver código
                </button>
              </div>
            )}
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
          
          {/* API Endpoint Selector */}
          <div className="model-select-section">
            <label className="section-label">🔌 API Endpoint</label>
            <select 
              className="model-select"
              value={selectedApiEndpoint}
              onChange={(e) => setSelectedApiEndpoint(e.target.value)}
            >
              <option value="auto">🔄 Auto (usa la primera disponible)</option>
              <option value="gemini">💎 Gemini API (AIza...)</option>
              <option value="vertex">⚡ Vertex AI (AQ...)</option>
            </select>
            <small style={{color: '#888', fontSize: '11px', marginTop: '4px', display: 'block'}}>
              Prueba ambas APIs para comparar calidad
            </small>
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
                    title={`${item.model}\n${item.api || ''}\n${item.prompt?.slice(0, 50)}...`}
                  >
                    <img src={item.image} alt={`History ${idx}`} />
                    <div className="history-badge">
                      {item.type === 'generate' ? '✨' : '🖼️'}
                    </div>
                    {item.api && (
                      <div className="history-api-badge">
                        {item.api === 'Vertex AI' ? '⚡' : '💎'}
                      </div>
                    )}
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
        
        .history-api-badge {
          position: absolute;
          bottom: 5px;
          right: 5px;
          background: rgba(0,0,0,0.7);
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 0.6rem;
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
        
        /* === DESIGN COPILOT STYLES === */
        .design-copilot {
          display: flex;
          gap: 0;
          max-width: 1800px;
          margin: 0 auto;
          padding: 20px;
          height: calc(100vh - 200px);
        }
        
        /* Left Panel */
        .copilot-left {
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: rgba(0,0,0,0.3);
          border-radius: 16px;
          padding: 20px;
          overflow: hidden;
          width: 420px;
          min-width: 420px;
        }
        
        /* Right Panel */
        .copilot-right {
          flex: 1;
          margin-left: 24px;
        }
        
        .copilot-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .copilot-title {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }
        
        .copilot-title span {
          font-size: 2rem;
        }
        
        .copilot-title h2 {
          margin: 0;
          font-size: 1.3rem;
          color: #d4af37;
        }
        
        .copilot-title p {
          margin: 0;
          font-size: 0.8rem;
          opacity: 0.6;
        }
        
        .copilot-model-select {
          padding: 8px 12px;
          background: rgba(212, 175, 55, 0.15);
          border: 1px solid rgba(212, 175, 55, 0.4);
          border-radius: 8px;
          color: #d4af37;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .copilot-model-select:hover {
          background: rgba(212, 175, 55, 0.25);
          border-color: rgba(212, 175, 55, 0.6);
        }
        
        .copilot-model-select option {
          background: #1a1a2e;
          color: white;
        }
        
        .copilot-image-upload {
          width: 80px;
          height: 80px;
          border: 2px dashed rgba(255,255,255,0.3);
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: all 0.2s;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }
        
        .copilot-image-upload:hover {
          border-color: #d4af37;
          background: rgba(212,175,55,0.1);
        }
        
        .copilot-image-upload.has-image {
          border: none;
          padding: 0;
        }
        
        .copilot-image-upload.has-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .copilot-image-upload .change-badge {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0,0,0,0.8);
          padding: 4px;
          font-size: 0.65rem;
          text-align: center;
        }
        
        .copilot-image-upload .upload-hint {
          font-size: 0.65rem;
          opacity: 0.5;
          margin-top: 2px;
        }
        
        /* Format chips */
        .copilot-formats {
          display: flex;
          gap: 8px;
        }
        
        .format-chip {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid rgba(255,255,255,0.2);
          background: transparent;
          color: rgba(255,255,255,0.7);
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.2s;
        }
        
        .format-chip:hover {
          border-color: #d4af37;
        }
        
        .format-chip.active {
          background: rgba(212,175,55,0.2);
          border-color: #d4af37;
          color: #d4af37;
        }
        
        /* Mode Indicator */
        .copilot-mode-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 0.85rem;
          margin-top: 8px;
        }
        
        .copilot-mode-indicator.create {
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #60a5fa;
        }
        
        .copilot-mode-indicator.edit {
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #4ade80;
        }
        
        .copilot-mode-indicator .mode-hint {
          font-size: 0.75rem;
          opacity: 0.7;
          flex: 1;
        }
        
        .copilot-mode-indicator .reset-btn {
          padding: 4px 10px;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          border-radius: 6px;
          color: #f87171;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .copilot-mode-indicator .reset-btn:hover {
          background: rgba(239, 68, 68, 0.3);
        }
        
        /* Quick Form */
        .quick-form-section {
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          overflow: hidden;
        }
        
        .toggle-form-btn {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255,255,255,0.05);
          border: none;
          color: #fff;
          font-size: 0.9rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          text-align: left;
        }
        
        .toggle-form-btn:hover {
          background: rgba(255,255,255,0.1);
        }
        
        .ai-fill-all {
          margin-left: auto;
          padding: 6px 12px;
          background: linear-gradient(135deg, #d4af37, #b8962d);
          color: #000;
          border-radius: 16px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
        }
        
        .ai-fill-all:hover {
          transform: scale(1.05);
        }
        
        .quick-fields {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: rgba(0,0,0,0.2);
          max-height: 400px;
          overflow-y: auto;
        }
        
        .quick-field .field-row {
          display: flex;
          gap: 8px;
        }
        
        .quick-field input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(0,0,0,0.3);
          color: #fff;
          border-radius: 8px;
          font-size: 0.85rem;
          font-family: inherit;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .quick-field input:focus {
          outline: none;
          border-color: #d4af37;
        }
        
        .quick-field textarea.scrollable-input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(0,0,0,0.3);
          color: #fff;
          border-radius: 8px;
          font-size: 0.85rem;
          font-family: inherit;
          min-width: 0;
          resize: none;
          overflow-y: auto;
          min-height: 38px;
          max-height: 80px;
        }
        
        .quick-field textarea.scrollable-input:focus {
          outline: none;
          border-color: #d4af37;
        }
        
        .ai-btn {
          width: 36px;
          height: 36px;
          border: 1px solid rgba(212,175,55,0.4);
          background: rgba(212,175,55,0.1);
          color: #d4af37;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        
        .ai-btn:hover:not(:disabled) {
          background: rgba(212,175,55,0.2);
          transform: scale(1.05);
        }
        
        .ai-btn:disabled {
          opacity: 0.5;
          cursor: wait;
        }
        
        .ai-btn.small {
          width: auto;
          height: auto;
          padding: 4px 8px;
          font-size: 0.7rem;
        }
        
        /* Pills Field */
        .pills-field .pills-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.7);
        }
        
        .pills-inputs {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .pill-input {
          display: flex;
          gap: 6px;
        }
        
        .pill-input input {
          flex: 1;
          padding: 8px 10px;
          font-size: 0.8rem;
        }
        
        .remove-btn {
          width: 28px;
          background: rgba(255,100,100,0.2);
          border: 1px solid rgba(255,100,100,0.3);
          color: #ff6464;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
        }
        
        .add-pill {
          padding: 6px;
          border: 1px dashed rgba(255,255,255,0.2);
          background: transparent;
          color: rgba(255,255,255,0.5);
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.75rem;
        }
        
        .add-pill:hover {
          border-color: #d4af37;
          color: #d4af37;
        }
        
        /* Price Field */
        .price-field .field-row input {
          min-width: 0;
        }
        
        /* Generate Button */
        .generate-design-btn {
          padding: 14px;
          background: linear-gradient(135deg, #d4af37, #b8962d);
          border: none;
          color: #000;
          font-weight: 600;
          font-size: 0.95rem;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .generate-design-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(212,175,55,0.3);
        }
        
        .generate-design-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* Design Chat - Main Controller */
        .design-chat {
          flex: 1;
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          overflow: hidden;
          background: rgba(0,0,0,0.2);
          min-height: 300px;
        }
        
        .design-chat.main-chat {
          min-height: 400px;
          border-color: rgba(212,175,55,0.3);
        }
        
        .chat-messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .chat-empty {
          text-align: center;
          padding: 30px 20px;
          color: rgba(255,255,255,0.6);
        }
        
        .chat-empty span {
          font-size: 2.5rem;
          display: block;
          margin-bottom: 12px;
        }
        
        .chat-empty h3 {
          margin: 0 0 8px;
          color: #d4af37;
          font-weight: 500;
        }
        
        .chat-empty p {
          margin: 0 0 20px;
          font-size: 0.9rem;
        }
        
        .quick-suggestions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .quick-suggestions button {
          padding: 10px 14px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.8);
          border-radius: 8px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }
        
        .quick-suggestions button:hover {
          border-color: #d4af37;
          background: rgba(212,175,55,0.1);
        }
        
        /* Design Messages */
        .design-message {
          display: flex;
          gap: 10px;
          max-width: 90%;
        }
        
        .design-message.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        
        .design-message .msg-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          flex-shrink: 0;
        }
        
        .design-message .msg-content {
          background: rgba(255,255,255,0.08);
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 0.85rem;
        }
        
        .design-message.user .msg-content {
          background: rgba(212,175,55,0.2);
        }
        
        .design-message .msg-content p {
          margin: 0 0 6px;
          white-space: pre-wrap;
        }
        
        .design-message .msg-time {
          font-size: 0.65rem;
          opacity: 0.5;
        }
        
        .html-badge {
          display: block;
          margin-top: 8px;
          padding: 4px 8px;
          background: rgba(100,200,100,0.2);
          color: #90EE90;
          border-radius: 4px;
          font-size: 0.75rem;
        }
        
        .changes-badge {
          display: block;
          margin-top: 8px;
          padding: 4px 8px;
          background: rgba(100,200,100,0.2);
          border-radius: 4px;
          font-size: 0.7rem;
          color: #6c6;
        }
        
        .design-message .msg-content.typing {
          display: flex;
          gap: 4px;
          padding: 14px 18px;
        }
        
        .design-message .msg-content.typing span {
          width: 6px;
          height: 6px;
          background: #d4af37;
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;
        }
        
        .design-message .msg-content.typing span:nth-child(2) { animation-delay: 0.2s; }
        .design-message .msg-content.typing span:nth-child(3) { animation-delay: 0.4s; }
        
        /* Design Chat Input */
        .design-chat-input {
          display: flex;
          gap: 8px;
          padding: 12px;
          border-top: 1px solid rgba(255,255,255,0.1);
          align-items: flex-end;
        }
        
        .design-chat-input textarea {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(0,0,0,0.3);
          color: #fff;
          border-radius: 16px;
          font-size: 0.85rem;
          font-family: inherit;
          resize: none;
          min-height: 40px;
          max-height: 120px;
          line-height: 1.4;
        }
        
        .design-chat-input textarea:focus {
          outline: none;
          border-color: #d4af37;
        }
        
        .design-chat-input .mic-btn {
          width: 38px;
          height: 38px;
          border: none;
          background: rgba(255,255,255,0.1);
          color: #fff;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        
        .design-chat-input .mic-btn:hover {
          background: rgba(212, 175, 55, 0.3);
        }
        
        .design-chat-input .mic-btn.recording {
          background: linear-gradient(135deg, #ff4444, #cc3333);
          animation: pulse 1s infinite;
        }
        
        .design-chat-input button:last-child {
          width: 38px;
          height: 38px;
          border: none;
          background: linear-gradient(135deg, #d4af37, #b8962d);
          color: #000;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        
        .design-chat-input button:last-child:hover:not(:disabled) {
          transform: scale(1.1);
        }
        
        .design-chat-input button:last-child:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .error-msg {
          padding: 10px;
          background: rgba(255,100,100,0.1);
          border: 1px solid rgba(255,100,100,0.3);
          border-radius: 8px;
          color: #ff6464;
          font-size: 0.85rem;
        }
        
        /* Right Panel - Preview */
        .copilot-right {
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: rgba(0,0,0,0.2);
          border-radius: 16px;
          padding: 20px;
        }
        
        .preview-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .preview-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #d4af37;
          font-weight: 500;
        }
        
        .preview-bg-toggle {
          display: flex;
          gap: 4px;
          background: rgba(0,0,0,0.3);
          padding: 4px;
          border-radius: 8px;
        }
        
        .preview-bg-toggle button {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          opacity: 0.5;
          transition: all 0.2s;
        }
        
        .preview-bg-toggle button:hover {
          opacity: 0.8;
        }
        
        .preview-bg-toggle button.active {
          background: rgba(255,255,255,0.1);
          opacity: 1;
        }
        
        /* Preview Canvas */
        .preview-canvas {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          min-height: 500px;
          padding: 20px;
          transition: background 0.3s;
        }
        
        .preview-frame-container {
          position: relative;
        }
        
        .preview-canvas.bg-dark {
          background: #000;
        }
        
        .preview-canvas.bg-light {
          background: #f0f0f0;
        }
        
        .preview-canvas.bg-checker {
          background: repeating-conic-gradient(#666 0% 25%, #444 0% 50%) 50% / 20px 20px;
        }
        
        .preview-empty {
          text-align: center;
          color: rgba(255,255,255,0.4);
        }
        
        .preview-empty span {
          font-size: 3rem;
          display: block;
          margin-bottom: 12px;
        }
        
        .preview-empty p {
          margin: 0 0 6px;
        }
        
        .preview-empty small {
          font-size: 0.75rem;
          opacity: 0.6;
        }
        
        .preview-with-bg {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
        }
        
        .preview-with-bg img {
          max-width: 100%;
          max-height: 400px;
          display: block;
        }
        
        .preview-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #fff;
        }
        
        .preview-overlay p {
          margin: 0;
          font-size: 1.2rem;
          color: #6c6;
        }
        
        .preview-overlay small {
          margin-top: 8px;
          opacity: 0.7;
        }
        
        /* Colors Panel */
        .colors-panel {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(0,0,0,0.3);
          border-radius: 10px;
        }
        
        .colors-label {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.7);
        }
        
        .color-dots {
          display: flex;
          gap: 6px;
        }
        
        .color-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.2);
          cursor: pointer;
          transition: transform 0.2s;
        }
        
        .color-dot:hover {
          transform: scale(1.2);
        }
        
        /* Preview Actions */
        .preview-actions {
          display: flex;
          gap: 10px;
        }
        
        .action-btn {
          flex: 1;
          padding: 12px;
          border: 1px solid rgba(212,175,55,0.5);
          background: rgba(212,175,55,0.1);
          color: #d4af37;
          border-radius: 10px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .action-btn:hover {
          background: rgba(212,175,55,0.2);
          border-color: #d4af37;
        }
        
        .action-btn.secondary {
          background: transparent;
          border-color: rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.7);
        }
        
        .action-btn.secondary:hover {
          border-color: rgba(255,255,255,0.4);
          color: #fff;
        }
        
        /* Responsive */
        @media (max-width: 1100px) {
          .design-copilot {
            grid-template-columns: 1fr;
            height: auto;
          }
          
          .copilot-left {
            max-height: calc(100vh - 300px);
          }
          
          .copilot-right {
            min-height: 500px;
          }
        }
      `}</style>
    </div>
  )
}
