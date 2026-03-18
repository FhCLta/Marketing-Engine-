// Firestore Services for Marketing Engine
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
  orderBy
} from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════════
// PROJECTS COLLECTION
// ═══════════════════════════════════════════════════════════════════

const PROJECTS_COLLECTION = 'projects';

/**
 * Get all projects from Firestore
 */
export async function getProjects() {
  try {
    const q = query(collection(db, PROJECTS_COLLECTION), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

/**
 * Get a single project by ID
 */
export async function getProject(projectId) {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, projectId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}

/**
 * Add a new project
 */
export async function addProject(projectData) {
  try {
    const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), {
      ...projectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id: docRef.id, ...projectData };
  } catch (error) {
    console.error('Error adding project:', error);
    throw error;
  }
}

/**
 * Update an existing project
 */
export async function updateProject(projectId, projectData) {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, projectId);
    await updateDoc(docRef, {
      ...projectData,
      updatedAt: new Date().toISOString()
    });
    return { id: projectId, ...projectData };
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

/**
 * Delete a project
 */
export async function deleteProject(projectId) {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, projectId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════
// CAMPAIGNS COLLECTION (Saved renders/exports)
// ═══════════════════════════════════════════════════════════════════

const CAMPAIGNS_COLLECTION = 'campaigns';

/**
 * Save a campaign (rendered ad)
 */
export async function saveCampaign(campaignData) {
  try {
    const docRef = await addDoc(collection(db, CAMPAIGNS_COLLECTION), {
      ...campaignData,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...campaignData };
  } catch (error) {
    console.error('Error saving campaign:', error);
    throw error;
  }
}

/**
 * Get campaigns for a project
 */
export async function getCampaignsByProject(projectId) {
  try {
    const q = query(collection(db, CAMPAIGNS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(c => c.projectId === projectId);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════
// INITIAL DATA SEEDING
// ═══════════════════════════════════════════════════════════════════

/**
 * Seed initial projects to Firestore (run once)
 */
export async function seedInitialProjects(projectsData) {
  try {
    const existing = await getProjects();
    if (existing.length > 0) {
      console.log('Projects already exist, skipping seed');
      return existing;
    }
    
    const results = [];
    for (const [key, data] of Object.entries(projectsData)) {
      const project = await addProject({
        name: key,
        displayName: key.replace(/_/g, ' '),
        ...data
      });
      results.push(project);
    }
    console.log(`Seeded ${results.length} projects`);
    return results;
  } catch (error) {
    console.error('Error seeding projects:', error);
    throw error;
  }
}
