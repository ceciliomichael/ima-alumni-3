import { OfficerPosition } from "../../../../types";
import { getAlumniById } from "./alumniService";

const STORAGE_KEY = 'alumni_officers';
const USER_STORAGE_KEY = 'users';

// Get all officers
export const getAllOfficers = (): OfficerPosition[] => {
  const officers = localStorage.getItem(STORAGE_KEY);
  return officers ? JSON.parse(officers) : [];
};

// Get officer by ID
export const getOfficerById = (id: string): OfficerPosition | null => {
  const officers = getAllOfficers();
  return officers.find(officer => officer.id === id) || null;
};

// Get officers by role title
export const getOfficersByTitle = (title: string): OfficerPosition[] => {
  const officers = getAllOfficers();
  return officers.filter(officer => officer.title.toLowerCase() === title.toLowerCase());
};

// Get officers by alumniId
export const getOfficersByAlumniId = (alumniId: string): OfficerPosition[] => {
  const officers = getAllOfficers();
  return officers.filter(officer => officer.alumniId === alumniId);
};

// Get officers by batch year
export const getOfficersByBatchYear = (batchYear: string): OfficerPosition[] => {
  const officers = getAllOfficers();
  return officers.filter(officer => officer.batchYear === batchYear);
};

// Add new officer
export const addOfficer = (officer: Omit<OfficerPosition, 'id'>): OfficerPosition => {
  const officers = getAllOfficers();
  
  const newOfficer: OfficerPosition = {
    ...officer,
    id: Date.now().toString()
  };
  
  officers.push(newOfficer);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(officers));
  
  return newOfficer;
};

// Update officer
export const updateOfficer = (id: string, updatedData: Partial<OfficerPosition>): OfficerPosition | null => {
  const officers = getAllOfficers();
  const index = officers.findIndex(officer => officer.id === id);
  
  if (index === -1) return null;
  
  const updatedOfficer = {
    ...officers[index],
    ...updatedData
  };
  
  officers[index] = updatedOfficer;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(officers));
  
  return updatedOfficer;
};

// Delete officer
export const deleteOfficer = (id: string): boolean => {
  const officers = getAllOfficers();
  const filteredOfficers = officers.filter(officer => officer.id !== id);
  
  if (filteredOfficers.length === officers.length) {
    return false; // No officer was deleted
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredOfficers));
  return true; // Officer was deleted
};

// Search officers
export const searchOfficers = (query: string): OfficerPosition[] => {
  const officers = getAllOfficers();
  const lowerCaseQuery = query.toLowerCase();
  
  return officers.filter(officer => 
    officer.title.toLowerCase().includes(lowerCaseQuery) ||
    (officer.batchYear && officer.batchYear.toLowerCase().includes(lowerCaseQuery))
  );
};

// Initialize with empty array if no data exists
export const initializeOfficerData = () => {
  const existingData = localStorage.getItem(STORAGE_KEY);
  
  if (!existingData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
};

// Update user with officer information
export const updateUserWithOfficerInfo = (officerId: string): boolean => {
  const officer = getOfficerById(officerId);
  if (!officer) return false;
  
  // Get the alumni record to find the associated user
  const alumni = getAlumniById(officer.alumniId);
  if (!alumni || !alumni.userId) return false;
  
  // Get all users
  const usersJson = localStorage.getItem(USER_STORAGE_KEY);
  if (!usersJson) return false;
  
  const users = JSON.parse(usersJson);
  const userIndex = users.findIndex((user: any) => user.id === alumni.userId);
  
  if (userIndex === -1) return false;
  
  // Add officer information to the user
  users[userIndex] = {
    ...users[userIndex],
    officerPosition: {
      title: officer.title,
      startDate: officer.startDate,
      endDate: officer.endDate,
      batchYear: officer.batchYear
    },
    showOfficerInfo: true // Default to showing the information
  };
  
  // Save updated users
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
  return true;
};

// Remove officer information from user
export const removeOfficerInfoFromUser = (alumniId: string): boolean => {
  const alumni = getAlumniById(alumniId);
  if (!alumni || !alumni.userId) return false;
  
  // Get all users
  const usersJson = localStorage.getItem(USER_STORAGE_KEY);
  if (!usersJson) return false;
  
  const users = JSON.parse(usersJson);
  const userIndex = users.findIndex((user: any) => user.id === alumni.userId);
  
  if (userIndex === -1) return false;
  
  // Check if user has officer info
  if (!users[userIndex].officerPosition) return false;
  
  // Remove officer information from the user
  const { officerPosition, showOfficerInfo, ...userWithoutOfficerInfo } = users[userIndex];
  users[userIndex] = userWithoutOfficerInfo;
  
  // Save updated users
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
  return true;
}; 