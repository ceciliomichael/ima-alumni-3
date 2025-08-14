import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { AlumniRecord } from '../../types';
import { approveUser } from './userService';

const COLLECTION_NAME = 'alumni_records';

// Get all alumni records
export const getAllAlumni = async (): Promise<AlumniRecord[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AlumniRecord));
  } catch (error) {
    console.error('Error getting alumni records:', error);
    return [];
  }
};

// Get alumni by ID
export const getAlumniById = async (id: string): Promise<AlumniRecord | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as AlumniRecord;
    }
    return null;
  } catch (error) {
    console.error('Error getting alumni by ID:', error);
    return null;
  }
};

// Get alumni by batch
export const getAlumniByBatch = async (batch: string): Promise<AlumniRecord[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("batch", "==", batch));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AlumniRecord));
  } catch (error) {
    console.error('Error getting alumni by batch:', error);
    return [];
  }
};

// Add new alumni record
export const addAlumni = async (alumni: Omit<AlumniRecord, 'id'>): Promise<AlumniRecord> => {
  try {
    const newAlumni = {
      ...alumni,
      dateRegistered: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), newAlumni);
    
    return {
      id: docRef.id,
      ...newAlumni
    };
  } catch (error) {
    console.error('Error adding alumni record:', error);
    throw error;
  }
};

// Update alumni record
export const updateAlumni = async (id: string, updatedData: Partial<AlumniRecord>): Promise<AlumniRecord | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updatedData);
    
    // Get the updated document
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as AlumniRecord;
    }
    return null;
  } catch (error) {
    console.error('Error updating alumni record:', error);
    return null;
  }
};

// Delete alumni record
export const deleteAlumni = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting alumni record:', error);
    return false;
  }
};

// Search alumni
export const searchAlumni = async (query: string): Promise<AlumniRecord[]> => {
  try {
    // Firestore doesn't support direct text search like localStorage
    // We'll get all records and filter them client-side
    // In a production app, consider using a more scalable approach like Algolia
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const alumniRecords = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AlumniRecord));
    
    const lowerCaseQuery = query.toLowerCase();
    return alumniRecords.filter(alumni => 
      alumni.name.toLowerCase().includes(lowerCaseQuery) ||
      alumni.email.toLowerCase().includes(lowerCaseQuery) ||
      alumni.batch.toLowerCase().includes(lowerCaseQuery)
    );
  } catch (error) {
    console.error('Error searching alumni:', error);
    return [];
  }
};

// Get alumni statistics
export const getAlumniStatistics = async () => {
  try {
    const alumniRecords = await getAllAlumni();
    
    // Get total count
    const totalAlumni = alumniRecords.length;
    
    // Get count by batch
    const alumniByBatch = alumniRecords.reduce((acc, alumni) => {
      acc[alumni.batch] = (acc[alumni.batch] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Get active vs inactive
    const activeAlumni = alumniRecords.filter(alumni => alumni.isActive).length;
    const inactiveAlumni = totalAlumni - activeAlumni;
    
    return {
      totalAlumni,
      alumniByBatch,
      activeAlumni,
      inactiveAlumni
    };
  } catch (error) {
    console.error('Error getting alumni statistics:', error);
    return {
      totalAlumni: 0,
      alumniByBatch: {},
      activeAlumni: 0,
      inactiveAlumni: 0
    };
  }
};

// Initialize with empty array if no data exists
export const initializeAlumniData = async () => {
  // No need to initialize in Firestore as collections are created automatically
  // This function is kept for API compatibility
};

// Approve alumni record and corresponding user account
export const approveAlumniWithUser = async (id: string): Promise<AlumniRecord | null> => {
  try {
    const alumni = await getAlumniById(id);
    if (!alumni) return null;
    
    // Update alumni record
    const updatedAlumni = await updateAlumni(id, { isActive: true });
    
    // If there's a linked user, approve that too
    if (alumni.userId) {
      await approveUser(alumni.userId);
    }
    
    return updatedAlumni;
  } catch (error) {
    console.error('Error approving alumni with user:', error);
    return null;
  }
};

// Get alumni record by user ID
export const getAlumniByUserId = async (userId: string): Promise<AlumniRecord | null> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as AlumniRecord;
  } catch (error) {
    console.error('Error getting alumni by user ID:', error);
    return null;
  }
};
