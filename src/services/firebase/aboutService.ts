import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const COLLECTION_NAME = 'about_content';

// Define interfaces for different about content sections
export interface HistoryItem {
  id: string;
  year: number;
  title: string;
  description: string;
  order: number;
}

export interface VisionMissionContent {
  id: string;
  vision: string;
  mission: string;
  goals: string[];
}

export interface OrganizationMember {
  id: string;
  position: string;
  name: string;
  batch: string;
  level: 'president' | 'vicePresident' | 'executive';
  order: number;
}

export interface OrganizationChart {
  id: string;
  imageUrl: string;
  title: string;
  description?: string;
}

export interface ContactInfo {
  id: string;
  address: string;
  email: string;
  phone: string;
  supportEmail?: string;
  supportPhone?: string;
}

export interface AboutContent {
  id: string;
  section: 'history' | 'vision_mission' | 'organization' | 'organization_chart' | 'contact';
  content: HistoryItem | VisionMissionContent | OrganizationMember | OrganizationChart | ContactInfo;
  updatedAt: string;
  updatedBy: string;
}

// Get all content for a specific section
export const getAboutContentBySection = async (section: string): Promise<AboutContent[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("section", "==", section));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AboutContent));
  } catch (error) {
    console.error(`Error getting ${section} content:`, error);
    return [];
  }
};

// Get all about content
export const getAllAboutContent = async (): Promise<AboutContent[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AboutContent));
  } catch (error) {
    console.error('Error getting all about content:', error);
    return [];
  }
};

// Get content by ID
export const getAboutContentById = async (id: string): Promise<AboutContent | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as AboutContent;
    }
    return null;
  } catch (error) {
    console.error('Error getting about content by ID:', error);
    return null;
  }
};

// Add new about content
export const addAboutContent = async (content: Omit<AboutContent, 'id' | 'updatedAt'>): Promise<AboutContent> => {
  try {
    const newContent = {
      ...content,
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), newContent);
    
    return {
      id: docRef.id,
      ...newContent
    };
  } catch (error) {
    console.error('Error adding about content:', error);
    throw error;
  }
};

// Update about content
export const updateAboutContent = async (id: string, updatedData: Partial<AboutContent>): Promise<AboutContent | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData = {
      ...updatedData,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(docRef, updateData);
    
    // Get the updated document
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as AboutContent;
    }
    return null;
  } catch (error) {
    console.error('Error updating about content:', error);
    return null;
  }
};

// Delete about content
export const deleteAboutContent = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting about content:', error);
    return false;
  }
};

// Specific functions for each section

// History functions
export const getHistoryItems = async (): Promise<HistoryItem[]> => {
  try {
    const content = await getAboutContentBySection('history');
    return content
      .map(item => ({
        ...(item.content as HistoryItem),
        id: item.id // Use the Firebase document ID, not the content.id
      }))
      .sort((a, b) => a.year - b.year);
  } catch (error) {
    console.error('Error getting history items:', error);
    return [];
  }
};

export const addHistoryItem = async (historyItem: Omit<HistoryItem, 'id'>, updatedBy: string): Promise<AboutContent> => {
  const content: Omit<AboutContent, 'id' | 'updatedAt'> = {
    section: 'history',
    content: { ...historyItem, id: `history_${Date.now()}` },
    updatedBy
  };
  return addAboutContent(content);
};

// Vision & Mission functions
export const getVisionMission = async (): Promise<VisionMissionContent | null> => {
  try {
    const content = await getAboutContentBySection('vision_mission');
    if (content.length > 0) {
      return content[0].content as VisionMissionContent;
    }
    return null;
  } catch (error) {
    console.error('Error getting vision & mission:', error);
    return null;
  }
};

export const updateVisionMission = async (visionMissionData: Omit<VisionMissionContent, 'id'>, updatedBy: string): Promise<AboutContent | null> => {
  try {
    const existingContent = await getAboutContentBySection('vision_mission');
    
    if (existingContent.length > 0) {
      // Update existing
      return updateAboutContent(existingContent[0].id, {
        content: { ...visionMissionData, id: existingContent[0].id },
        updatedBy
      });
    } else {
      // Create new
      const content: Omit<AboutContent, 'id' | 'updatedAt'> = {
        section: 'vision_mission',
        content: { ...visionMissionData, id: 'vision_mission_1' },
        updatedBy
      };
      return addAboutContent(content);
    }
  } catch (error) {
    console.error('Error updating vision & mission:', error);
    return null;
  }
};

// Organization Chart functions (NEW - for image upload)
export const getOrganizationChart = async (): Promise<OrganizationChart | null> => {
  try {
    const content = await getAboutContentBySection('organization_chart');
    if (content.length > 0) {
      return content[0].content as OrganizationChart;
    }
    return null;
  } catch (error) {
    console.error('Error getting organization chart:', error);
    return null;
  }
};

export const updateOrganizationChart = async (chartData: Omit<OrganizationChart, 'id'>, updatedBy: string): Promise<AboutContent | null> => {
  try {
    const existingContent = await getAboutContentBySection('organization_chart');
    
    if (existingContent.length > 0) {
      // Update existing
      return updateAboutContent(existingContent[0].id, {
        content: { ...chartData, id: existingContent[0].id },
        updatedBy
      });
    } else {
      // Create new
      const content: Omit<AboutContent, 'id' | 'updatedAt'> = {
        section: 'organization_chart',
        content: { ...chartData, id: 'organization_chart_1' },
        updatedBy
      };
      return addAboutContent(content);
    }
  } catch (error) {
    console.error('Error updating organization chart:', error);
    return null;
  }
};

// Legacy Organization functions (keeping for backward compatibility)
export const getOrganizationMembers = async (): Promise<OrganizationMember[]> => {
  try {
    const content = await getAboutContentBySection('organization');
    return content
      .map(item => item.content as OrganizationMember)
      .sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error getting organization members:', error);
    return [];
  }
};

export const addOrganizationMember = async (member: Omit<OrganizationMember, 'id'>, updatedBy: string): Promise<AboutContent> => {
  const content: Omit<AboutContent, 'id' | 'updatedAt'> = {
    section: 'organization',
    content: { ...member, id: `org_${Date.now()}` },
    updatedBy
  };
  return addAboutContent(content);
};

// Contact functions
export const getContactInfo = async (): Promise<ContactInfo | null> => {
  try {
    const content = await getAboutContentBySection('contact');
    if (content.length > 0) {
      return content[0].content as ContactInfo;
    }
    return null;
  } catch (error) {
    console.error('Error getting contact info:', error);
    return null;
  }
};

export const updateContactInfo = async (contactData: Omit<ContactInfo, 'id'>, updatedBy: string): Promise<AboutContent | null> => {
  try {
    const existingContent = await getAboutContentBySection('contact');
    
    if (existingContent.length > 0) {
      // Update existing
      return updateAboutContent(existingContent[0].id, {
        content: { ...contactData, id: existingContent[0].id },
        updatedBy
      });
    } else {
      // Create new
      const content: Omit<AboutContent, 'id' | 'updatedAt'> = {
        section: 'contact',
        content: { ...contactData, id: 'contact_1' },
        updatedBy
      };
      return addAboutContent(content);
    }
  } catch (error) {
    console.error('Error updating contact info:', error);
    return null;
  }
};

// Initialize default content
export const initializeDefaultAboutContent = async (): Promise<void> => {
  try {
    const existingContent = await getAllAboutContent();
    
    if (existingContent.length === 0) {
      // Initialize with default content
      const defaultHistory: Omit<AboutContent, 'id' | 'updatedAt'>[] = [
        {
          section: 'history',
          content: {
            id: 'history_1',
            year: 2000,
            title: 'Foundation',
            description: 'The beginning of our alumni association.',
            order: 0
          },
          updatedBy: 'system'
        }
      ];

      const defaultVisionMission: Omit<AboutContent, 'id' | 'updatedAt'> = {
        section: 'vision_mission',
        content: {
          id: 'vision_mission_1',
          vision: 'Immaculate Mary Academy, a Catholic institution, provides quality education and committed to the Renewed Catholic Christian Formation characterized by learning in the light of Christ\'s Good News and Living Faith for the understanding and commitment of life.',
          mission: 'Through the enlightenment of the Holy Spirit and with the guidance of Immaculate Mary, Immaculate Mary Academy commits to focus Catholic Christian Religious Teachings, uplifts quality life, education, and programs for national development which geared to excellence.',
          goals: [
            'To bring students to an awareness of their responsibilities to the community and help them develop their social virtues and instilling the 21st century learning skills required for effective service to the local community.',
            'To show in the students\' daily life a dynamic love of God, a sense of personal worth and respect for others to enable them to relate harmoniously with their family, the school, and the community.',
            'To demonstrate academic excellence in studies and exemplify knowledge, skills, and habits by producing integrated and globally competitive graduates.'
          ]
        },
        updatedBy: 'system'
      };

      const defaultContact: Omit<AboutContent, 'id' | 'updatedAt'> = {
        section: 'contact',
        content: {
          id: 'contact_1',
          address: '123 University Avenue\nMain Campus, Alumni Center\nNew York, NY 10001',
          email: 'alumni@university.edu',
          phone: '(123) 456-7890',
          supportEmail: 'support@IMA Alumni.com',
          supportPhone: '(123) 456-7891'
        },
        updatedBy: 'system'
      };

      // Add default content
      await Promise.all([
        ...defaultHistory.map(item => addAboutContent(item)),
        addAboutContent(defaultVisionMission),
        addAboutContent(defaultContact)
      ]);

      console.log('Default about content initialized');
    }
  } catch (error) {
    console.error('Error initializing default about content:', error);
  }
};
