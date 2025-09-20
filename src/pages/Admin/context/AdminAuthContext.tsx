import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminUser } from '../../../types';
import { 
  adminLogin as firebaseAdminLogin, 
  adminLogout as firebaseAdminLogout,
  getCurrentAdminUser,
  getRememberedAdminUser,
  clearAllAdminSessions,
  hasAdminSession,
  initializeAdminUser
} from '../../../services/firebase/adminService';

// Define the context type
interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isAdminAuthenticated: boolean;
  adminLogin: (username: string, password: string, rememberMe?: boolean) => Promise<AdminUser | null>;
  adminLogout: () => void;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Check if user is already logged in on mount
  useEffect(() => {
    const init = async () => {
      try {
        console.log('AdminAuth: Initializing authentication...');
        setIsLoading(true);
        
        // Check if any admin session exists
        const sessionExists = hasAdminSession();
        console.log('AdminAuth: Session exists check:', sessionExists);
        
        if (!sessionExists) {
          console.log('AdminAuth: No existing sessions found');
          await initializeAdminUser();
          setIsLoading(false);
          return;
        }
        
        // First priority: Check for remembered session (persistent login)
        const rememberedUser = getRememberedAdminUser();
        
        if (rememberedUser) {
          console.log('AdminAuth: Restoring remembered session for:', rememberedUser.username);
          setAdminUser(rememberedUser);
          setIsAdminAuthenticated(true);
          
          // Ensure session storage also has the user data
          sessionStorage.setItem(ADMIN_USER_STORAGE_KEY, JSON.stringify(rememberedUser));
          console.log('AdminAuth: Successfully restored remembered session');
        } else {
          // Second priority: Check for current session
          console.log('AdminAuth: Checking current session...');
          const storedUser = getCurrentAdminUser();
          
          if (storedUser) {
            console.log('AdminAuth: Restoring current session for:', storedUser.username);
            setAdminUser(storedUser);
            setIsAdminAuthenticated(true);
          } else {
            console.log('AdminAuth: No valid sessions found');
          }
        }
        
        // Initialize admin user if none exists (only once)
        await initializeAdminUser();
        console.log('AdminAuth: Initialization complete');
        
      } catch (error) {
        console.error('AdminAuth: Error during initialization:', error);
        // Clear potentially corrupted sessions
        try {
          clearAllAdminSessions();
          console.log('AdminAuth: Cleared potentially corrupted sessions');
        } catch (clearError) {
          console.error('AdminAuth: Error clearing sessions:', clearError);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
  }, []);
  
  // Admin login function
  const adminLogin = async (username: string, password: string, rememberMe: boolean = false): Promise<AdminUser | null> => {
    try {
      console.log('AdminAuth: Attempting login for:', username, 'Remember me:', rememberMe);
      setIsLoading(true);
      
      // Validate input
      if (!username || !password) {
        console.error('AdminAuth: Username and password are required');
        return null;
      }
      
      const user = await firebaseAdminLogin(username.trim(), password);
      
      if (user) {
        console.log('AdminAuth: Login successful for:', user.username);
        
        // Validate user object
        if (!user.id || !user.username || !user.name) {
          console.error('AdminAuth: Invalid user object received from login');
          return null;
        }
        
        // Set authentication state
        setAdminUser(user);
        setIsAdminAuthenticated(true);
        
        // Store user based on remember me preference
        const userString = JSON.stringify(user);
        
        try {
          if (rememberMe) {
            console.log('AdminAuth: Storing persistent session in localStorage');
            localStorage.setItem(ADMIN_REMEMBER_KEY, userString);
          } else {
            console.log('AdminAuth: Clearing any existing persistent session');
            // Clear any existing remember me data
            localStorage.removeItem(ADMIN_REMEMBER_KEY);
          }
          
          // Always store in session storage for current session
          console.log('AdminAuth: Storing session in sessionStorage');
          sessionStorage.setItem(ADMIN_USER_STORAGE_KEY, userString);
        } catch (storageError) {
          console.error('AdminAuth: Error storing session data:', storageError);
          // Continue with login even if storage fails
        }
        
        return user;
      }
      
      console.log('AdminAuth: Login failed - invalid credentials');
      return null;
    } catch (error) {
      console.error('AdminAuth: Error during login:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Admin logout function
  const adminLogout = () => {
    console.log('AdminAuth: Logging out admin user');
    
    try {
      // Call Firebase logout service
      firebaseAdminLogout();
      
      // Clear state
      setAdminUser(null);
      setIsAdminAuthenticated(false);
      
      // Clear all storage using service utility
      clearAllAdminSessions();
      
      console.log('AdminAuth: Logout completed successfully');
    } catch (error) {
      console.error('AdminAuth: Error during logout:', error);
      
      // Force clear state even if logout service fails
      setAdminUser(null);
      setIsAdminAuthenticated(false);
      
      // Attempt to clear storage directly
      try {
        localStorage.removeItem(ADMIN_REMEMBER_KEY);
        sessionStorage.removeItem(ADMIN_USER_STORAGE_KEY);
      } catch (storageError) {
        console.error('AdminAuth: Error clearing storage during logout:', storageError);
      }
    }
  };
  
  // Context value
  const value = {
    adminUser,
    isAdminAuthenticated,
    adminLogin,
    adminLogout,
    isLoading
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
