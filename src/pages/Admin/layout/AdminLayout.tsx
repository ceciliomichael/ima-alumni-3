import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, X, LogOut, Settings,
  LayoutDashboard, Users, Award, Calendar,
  Image, Briefcase,
  Info, FileText, Shield
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { subscribeToPendingJobs } from '../../../services/firebase/jobService';
import { subscribeToPendingGalleryItems } from '../../../services/firebase/galleryService';
import { subscribeToPendingPosts } from '../../../services/firebase/postService';

import './AdminLayout.css';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

const AdminLayout = ({ children, title = 'Dashboard' }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [pendingModerationCount, setPendingModerationCount] = useState(0);

  const location = useLocation();
  const { adminUser, adminLogout } = useAdminAuth();

  // Subscribe to pending counts for Content Moderation and Gallery badges
  useEffect(() => {
    let pendingPostsCountLocal = 0;
    let pendingJobsCountLocal = 0;
    let pendingGalleryCountLocal = 0;

    const updateModerationCount = () => {
      setPendingModerationCount(
        pendingPostsCountLocal + pendingJobsCountLocal + pendingGalleryCountLocal
      );
    };

    const unsubscribePosts = subscribeToPendingPosts((posts) => {
      pendingPostsCountLocal = posts.length;
      updateModerationCount();
    });

    const unsubscribeJobs = subscribeToPendingJobs((jobs) => {
      pendingJobsCountLocal = jobs.length;
      updateModerationCount();
    });

    const unsubscribeGallery = subscribeToPendingGalleryItems((items) => {
      pendingGalleryCountLocal = items.length;
      updateModerationCount();
    });

    return () => {
      unsubscribePosts();
      unsubscribeJobs();
      unsubscribeGallery();
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };

  // Get first letter of admin name for avatar
  const getInitial = () => {
    if (adminUser && adminUser.name) {
      return adminUser.name.charAt(0).toUpperCase();
    }
    return 'A';
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-logo">
          <Link to="/admin" className="admin-logo-link">
            <img 
              src="/images/alumni-conlogo.png" 
              alt="IMA Alumni Admin" 
              className="admin-logo-image"
            />
          </Link>
        </div>

        <nav className="admin-menu">
          <div className="admin-menu-title">Main</div>
          <Link 
            to="/admin" 
            className={`admin-menu-item ${location.pathname === '/admin' ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <LayoutDashboard className="admin-menu-icon" />
            Dashboard
          </Link>
          
          <div className="admin-menu-title">Records Management</div>
          <Link 
            to="/admin/alumni-records" 
            className={`admin-menu-item ${location.pathname.includes('/admin/alumni-records') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Users className="admin-menu-icon" />
            Alumni Records
          </Link>

          <Link 
            to="/admin/alumni-officers" 
            className={`admin-menu-item ${location.pathname.includes('/admin/alumni-officers') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Award className="admin-menu-icon" />
            Alumni Officers
          </Link>

          <div className="admin-menu-title">Content Management</div>
          <Link 
            to="/admin/events" 
            className={`admin-menu-item ${location.pathname.includes('/admin/events') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Calendar className="admin-menu-icon" />
            Events
          </Link>
          
          <Link 
            to="/admin/jobs" 
            className={`admin-menu-item ${location.pathname.includes('/admin/jobs') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Briefcase className="admin-menu-icon" />
            Jobs
          </Link>
          
          <Link 
            to="/admin/gallery" 
            className={`admin-menu-item ${location.pathname.includes('/admin/gallery') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Image className="admin-menu-icon" />
            Gallery
          </Link>
          
          <Link 
            to="/admin/donations" 
            className={`admin-menu-item ${location.pathname === '/admin/donations' || location.pathname.includes('/admin/donations/') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="admin-menu-icon peso-icon">₱</span>
            Donations
          </Link>
          
          <Link 
            to="/admin/donation-reports" 
            className={`admin-menu-item ${location.pathname.includes('/admin/donation-reports') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <FileText className="admin-menu-icon" />
            Donation Reports
          </Link>
          
          <Link 
            to="/admin/about-us" 
            className={`admin-menu-item ${location.pathname.includes('/admin/about-us') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Info className="admin-menu-icon" />
            About Us
          </Link>

          <div className="admin-menu-title">Moderation</div>
          <Link 
            to="/admin/content-moderation" 
            className={`admin-menu-item ${location.pathname.includes('/admin/content-moderation') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Shield className="admin-menu-icon" />
            Content Moderation
            {pendingModerationCount > 0 && (
              <span className="sidebar-badge">{pendingModerationCount > 99 ? '99+' : pendingModerationCount}</span>
            )}
          </Link>

          <div className="admin-menu-title">System</div>
          <Link 
            to="/admin/settings" 
            className={`admin-menu-item ${location.pathname.includes('/admin/settings') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Settings className="admin-menu-icon" />
            Settings
          </Link>
        </nav>
      </div>

      {/* Click-outside overlay for sidebar */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="admin-main">
        <header className="admin-header">
          <div>
            <button className="admin-menu-toggle" onClick={toggleSidebar}>
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="admin-header-title">{title}</h1>
          </div>
          <div className={`admin-user ${userDropdownOpen ? 'open' : ''}`}>
            <div className="admin-user-info">
              <div className="admin-user-name">{adminUser?.name}</div>
              <div className="admin-user-role">{adminUser?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</div>
            </div>
            
            <div className="admin-avatar" onClick={toggleUserDropdown}>
              {getInitial()}
            </div>
            
            <div className="admin-dropdown">
              <div className="admin-dropdown-menu">
                <div className="admin-dropdown-item admin-logout" onClick={adminLogout}>
                  <LogOut size={16} /> Sign Out
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout; 