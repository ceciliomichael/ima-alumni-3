import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LoginPage from './pages/Auth/LoginPage';
import HomePage from './pages/Home/HomePage';
import GalleryPage from './pages/Gallery/GalleryPage';
import EventsPage from './pages/Events/EventsPage';
import AboutPage from './pages/About/AboutPage';
import ProfilePage from './pages/Profile/ProfilePage';
import JobsPage from './pages/Jobs/JobsPage';
import NotificationsPage from './pages/Notifications/NotificationsPage';
import DonationsPage from './pages/Donations/DonationsPage';
import Layout from './components/Layout/Layout';
import { User } from './types';

// Import Firebase services
import { getCurrentUser as getStoredUser, logoutUser } from './services/firebase/userService';
import { User as ServiceUser } from './services/firebase/userService';
import { initializeAlumniData } from './services/firebase/alumniService';
import { initializeOfficerData } from './services/firebase/officerService';
import { initializeEventData } from './services/firebase/eventService';
import { initializeGalleryData } from './services/firebase/galleryService';
import { initializeJobData } from './services/firebase/jobService';
import { initializeDonationData } from './services/firebase/donationService';
import { initializePostData } from './services/firebase/postService';
import { initializeAdminUser as initializeAdmin } from './services/firebase/adminService';

// Admin imports
import AdminLoginPage from './pages/Admin/AdminLoginPage';
import Dashboard from './pages/Admin/components/Dashboard/Dashboard';
import { AdminAuthProvider, useAdminAuth } from './pages/Admin/context/AdminAuthContext';
import { AlumniRecords, AlumniListByBatch, AlumniForm, AlumniView } from './pages/Admin/components/AlumniRecords';
import { AlumniOfficers, OfficerForm } from './pages/Admin/components/AlumniOfficers';
import { EventManagement, EventForm } from './pages/Admin/components/Events';
import { GalleryManagement, GalleryForm } from './pages/Admin/components/Gallery';
import { DonationsManagement, DonationForm } from './pages/Admin/components/Donations';
import JobManagement from './pages/Admin/components/Jobs/JobManagement';
import JobForm from './pages/Admin/components/Jobs/JobForm';
import ContactMessages from './pages/Admin/components/ContactMessages/ContactMessages';
import { initializeContactMessages } from './services/firebase/contactService';

// Helper component for admin protected routes
const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdminAuthenticated } = useAdminAuth();
  return isAdminAuthenticated ? <>{children}</> : <Navigate to="/admin/login" />;
};

// Helper component for user protected routes
const ProtectedRoute = ({ children, isAuthenticated, isLoading }: { children: React.ReactNode, isAuthenticated: boolean, isLoading: boolean }) => {
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Helper function to convert ServiceUser to User
const convertUser = (serviceUser: ServiceUser | null): User | null => {
  if (!serviceUser) return null;
  
  return {
    id: serviceUser.id,
    name: serviceUser.name,
    email: serviceUser.email,
    batch: serviceUser.batch || '',
    profileImage: serviceUser.profileImage,
    coverPhoto: serviceUser.coverPhoto,
    bio: serviceUser.bio,
    job: serviceUser.job,
    company: serviceUser.company,
    location: serviceUser.location,
    socialLinks: serviceUser.socialLinks
  };
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Function to handle successful login
  const handleLoginSuccess = (loggedInUser: ServiceUser) => {
    setUser(convertUser(loggedInUser));
    // We might still need isLoadingAuth logic if other async ops happen
    // but setting user directly makes auth state immediate
  };

  // Function to refresh user data from localStorage
  const refreshUserData = () => {
    const currentUser = getStoredUser();
    if (currentUser) {
      setUser(convertUser(currentUser));
    }
  };

  // Check authentication on load
  useEffect(() => {
    refreshUserData();
    setIsLoadingAuth(false);
  }, []);

  // Add event listener for storage events to update user data when it changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // If the current user in localStorage was changed, refresh the user data
      if (e.key === 'currentUser') {
        refreshUserData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Initialize Firebase services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize all Firebase services
        await initializeAlumniData();
        await initializeOfficerData();
        await initializeEventData();
        await initializeGalleryData();
        await initializeJobData();
        await initializeDonationData();
        await initializePostData();
        await initializeContactMessages();
        await initializeAdmin();
        console.log('Firebase services initialized successfully');
      } catch (error) {
        console.error('Error initializing Firebase services:', error);
      }
    };
    
    initializeServices();
  }, []);

  // Logout function
  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setIsLoadingAuth(false); // Explicitly set loading to false on logout
    // Navigate to login? Optional: <Navigate to="/login" replace /> might be needed
  };

  return (
    <Router>
      <AdminAuthProvider>
        <Routes>
          {/* --- Authentication Routes --- */}
          <Route path="/login" element={
            !isLoadingAuth && user ? <Navigate to="/" /> : <LoginPage onLoginSuccess={handleLoginSuccess} />
          } />
          {/* Redirect any attempts to access registration back to login */}
          <Route path="/register" element={<Navigate to="/login" replace />} />

          {/* --- User Protected Routes with Layout --- */}
          <Route 
            path="/"
            element={
              <ProtectedRoute isAuthenticated={!!user} isLoading={isLoadingAuth}>
                <Layout isAuthenticated={!!user} user={user} onLogout={handleLogout}>
                  <HomePage user={user} />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/gallery"
            element={
              <ProtectedRoute isAuthenticated={!!user} isLoading={isLoadingAuth}>
                <Layout isAuthenticated={!!user} user={user} onLogout={handleLogout}>
                  <GalleryPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/events"
            element={
              <ProtectedRoute isAuthenticated={!!user} isLoading={isLoadingAuth}>
                <Layout isAuthenticated={!!user} user={user} onLogout={handleLogout}>
                  <EventsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/jobs"
            element={
              <ProtectedRoute isAuthenticated={!!user} isLoading={isLoadingAuth}>
                <Layout isAuthenticated={!!user} user={user} onLogout={handleLogout}>
                  <JobsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/about"
            element={
              <ProtectedRoute isAuthenticated={!!user} isLoading={isLoadingAuth}>
                <Layout isAuthenticated={!!user} user={user} onLogout={handleLogout}>
                  <AboutPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* Route for specific About tabs if needed - AboutPage needs to handle :tab param */}
          <Route 
            path="/about/:tab"
            element={
              <ProtectedRoute isAuthenticated={!!user} isLoading={isLoadingAuth}>
                <Layout isAuthenticated={!!user} user={user} onLogout={handleLogout}>
                  <AboutPage /> 
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/profile"
            element={
              <ProtectedRoute isAuthenticated={!!user} isLoading={isLoadingAuth}>
                <Layout isAuthenticated={!!user} user={user} onLogout={handleLogout}>
                  <ProfilePage key={user?.id + '_' + Date.now()} user={user} />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/profile/update"
            element={
              <ProtectedRoute isAuthenticated={!!user} isLoading={isLoadingAuth}>
                <Layout isAuthenticated={!!user} user={user} onLogout={handleLogout}>
                  <ProfilePage key={user?.id + '_edit_' + Date.now()} user={user} isEditing={true} />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/profile/:userId"
            element={
              <ProtectedRoute isAuthenticated={!!user} isLoading={isLoadingAuth}>
                <Layout isAuthenticated={!!user} user={user} onLogout={handleLogout}>
                  <ProfilePage key={'view_' + Date.now()} user={user} isViewingOtherUser={true} />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/notifications"
            element={
              <ProtectedRoute isAuthenticated={!!user} isLoading={isLoadingAuth}>
                <Layout isAuthenticated={!!user} user={user} onLogout={handleLogout}>
                  <NotificationsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route 
            path="/donations"
            element={
              <ProtectedRoute isAuthenticated={!!user} isLoading={isLoadingAuth}>
                <Layout isAuthenticated={!!user} user={user} onLogout={handleLogout}>
                  <DonationsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* --- Admin Routes (Keep separate) --- */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={
            <ProtectedAdminRoute><Dashboard /></ProtectedAdminRoute>
          } />
          <Route path="/admin/alumni-records" element={
            <ProtectedAdminRoute><AlumniRecords /></ProtectedAdminRoute>
          } />
          <Route path="/admin/alumni-records/by-batch" element={
            <ProtectedAdminRoute><AlumniListByBatch /></ProtectedAdminRoute>
          } />
          <Route path="/admin/alumni-records/add" element={
            <ProtectedAdminRoute><AlumniForm /></ProtectedAdminRoute>
          } />
          <Route path="/admin/alumni-records/edit/:id" element={
            <ProtectedAdminRoute><AlumniForm /></ProtectedAdminRoute>
          } />
          <Route path="/admin/alumni-records/view/:id" element={
            <ProtectedAdminRoute><AlumniView /></ProtectedAdminRoute>
          } />
          <Route path="/admin/alumni-officers" element={
            <ProtectedAdminRoute><AlumniOfficers /></ProtectedAdminRoute>
          } />
          <Route path="/admin/alumni-officers/add" element={
            <ProtectedAdminRoute><OfficerForm /></ProtectedAdminRoute>
          } />
          <Route path="/admin/alumni-officers/edit/:id" element={
            <ProtectedAdminRoute><OfficerForm /></ProtectedAdminRoute>
          } />
          <Route path="/admin/events" element={
            <ProtectedAdminRoute><EventManagement /></ProtectedAdminRoute>
          } />
          <Route path="/admin/events/add" element={
            <ProtectedAdminRoute><EventForm /></ProtectedAdminRoute>
          } />
          <Route path="/admin/events/edit/:id" element={
            <ProtectedAdminRoute><EventForm /></ProtectedAdminRoute>
          } />
          <Route path="/admin/gallery" element={
            <ProtectedAdminRoute><GalleryManagement /></ProtectedAdminRoute>
          } />
          <Route path="/admin/gallery/add" element={
            <ProtectedAdminRoute><GalleryForm /></ProtectedAdminRoute>
          } />
          <Route path="/admin/gallery/edit/:id" element={
            <ProtectedAdminRoute><GalleryForm /></ProtectedAdminRoute>
          } />
          <Route path="/admin/jobs" element={
            <ProtectedAdminRoute><JobManagement /></ProtectedAdminRoute>
          } />
          <Route path="/admin/jobs/add" element={
            <ProtectedAdminRoute><JobForm /></ProtectedAdminRoute>
          } />
          <Route path="/admin/jobs/edit/:id" element={
            <ProtectedAdminRoute><JobForm /></ProtectedAdminRoute>
          } />
          <Route path="/admin/messages" element={
            <ProtectedAdminRoute><ContactMessages /></ProtectedAdminRoute>
          } />
          <Route path="/admin/donations" element={
            <ProtectedAdminRoute><DonationsManagement /></ProtectedAdminRoute>
          } />
          <Route path="/admin/donations/add" element={
            <ProtectedAdminRoute><DonationForm /></ProtectedAdminRoute>
          } />
          <Route path="/admin/donations/edit/:id" element={
            <ProtectedAdminRoute><DonationForm /></ProtectedAdminRoute>
          } />

          {/* --- Catch-all Route --- */}
          {/* If authenticated and route not found, redirect to home. Otherwise, redirect to login */}
          <Route path="*" element={
            isLoadingAuth ? <div>Loading...</div> : 
            user ? <Navigate to="/" /> : <Navigate to="/login" />
          } />

        </Routes>
      </AdminAuthProvider>
    </Router>
  );
}

export default App;
