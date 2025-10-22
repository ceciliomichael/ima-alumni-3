import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const COLLECTION_NAME = 'landing_config';
const DEFAULT_DOC_ID = 'main';

export interface LandingConfig {
  id: string;
  welcomeMessage: string;
  showOfficersCarousel: boolean;
  updatedAt: string;
  updatedBy: string;
}

// Default welcome message
const DEFAULT_WELCOME_MESSAGE = 
  "Once an Immaculatian, always an Immaculatian! Proud to be part of Immaculate Mary Academy, where dreams begin and success continues. Forever grateful for the memories and lessons!";

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
      welcomeMessage: DEFAULT_WELCOME_MESSAGE,
      showOfficersCarousel: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    };
  } catch (error) {
    console.error('Error getting landing config:', error);
    // Return default on error
    return {
      id: DEFAULT_DOC_ID,
      welcomeMessage: DEFAULT_WELCOME_MESSAGE,
      showOfficersCarousel: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    };
  }
};

// Update landing page configuration
export const updateLandingConfig = async (
  updates: Partial<Omit<LandingConfig, 'id' | 'updatedAt'>>,
  updatedBy: string
): Promise<LandingConfig | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, DEFAULT_DOC_ID);
    const docSnap = await getDoc(docRef);
    
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy
    };
    
    if (docSnap.exists()) {
      // Update existing document
      await updateDoc(docRef, updateData);
    } else {
      // Create new document with defaults
      await setDoc(docRef, {
        welcomeMessage: updates.welcomeMessage || DEFAULT_WELCOME_MESSAGE,
        showOfficersCarousel: updates.showOfficersCarousel !== undefined ? updates.showOfficersCarousel : true,
        ...updateData
      });
    }
    
    // Return updated config
    return await getLandingConfig();
  } catch (error) {
    console.error('Error updating landing config:', error);
    return null;
  }
};

// Initialize landing config with defaults
export const initializeLandingConfig = async (): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, DEFAULT_DOC_ID);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        welcomeMessage: DEFAULT_WELCOME_MESSAGE,
        showOfficersCarousel: true,
        updatedAt: new Date().toISOString(),
        updatedBy: 'system'
      });
      console.log('Landing config initialized with defaults');
    }
  } catch (error) {
    console.error('Error initializing landing config:', error);
  }
};

// Get welcome message only (convenience function)
export const getWelcomeMessage = async (): Promise<string> => {
  const config = await getLandingConfig();
  return config.welcomeMessage;
};

// Update welcome message only (convenience function)
export const updateWelcomeMessage = async (message: string, updatedBy: string): Promise<boolean> => {
  try {
    const result = await updateLandingConfig({ welcomeMessage: message }, updatedBy);
    return result !== null;
  } catch (error) {
    console.error('Error updating welcome message:', error);
    return false;
  }
};

