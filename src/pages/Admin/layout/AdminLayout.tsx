import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, X, LogOut, Settings, User, 
  LayoutDashboard, Users, Award, Calendar,
  Image, Briefcase, ChevronRight,
  MessageSquare
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { getUnreadMessagesCount } from '../services/localStorage/contactService';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

const AdminLayout = ({ children, title = 'Dashboard' }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const location = useLocation();
  const { adminUser, adminLogout } = useAdminAuth();

  // Check for unread messages
  useEffect(() => {
    updateUnreadCount();
    
    // Add event listener for storage changes
    window.addEventListener('storage', updateUnreadCount);
    
    return () => {
      window.removeEventListener('storage', updateUnreadCount);
    };
  }, []);
  
  const updateUnreadCount = () => {
    const count = getUnreadMessagesCount();
    setUnreadMessages(count);
  };

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
          <Link to="/admin" className="admin-logo-text">
            IMA Alumni Admin
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
            to="/admin/messages" 
            className={`admin-menu-item ${location.pathname.includes('/admin/messages') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <MessageSquare className="admin-menu-icon" />
            Contact Messages
            {unreadMessages > 0 && (
              <span className="admin-badge">{unreadMessages}</span>
            )}
          </Link>
          
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
            to="/admin/donations" 
            className={`admin-menu-item ${location.pathname.includes('/admin/donations') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="admin-menu-icon peso-icon">₱</span>
            Donations
          </Link>
          
          <Link 
            to="/admin/gallery" 
            className={`admin-menu-item ${location.pathname.includes('/admin/gallery') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Image className="admin-menu-icon" />
            Gallery
          </Link>
        </nav>
      </div>

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
                <div className="admin-dropdown-item">
                  <User size={16} /> Profile
                </div>
                <div className="admin-dropdown-item">
                  <Settings size={16} /> Settings
                </div>
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