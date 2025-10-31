import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LoginPage from './pages/Auth/LoginPage';
import LandingPage from './pages/Landing';
import HomePage from './pages/Home/HomePage';
import GalleryPage from './pages/Gallery/GalleryPage';
import EventsPage from './pages/Events/EventsPage';
import AboutPage from './pages/About/AboutPage';
import PublicAboutPage from './pages/About/PublicAboutPage';
import ProfilePage from './pages/Profile/ProfilePage';
import JobsPage from './pages/Jobs/JobsPage';
import NotificationsPage from './pages/Notifications/NotificationsPage';
import DonationsPage from './pages/Donations/DonationsPage';
import Layout from './components/Layout/Layout';
import GuestLayout from './components/Layout/GuestLayout';
import { User } from './types';
import DonationNotificationsContainer from './pages/Home/components/Sidebar/DonationNotificationsContainer';

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
import { initializeLandingConfig } from './services/firebase/landingService';

// Admin imports
import AdminLoginPage from './pages/Admin/AdminLoginPage';
import Dashboard from './pages/Admin/components/Dashboard/Dashboard';
import { AdminAuthProvider, useAdminAuth } from './pages/Admin/context/AdminAuthContext';
import { AlumniRecords, AlumniListByBatch, AlumniForm, AlumniView, CSVImport } from './pages/Admin/components/AlumniRecords';
import { AlumniOfficers, OfficerForm } from './pages/Admin/components/AlumniOfficers';
import { EventManagement, EventForm } from './pages/Admin/components/Events';
import { GalleryManagement, GalleryForm } from './pages/Admin/components/Gallery';
import { DonationsManagement, DonationForm } from './pages/Admin/components/Donations';
import DonationReports from './pages/Admin/components/DonationReports';
import JobManagement from './pages/Admin/components/Jobs/JobManagement';
import JobForm from './pages/Admin/components/Jobs/JobForm';

import AboutUsManagement from './pages/Admin/components/AboutUs/AboutUsManagement';
import LandingPageSettings from './pages/Admin/components/LandingPageSettings';
import ContentModeration from './pages/Admin/components/ContentModeration';
import { Settings } from './pages/Admin/components/Settings';


// Helper component for admin protected routes
const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdminAuthenticated, isLoading } = useAdminAuth();
  
  if (isLoading) {
    return <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '1rem' }}>
      <div className="app-loading-spinner"></div>
      <div>Loading admin authentication...</div>
    </div>;
  }
  
  return isAdminAuthenticated ? <>{children}</> : <Navigate to="/admin/login" />;
};

// Helper component for user protected routes
const ProtectedRoute = ({ children, isAuthenticated, isLoading }: { children: React.ReactNode, isAuthenticated: boolean, isLoading: boolean }) => {
  if (isLoading) {
    return <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '1rem' }}>
      <div className="app-loading-spinner"></div>
      <div>Loading...</div>
    </div>;
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
        await initializeLandingConfig();

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
        {/* Add donation notifications container */}
        {user && <DonationNotificationsContainer />}
        <Routes>
          {/* --- Public Routes (No Authentication Required) --- */}
          <Route 
            path="/" 
            element={
              user ? <Navigate to="/landing" /> : (
                <GuestLayout>
                  <LandingPage />
                </GuestLayout>
              )
            } 
          />
          
          <Route 
            path="/about" 
            element={
              user ? (
                <Layout isAuthenticated={!!user} user={user} onLogout={handleLogout}>
                  <AboutPage />
                </Layout>
              ) : (
                <GuestLayout>
                  <PublicAboutPage />
                </GuestLayout>
              )
            } 
          />
          
          <Route 
            path="/donations" 
            element={
              user ? (
                <Layout isAuthenticated={!!user} user={user} onLogout={handleLogout}>
                  <DonationsPage user={user} />
                </Layout>
              ) : (
                <GuestLayout>
                  <DonationsPage />
                </GuestLayout>
              )
            } 
          />

          <Route 
            path="/events" 
            element={
              user ? (
                <Layout isAuthenticated={!!user} user={user} onLogout={handleLogout}>
                  <EventsPage />
                </Layout>
              ) : (
                <GuestLayout>
                  <EventsPage />
                </GuestLayout>
              )
            } 
          />

          <Route 
            path="/gallery" 
            element={
              user ? (
                <Layout isAuthenticated={!!user} user={user} onLogout={handleLogout}>
                  <GalleryPage />
                </Layout>
              ) : (
                <GuestLayout>
                  <GalleryPage />
                </GuestLayout>
              )
            } 
          />

          {/* --- Authentication Routes --- */}
          <Route path="/login" element={
            !isLoadingAuth && user ? <Navigate to="/landing" /> : <LoginPage onLoginSuccess={handleLoginSuccess} />
          } />
          {/* Redirect any attempts to access registration back to login */}
          <Route path="/register" element={<Navigate to="/login" replace />} />
          
          {/* --- Authenticated Landing Page (after login) --- */}
          <Route 
            path="/landing" 
            element={
              <ProtectedRoute isAuthenticated={!!user} isLoading={isLoadingAuth}>
                <LandingPage showProceedButton={true} />
              </ProtectedRoute>
            } 
          />

          {/* --- User Protected Routes with Layout --- */}
          <Route 
            path="/home"
            element={
              <ProtectedRoute isAuthenticated={!!user} isLoading={isLoadingAuth}>
                <Layout isAuthenticated={!!user} user={user} onLogout={handleLogout}>
                  <HomePage user={user} />
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
            path="/about-us"
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
            path="/about-us/:tab"
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
          <Route path="/admin/alumni-records/csv-import" element={
            <ProtectedAdminRoute><CSVImport /></ProtectedAdminRoute>
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

          <Route path="/admin/about-us" element={
            <ProtectedAdminRoute><AboutUsManagement /></ProtectedAdminRoute>
          } />
          <Route path="/admin/landing-settings" element={
            <ProtectedAdminRoute><LandingPageSettings /></ProtectedAdminRoute>
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
          <Route path="/admin/donation-reports" element={
            <ProtectedAdminRoute><DonationReports /></ProtectedAdminRoute>
          } />
          <Route path="/admin/content-moderation" element={
            <ProtectedAdminRoute><ContentModeration /></ProtectedAdminRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedAdminRoute><Settings /></ProtectedAdminRoute>
          } />

          {/* --- Catch-all Route --- */}
          {/* If authenticated and route not found, redirect to landing. Otherwise, redirect to public landing */}
          <Route path="*" element={
            isLoadingAuth ? (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '1rem' }}>
                <div className="app-loading-spinner"></div>
                <div>Loading...</div>
              </div>
            ) : 
            user ? <Navigate to="/landing" /> : <Navigate to="/" />
          } />

        </Routes>
      </AdminAuthProvider>
    </Router>
  );
}

export default App;
