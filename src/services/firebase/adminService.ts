import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { AdminUser } from '../../types';

const COLLECTION_NAME = 'admin_users';
const ADMIN_USER_STORAGE_KEY = 'admin_user';

// Get all admin users
export const getAllAdminUsers = async (): Promise<AdminUser[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AdminUser));
  } catch (error) {
    console.error('Error getting admin users:', error);
    return [];
  }
};

// Get admin user by ID
export const getAdminUserById = async (id: string): Promise<AdminUser | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as AdminUser;
    }
    return null;
  } catch (error) {
    console.error('Error getting admin user by ID:', error);
    return null;
  }
};

// Get admin user by username
export const getAdminUserByUsername = async (username: string): Promise<AdminUser | null> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("username", "==", username));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as AdminUser;
  } catch (error) {
    console.error('Error getting admin user by username:', error);
    return null;
  }
};

// Add new admin user
export const addAdminUser = async (adminUser: Omit<AdminUser, 'id'>): Promise<AdminUser> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), adminUser);
    
    return {
      id: docRef.id,
      ...adminUser
    };
  } catch (error) {
    console.error('Error adding admin user:', error);
    throw error;
  }
};

// Update admin user
export const updateAdminUser = async (id: string, updatedData: Partial<AdminUser>): Promise<AdminUser | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updatedData);
    
    // Get the updated document
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as AdminUser;
    }
    return null;
  } catch (error) {
    console.error('Error updating admin user:', error);
    return null;
  }
};

// Delete admin user
export const deleteAdminUser = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting admin user:', error);
    return false;
  }
};

// Admin login
export const adminLogin = async (username: string, password: string): Promise<AdminUser | null> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("username", "==", username));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const adminUser = {
      id: doc.id,
      ...doc.data()
    } as AdminUser;
    
    // Check password
    if (adminUser.password !== password) {
      return null;
    }
    
    // Store user in local storage without password
    const { password: _, ...userWithoutPassword } = adminUser;
    const safeUser = { ...userWithoutPassword, password: '******' } as AdminUser;
    localStorage.setItem(ADMIN_USER_STORAGE_KEY, JSON.stringify(safeUser));
    
    return safeUser;
  } catch (error) {
    console.error('Error logging in admin user:', error);
    return null;
  }
};

// Admin logout
export const adminLogout = (): void => {
  localStorage.removeItem(ADMIN_USER_STORAGE_KEY);
};

// Get current admin user
export const getCurrentAdminUser = (): AdminUser | null => {
  const adminUser = localStorage.getItem(ADMIN_USER_STORAGE_KEY);
  return adminUser ? JSON.parse(adminUser) : null;
};

// Initialize admin user if none exists
export const initializeAdminUser = async (): Promise<void> => {
  try {
    const adminUsers = await getAllAdminUsers();
    
    if (adminUsers.length === 0) {
      const defaultAdmin: Omit<AdminUser, 'id'> = {
        username: 'admin',
        password: 'admin123', // In a real app, this would be hashed
        name: 'Admin User',
        role: 'admin'
      };
      
      await addAdminUser(defaultAdmin);
    }
  } catch (error) {
    console.error('Error initializing admin user:', error);
  }
};
