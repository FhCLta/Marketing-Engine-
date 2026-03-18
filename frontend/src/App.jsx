import { useState, useRef, useEffect } from 'react'
import './index.css'

// Firebase Imports
import { getProjects, seedInitialProjects, addProject } from './services/firestoreService'
import { INITIAL_PROJECTS } from './data/initialProjects'

function App() {
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
  const [socialVariants, setSocialVariants] = useState([])
  const [currentVariantIndex, setCurrentVariantIndex] = useState(0)
  const [showSocialModal, setShowSocialModal] = useState(false)

  // Ad Copy State
  const [adVariants, setAdVariants] = useState([])
  const [currentAdVariantIndex, setCurrentAdVariantIndex] = useState(0)
  const [superHeadline, setSuperHeadline] = useState("ULTRA LUXURY LIVING")
  const [mainHeadline, setMainHeadline] = useState("Brisa Maya Capital")
  const [bodyText, setBodyText] = useState("Invierte en el futuro del Caribe Mexicano con los más altos estándares de calidad y exclusividad.")
  
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
  
  // Granular Color Controls (replaces fixed themes)
  const [accentColor, _setAccentColor] = useState("#d4af37")
  const [textColor, _setTextColor] = useState("#ffffff")
  const [bodyColor, _setBodyColor] = useState("#cccccc")
  const [logoColor, _setLogoColor] = useState("#d4af37")
  const [lineColor, _setLineColor] = useState("#d4af37")
  
  // Auto-clear rendered image when any color changes → live preview
  const setAccentColor = (v) => { _setAccentColor(v); setRenderedImage(null) }
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
  const [aspectRatio, setAspectRatio] = useState("original")

  const fileInputRef = useRef(null)

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
      formData.append("super_headline", superHeadline)
      formData.append("main_headline", mainHeadline)
      formData.append("body_text", bodyText)
      formData.append("layout", layout)
      formData.append("theme", "GOLDEN_LEGACY")
      formData.append("output_quality", "4k")
      formData.append("output_format", "jpeg")
      formData.append("color_enhance", "true")
      formData.append("aspect_ratio", aspectRatio)
      formData.append("accent_color_hex", accentColor)
      formData.append("text_color_hex", textColor)
      formData.append("body_color_hex", bodyColor)
      formData.append("logo_color_hex", logoColor)
      formData.append("line_color_hex", lineColor)

      const response = await fetch("http://localhost:8000/api/render-ad", {
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
      // TODO: Connect to FastAPI backend endpoint to call Gemini/Imagen
      alert(`Backend: Falta conectar con la API de IA DALL-E/Midjourney/Gemini para crear: "${imagePrompt}"`)
      await new Promise(r => setTimeout(r, 2000)) // simulated wait
    } catch(err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCopy = async () => {
    if(!projectContext) return alert("Ingresa el nombre del proyecto o sube una imagen primero.")
    setLoading(true)
    try {
      const resp = await fetch("http://localhost:8000/api/generate-copy", {
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

  const handleGenerateSocialCopy = async () => {
    if(!projectContext) return alert("Ingresa el nombre del proyecto o sube una imagen primero.")
    setLoading(true)
    try {
      const resp = await fetch("http://localhost:8000/api/social-copy", {
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
      formData.append("super_headline", superHeadline)
      formData.append("main_headline", mainHeadline)
      formData.append("body_text", bodyText)
      formData.append("layout", layout)
      formData.append("theme", "GOLDEN_LEGACY")
      formData.append("output_quality", outputQuality)
      formData.append("output_format", outputFormat)
      formData.append("color_enhance", "true")
      formData.append("aspect_ratio", aspectRatio)
      formData.append("accent_color_hex", accentColor)
      formData.append("text_color_hex", textColor)
      formData.append("body_color_hex", bodyColor)
      formData.append("logo_color_hex", logoColor)
      formData.append("line_color_hex", lineColor)

      const response = await fetch("http://localhost:8000/api/render-ad", {
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

      const response = await fetch("http://localhost:8000/api/enhance-image", {
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
    <div className="app-container">
      {/* SIDEBAR / CONTROLS */}
      <div className="sidebar">
        <div className="brand-header">
          <h1 className="brand-title">BRISA MAYA</h1>
          <div className="brand-subtitle">Marketing Engine AI</div>
        </div>

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

        {/* SELECTOR DE PROYECTOS DINÁMICO (Firebase) */}
        <div className="form-group" style={{ background: 'rgba(212,175,55,0.05)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(212,175,55,0.2)' }}>
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
        </div>

        {/* SELECTOR DE TONO PARA COPY */}
        <div className="form-group" style={{ marginBottom: '12px' }}>
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

        <div className="form-group" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
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
          <label className="form-label">Super Headline</label>
          <input 
            type="text" 
            className="form-input" 
            value={superHeadline}
            onChange={(e) => setSuperHeadline(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Main Headline</label>
          <input 
            type="text" 
            className="form-input" 
            value={mainHeadline}
            onChange={(e) => setMainHeadline(e.target.value)}
            style={{ fontFamily: 'Playfair Display', fontWeight: 'bold' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Body Text</label>
          <textarea 
            className="form-textarea" 
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
          />
        </div>

        <div className="form-group glass-card" style={{ padding: '15px', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <label className="form-label" style={{color: '#d4af37', fontSize: '0.8rem', letterSpacing: '1px'}}>IDENTIDAD VISUAL</label>
          
          <div className="color-control-grid">
            {[
              { label: 'Logo', value: logoColor, setter: setLogoColor },
              { label: 'Acento', value: accentColor, setter: setAccentColor },
              { label: 'Línea', value: lineColor, setter: setLineColor },
              { label: 'Texto', value: textColor, setter: setTextColor },
              { label: 'Body', value: bodyColor, setter: setBodyColor },
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
              <option value="original">📷 Original</option>
              <option value="1:1">⬜ Cuadrado (1:1) — Feed</option>
              <option value="9:16">📱 Reel / Story (9:16)</option>
              <option value="4:5">📐 Retrato (4:5) — IG Post</option>
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

        <div className="canvas-container">
          {renderedImage ? (
            <img src={renderedImage} alt="Real Preview" className="image-preview" />
          ) : imageSrc ? (
            <>
              <img src={imageSrc} alt="Preview" className="image-preview" />
              <div style={{
                position:'absolute', top:0, left:0, right:0, bottom:0,
                background: 'linear-gradient(to bottom, rgba(15,20,25,0.8) 0%, transparent 20%, transparent 50%, rgba(15,20,25,0.95) 100%)'
              }} />
              
              <div className={`layout-preview-overlay align-${layout}`}>
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
                  <div className="lp-super" style={{ color: accentColor }}>
                    {superHeadline}
                  </div>
                  <div className="lp-line" style={{ 
                    backgroundColor: lineColor,
                    boxShadow: `0 0 8px ${lineColor}66, 0 0 20px ${lineColor}33`,
                    marginLeft: layout === 'right' ? 'auto' : layout === 'center' ? 'auto' : '0',
                    marginRight: layout === 'left' ? 'auto' : layout === 'center' ? 'auto' : '0',
                  }} />
                  <div className="lp-main" style={{ color: textColor }}>
                    {mainHeadline.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                  <div className="lp-body" style={{ color: bodyColor }}>
                    {bodyText}
                  </div>
                </div>
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
  )
}

export default App
