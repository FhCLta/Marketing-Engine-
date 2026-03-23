// Designs Service for Marketing Engine
// Stores all designs, variants, and enables AI learning from history

import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';

const DESIGNS_COLLECTION = 'designs';
const RESEARCH_COLLECTION = 'project_research';

// ═══════════════════════════════════════════════════════════════════
// IMAGE COMPRESSION UTILITY
// ═══════════════════════════════════════════════════════════════════

/**
 * Compress an image to fit within Firestore limits
 * @param {string} base64Image - Original base64 image (with or without data: prefix)
 * @param {number} maxSizeKB - Maximum size in KB (default 500KB)
 * @param {number} maxDimension - Maximum width/height (default 600px)
 * @returns {Promise<string>} - Compressed base64 image
 */
async function compressImage(base64Image, maxSizeKB = 500, maxDimension = 600) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      // Draw to canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Try different quality levels
      let quality = 0.8;
      let result = canvas.toDataURL('image/jpeg', quality);
      
      // Reduce quality until under limit
      while ((result.length * 3 / 4) / 1024 > maxSizeKB && quality > 0.1) {
        quality -= 0.1;
        result = canvas.toDataURL('image/jpeg', quality);
      }

      console.log(`📸 Image compressed: ${Math.round((result.length * 3/4) / 1024)}KB (quality: ${quality.toFixed(1)})`);
      resolve(result);
    };
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    
    // Handle both formats: with and without data: prefix
    img.src = base64Image.startsWith('data:') ? base64Image : `data:image/png;base64,${base64Image}`;
  });
}

// ═══════════════════════════════════════════════════════════════════
// DESIGNS CRUD
// ═══════════════════════════════════════════════════════════════════

/**
 * Save a new design to Firestore
 * Note: imageBase64 is compressed if > 500KB to avoid Firestore's 1MB field limit
 */
export async function saveDesign(userId, designData) {
  try {
    // Compress imageBase64 if needed
    let imageToSave = null;
    if (designData.imageBase64) {
      const originalSizeKB = (designData.imageBase64.length * 3 / 4) / 1024;
      if (originalSizeKB < 500) {
        imageToSave = designData.imageBase64;
        console.log(`✅ Image size OK: ${Math.round(originalSizeKB)}KB`);
      } else {
        console.log(`🔄 Compressing image (${Math.round(originalSizeKB)}KB)...`);
        try {
          imageToSave = await compressImage(designData.imageBase64, 500, 600);
        } catch (compressError) {
          console.warn('⚠️ Could not compress image, skipping:', compressError);
        }
      }
    }
    
    // Sanitize chatContext - remove long HTML content from messages to avoid size limits
    let sanitizedChatContext = [];
    if (designData.chatContext && Array.isArray(designData.chatContext)) {
      sanitizedChatContext = designData.chatContext.map(msg => ({
        role: msg.role || 'user',
        // Truncate very long messages (likely HTML) to 500 chars
        content: msg.content?.length > 500 
          ? msg.content.substring(0, 500) + '... [truncado]' 
          : (msg.content || ''),
        timestamp: msg.timestamp || '',
        hasHtml: msg.hasHtml || false
      })).slice(-5); // Only last 5 messages
    }
    
    const docRef = await addDoc(collection(db, DESIGNS_COLLECTION), {
      userId,
      html: designData.html || '',
      format: designData.format || '1080x1080',
      projectName: designData.projectName || '',
      description: designData.description || '',
      tags: designData.tags || [],
      chatContext: sanitizedChatContext, // Sanitized conversation context
      imageBase64: imageToSave, // Image (compressed if needed)
      type: designData.type || 'html-design', // 'html-design', 'generated-image', 'edited-image'
      isFavorite: false,
      rating: null, // User can rate 1-5 stars
      notes: '',
      parentDesignId: designData.parentDesignId || null, // For variants
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✅ Design saved successfully with ID:', docRef.id);
    return { id: docRef.id, error: null };
  } catch (error) {
    console.error('Error saving design:', error);
    return { id: null, error: error.message };
  }
}

/**
 * Get all designs for a user
 */
export async function getUserDesigns(userId, limitCount = 50) {
  try {
    const q = query(
      collection(db, DESIGNS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    console.log(`Loaded ${snapshot.docs.length} designs for user ${userId}`);
    return {
      designs: snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      })),
      error: null
    };
  } catch (error) {
    console.error('Error fetching user designs:', error);
    // Check for missing index error
    if (error.message?.includes('index')) {
      console.error('⚠️ Firestore needs a composite index. Create it at:', error.message);
    }
    return { designs: [], error: error.message };
  }
}

/**
 * Get designs by project name
 */
export async function getDesignsByProject(userId, projectName) {
  try {
    const q = query(
      collection(db, DESIGNS_COLLECTION),
      where('userId', '==', userId),
      where('projectName', '==', projectName),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return {
      designs: snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      })),
      error: null
    };
  } catch (error) {
    console.error('Error fetching designs by project:', error);
    return { designs: [], error: error.message };
  }
}

/**
 * Get favorite designs
 */
export async function getFavoriteDesigns(userId) {
  try {
    const q = query(
      collection(db, DESIGNS_COLLECTION),
      where('userId', '==', userId),
      where('isFavorite', '==', true),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return {
      designs: snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      })),
      error: null
    };
  } catch (error) {
    console.error('Error fetching favorite designs:', error);
    return { designs: [], error: error.message };
  }
}

/**
 * Get top rated designs for AI learning context
 */
export async function getTopRatedDesigns(userId, limitCount = 10) {
  try {
    const q = query(
      collection(db, DESIGNS_COLLECTION),
      where('userId', '==', userId),
      where('rating', '>=', 4),
      orderBy('rating', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return {
      designs: snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      })),
      error: null
    };
  } catch (error) {
    console.error('Error fetching top rated designs:', error);
    return { designs: [], error: error.message };
  }
}

/**
 * Get a single design
 */
export async function getDesign(designId) {
  try {
    const docRef = doc(db, DESIGNS_COLLECTION, designId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { 
        design: { 
          id: docSnap.id, 
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate?.() || new Date()
        }, 
        error: null 
      };
    }
    return { design: null, error: 'Design not found' };
  } catch (error) {
    console.error('Error fetching design:', error);
    return { design: null, error: error.message };
  }
}

/**
 * Update a design
 */
export async function updateDesign(designId, updates) {
  try {
    const docRef = doc(db, DESIGNS_COLLECTION, designId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { error: null };
  } catch (error) {
    console.error('Error updating design:', error);
    return { error: error.message };
  }
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(designId, isFavorite) {
  return updateDesign(designId, { isFavorite });
}

/**
 * Rate a design (1-5 stars)
 */
export async function rateDesign(designId, rating) {
  return updateDesign(designId, { rating });
}

/**
 * Add notes to a design
 */
export async function addNotes(designId, notes) {
  return updateDesign(designId, { notes });
}

/**
 * Delete a design
 */
export async function deleteDesign(designId) {
  try {
    const docRef = doc(db, DESIGNS_COLLECTION, designId);
    await deleteDoc(docRef);
    return { error: null };
  } catch (error) {
    console.error('Error deleting design:', error);
    return { error: error.message };
  }
}

/**
 * Create a variant (copy of a design as starting point)
 */
export async function createVariant(userId, parentDesignId) {
  const { design, error } = await getDesign(parentDesignId);
  if (error || !design) {
    return { id: null, error: error || 'Parent design not found' };
  }
  
  return saveDesign(userId, {
    ...design,
    parentDesignId,
    description: `Variante de: ${design.description || 'Sin descripción'}`,
    tags: [...(design.tags || []), 'variante']
  });
}

// ═══════════════════════════════════════════════════════════════════
// PROJECT RESEARCH
// ═══════════════════════════════════════════════════════════════════

/**
 * Save project research/investigation
 */
export async function saveProjectResearch(userId, researchData) {
  try {
    const docRef = await addDoc(collection(db, RESEARCH_COLLECTION), {
      userId,
      projectName: researchData.projectName,
      chatHistory: researchData.chatHistory || [],
      keyfacts: researchData.keyfacts || [],
      competitorAnalysis: researchData.competitorAnalysis || '',
      targetAudience: researchData.targetAudience || '',
      uniqueSellingPoints: researchData.uniqueSellingPoints || [],
      colorPalette: researchData.colorPalette || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, error: null };
  } catch (error) {
    console.error('Error saving research:', error);
    return { id: null, error: error.message };
  }
}

/**
 * Get research for a project
 */
export async function getProjectResearch(userId, projectName) {
  try {
    const q = query(
      collection(db, RESEARCH_COLLECTION),
      where('userId', '==', userId),
      where('projectName', '==', projectName),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return { research: null, error: null };
    }
    const doc = snapshot.docs[0];
    return {
      research: {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching research:', error);
    return { research: null, error: error.message };
  }
}

/**
 * Get all researched projects
 */
export async function getAllResearch(userId) {
  try {
    const q = query(
      collection(db, RESEARCH_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return {
      research: snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      })),
      error: null
    };
  } catch (error) {
    console.error('Error fetching all research:', error);
    return { research: [], error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// AI LEARNING CONTEXT
// ═══════════════════════════════════════════════════════════════════

/**
 * Get context for AI to learn from user's best designs
 * Returns a summary of top-rated designs that can be included in prompts
 */
export async function getAILearningContext(userId) {
  try {
    // Get top rated designs
    const { designs: topDesigns } = await getTopRatedDesigns(userId, 5);
    
    // Get favorite designs
    const { designs: favorites } = await getFavoriteDesigns(userId);
    const topFavorites = favorites.slice(0, 5);
    
    // Combine and dedupe
    const allBest = [...topDesigns];
    for (const fav of topFavorites) {
      if (!allBest.find(d => d.id === fav.id)) {
        allBest.push(fav);
      }
    }
    
    // Create learning context summary
    const context = {
      totalDesigns: allBest.length,
      designs: allBest.map(d => ({
        projectName: d.projectName,
        format: d.format,
        description: d.description,
        html: d.html,
        rating: d.rating,
        notes: d.notes,
        tags: d.tags
      })),
      // Extract common patterns
      commonTags: extractCommonTags(allBest),
      preferredFormats: extractPreferredFormats(allBest)
    };
    
    return { context, error: null };
  } catch (error) {
    console.error('Error getting AI context:', error);
    return { context: null, error: error.message };
  }
}

/**
 * Format AI context as a prompt addition
 */
export function formatContextForPrompt(context) {
  if (!context || !context.designs || context.designs.length === 0) {
    return '';
  }
  
  let prompt = `\n\n📚 CONTEXTO DE DISEÑOS PREVIOS DEL USUARIO:\n`;
  prompt += `El usuario ha creado ${context.totalDesigns} diseños que le gustan.\n\n`;
  
  if (context.preferredFormats.length > 0) {
    prompt += `Formatos preferidos: ${context.preferredFormats.join(', ')}\n`;
  }
  
  if (context.commonTags.length > 0) {
    prompt += `Estilos/temas comunes: ${context.commonTags.join(', ')}\n`;
  }
  
  prompt += `\nEjemplos de diseños bien calificados:\n`;
  
  for (const design of context.designs.slice(0, 3)) {
    prompt += `\n--- DISEÑO: ${design.projectName || 'Sin nombre'} ---\n`;
    if (design.description) prompt += `Descripción: ${design.description}\n`;
    if (design.notes) prompt += `Notas del usuario: ${design.notes}\n`;
    if (design.html) {
      // Include a truncated version of the HTML to show style patterns
      const truncatedHtml = design.html.length > 1500 
        ? design.html.substring(0, 1500) + '...[truncado]'
        : design.html;
      prompt += `HTML:\n\`\`\`html\n${truncatedHtml}\n\`\`\`\n`;
    }
  }
  
  prompt += `\n🎯 IMPORTANTE: Aprende del estilo y patrones de estos diseños para crear algo similar pero único.\n`;
  
  return prompt;
}

// Helper functions
function extractCommonTags(designs) {
  const tagCount = {};
  for (const d of designs) {
    for (const tag of (d.tags || [])) {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    }
  }
  return Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);
}

function extractPreferredFormats(designs) {
  const formatCount = {};
  for (const d of designs) {
    if (d.format) {
      formatCount[d.format] = (formatCount[d.format] || 0) + 1;
    }
  }
  return Object.entries(formatCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([format]) => format);
}
