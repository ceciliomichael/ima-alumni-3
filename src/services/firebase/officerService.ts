import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { OfficerPosition } from '../../types';
import { getAlumniById } from './alumniService';
import { getUserById, updateUser } from './userService';

const COLLECTION_NAME = 'alumni_officers';

// Get all officers
export const getAllOfficers = async (): Promise<OfficerPosition[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as OfficerPosition));
  } catch (error) {
    console.error('Error getting officers:', error);
    return [];
  }
};

// Get officer by ID
export const getOfficerById = async (id: string): Promise<OfficerPosition | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as OfficerPosition;
    }
    return null;
  } catch (error) {
    console.error('Error getting officer by ID:', error);
    return null;
  }
};

// Get officers by role title
export const getOfficersByTitle = async (title: string): Promise<OfficerPosition[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("title", "==", title));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as OfficerPosition));
  } catch (error) {
    console.error('Error getting officers by title:', error);
    return [];
  }
};

// Get officers by alumniId
export const getOfficersByAlumniId = async (alumniId: string): Promise<OfficerPosition[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("alumniId", "==", alumniId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as OfficerPosition));
  } catch (error) {
    console.error('Error getting officers by alumniId:', error);
    return [];
  }
};

// Get officers by batch year
export const getOfficersByBatchYear = async (batchYear: string): Promise<OfficerPosition[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("batchYear", "==", batchYear));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as OfficerPosition));
  } catch (error) {
    console.error('Error getting officers by batch year:', error);
    return [];
  }
};

// Add new officer
export const addOfficer = async (officer: Omit<OfficerPosition, 'id'>): Promise<OfficerPosition> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), officer);
    
    const newOfficer = {
      id: docRef.id,
      ...officer
    };
    
    // Update user with officer information
    await updateUserWithOfficerInfo(newOfficer.id);
    
    return newOfficer;
  } catch (error) {
    console.error('Error adding officer:', error);
    throw error;
  }
};

// Update officer
export const updateOfficer = async (id: string, updatedData: Partial<OfficerPosition>): Promise<OfficerPosition | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updatedData);
    
    // Get the updated document
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      const updatedOfficer = {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as OfficerPosition;
      
      // Update user with officer information
      await updateUserWithOfficerInfo(updatedOfficer.id);
      
      return updatedOfficer;
    }
    return null;
  } catch (error) {
    console.error('Error updating officer:', error);
    return null;
  }
};

// Delete officer
export const deleteOfficer = async (id: string): Promise<boolean> => {
  try {
    // Get officer before deleting to remove info from user
    const officer = await getOfficerById(id);
    if (officer) {
      await removeOfficerInfoFromUser(officer.alumniId);
    }
    
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting officer:', error);
    return false;
  }
};

// Search officers
export const searchOfficers = async (query: string): Promise<OfficerPosition[]> => {
  try {
    // Firestore doesn't support direct text search like localStorage
    // We'll get all officers and filter them client-side
    // In a production app, consider using a more scalable approach like Algolia
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const officers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as OfficerPosition));
    
    const lowerCaseQuery = query.toLowerCase();
    return officers.filter(officer => 
      officer.title.toLowerCase().includes(lowerCaseQuery) ||
      (officer.batchYear && officer.batchYear.toLowerCase().includes(lowerCaseQuery))
    );
  } catch (error) {
    console.error('Error searching officers:', error);
    return [];
  }
};

// Initialize with empty array if no data exists
export const initializeOfficerData = async () => {
  // No need to initialize in Firestore as collections are created automatically
  // This function is kept for API compatibility
};

// Update user with officer information
export const updateUserWithOfficerInfo = async (officerId: string): Promise<boolean> => {
  try {
    const officer = await getOfficerById(officerId);
    if (!officer) return false;
    
    // Get the alumni record to find the associated user
    const alumni = await getAlumniById(officer.alumniId);
    if (!alumni || !alumni.userId) return false;
    
    // Get the user
    const user = await getUserById(alumni.userId);
    if (!user) return false;
    
    // Add officer information to the user
    await updateUser(user.id, {
      officerPosition: {
        title: officer.title,
        startDate: officer.startDate,
        endDate: officer.endDate,
        batchYear: officer.batchYear
      },
      showOfficerInfo: true // Default to showing the information
    });
    
    return true;
  } catch (error) {
    console.error('Error updating user with officer info:', error);
    return false;
  }
};

// Remove officer information from user
export const removeOfficerInfoFromUser = async (alumniId: string): Promise<boolean> => {
  try {
    const alumni = await getAlumniById(alumniId);
    if (!alumni || !alumni.userId) return false;
    
    // Get the user
    const user = await getUserById(alumni.userId);
    if (!user || !user.officerPosition) return false;
    
    // Remove officer information from the user by setting to undefined
    // Note: Firestore doesn't support deleting specific fields with updateDoc
    // So we set them to null or undefined
    await updateUser(user.id, {
      officerPosition: null as any, // Type assertion to avoid TypeScript error
      showOfficerInfo: false
    });
    
    return true;
  } catch (error) {
    console.error('Error removing officer info from user:', error);
    return false;
  }
};
