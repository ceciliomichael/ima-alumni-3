import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { HomepageHeroContent } from '../../types';

const SETTINGS_COLLECTION = 'settings';
const HOMEPAGE_HERO_DOC = 'homepageHero';

// Default hero content (fallback if not set in Firestore)
export const DEFAULT_HERO_CONTENT: HomepageHeroContent = {
  title: 'Immaculate Mary Academy',
  subtitle: 'Alumni Community',
  description: 'Welcome to the official alumni portal of Immaculate Mary Academy. Connect with fellow graduates, stay updated with school news, and be part of our growing community that continues to uphold the values and traditions of IMA.',
  ctaLabel: 'Learn More About IMA',
  ctaUrl: '/about'
};

// Get homepage hero content
export const getHomepageHero = async (): Promise<HomepageHeroContent> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, HOMEPAGE_HERO_DOC);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as HomepageHeroContent;
    }
    
    // Return default content if document doesn't exist
    return DEFAULT_HERO_CONTENT;
  } catch (error) {
    console.error('Error getting homepage hero content:', error);
    return DEFAULT_HERO_CONTENT;
  }
};

// Update homepage hero content
export const updateHomepageHero = async (
  content: Partial<HomepageHeroContent>,
  adminName?: string
): Promise<HomepageHeroContent> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, HOMEPAGE_HERO_DOC);
    
    // Get current content or use defaults
    const currentContent = await getHomepageHero();
    
    // Merge with updates
    const updatedContent: HomepageHeroContent = {
      ...currentContent,
      ...content,
      updatedAt: new Date().toISOString(),
      updatedBy: adminName
    };
    
    await setDoc(docRef, updatedContent);
    
    return updatedContent;
  } catch (error) {
    console.error('Error updating homepage hero content:', error);
    throw error;
  }
};
