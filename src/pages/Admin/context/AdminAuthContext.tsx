import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminUser } from '../../../types';
import { 
  adminLogin as firebaseAdminLogin, 
  adminLogout as firebaseAdminLogout,
  getCurrentAdminUser,
  initializeAdminUser
} from '../../../services/firebase/adminService';

// Define the context type
interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isAdminAuthenticated: boolean;
  adminLogin: (username: string, password: string) => Promise<AdminUser | null>;
  adminLogout: () => void;
}

// Create context with default value
const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Provider props type
interface AdminAuthProviderProps {
  children: ReactNode;
}

// Storage key for admin user
const ADMIN_USER_STORAGE_KEY = 'admin_user';

export const AdminAuthProvider = ({ children }: AdminAuthProviderProps) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  
  // Check if user is already logged in on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Check if user is already logged in
        const storedUser = getCurrentAdminUser();
        if (storedUser) {
          setAdminUser(storedUser);
          setIsAdminAuthenticated(true);
        }
        
        // Initialize admin user if none exists
        await initializeAdminUser();
      } catch (error) {
        console.error('Error initializing admin auth:', error);
      }
    };
    
    init();
  }, []);
  
  // Admin login function
  const adminLogin = async (username: string, password: string): Promise<AdminUser | null> => {
    try {
      const user = await firebaseAdminLogin(username, password);
      
      if (user) {
        setAdminUser(user);
        setIsAdminAuthenticated(true);
        return user;
      }
      
      return null;
    } catch (error) {
      console.error('Error logging in admin:', error);
      return null;
    }
  };
  
  // Admin logout function
  const adminLogout = () => {
    firebaseAdminLogout();
    setAdminUser(null);
    setIsAdminAuthenticated(false);
  };
  
  // Context value
  const value = {
    adminUser,
    isAdminAuthenticated,
    adminLogin,
    adminLogout
  };
  
  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

// Custom hook to use admin auth context
export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  
  return context;
};
