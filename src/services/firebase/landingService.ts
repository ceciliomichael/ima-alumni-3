import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const COLLECTION_NAME = 'landing_config';
const DEFAULT_DOC_ID = 'main';

export interface LandingConfig {
  id: string;
  updatedAt: string;
  updatedBy: string;
}

// Get landing page configuration
export const getLandingConfig = async (): Promise<LandingConfig> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, DEFAULT_DOC_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as LandingConfig;
    }
    
    // Return default config if not exists
    return {
      id: DEFAULT_DOC_ID,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    };
  } catch (error) {
    console.error('Error getting landing config:', error);
    // Return default on error
    return {
      id: DEFAULT_DOC_ID,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    };
  }
};

// Initialize landing config with defaults
export const initializeLandingConfig = async (): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, DEFAULT_DOC_ID);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        updatedAt: new Date().toISOString(),
        updatedBy: 'system'
      });
      console.log('Landing config initialized with defaults');
    }
  } catch (error) {
    console.error('Error initializing landing config:', error);
  }
};
