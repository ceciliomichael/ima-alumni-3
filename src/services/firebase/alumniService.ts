import { db } from '../../firebase/config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  query, 
  where
} from 'firebase/firestore';
import { AlumniRecord } from '../../types';
import { cleanAlumniId, validateAndFormatAlumniId } from '../../utils/alumniIdUtils';
import { approveUser } from './userService';

const COLLECTION_NAME = 'alumni_records';

// Get all alumni records (excluding deleted)
export const getAllAlumni = async (): Promise<AlumniRecord[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AlumniRecord))
      .filter(alumni => !alumni.deletedAt); // Exclude soft-deleted records
  } catch (error) {
    console.error('Error getting alumni records:', error);
    return [];
  }
};

// Get alumni by ID (excluding deleted)
export const getAlumniById = async (id: string): Promise<AlumniRecord | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const alumni = {
        id: docSnap.id,
        ...docSnap.data()
      } as AlumniRecord;
      
      // Return null if deleted
      return alumni.deletedAt ? null : alumni;
    }
    return null;
  } catch (error) {
    console.error('Error getting alumni by ID:', error);
    return null;
  }
};

// Get alumni by batch (excluding deleted)
export const getAlumniByBatch = async (batch: string): Promise<AlumniRecord[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("batch", "==", batch));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AlumniRecord))
      .filter(alumni => !alumni.deletedAt); // Exclude soft-deleted records
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

// Delete alumni record (soft delete)
export const deleteAlumni = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      deletedAt: new Date().toISOString(),
      isActive: false // Also mark as inactive
    });
    return true;
  } catch (error) {
    console.error('Error deleting alumni record:', error);
    return false;
  }
};

// Search alumni (excluding deleted)
export const searchAlumni = async (query: string): Promise<AlumniRecord[]> => {
  try {
    if (!query.trim()) return [];
    
    // Firestore doesn't support direct text search like localStorage
    // We'll get all records and filter them client-side
    // In a production app, consider using a more scalable approach like Algolia
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const alumniRecords = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AlumniRecord))
      .filter(alumni => !alumni.deletedAt); // Exclude soft-deleted records
    
    const lowerCaseQuery = query.toLowerCase();
    return alumniRecords
      .filter(alumni => 
        alumni.name.toLowerCase().includes(lowerCaseQuery) ||
        alumni.email.toLowerCase().includes(lowerCaseQuery) ||
        alumni.batch.toLowerCase().includes(lowerCaseQuery) ||
        (alumni.alumniId && alumni.alumniId.toLowerCase().includes(lowerCaseQuery))
      )
      .slice(0, 10); // Limit to 10 results for performance
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

// Get alumni record by user ID (excluding deleted)
export const getAlumniByUserId = async (userId: string): Promise<AlumniRecord | null> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const alumni = {
      id: doc.id,
      ...doc.data()
    } as AlumniRecord;
    
    // Return null if deleted
    return alumni.deletedAt ? null : alumni;
  } catch (error) {
    console.error('Error getting alumni by user ID:', error);
    return null;
  }
};

// Get alumni record by Alumni ID (excluding deleted)
export const getAlumniByAlumniId = async (alumniId: string): Promise<AlumniRecord | null> => {
  try {
    const cleanId = cleanAlumniId(alumniId);
    const q = query(collection(db, COLLECTION_NAME), where("alumniId", "==", cleanId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const alumni = {
      id: doc.id,
      ...doc.data()
    } as AlumniRecord;
    
    // Return null if deleted
    return alumni.deletedAt ? null : alumni;
  } catch (error) {
    console.error('Error getting alumni by Alumni ID:', error);
    return null;
  }
};

// Check if Alumni ID exists in alumni records
export const checkAlumniIdExistsInRecords = async (alumniId: string): Promise<boolean> => {
  try {
    const alumni = await getAlumniByAlumniId(alumniId);
    return alumni !== null;
  } catch (error) {
    console.error('Error checking Alumni ID existence in records:', error);
    return false;
  }
};

// CSV Batch Import Function
export const importAlumniFromCSV = async (csvText: string, batchYear: string): Promise<{
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}> => {
  try {
    const lines = csvText.split('\n').filter(line => line.trim());
    const imported: AlumniRecord[] = [];
    const errors: string[] = [];
    let skipped = 0;

    // Skip header line (index 0)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        // Parse CSV line - format: Male Name,Alumni ID,Female Name,Alumni ID
        const parts = line.split(',');
        
        if (parts.length >= 6) {
          // Process male alumni (first 3 columns)
          const maleName = parts[0]?.trim();
          const maleAlumniId = parts[2]?.trim();
          
          // Process female alumni (last 3 columns)
          const femaleName = parts[3]?.trim();
          const femaleAlumniId = parts[5]?.trim();
          
          // Add male alumni if data exists
          if (maleName && maleAlumniId && maleName !== 'Male') {
            const cleanId = cleanAlumniId(maleAlumniId);
            
            // Validate alumni ID format (must be 6 digits + dash + 1 letter)
            const validation = validateAndFormatAlumniId(cleanId);
            if (!validation.isValid) {
              skipped++;
              errors.push(`Skipped ${maleName} - Invalid Alumni ID format: ${maleAlumniId} (must be 6 digits-1 letter, e.g., 123456-A)`);
            } else {
              // Check if alumni ID already exists
              const exists = await checkAlumniIdExistsInRecords(cleanId);
              if (!exists) {
                const alumniRecord: Omit<AlumniRecord, 'id'> = {
                  name: maleName,
                  email: `${maleName.toLowerCase().replace(/\s+/g, '.')}@example.com`, // Placeholder email
                  alumniId: cleanId,
                  batch: batchYear,
                  isActive: true,
                  profileImage: '',
                  position: '',
                  dateRegistered: new Date().toISOString()
                };
                
                await addAlumni(alumniRecord);
                imported.push(alumniRecord as AlumniRecord);
              } else {
                skipped++;
                errors.push(`Skipped ${maleName} - Alumni ID ${maleAlumniId} already exists`);
              }
            }
          }
          
          // Add female alumni if data exists
          if (femaleName && femaleAlumniId && femaleName !== 'Female') {
            const cleanId = cleanAlumniId(femaleAlumniId);
            
            // Validate alumni ID format (must be 6 digits + dash + 1 letter)
            const validation = validateAndFormatAlumniId(cleanId);
            if (!validation.isValid) {
              skipped++;
              errors.push(`Skipped ${femaleName} - Invalid Alumni ID format: ${femaleAlumniId} (must be 6 digits-1 letter, e.g., 123456-A)`);
            } else {
              // Check if alumni ID already exists
              const exists = await checkAlumniIdExistsInRecords(cleanId);
              if (!exists) {
                const alumniRecord: Omit<AlumniRecord, 'id'> = {
                  name: femaleName,
                  email: `${femaleName.toLowerCase().replace(/\s+/g, '.')}@example.com`, // Placeholder email
                  alumniId: cleanId,
                  batch: batchYear,
                  isActive: true,
                  profileImage: '',
                  position: '',
                  dateRegistered: new Date().toISOString()
                };
                
                await addAlumni(alumniRecord);
                imported.push(alumniRecord as AlumniRecord);
              } else {
                skipped++;
                errors.push(`Skipped ${femaleName} - Alumni ID ${femaleAlumniId} already exists`);
              }
            }
          }
        }
      } catch (error) {
        errors.push(`Error processing line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: true,
      imported: imported.length,
      skipped,
      errors
    };
  } catch (error) {
    console.error('Error importing CSV:', error);
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    };
  }
};
