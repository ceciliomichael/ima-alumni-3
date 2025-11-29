import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { AdminUser } from '../../types';

const COLLECTION_NAME = 'admin_users';
const ADMIN_USER_STORAGE_KEY = 'admin_user';
const ADMIN_REMEMBER_KEY = 'admin_remember_me';

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

// Default password for legacy admin detection
const DEFAULT_ADMIN_PASSWORD = 'admin123';

// Admin login
export const adminLogin = async (username: string, password: string): Promise<AdminUser | null> => {
  try {
    console.log('AdminService: Attempting login for username:', username);
    const q = query(collection(db, COLLECTION_NAME), where("username", "==", username));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('AdminService: No user found with username:', username);
      return null;
    }
    
    const docSnapshot = querySnapshot.docs[0];
    const adminUser = {
      id: docSnapshot.id,
      ...docSnapshot.data()
    } as AdminUser;
    
    // Check password
    if (adminUser.password !== password) {
      console.log('AdminService: Invalid password for username:', username);
      return null;
    }
    
    console.log('AdminService: Login successful for username:', username);
    
    // Handle legacy admin users: if mustChangePassword is undefined and password is default, set flag
    let mustChangePassword = adminUser.mustChangePassword;
    if (mustChangePassword === undefined && adminUser.password === DEFAULT_ADMIN_PASSWORD) {
      console.log('AdminService: Legacy admin detected with default password, setting mustChangePassword flag');
      mustChangePassword = true;
      // Update Firestore to persist this flag
      const docRef = doc(db, COLLECTION_NAME, adminUser.id);
      await updateDoc(docRef, { mustChangePassword: true });
    }
    
    // Return user without actual password (storage is handled in AdminAuthContext)
    const { password: _, ...userWithoutPassword } = adminUser;
    void _;
    const safeUser = { 
      ...userWithoutPassword, 
      password: '******',
      mustChangePassword: mustChangePassword ?? false
    } as AdminUser;
    
    return safeUser;
  } catch (error) {
    console.error('AdminService: Error logging in admin user:', error);
    return null;
  }
};

// Admin logout
export const adminLogout = (): void => {
  console.log('AdminService: Logout called - storage cleanup handled by context');
  // Storage cleanup is handled in AdminAuthContext
};

// Get current admin user with enhanced validation
export const getCurrentAdminUser = (): AdminUser | null => {
  try {
    console.log('AdminService: Getting current admin user from session storage');
    const adminUserData = sessionStorage.getItem(ADMIN_USER_STORAGE_KEY);
    
    if (!adminUserData) {
      console.log('AdminService: No admin user found in session storage');
      return null;
    }
    
    const adminUser = JSON.parse(adminUserData) as AdminUser;
    
    // Validate required properties
    if (!adminUser.id || !adminUser.username || !adminUser.name) {
      console.warn('AdminService: Invalid admin user data in session storage, clearing...');
      sessionStorage.removeItem(ADMIN_USER_STORAGE_KEY);
      return null;
    }
    
    console.log('AdminService: Valid admin user found:', adminUser.username);
    return adminUser;
  } catch (error) {
    console.error('AdminService: Error parsing admin user from session storage:', error);
    // Clear corrupted data
    sessionStorage.removeItem(ADMIN_USER_STORAGE_KEY);
    return null;
  }
};

// Get remembered admin user (persistent login)
export const getRememberedAdminUser = (): AdminUser | null => {
  try {
    console.log('AdminService: Getting remembered admin user from local storage');
    const rememberedUserData = localStorage.getItem(ADMIN_REMEMBER_KEY);
    
    if (!rememberedUserData) {
      console.log('AdminService: No remembered admin user found');
      return null;
    }
    
    const adminUser = JSON.parse(rememberedUserData) as AdminUser;
    
    // Validate required properties
    if (!adminUser.id || !adminUser.username || !adminUser.name) {
      console.warn('AdminService: Invalid remembered admin user data, clearing...');
      localStorage.removeItem(ADMIN_REMEMBER_KEY);
      return null;
    }
    
    console.log('AdminService: Valid remembered admin user found:', adminUser.username);
    return adminUser;
  } catch (error) {
    console.error('AdminService: Error parsing remembered admin user:', error);
    // Clear corrupted data
    localStorage.removeItem(ADMIN_REMEMBER_KEY);
    return null;
  }
};

// Clear all admin sessions
export const clearAllAdminSessions = (): void => {
  console.log('AdminService: Clearing all admin sessions');
  try {
    localStorage.removeItem(ADMIN_REMEMBER_KEY);
    sessionStorage.removeItem(ADMIN_USER_STORAGE_KEY);
    console.log('AdminService: All admin sessions cleared successfully');
  } catch (error) {
    console.error('AdminService: Error clearing admin sessions:', error);
  }
};

// Check if admin session exists
export const hasAdminSession = (): boolean => {
  const currentUser = getCurrentAdminUser();
  const rememberedUser = getRememberedAdminUser();
  return currentUser !== null || rememberedUser !== null;
};

// Initialize admin user if none exists
export const initializeAdminUser = async (): Promise<void> => {
  try {
    console.log('AdminService: Checking if admin user initialization is needed');
    const adminUsers = await getAllAdminUsers();
    
    if (adminUsers.length === 0) {
      console.log('AdminService: No admin users found, creating default admin');
      const defaultAdmin: Omit<AdminUser, 'id'> = {
        username: 'admin',
        password: DEFAULT_ADMIN_PASSWORD,
        name: 'Admin User',
        role: 'admin',
        mustChangePassword: true // Force password change on first login
      };
      
      await addAdminUser(defaultAdmin);
      console.log('AdminService: Default admin user created successfully with mustChangePassword flag');
    } else {
      console.log('AdminService: Admin users already exist, no initialization needed');
    }
  } catch (error) {
    console.error('AdminService: Error initializing admin user:', error);
  }
};

// Update admin password and clear mustChangePassword flag
export const updateAdminPassword = async (adminId: string, newPassword: string): Promise<boolean> => {
  try {
    console.log('AdminService: Updating password for admin:', adminId);
    const docRef = doc(db, COLLECTION_NAME, adminId);
    await updateDoc(docRef, { 
      password: newPassword,
      mustChangePassword: false 
    });
    console.log('AdminService: Password updated successfully');
    return true;
  } catch (error) {
    console.error('AdminService: Error updating admin password:', error);
    return false;
  }
};

// Verify current password for an admin user
export const verifyAdminPassword = async (adminId: string, currentPassword: string): Promise<boolean> => {
  try {
    console.log('AdminService: Verifying password for admin:', adminId);
    const docRef = doc(db, COLLECTION_NAME, adminId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log('AdminService: Admin user not found');
      return false;
    }
    
    const adminUser = docSnap.data() as AdminUser;
    const isValid = adminUser.password === currentPassword;
    console.log('AdminService: Password verification result:', isValid);
    return isValid;
  } catch (error) {
    console.error('AdminService: Error verifying admin password:', error);
    return false;
  }
};
