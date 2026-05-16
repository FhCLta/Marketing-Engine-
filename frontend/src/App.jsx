import { useState, useRef, useEffect } from 'react'
import API_BASE_URL from './config/api'
import './index.css'

// Firebase Imports
import { getProjects, seedInitialProjects, addProject } from './services/firestoreService'
import { INITIAL_PROJECTS } from './data/initialProjects'
import { ALTTA_HOMES_CATALOG, getAlttaProductById } from './data/alttaHomesCatalog'

// Page Components
import ImageStudio from './pages/ImageStudio'
import AIChat from './pages/AIChat'

// Utility: Compress image before upload to avoid 413 errors
const COMPRESS_IMAGE_FOR_UPLOAD = async (file, maxSizeMB = 25, maxDimension = 4000) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      
      // Scale down if larger than maxDimension
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }
      
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      
      // Start with high quality, reduce if needed
      let quality = 0.92
      const tryCompress = () => {
        canvas.toBlob((blob) => {
          const sizeMB = blob.size / (1024 * 1024)
          if (sizeMB > maxSizeMB && quality > 0.5) {
            quality -= 0.1
            tryCompress()
          } else {
            console.log(`Image compressed: ${sizeMB.toFixed(2)}MB, quality: ${quality}, ${width}x${height}`)
            resolve(blob)
          }
        }, 'image/jpeg', quality)
      }
      tryCompress()
    }
    img.src = URL.createObjectURL(file)
  })
}

function App() {
  // Page Navigation
  const [currentPage, setCurrentPage] = useState('engine') // 'engine' | 'studio' | 'aichat'
  
  const [imageSrc, setImageSrc] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [renderedImage, setRenderedImage] = useState(null)
  
  // Firebase Projects State
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [showAddProjectModal, setShowAddProjectModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  
  // Advanced Features State
  const [activeTab, setActiveTab] = useState('upload') // 'upload' or 'generate'
  const [imagePrompt, setImagePrompt] = useState("")
  const [projectContext, setProjectContext] = useState("")
  const [projectLocation, setProjectLocation] = useState("")
  const [selectedAlttaProductId, setSelectedAlttaProductId] = useState('jds6-capua')
  const [alttaDevelopment, setAlttaDevelopment] = useState('Jardines del Sur 6')
  const [alttaModel, setAlttaModel] = useState('Capua')
  const [alttaProductType, setAlttaProductType] = useState('Departamento')
  const [alttaPrice, setAlttaPrice] = useState('Desde $1,853,830 MXN')
  const [alttaSpecs, setAlttaSpecs] = useState('85.34 m2 · 3 Rec · 2 Banos')
  const [alttaBadge, setAlttaBadge] = useState('Grupo Sadasi')
  const [alttaCta, setAlttaCta] = useState('Agenda tu cita')
  const [alttaPhone, setAlttaPhone] = useState('998 385 1133')
  const [alttaCopyVariants, setAlttaCopyVariants] = useState([])
  const [currentAlttaVariantIndex, setCurrentAlttaVariantIndex] = useState(0)
  const [ctaFontSize, setCtaFontSize] = useState(1.2)
  const [alttaLayout, setAlttaLayout] = useState({
    logo: { x: 50, y: 14, width: 42 },
    model: { x: 50, y: 52, width: 70 },
    headline: { x: 50, y: 62, width: 92 },
    price: { x: 50, y: 75, width: 72 },
    cta: { x: 50, y: 86, width: 72 },
  })
  const [activeAlttaLayer, setActiveAlttaLayer] = useState(null)
  const [selectedAlttaLayer, setSelectedAlttaLayer] = useState(null)
  const [socialVariants, setSocialVariants] = useState([])
  const [currentVariantIndex, setCurrentVariantIndex] = useState(0)
  const [showSocialModal, setShowSocialModal] = useState(false)

  // Ad Copy State
  const [adVariants, setAdVariants] = useState([])
  const [currentAdVariantIndex, setCurrentAdVariantIndex] = useState(0)
  const [superHeadline, setSuperHeadline] = useState("AlttaHomes")
  const [mainHeadline, setMainHeadline] = useState("Tu hogar en Cancun con alberca y amenidades")
  const [bodyText, setBodyText] = useState("")
  
  // Copy Tone Selector
  const [copyTone, setCopyTone] = useState("balanced")
  const COPY_TONES = [
    { id: 'investment', name: '💰 Inversión', desc: 'ROI, plusvalía, activo patrimonial' },
    { id: 'lifestyle', name: '🌴 Lifestyle', desc: 'Experiencia, bienestar, legado familiar' },
    { id: 'urgency', name: '⚡ Urgencia', desc: 'Escasez, últimas unidades, oportunidad' },
    { id: 'luxury', name: '👑 Ultra Lujo', desc: 'Exclusividad, privacidad, estatus' },
    { id: 'balanced', name: '⚖️ Balanceado', desc: 'Mix equilibrado de todos los ángulos' },
  ]
  
  // Design Settings State
  const [layout, setLayout] = useState("center")
  
  // Font Size Controls (vh units for preview, sent as multiplier to backend)
  const [superFontSize, setSuperFontSize] = useState(1.4)       // Altta logo/brand
  const [projectFontSize, setProjectFontSize] = useState(1.6)   // Model label
  const [headlineFontSize, setHeadlineFontSize] = useState(4.2) // Hook phrase
  const [bodyFontSize, setBodyFontSize] = useState(2.2)         // Price
  
  // Granular Color Controls (replaces fixed themes)
  const [accentColor, _setAccentColor] = useState("#d4af37")
  const [projectColor, _setProjectColor] = useState("#ffffff")  // Color del nombre del proyecto
  const [textColor, _setTextColor] = useState("#ffffff")
  const [bodyColor, _setBodyColor] = useState("#cccccc")
  const [logoColor, _setLogoColor] = useState("#d4af37")
  const [lineColor, _setLineColor] = useState("#d4af37")
  
  // Auto-clear rendered image when any color changes → live preview
  const setAccentColor = (v) => { _setAccentColor(v); setRenderedImage(null) }
  const setProjectColor = (v) => { _setProjectColor(v); setRenderedImage(null) }
  const setTextColor = (v) => { _setTextColor(v); setRenderedImage(null) }
  const setBodyColor = (v) => { _setBodyColor(v); setRenderedImage(null) }
  const setLogoColor = (v) => { _setLogoColor(v); setRenderedImage(null) }
  const setLineColor = (v) => { _setLineColor(v); setRenderedImage(null) }
  
  // BMC Quick Palette
  const BMC_PALETTE = [
    { name: 'Gold', hex: '#d4af37' },
    { name: 'Platinum', hex: '#e5e4e2' },
    { name: 'White', hex: '#ffffff' },
    { name: 'Onyx', hex: '#1a1a1a' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Auburn', hex: '#8b4513' },
    { name: 'Teal', hex: '#005f73' },
    { name: 'Navy', hex: '#001219' },
  ]

  // 8K Export Settings
  const [outputQuality, setOutputQuality] = useState("8k")
  const [outputFormat, setOutputFormat] = useState("jpeg")
  const [aspectRatio, setAspectRatio] = useState("1:1")

  const fileInputRef = useRef(null)
  const previewRef = useRef(null)

  const selectedAlttaProduct = getAlttaProductById(selectedAlttaProductId)

  const normalizeAlttaPrice = (value) => {
    const clean = (value || '').trim()
    if (!clean) return ''
    return clean.toLowerCase().startsWith('desde') ? clean : `Desde ${clean}`
  }

  const buildAlttaContext = () => {
    const productContext = selectedAlttaProduct?.context || ''
    return [
      productContext,
      `Empresa: Altta Homes.`,
      `Desarrollo: ${alttaDevelopment}.`,
      `Modelo: ${alttaModel}.`,
      `Tipo: ${alttaProductType}.`,
      `Precio: ${normalizeAlttaPrice(alttaPrice)}.`,
      `Especificaciones: ${alttaSpecs}.`,
      `CTA: ${alttaCta}.`,
      `Telefono: ${alttaPhone}.`
    ].filter(Boolean).join(' ')
  }

  const applyAlttaProduct = (product) => {
    if (!product) return
    setSelectedAlttaProductId(product.id)
    setAlttaDevelopment(product.development)
    setAlttaModel(product.model)
    setAlttaProductType(product.productType)
    setAlttaPrice(normalizeAlttaPrice(product.price))
    setAlttaSpecs(product.specs)
    setAlttaBadge(product.badge)
    setAlttaCta(product.cta)
    setAlttaPhone(product.phone)
    setProjectContext(product.development)
    setProjectLocation('Cancun, Quintana Roo')
    setSuperHeadline('AlttaHomes')
    setMainHeadline(product.defaultHook)
    setBodyText('')
    setAccentColor('#d6b84f')
    setProjectColor('#ffffff')
    setTextColor('#ffffff')
    setBodyColor('#ffffff')
    setLogoColor('#d6b84f')
    setLineColor('#d6b84f')
    setLayout('center')
    setRenderedImage(null)
  }

  const resetAlttaLayout = () => {
    setAlttaLayout({
      logo: { x: 50, y: 14, width: 42 },
      model: { x: 50, y: 52, width: 70 },
      headline: { x: 50, y: 62, width: 92 },
      price: { x: 50, y: 75, width: 72 },
      cta: { x: 50, y: 86, width: 72 },
    })
    setRenderedImage(null)
  }

  const startAlttaDrag = (key, event) => {
    event.preventDefault()
    event.stopPropagation()
    setSelectedAlttaLayer(key)
    setActiveAlttaLayer(key)
    const rect = previewRef.current?.getBoundingClientRect()
    if (!rect) return
    const move = (e) => {
      let x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
      let y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
      if (Math.abs(x - 50) < 1.2) x = 50
      if (Math.abs(y - 50) < 1.2) y = 50
      setAlttaLayout(prev => ({
        ...prev,
        [key]: { ...prev[key], x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) }
      }))
      setRenderedImage(null)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setActiveAlttaLayer(null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    move(event)
  }

  const alttaLayerStyle = (key, extra = {}) => {
    const layer = alttaLayout[key]
    return {
      left: `${layer.x}%`,
      top: `${layer.y}%`,
      width: 'fit-content',
      maxWidth: `${layer.width}%`,
      transform: 'translate(-50%, -50%)',
      ...extra
    }
  }

  const activeLayerPosition = activeAlttaLayer ? alttaLayout[activeAlttaLayer] : null
  const selectedLayerPosition = selectedAlttaLayer ? alttaLayout[selectedAlttaLayer] : null

  const getSelectedLayerConfig = () => {
    const configs = {
      logo: {
        label: 'Logo',
        text: superHeadline,
        setText: setSuperHeadline,
        color: logoColor,
        setColor: setLogoColor,
        size: superFontSize,
        setSize: setSuperFontSize,
      },
      model: {
        label: 'Modelo',
        text: alttaModel,
        setText: setAlttaModel,
        color: projectColor,
        setColor: setProjectColor,
        size: projectFontSize,
        setSize: setProjectFontSize,
      },
      headline: {
        label: 'Frase',
        text: mainHeadline,
        setText: setMainHeadline,
        color: textColor,
        setColor: setTextColor,
        size: headlineFontSize,
        setSize: setHeadlineFontSize,
      },
      price: {
        label: 'Precio',
        text: alttaPrice,
        setText: (value) => setAlttaPrice(normalizeAlttaPrice(value)),
        color: accentColor,
        setColor: setAccentColor,
        size: bodyFontSize,
        setSize: setBodyFontSize,
      },
      cta: {
        label: 'CTA',
        text: `${alttaCta} - ${alttaPhone}`,
        setText: (value) => {
          const [ctaValue, ...phoneParts] = value.split('-')
          setAlttaCta(ctaValue.trim())
          setAlttaPhone(phoneParts.join('-').trim())
        },
        color: bodyColor,
        setColor: setBodyColor,
        size: ctaFontSize,
        setSize: setCtaFontSize,
      },
    }
    return selectedAlttaLayer ? configs[selectedAlttaLayer] : null
  }

  const updateSelectedLayerWidth = (delta) => {
    if (!selectedAlttaLayer) return
    setAlttaLayout(prev => ({
      ...prev,
      [selectedAlttaLayer]: {
        ...prev[selectedAlttaLayer],
        width: Math.max(12, Math.min(100, Number((prev[selectedAlttaLayer].width + delta).toFixed(2))))
      }
    }))
    setRenderedImage(null)
  }

  const nudgeSelectedLayer = (dx, dy) => {
    if (!selectedAlttaLayer) return
    setAlttaLayout(prev => ({
      ...prev,
      [selectedAlttaLayer]: {
        ...prev[selectedAlttaLayer],
        x: Math.max(0, Math.min(100, Number((prev[selectedAlttaLayer].x + dx).toFixed(2)))),
        y: Math.max(0, Math.min(100, Number((prev[selectedAlttaLayer].y + dy).toFixed(2)))),
      }
    }))
    setRenderedImage(null)
  }

  const selectedLayerConfig = getSelectedLayerConfig()

  const appendRenderFields = (formData, format) => {
    formData.append("super_headline", superHeadline)
    formData.append("main_headline", mainHeadline)
    formData.append("body_text", bodyText)
    formData.append("project_name", projectContext)
    formData.append("location", projectLocation)
    formData.append("layout", layout)
    formData.append("theme", "ALTTA_PRODUCT_CARD")
    formData.append("output_quality", outputQuality)
    formData.append("output_format", format)
    formData.append("color_enhance", "true")
    formData.append("aspect_ratio", aspectRatio)
    formData.append("accent_color_hex", accentColor)
    formData.append("project_color_hex", projectColor)
    formData.append("text_color_hex", textColor)
    formData.append("body_color_hex", bodyColor)
    formData.append("logo_color_hex", logoColor)
    formData.append("line_color_hex", lineColor)
    formData.append("super_font_size", superFontSize.toString())
    formData.append("project_font_size", projectFontSize.toString())
    formData.append("headline_font_size", headlineFontSize.toString())
    formData.append("body_font_size", bodyFontSize.toString())
    formData.append("cta_font_size", ctaFontSize.toString())
    formData.append("altta_layout_json", JSON.stringify(alttaLayout))
    formData.append("brand_name", superHeadline || "AlttaHomes")
    formData.append("developer_name", alttaBadge)
    formData.append("development_name", alttaDevelopment)
    formData.append("model_name", alttaModel)
    formData.append("product_type", alttaProductType)
    formData.append("price_text", normalizeAlttaPrice(alttaPrice))
    formData.append("specs_text", alttaSpecs)
    formData.append("cta_text", alttaCta)
    formData.append("phone_text", alttaPhone)
  }

  // ═══════════════════════════════════════════════════════════════════
  // FIREBASE: Load projects on mount
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const projectsList = await getProjects()
      setProjects(projectsList)
      console.log('Loaded projects from Firestore:', projectsList.length)
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const handleSeedProjects = async () => {
    setLoading(true)
    try {
      await seedInitialProjects(INITIAL_PROJECTS)
      await loadProjects()
      alert('¡Proyectos migrados a Firebase exitosamente!')
    } catch (error) {
      console.error('Error seeding:', error)
      alert('Error migrando proyectos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProject = (project) => {
    setSelectedProject(project)
    setProjectContext(project.name)
    
    // Auto-apply project copy
    if (project.super_headline) setSuperHeadline(project.super_headline)
    if (project.main_headline) setMainHeadline(project.main_headline)
    if (project.body_text) setBodyText(project.body_text)
    if (project.layout) setLayout(project.layout)
    
    // Auto-apply project colors
    if (project.color_scheme) {
      const cs = project.color_scheme
      if (cs.accent) setAccentColor(cs.accent)
      if (cs.text) setTextColor(cs.text)
      if (cs.logo) setLogoColor(cs.logo)
      setLineColor(cs.accent || '#d4af37')
    }
    
    setRenderedImage(null) // Reset preview
  }

  const handleAddProject = async () => {
    if (!newProjectName.trim()) return
    setLoading(true)
    try {
      await addProject({
        name: newProjectName.toUpperCase().replace(/\s+/g, '_'),
        displayName: newProjectName,
        super_headline: 'NUEVO PROYECTO',
        main_headline: newProjectName + '\nNueva Oportunidad',
        body_text: 'Descripción del proyecto aquí.',
        layout: 'center',
        color_scheme: {
          accent: '#d4af37',
          text: '#ffffff',
          logo: '#d4af37'
        }
      })
      await loadProjects()
      setShowAddProjectModal(false)
      setNewProjectName('')
    } catch (error) {
      alert('Error agregando proyecto: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      // Extract project name from filename if possible
      const nameWithoutExt = file.name.split('.').slice(0, -1).join('.')
      setProjectContext(nameWithoutExt)
      
      // Use createObjectURL for better performance and robustness
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc)
      }
      setRenderedImage(null) // Reset when uploading new
      const url = URL.createObjectURL(file)
      setImageSrc(url)
    }
  }

  const handleRealPreview = async () => {
    if (!imageSrc) return alert("Sube una imagen primero.")
    setLoading(true)
    try {
      const formData = new FormData()
      if(imageFile) {
        formData.append("image", imageFile)
      } else {
        const res = await fetch(imageSrc)
        const blob = await res.blob()
        formData.append("image", blob)
      }
      appendRenderFields(formData, "jpeg")

      const response = await fetch(`${API_BASE_URL}/api/render-ad`, {
        method: "POST",
        body: formData
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        if (renderedImage) URL.revokeObjectURL(renderedImage)
        setRenderedImage(url)
      } else {
        alert("El Backend no respondió correctamente para la previa.")
      }
    } catch (err) {
      console.error(err)
      alert("Error conectando con el Backend. Asegúrate de que esté encendido.")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateImage = async () => {
    if(!imagePrompt) return alert("Escribe un prompt para la IA")
    setLoading(true)
    try {
      const resp = await fetch(`${API_BASE_URL}/api/generate-ai-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt,
          aspect_ratio: aspectRatio === "original" ? "1:1" : aspectRatio
        })
      })
      const data = await resp.json()
      
      if (data.success && data.image_base64) {
        // Convertir base64 a blob y crear URL
        const byteCharacters = atob(data.image_base64)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: data.mime_type })
        const imageUrl = URL.createObjectURL(blob)
        
        setImageSrc(imageUrl)
        alert("✅ Imagen generada con IA exitosamente!")
      } else {
        alert(`Error: ${data.error || "No se pudo generar la imagen"}`)
      }
    } catch(err) {
      console.error(err)
      alert(`Error de conexión: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCopy = async () => {
    if(!projectContext) return alert("Ingresa el nombre del proyecto o sube una imagen primero.")
    setLoading(true)
    try {
      const resp = await fetch(`${API_BASE_URL}/api/generate-copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: projectContext,
          context: "",
          tone: copyTone // Tono seleccionado por el usuario
        })
      })
      
      if(resp.ok) {
        const data = await resp.json()
        if (data.variantes && data.variantes.length > 0) {
          setAdVariants(data.variantes)
          setCurrentAdVariantIndex(0)
          
          // Apply first variant
          const first = data.variantes[0]
          setSuperHeadline(first.super_headline)
          setMainHeadline(first.main_headline)
          setBodyText(first.body_text)
        }
        
        // Auto-apply project colors from backend scheme
        if (data.color_scheme) {
          const COLOR_MAP = {
            'GOLD': '#d4af37', 'PLATINUM': '#e5e4e2', 'WHITE': '#ffffff',
            'ONYX': '#1a1a1a', 'SILVER': '#a0aec0', 'EMERALD': '#10b981',
            'AUBURN': '#8b4513', 'TEAL': '#005f73'
          }
          const s = data.color_scheme
          if (s.accent_key && COLOR_MAP[s.accent_key]) setAccentColor(COLOR_MAP[s.accent_key])
          if (s.text_key === 'WHITE') setTextColor('#ffffff')
          else if (s.text_key === 'ONYX') setTextColor('#1a1a1a')
          else if (s.text_key === 'SILVER') setTextColor('#a0aec0')
          else if (s.text_key && s.text_key.startsWith('#')) setTextColor(s.text_key)
          if (s.logo_color && COLOR_MAP[s.logo_color]) setLogoColor(COLOR_MAP[s.logo_color])
          // Set body to a complementary shade
          if (s.base) {
            // If base is dark, body should be light; if light, body dark
            const isDark = s.base.replace('#','').match(/.{2}/g)
              ?.reduce((sum, c) => sum + parseInt(c, 16), 0) < 384
            setBodyColor(isDark ? '#cccccc' : '#4a4a4a')
          }
        }
      } else {
        console.error("Error en la API de copy")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateAlttaCopy = async () => {
    if(!alttaDevelopment || !alttaModel) return alert("Selecciona o escribe un desarrollo y modelo primero.")
    setLoading(true)
    try {
      const resp = await fetch(`${API_BASE_URL}/api/altta/product-copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          development: alttaDevelopment,
          model_name: alttaModel,
          product_type: alttaProductType,
          price_text: normalizeAlttaPrice(alttaPrice),
          specs_text: alttaSpecs,
          cta_text: alttaCta,
          context: buildAlttaContext(),
          hashtags: ""
        })
      })
      const data = await resp.json()
      if (data.success && data.hooks?.length) {
        setAlttaCopyVariants(data.hooks)
        setCurrentAlttaVariantIndex(0)
        setMainHeadline(data.hooks[0])
        if (data.social_posts?.length) {
          setSocialVariants(data.social_posts)
        }
      } else {
        alert(data.error || "No se pudo generar copy de Altta.")
      }
    } catch (err) {
      console.error(err)
      alert(`Error de conexion: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateAlttaSocialCopy = async () => {
    setLoading(true)
    try {
      const resp = await fetch(`${API_BASE_URL}/api/altta/product-copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          development: alttaDevelopment,
          model_name: alttaModel,
          product_type: alttaProductType,
          price_text: normalizeAlttaPrice(alttaPrice),
          specs_text: alttaSpecs,
          cta_text: alttaCta,
          context: buildAlttaContext(),
          hashtags: ""
        })
      })
      const data = await resp.json()
      if (data.success && data.social_posts?.length) {
        setSocialVariants(data.social_posts)
        setCurrentVariantIndex(0)
        setShowSocialModal(true)
      } else {
        alert(data.error || "No se pudo generar copy para publicacion.")
      }
    } catch (err) {
      console.error(err)
      alert(`Error de conexion: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateSocialCopy = async () => {
    if(!projectContext) return alert("Ingresa el nombre del proyecto o sube una imagen primero.")
    setLoading(true)
    try {
      const resp = await fetch(`${API_BASE_URL}/api/social-copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: projectContext,
          context: ""
        })
      })
      
      if(resp.ok) {
        const data = await resp.json()
        if (data.variantes && data.variantes.length > 0) {
          setSocialVariants(data.variantes)
          setCurrentVariantIndex(0)
          setShowSocialModal(true)
        } else {
          alert("La IA no generó variantes válidas. Intenta de nuevo.")
        }
      } else {
        console.error("Error en la API de social copy")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!imageSrc) {
      alert("Necesitas una imagen en el canvas primero.")
      return
    }
    setLoading(true)
    
    alert(`Enviando al Backend Python (FastAPI)...\nPara que funcione debes ejecutar 'python main.py' en la carpeta backend.`)
    
    try {
      const formData = new FormData()
      // If we generated via AI we might not have a File object, just base64 src. 
      // For now we assume a File object exists or we convert base64 to blob.
      if(imageFile) {
        formData.append("image", imageFile)
      } else {
        // Mock if AI generated
        const res = await fetch(imageSrc)
        const blob = await res.blob()
        formData.append("image", blob)
      }
      appendRenderFields(formData, outputFormat)

      const response = await fetch(`${API_BASE_URL}/api/render-ad`, {
        method: "POST",
        body: formData
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        let projName = projectContext ? projectContext.trim().replace(/\s+/g, '_') : 'BMC_Ad';
        let dimensionStr = aspectRatio !== 'original' ? aspectRatio.replace(':', 'x') : 'Original';
        a.download = `${projName}_${dimensionStr}_${Date.now()}.${outputFormat === 'png' ? 'png' : 'jpg'}`
        
        document.body.appendChild(a)
        a.click()
        a.remove()
      } else {
        console.warn("Backend FastAPI falló o no está activo.")
      }
    } catch (err) {
      console.error("No se pudo conectar al backend", err)
    } finally {
      setLoading(false)
    }
  }

  const handleEnhanceOnly = async () => {
    if (!imageSrc) {
      alert("Necesitas subir una imagen primero.")
      return
    }
    setLoading(true)
    
    alert(`Enviando imagen original al motor 8K (LANCZOS)...\nTardará unos segundos.`)
    
    try {
      const formData = new FormData()
      if(imageFile) {
        formData.append("image", imageFile)
      } else {
        const res = await fetch(imageSrc)
        const blob = await res.blob()
        formData.append("image", blob)
      }
      formData.append("output_quality", outputQuality)
      formData.append("color_enhance", "true")

      const response = await fetch(`${API_BASE_URL}/api/enhance-image`, {
        method: "POST",
        body: formData
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `BMC_Clean_${outputQuality}_${Date.now()}.jpg`
        document.body.appendChild(a)
        a.click()
        a.remove()
      } else {
        console.warn("Backend FastAPI falló o no está activo.")
        alert("Error al intentar mejorar la foto.")
      }
    } catch (err) {
      console.error("No se pudo conectar al backend", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Page Router */}
      {currentPage === 'studio' ? (
        <ImageStudio onBack={() => setCurrentPage('engine')} />
      ) : currentPage === 'aichat' ? (
        <AIChat onBack={() => setCurrentPage('engine')} />
      ) : (
    <div className="app-container">
      {/* SIDEBAR / CONTROLS */}
      <div className="sidebar">
        <div className="brand-header">
          <h1 className="brand-title">BRISA MAYA</h1>
          <div className="brand-subtitle">Marketing Engine AI</div>
        </div>
        
        {/* AI CHAT BUTTON */}
        <button 
          className="btn btn-ai" 
          style={{width: '100%', marginBottom: '10px', padding: '12px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer'}}
          onClick={() => setCurrentPage('aichat')}
        >
          💬 AI Chat (Generador de Imágenes)
        </button>

        {/* AI STUDIO BUTTON */}
        <button 
          className="btn btn-ai" 
          style={{width: '100%', marginBottom: '15px', padding: '12px', background: 'linear-gradient(135deg, #9333ea, #db2777)'}}
          onClick={() => setCurrentPage('studio')}
        >
          🎨 AI Image Studio
        </button>

        {/* --- NUEVO: PESTAÑAS DE ORIGEN DE IMAGEN --- */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            className={`btn ${activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}`} 
            style={{flex: 1, padding: '8px'}}
            onClick={() => setActiveTab('upload')}
          >
            Subir Foto
          </button>
          <button 
            className={`btn ${activeTab === 'generate' ? 'btn-ai' : 'btn-secondary'}`} 
            style={{flex: 1, padding: '8px', animation: "none"}}
            onClick={() => setActiveTab('generate')}
          >
            Crear con IA
          </button>
        </div>

        {activeTab === 'generate' && (
          <div className="form-group" style={{background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px'}}>
            <label className="form-label">Prompt de Imagen (IA)</label>
            <textarea 
              className="form-textarea" 
              placeholder="Ej. Fachada de edificio de lujo frente al mar en Tulum al atardecer, hiperrealista, 8k..."
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              style={{minHeight: '60px', marginBottom: '10px'}}
            />
            <button className="btn btn-ai" style={{padding: '8px'}} onClick={handleGenerateImage}>
              🎨 Generar Fotografía
            </button>
          </div>
        )}

        <div className="form-group glass-card" style={{ padding: '14px', borderRadius: '12px', border: '1px solid rgba(214,184,79,0.25)' }}>
          <label className="form-label" style={{ color: '#d6b84f', fontWeight: 700 }}>
            ALTTA HOMES - CATALOGO
          </label>
          <select
            className="form-select"
            value={selectedAlttaProductId}
            onChange={(e) => applyAlttaProduct(getAlttaProductById(e.target.value))}
            style={{ marginBottom: '10px' }}
          >
            {ALTTA_HOMES_CATALOG.map(item => (
              <option key={item.id} value={item.id}>
                {item.development} - {item.model}
              </option>
            ))}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <input className="form-input" value={alttaDevelopment} onChange={(e) => { setAlttaDevelopment(e.target.value); setProjectContext(e.target.value); setRenderedImage(null) }} placeholder="Desarrollo" />
            <input className="form-input" value={alttaModel} onChange={(e) => { setAlttaModel(e.target.value); setRenderedImage(null) }} placeholder="Modelo" />
          </div>
          <div style={{ display: 'none', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <input className="form-input" value={alttaProductType} onChange={(e) => { setAlttaProductType(e.target.value); setRenderedImage(null) }} placeholder="Tipo" />
            <input className="form-input" value={alttaBadge} onChange={(e) => { setAlttaBadge(e.target.value); setRenderedImage(null) }} placeholder="Badge" />
          </div>
          <input
            className="form-input"
            value={alttaPrice}
            onChange={(e) => { setAlttaPrice(normalizeAlttaPrice(e.target.value)); setRenderedImage(null) }}
            placeholder="Desde $0 MXN"
            style={{ marginBottom: '8px' }}
          />
          <input
            className="form-input"
            value={alttaSpecs}
            onChange={(e) => { setAlttaSpecs(e.target.value); setRenderedImage(null) }}
            placeholder="m2 · Rec · Banos"
            style={{ marginBottom: '8px' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <input className="form-input" value={alttaCta} onChange={(e) => { setAlttaCta(e.target.value); setRenderedImage(null) }} placeholder="CTA" />
            <input className="form-input" value={alttaPhone} onChange={(e) => { setAlttaPhone(e.target.value); setRenderedImage(null) }} placeholder="Telefono" />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-ai" style={{ flex: 1, padding: '9px', animation: 'none' }} onClick={handleGenerateAlttaCopy}>
              Frase IA
            </button>
            <button className="btn btn-secondary" style={{ flex: 1, padding: '9px', border: '1px solid #d6b84f', color: '#d6b84f' }} onClick={handleGenerateAlttaSocialCopy}>
              Copy Post
            </button>
          </div>
          {alttaCopyVariants.length > 0 && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {alttaCopyVariants.map((hook, idx) => (
                <button
                  key={hook}
                  className={`btn ${currentAlttaVariantIndex === idx ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: 'auto', padding: '6px 8px', fontSize: '0.72rem' }}
                  onClick={() => {
                    setCurrentAlttaVariantIndex(idx)
                    setMainHeadline(hook)
                    setRenderedImage(null)
                  }}
                >
                  Frase {idx + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SELECTOR DE PROYECTOS DINÁMICO (Firebase) */}
        <div className="form-group" style={{ display: 'none', background: 'rgba(212,175,55,0.05)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(212,175,55,0.2)' }}>
          <label className="form-label" style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '0.75rem', letterSpacing: '1px' }}>
            📁 PROYECTO
          </label>
          
          {projects.length > 0 ? (
            <select 
              className="form-select" 
              value={selectedProject?.id || ''} 
              onChange={(e) => {
                const proj = projects.find(p => p.id === e.target.value)
                if (proj) handleSelectProject(proj)
              }}
              style={{ marginBottom: '8px' }}
            >
              <option value="">— Seleccionar proyecto —</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.displayName || p.name} {p.location ? `(${p.location})` : ''}
                </option>
              ))}
            </select>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '10px' }}>No hay proyectos en Firebase</p>
              <button 
                className="btn btn-ai" 
                style={{ padding: '8px 16px' }} 
                onClick={handleSeedProjects}
              >
                🚀 Migrar Proyectos a Firebase
              </button>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '6px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="O escribe nombre manualmente..."
              value={projectContext}
              onChange={(e) => setProjectContext(e.target.value)}
              style={{ flex: 1, fontSize: '0.85rem' }}
            />
            <button 
              className="btn btn-secondary" 
              style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
              onClick={() => setShowAddProjectModal(true)}
              title="Agregar nuevo proyecto"
            >
              +
            </button>
          </div>
          <input 
            type="text" 
            className="form-input" 
            placeholder="📍 Ubicación (opcional): Tulum, México"
            value={projectLocation}
            onChange={(e) => setProjectLocation(e.target.value)}
            style={{ marginTop: '6px', fontSize: '0.85rem' }}
          />
        </div>

        {/* SELECTOR DE TONO PARA COPY */}
        <div className="form-group" style={{ display: 'none', marginBottom: '12px' }}>
          <label className="form-label" style={{ fontSize: '0.7rem', color: '#a78bfa', letterSpacing: '1px' }}>
            🎯 TONO DEL COPY
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {COPY_TONES.map(tone => (
              <button
                key={tone.id}
                className={`btn ${copyTone === tone.id ? 'btn-ai' : 'btn-secondary'}`}
                style={{ 
                  flex: '1 1 calc(50% - 3px)', 
                  padding: '8px 6px', 
                  fontSize: '0.75rem',
                  minWidth: '100px',
                  border: copyTone === tone.id ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)'
                }}
                onClick={() => setCopyTone(tone.id)}
                title={tone.desc}
              >
                {tone.name}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.65rem', color: '#666', marginTop: '4px', textAlign: 'center' }}>
            {COPY_TONES.find(t => t.id === copyTone)?.desc}
          </p>
        </div>

        <div className="form-group" style={{ display: 'none', gap: '8px', marginBottom: '8px' }}>
          <button className="btn btn-ai" style={{ flex: 1 }} onClick={handleGenerateCopy}>
            ✨ Textos Ad
          </button>
          <button className="btn btn-secondary" style={{ flex: 1, border: '1px solid #8b5cf6', color: '#a78bfa' }} onClick={handleGenerateSocialCopy}>
            📱 Social Copy
          </button>
        </div>

        {adVariants.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '10px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
            <span style={{ fontSize: '0.7rem', color: '#d4af37', fontWeight: 'bold' }}>VARIANTE {currentAdVariantIndex + 1}/3</span>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '2px 8px', fontSize: '10px', width: 'auto' }}
                disabled={currentAdVariantIndex === 0}
                onClick={() => {
                  const newIdx = currentAdVariantIndex - 1;
                  setCurrentAdVariantIndex(newIdx);
                  const v = adVariants[newIdx];
                  setSuperHeadline(v.super_headline);
                  setMainHeadline(v.main_headline);
                  setBodyText(v.body_text);
                }}
              >
                &larr;
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '2px 8px', fontSize: '10px', width: 'auto' }}
                disabled={currentAdVariantIndex === adVariants.length - 1}
                onClick={() => {
                  const newIdx = currentAdVariantIndex + 1;
                  setCurrentAdVariantIndex(newIdx);
                  const v = adVariants[newIdx];
                  setSuperHeadline(v.super_headline);
                  setMainHeadline(v.main_headline);
                  setBodyText(v.body_text);
                }}
              >
                &rarr;
              </button>
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Logo / Marca</label>
          <input 
            type="text" 
            className="form-input" 
            value={superHeadline}
            onChange={(e) => setSuperHeadline(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Frase gancho</label>
          <input 
            type="text" 
            className="form-input" 
            value={mainHeadline}
            onChange={(e) => setMainHeadline(e.target.value)}
            style={{ fontFamily: 'Playfair Display', fontWeight: 'bold' }}
          />
        </div>

        <div className="form-group" style={{ display: 'none' }}>
          <label className="form-label">Body Text</label>
          <textarea 
            className="form-textarea" 
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
          />
        </div>

        {/* Font Size Controls */}
        <div className="form-group glass-card" style={{ padding: '12px', borderRadius: '12px', marginBottom: '1rem' }}>
          <label className="form-label" style={{color: '#a78bfa', fontSize: '0.75rem', letterSpacing: '1px', marginBottom: '10px'}}>
            📐 TAMAÑOS DE TEXTO
          </label>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.7rem', color: '#888', width: '60px' }}>Logo</span>
              <input 
                type="range" 
                min="0.8" max="3" step="0.1"
                value={superFontSize}
                onChange={(e) => setSuperFontSize(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#d4af37' }}
              />
              <span style={{ fontSize: '0.7rem', color: '#d4af37', width: '35px' }}>{superFontSize}vh</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.7rem', color: '#888', width: '60px' }}>Modelo</span>
              <input 
                type="range" 
                min="0.9" max="3" step="0.1"
                value={projectFontSize}
                onChange={(e) => setProjectFontSize(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#d4af37' }}
              />
              <span style={{ fontSize: '0.7rem', color: '#d4af37', width: '35px' }}>{projectFontSize}vh</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.7rem', color: '#888', width: '60px' }}>Frase</span>
              <input 
                type="range" 
                min="2" max="7" step="0.2"
                value={headlineFontSize}
                onChange={(e) => setHeadlineFontSize(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#d4af37' }}
              />
              <span style={{ fontSize: '0.7rem', color: '#d4af37', width: '35px' }}>{headlineFontSize}vh</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.7rem', color: '#888', width: '60px' }}>Precio</span>
              <input 
                type="range" 
                min="1.4" max="4" step="0.1"
                value={bodyFontSize}
                onChange={(e) => setBodyFontSize(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#d4af37' }}
              />
              <span style={{ fontSize: '0.7rem', color: '#d4af37', width: '35px' }}>{bodyFontSize}vh</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.7rem', color: '#888', width: '60px' }}>CTA</span>
              <input 
                type="range" 
                min="0.8" max="2.5" step="0.1"
                value={ctaFontSize}
                onChange={(e) => setCtaFontSize(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#d4af37' }}
              />
              <span style={{ fontSize: '0.7rem', color: '#d4af37', width: '35px' }}>{ctaFontSize}vh</span>
            </div>
          </div>
        </div>

        <div className="form-group glass-card" style={{ padding: '15px', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <label className="form-label" style={{color: '#d4af37', fontSize: '0.8rem', letterSpacing: '1px'}}>IDENTIDAD VISUAL</label>
          
          <div className="color-control-grid">
            {[
              { label: 'Logo', value: logoColor, setter: setLogoColor },
              { label: 'Precio', value: accentColor, setter: setAccentColor },
              { label: 'Modelo', value: projectColor, setter: setProjectColor },
              { label: 'Frase', value: textColor, setter: setTextColor },
              { label: 'CTA', value: bodyColor, setter: setBodyColor },
            ].map(ctrl => (
              <div key={ctrl.label} className="color-control">
                <div className="color-control-header">
                  <span className="color-control-label">{ctrl.label}</span>
                  <div className="color-dot" style={{ background: ctrl.value }} />
                </div>
                <div className="color-palette">
                  {BMC_PALETTE.map(c => (
                    <button
                      key={c.hex}
                      className={`palette-dot ${ctrl.value === c.hex ? 'active' : ''}`}
                      style={{ background: c.hex }}
                      title={c.name}
                      onClick={() => ctrl.setter(c.hex)}
                    />
                  ))}
                </div>
                <input 
                  type="color" 
                  className="color-hex-input"
                  value={ctrl.value}
                  onChange={(e) => ctrl.setter(e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Layout</label>
          <select className="form-select" value={layout} onChange={(e) => setLayout(e.target.value)}>
            <option value="left">Izquierda</option>
            <option value="center">Centro</option>
            <option value="right">Derecha</option>
          </select>
          <button
            className="btn btn-secondary"
            style={{ marginTop: '8px', padding: '8px', border: '1px solid rgba(212,175,55,0.45)', color: '#d4af37' }}
            onClick={resetAlttaLayout}
          >
            Resetear posiciones
          </button>
        </div>

        <div className="form-group" style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <label className="form-label" style={{color: '#a78bfa', fontWeight: 'bold'}}>⚡ Motor 8K Ultra-HD</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Resolución</label>
              <select className="form-select" value={outputQuality} onChange={(e) => setOutputQuality(e.target.value)}>
                <option value="8k">🔥 8K UHD (7680px)</option>
                <option value="4k">⚡ 4K UHD (3840px)</option>
                <option value="original">📷 Original</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">Formato</label>
              <select className="form-select" value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)}>
                <option value="jpeg">JPEG (Rápido)</option>
                <option value="png">PNG (Lossless)</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: '8px' }}>
            <label className="form-label">Proporción</label>
            <select className="form-select" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
              <option value="1:1">⬜ Cuadrado (1:1) — Feed</option>
              <option value="9:16">📱 Reel / Story (9:16)</option>
              <option value="16:9">🖥️ Paisaje (16:9) — YouTube</option>
            </select>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button 
            className="btn btn-secondary" 
            style={{marginBottom: '10px', border: '1px solid #6366f1', color: '#818cf8'}} 
            onClick={handleRealPreview}
          >
            👁️ Generar Previa Real
          </button>
          <button 
            className="btn btn-secondary" 
            style={{marginBottom: '10px', border: '1px solid #10b981', color: '#34d399'}} 
            onClick={handleEnhanceOnly}
          >
            🪄 Solo Mejorar en 8K (Limpia)
          </button>
          <button className="btn btn-primary" onClick={handleExport}>
            ⬇️ Descargar Anuncio Final
          </button>
        </div>
      </div>

      {/* CANVAS PREVIEW AREA */}
      <div className="canvas-area">
        <div className="canvas-toolbar">
          {renderedImage && (
            <button className="btn btn-secondary" style={{width: 'auto', marginRight: 'auto'}} onClick={() => setRenderedImage(null)}>
              ⬅️ Volver a Editor
            </button>
          )}
          <button className="btn btn-secondary" style={{width: 'auto'}} onClick={() => fileInputRef.current.click()}>
            📸 Subir Imagen Local
          </button>
        </div>

        {selectedLayerConfig && (
          <div
            className="altta-fixed-toolbar"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="altta-layer-name">{selectedLayerConfig.label}</span>
            <input
              className="altta-layer-text"
              value={selectedLayerConfig.text}
              onChange={(e) => {
                selectedLayerConfig.setText(e.target.value)
                setRenderedImage(null)
              }}
            />
            <input
              className="altta-layer-color"
              type="color"
              value={selectedLayerConfig.color}
              onChange={(e) => selectedLayerConfig.setColor(e.target.value)}
            />
            <button onClick={() => selectedLayerConfig.setSize(Math.max(0.6, Number((selectedLayerConfig.size - 0.1).toFixed(1))))}>-</button>
            <button onClick={() => selectedLayerConfig.setSize(Number((selectedLayerConfig.size + 0.1).toFixed(1)))}>+</button>
            <button onClick={() => updateSelectedLayerWidth(-4)}>W-</button>
            <button onClick={() => updateSelectedLayerWidth(4)}>W+</button>
            <button onClick={() => nudgeSelectedLayer(0, -1)}>↑</button>
            <button onClick={() => nudgeSelectedLayer(0, 1)}>↓</button>
            <button onClick={() => nudgeSelectedLayer(-1, 0)}>←</button>
            <button onClick={() => nudgeSelectedLayer(1, 0)}>→</button>
          </div>
        )}

        <div className="canvas-container">
          {renderedImage ? (
            <img src={renderedImage} alt="Real Preview" className="image-preview" />
          ) : imageSrc ? (
            <>
              <img src={imageSrc} alt="Preview" className="image-preview" />
              <div className={`layout-preview-overlay align-${layout}`} style={{ display: 'none' }}>
                <div style={{
                  width: '100%', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  marginBottom: 'auto',
                  marginTop: '4vh'
                }}>
                  {/* Vista Previa del Logotipo - Más realista */}
                  <div style={{
                     width: '15.5vh', height: '15.5vh',
                     maxHeight: '150px',
                     objectFit: 'contain',
                     opacity: 0.9,
                     filter: `drop-shadow(0px 2px 5px rgba(0,0,0,0.8))`
                  }}>
                    <svg viewBox="0 0 100 100" fill={logoColor} width="100%" height="100%">
                      <path d="M45 20h10v60h-10z M30 35h10v30h-10z M65 35h10v30h-10z"/>
                      <circle cx="50" cy="50" r="45" fill="none" stroke={logoColor} strokeWidth="2" opacity="0.5"/>
                    </svg>
                  </div>
                </div>

                <div className="lp-bottom" style={{ transform: 'translateY(-2vh)' }}>
                  {/* Location (opcional) */}
                  {projectLocation && (
                    <div style={{ 
                      color: '#b0b0b0', 
                      fontSize: '1.1vh', 
                      letterSpacing: '2px', 
                      marginBottom: '0.5vh',
                      textTransform: 'uppercase',
                      textAlign: layout === 'center' ? 'center' : layout === 'right' ? 'right' : 'left'
                    }}>
                      {projectLocation}
                    </div>
                  )}
                  
                  {/* Super Headline (badge) - opcional */}
                  {superHeadline && superHeadline.trim() && (
                    <>
                      <div className="lp-super" style={{ color: accentColor, fontSize: `${superFontSize}vh` }}>
                        {superHeadline}
                      </div>
                      
                      {/* Línea decorativa - solo si hay super_headline */}
                      <div className="lp-line" style={{ 
                        backgroundColor: lineColor,
                        boxShadow: `0 0 8px ${lineColor}66, 0 0 20px ${lineColor}33`,
                        marginLeft: layout === 'right' ? 'auto' : layout === 'center' ? 'auto' : '0',
                        marginRight: layout === 'left' ? 'auto' : layout === 'center' ? 'auto' : '0',
                      }} />
                    </>
                  )}
                  
                  {/* Project Name (HERO - el más grande) */}
                  {projectContext && (
                    <div style={{ 
                      color: projectColor, 
                      fontSize: `${projectFontSize}vh`, 
                      fontFamily: 'Playfair Display, Georgia, serif',
                      fontWeight: '400',
                      marginBottom: '0.8vh',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                      textAlign: layout === 'center' ? 'center' : layout === 'right' ? 'right' : 'left'
                    }}>
                      {projectContext}
                    </div>
                  )}
                  
                  {/* Main Headline (tagline) */}
                  <div className="lp-main" style={{ color: textColor, fontSize: `${headlineFontSize}vh` }}>
                    {mainHeadline.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                  
                  {/* Body Text */}
                  <div className="lp-body" style={{ color: bodyColor, fontSize: `${bodyFontSize}vh` }}>
                    {bodyText}
                  </div>
                </div>
              </div>
              <div ref={previewRef} className={`altta-preview-overlay altta-align-${layout}`}>
                {activeLayerPosition && (
                  <>
                    <div className={`altta-center-guide vertical ${Math.abs(activeLayerPosition.x - 50) <= 1.2 ? 'active' : ''}`} />
                    <div className={`altta-center-guide horizontal ${Math.abs(activeLayerPosition.y - 50) <= 1.2 ? 'active' : ''}`} />
                  </>
                )}
                <div
                  className={`altta-draggable altta-preview-brand ${selectedAlttaLayer === 'logo' ? 'selected' : ''}`}
                  onPointerDown={(e) => startAlttaDrag('logo', e)}
                  style={alttaLayerStyle('logo', { color: logoColor, fontSize: `${superFontSize}vh` })}
                >
                    {superHeadline}
                </div>
                <div
                  className={`altta-draggable altta-preview-model ${selectedAlttaLayer === 'model' ? 'selected' : ''}`}
                  onPointerDown={(e) => startAlttaDrag('model', e)}
                  style={alttaLayerStyle('model', { color: projectColor, fontSize: `${projectFontSize}vh` })}
                >
                    Modelo {alttaModel}
                </div>
                <div
                  className={`altta-draggable altta-preview-headline ${selectedAlttaLayer === 'headline' ? 'selected' : ''}`}
                  onPointerDown={(e) => startAlttaDrag('headline', e)}
                  style={alttaLayerStyle('headline', { color: textColor, fontSize: `${headlineFontSize}vh` })}
                >
                    {mainHeadline.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                </div>
                <div
                  className={`altta-draggable altta-preview-price ${selectedAlttaLayer === 'price' ? 'selected' : ''}`}
                  onPointerDown={(e) => startAlttaDrag('price', e)}
                  style={alttaLayerStyle('price', { color: accentColor, fontSize: `${bodyFontSize}vh` })}
                >
                    {normalizeAlttaPrice(alttaPrice)}
                </div>
                <div
                  className={`altta-draggable altta-preview-bottom ${selectedAlttaLayer === 'cta' ? 'selected' : ''}`}
                  onPointerDown={(e) => startAlttaDrag('cta', e)}
                  style={alttaLayerStyle('cta', { color: bodyColor, fontSize: `${ctaFontSize}vh` })}
                >
                  <span>{alttaCta}</span>
                  <span>{alttaPhone}</span>
                </div>
                {selectedLayerConfig && selectedLayerPosition && (
                  <div
                    className="altta-layer-toolbar"
                    style={{
                      left: `${selectedLayerPosition.x}%`,
                      top: `${Math.max(4, selectedLayerPosition.y - 9)}%`,
                      transform: 'translate(-50%, -100%)'
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="altta-layer-name">{selectedLayerConfig.label}</span>
                    <input
                      className="altta-layer-text"
                      value={selectedLayerConfig.text}
                      onChange={(e) => {
                        selectedLayerConfig.setText(e.target.value)
                        setRenderedImage(null)
                      }}
                    />
                    <input
                      className="altta-layer-color"
                      type="color"
                      value={selectedLayerConfig.color}
                      onChange={(e) => selectedLayerConfig.setColor(e.target.value)}
                    />
                    <button onClick={() => selectedLayerConfig.setSize(Math.max(0.6, Number((selectedLayerConfig.size - 0.1).toFixed(1))))}>-</button>
                    <button onClick={() => selectedLayerConfig.setSize(Number((selectedLayerConfig.size + 0.1).toFixed(1)))}>+</button>
                    <button onClick={() => updateSelectedLayerWidth(-4)}>W-</button>
                    <button onClick={() => updateSelectedLayerWidth(4)}>W+</button>
                    <button onClick={() => nudgeSelectedLayer(0, -1)}>↑</button>
                    <button onClick={() => nudgeSelectedLayer(0, 1)}>↓</button>
                    <button onClick={() => nudgeSelectedLayer(-1, 0)}>←</button>
                    <button onClick={() => nudgeSelectedLayer(1, 0)}>→</button>
                  </div>
                )}
              </div>
            </>
          ) : (
             <div className="upload-label" onClick={() => {
                if(activeTab === 'upload') fileInputRef.current.click()
                else document.querySelector('textarea').focus()
             }}>
              {activeTab === 'upload' ? (
                <>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  <span>Arrastra o haz clic para subir imagen original</span>
                </>
              ) : (
                <>
                 <svg fill="none" stroke="#8b5cf6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                  <span>Escribe un prompt en el panel y genera la imagen con IA</span>
                </>
              )}
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="file-input" 
          />
          
          {loading && (
            <div className="loader-overlay">
              <div className="spinner"></div>
              <div>Procesando magia de IA...</div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PARA SOCIAL COPY */}
      {showSocialModal && (
        <div className="modal-overlay" onClick={() => setShowSocialModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📱 Copy para Redes Sociales</h3>
              <button className="close-btn" onClick={() => setShowSocialModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <span style={{color: '#a78bfa', fontWeight: 'bold'}}>
                  Variante {currentVariantIndex + 1} de {socialVariants.length}
                </span>
                <div style={{display: 'flex', gap: '5px'}}>
                  <button 
                    className="btn btn-secondary" 
                    style={{padding: '4px 10px', width: 'auto'}} 
                    disabled={currentVariantIndex === 0}
                    onClick={() => setCurrentVariantIndex(i => i - 1)}
                  >
                    &larr; Ant
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={{padding: '4px 10px', width: 'auto'}} 
                    disabled={currentVariantIndex === socialVariants.length - 1}
                    onClick={() => setCurrentVariantIndex(i => i + 1)}
                  >
                    Sig &rarr;
                  </button>
                </div>
              </div>
              
              {socialVariants.length > 0 && (
                <div style={{background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(167, 139, 250, 0.2)'}}>
                  <h4 style={{color: '#fff', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px'}}>
                    {socialVariants[currentVariantIndex].titulo}
                  </h4>
                  <div className="social-copy-text" style={{whiteSpace: 'pre-wrap', color: '#e2e8f0', fontSize: '0.9rem', marginBottom: '15px'}}>
                    {socialVariants[currentVariantIndex].cuerpo}
                  </div>
                  <div style={{color: '#8b5cf6', fontSize: '0.8rem', fontWeight: '500'}}>
                    {socialVariants[currentVariantIndex].hashtags}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => {
                const variant = socialVariants[currentVariantIndex];
                const textToCopy = `${variant.titulo}\n\n${variant.cuerpo}\n\n${variant.hashtags}`;
                navigator.clipboard.writeText(textToCopy);
                alert("!Variante " + (currentVariantIndex + 1) + " copiada!");
              }}>
                📋 Copiar Esta Variante
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA AGREGAR NUEVO PROYECTO */}
      {showAddProjectModal && (
        <div className="modal-overlay" onClick={() => setShowAddProjectModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>➕ Nuevo Proyecto</h3>
              <button className="close-btn" onClick={() => setShowAddProjectModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nombre del Proyecto</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ej: NUEVO DESARROLLO TULUM"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  autoFocus
                />
              </div>
              <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '10px' }}>
                El proyecto se guardará en Firebase y estará disponible para generar copy y anuncios.
              </p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                style={{ marginRight: '10px' }}
                onClick={() => setShowAddProjectModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleAddProject}
                disabled={!newProjectName.trim()}
              >
                🚀 Crear Proyecto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
      )}
    </>
  )
}

export default App
