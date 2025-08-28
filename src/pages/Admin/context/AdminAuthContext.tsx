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
  adminLogin: (username: string, password: string, rememberMe?: boolean) => Promise<AdminUser | null>;
  adminLogout: () => void;
}

// Create context with default value
const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Provider props type
interface AdminAuthProviderProps {
  children: ReactNode;
}

// Storage keys for admin user
const ADMIN_USER_STORAGE_KEY = 'admin_user';
const ADMIN_REMEMBER_KEY = 'admin_remember_me';

export const AdminAuthProvider = ({ children }: AdminAuthProviderProps) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  
  // Check if user is already logged in on mount
  useEffect(() => {
    const init = async () => {
      try {
        console.log('AdminAuth: Initializing...');
        
        // Check for remembered session first
        const rememberedUser = localStorage.getItem(ADMIN_REMEMBER_KEY);
        console.log('AdminAuth: Remembered user:', rememberedUser ? 'Found' : 'Not found');
        
        if (rememberedUser) {
          const user = JSON.parse(rememberedUser);
          console.log('AdminAuth: Restoring remembered session for:', user.username);
          setAdminUser(user);
          setIsAdminAuthenticated(true);
          // Also set in session storage
          sessionStorage.setItem(ADMIN_USER_STORAGE_KEY, rememberedUser);
        } else {
          // Check session storage for current session
          const storedUser = getCurrentAdminUser();
          console.log('AdminAuth: Session user:', storedUser ? 'Found' : 'Not found');
          
          if (storedUser) {
            console.log('AdminAuth: Restoring session for:', storedUser.username);
            setAdminUser(storedUser);
            setIsAdminAuthenticated(true);
          }
        }
        
        // Initialize admin user if none exists
        await initializeAdminUser();
        console.log('AdminAuth: Initialization complete');
      } catch (error) {
        console.error('Error initializing admin auth:', error);
      }
    };
    
    init();
  }, []);
  
  // Admin login function
  const adminLogin = async (username: string, password: string, rememberMe: boolean = false): Promise<AdminUser | null> => {
    try {
      console.log('AdminAuth: Attempting login for:', username, 'Remember me:', rememberMe);
      const user = await firebaseAdminLogin(username, password);
      
      if (user) {
        console.log('AdminAuth: Login successful for:', user.username);
        setAdminUser(user);
        setIsAdminAuthenticated(true);
        
        // Store user based on remember me preference
        const userString = JSON.stringify(user);
        if (rememberMe) {
          console.log('AdminAuth: Storing in localStorage for remember me');
          localStorage.setItem(ADMIN_REMEMBER_KEY, userString);
        } else {
          console.log('AdminAuth: Clearing remember me data');
          // Clear any existing remember me data
          localStorage.removeItem(ADMIN_REMEMBER_KEY);
        }
        
        // Always store in session storage for current session
        console.log('AdminAuth: Storing in sessionStorage');
        sessionStorage.setItem(ADMIN_USER_STORAGE_KEY, userString);
        
        return user;
      }
      
      console.log('AdminAuth: Login failed - invalid credentials');
      return null;
    } catch (error) {
      console.error('Error logging in admin:', error);
      return null;
    }
  };
  
  // Admin logout function
  const adminLogout = () => {
    console.log('AdminAuth: Logging out admin user');
    firebaseAdminLogout();
    setAdminUser(null);
    setIsAdminAuthenticated(false);
    
    // Clear both storage types
    console.log('AdminAuth: Clearing all stored sessions');
    localStorage.removeItem(ADMIN_REMEMBER_KEY);
    sessionStorage.removeItem(ADMIN_USER_STORAGE_KEY);
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
