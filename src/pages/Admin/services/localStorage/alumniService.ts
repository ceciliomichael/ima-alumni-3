import { AlumniRecord } from "../../../../types";
import { approveUser } from "./userService";

const STORAGE_KEY = 'alumni_records';

// Get all alumni records
export const getAllAlumni = (): AlumniRecord[] => {
  const alumniRecords = localStorage.getItem(STORAGE_KEY);
  return alumniRecords ? JSON.parse(alumniRecords) : [];
};

// Get alumni by ID
export const getAlumniById = (id: string): AlumniRecord | null => {
  const alumniRecords = getAllAlumni();
  return alumniRecords.find(alumni => alumni.id === id) || null;
};

// Get alumni by batch
export const getAlumniByBatch = (batch: string): AlumniRecord[] => {
  const alumniRecords = getAllAlumni();
  return alumniRecords.filter(alumni => alumni.batch === batch);
};

// Add new alumni record
export const addAlumni = (alumni: Omit<AlumniRecord, 'id'>): AlumniRecord => {
  const alumniRecords = getAllAlumni();
  const newAlumni: AlumniRecord = {
    ...alumni,
    id: Date.now().toString(),
    dateRegistered: new Date().toISOString()
  };
  
  alumniRecords.push(newAlumni);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alumniRecords));
  
  return newAlumni;
};

// Update alumni record
export const updateAlumni = (id: string, updatedData: Partial<AlumniRecord>): AlumniRecord | null => {
  const alumniRecords = getAllAlumni();
  const index = alumniRecords.findIndex(alumni => alumni.id === id);
  
  if (index === -1) return null;
  
  const updatedAlumni = {
    ...alumniRecords[index],
    ...updatedData
  };
  
  alumniRecords[index] = updatedAlumni;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alumniRecords));
  
  return updatedAlumni;
};

// Delete alumni record
export const deleteAlumni = (id: string): boolean => {
  const alumniRecords = getAllAlumni();
  const filteredRecords = alumniRecords.filter(alumni => alumni.id !== id);
  
  if (filteredRecords.length === alumniRecords.length) {
    return false; // No record was deleted
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRecords));
  return true; // Record was deleted
};

// Search alumni
export const searchAlumni = (query: string): AlumniRecord[] => {
  const alumniRecords = getAllAlumni();
  const lowerCaseQuery = query.toLowerCase();
  
  return alumniRecords.filter(alumni => 
    alumni.name.toLowerCase().includes(lowerCaseQuery) ||
    alumni.email.toLowerCase().includes(lowerCaseQuery) ||
    alumni.batch.toLowerCase().includes(lowerCaseQuery)
  );
};

// Get alumni statistics
export const getAlumniStatistics = () => {
  const alumniRecords = getAllAlumni();
  
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
};

// Initialize with empty array if no data exists
export const initializeAlumniData = () => {
  const existingData = localStorage.getItem(STORAGE_KEY);
  
  if (!existingData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
};

// Approve alumni record and corresponding user account
export const approveAlumniWithUser = (id: string): AlumniRecord | null => {
  const alumni = getAlumniById(id);
  if (!alumni) return null;
  
  // Update alumni record
  const updatedAlumni = updateAlumni(id, { isActive: true });
  
  // If there's a linked user, approve that too
  if (alumni.userId) {
    approveUser(alumni.userId);
  }
  
  return updatedAlumni;
};

// Get alumni record by user ID
export const getAlumniByUserId = (userId: string): AlumniRecord | null => {
  const alumniRecords = getAllAlumni();
  return alumniRecords.find(alumni => alumni.userId === userId) || null;
}; 