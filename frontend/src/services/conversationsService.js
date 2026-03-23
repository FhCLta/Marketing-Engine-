// Conversations Service for Design Copilot
// Persists chat conversations like ChatGPT/Gemini

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

const CONVERSATIONS_COLLECTION = 'design_conversations';

// ═══════════════════════════════════════════════════════════════════
// CONVERSATIONS CRUD
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a new conversation
 */
export async function createConversation(userId, firstMessage = null) {
  try {
    const title = firstMessage 
      ? generateTitle(firstMessage)
      : 'Nueva conversación';
    
    const docRef = await addDoc(collection(db, CONVERSATIONS_COLLECTION), {
      userId,
      title,
      messages: firstMessage ? [firstMessage] : [],
      lastHtml: null, // Last generated HTML
      format: '1:1',
      projectName: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { 
      id: docRef.id, 
      title,
      messages: firstMessage ? [firstMessage] : [],
      error: null 
    };
  } catch (error) {
    console.error('Error creating conversation:', error);
    return { id: null, error: error.message };
  }
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(userId, limitCount = 50) {
  try {
    const q = query(
      collection(db, CONVERSATIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return {
      conversations: snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
      })),
      error: null
    };
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return { conversations: [], error: error.message };
  }
}

/**
 * Get a single conversation
 */
export async function getConversation(conversationId) {
  try {
    const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { 
        conversation: { 
          id: docSnap.id, 
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        }, 
        error: null 
      };
    }
    return { conversation: null, error: 'Conversation not found' };
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return { conversation: null, error: error.message };
  }
}

/**
 * Add a message to a conversation
 */
export async function addMessage(conversationId, message) {
  try {
    const { conversation, error: fetchError } = await getConversation(conversationId);
    if (fetchError) return { error: fetchError };
    
    const messages = [...(conversation.messages || []), message];
    
    // Update title if this is the first user message
    let updates = {
      messages,
      updatedAt: serverTimestamp()
    };
    
    if (messages.filter(m => m.role === 'user').length === 1 && message.role === 'user') {
      updates.title = generateTitle(message);
    }
    
    const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    await updateDoc(docRef, updates);
    
    return { error: null };
  } catch (error) {
    console.error('Error adding message:', error);
    return { error: error.message };
  }
}

/**
 * Update conversation with new messages and HTML
 */
export async function updateConversation(conversationId, updates) {
  try {
    const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { error: null };
  } catch (error) {
    console.error('Error updating conversation:', error);
    return { error: error.message };
  }
}

/**
 * Save the current HTML to a conversation
 */
export async function saveHtmlToConversation(conversationId, html, format) {
  return updateConversation(conversationId, { 
    lastHtml: html,
    format 
  });
}

/**
 * Update conversation title
 */
export async function renameConversation(conversationId, newTitle) {
  return updateConversation(conversationId, { title: newTitle });
}

/**
 * Delete a conversation
 */
export async function deleteConversation(conversationId) {
  try {
    const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    await deleteDoc(docRef);
    return { error: null };
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return { error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Generate a title from the first user message
 */
function generateTitle(message) {
  const content = message.content || '';
  
  // Extract project name if mentioned
  const projectMatch = content.match(/(?:proyecto|development|residencias?)\s+([\w\s]+)/i);
  if (projectMatch) {
    return projectMatch[1].trim().slice(0, 40);
  }
  
  // Look for known project names
  const knownProjects = ['kulkana', 'velmari', 'alba', 'mistral', 'candela', 'costa', 'rosewood', 'amares', 'macondo', 'meliora'];
  for (const proj of knownProjects) {
    if (content.toLowerCase().includes(proj)) {
      return proj.charAt(0).toUpperCase() + proj.slice(1);
    }
  }
  
  // Use first words of message
  const words = content.split(/\s+/).filter(w => w.length > 2);
  if (words.length > 0) {
    return words.slice(0, 5).join(' ').slice(0, 40) + (content.length > 40 ? '...' : '');
  }
  
  return 'Nueva conversación';
}

/**
 * Get conversation statistics
 */
export async function getConversationStats(userId) {
  try {
    const { conversations } = await getUserConversations(userId, 1000);
    
    const totalMessages = conversations.reduce((sum, c) => sum + (c.messages?.length || 0), 0);
    const withHtml = conversations.filter(c => c.lastHtml).length;
    
    // Messages by day (last 7 days)
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentConvos = conversations.filter(c => c.updatedAt > weekAgo);
    
    return {
      stats: {
        totalConversations: conversations.length,
        totalMessages,
        conversationsWithDesigns: withHtml,
        conversationsThisWeek: recentConvos.length
      },
      error: null
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return { stats: null, error: error.message };
  }
}
