import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from '../../types';
import { Home, Image, Calendar, Info, Bell, LogOut, Menu, X, User as UserIcon, Briefcase } from 'lucide-react';
import UserSearch from '../UserSearch/UserSearch';
import ImagePlaceholder from '../ImagePlaceholder/ImagePlaceholder';
import { subscribeToNotifications } from '../../services/firebase/notificationService';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
  isAuthenticated: boolean;
  user: User | null;
  onLogout: () => void;
}

const Layout = ({ children, isAuthenticated, user, onLogout }: LayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Subscribe to notifications to get unread count
  useEffect(() => {
    if (isAuthenticated) {
      const unsubscribe = subscribeToNotifications((notifications) => {
        const unread = notifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      });

      return () => unsubscribe();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="layout">
      <header className="header">
        <div className="container header-container">
          <div className="logo-container">
            <Link to="/" className="logo">
              <img src="/images/alumni-conlogo.png" alt="Immaculate Mary Academy (IMA) Alumni" className="logo-image" />
            </Link>
          </div>

          <button className="mobile-menu-button" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <nav className={`nav-menu ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
            <ul className="nav-list">
              <li className="nav-item">
                <Link 
                  to="/home" 
                  className={`nav-link ${location.pathname === '/home' ? 'active' : ''}`} 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Home size={18} /> Home
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  to="/gallery" 
                  className={`nav-link ${location.pathname.includes('/gallery') ? 'active' : ''}`} 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Image size={18} /> Gallery
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  to="/events" 
                  className={`nav-link ${location.pathname.includes('/events') ? 'active' : ''}`} 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Calendar size={18} /> Events
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  to="/jobs" 
                  className={`nav-link ${location.pathname.includes('/jobs') ? 'active' : ''}`} 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Briefcase size={18} /> Jobs
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  to="/donations" 
                  className={`nav-link ${location.pathname.includes('/donations') ? 'active' : ''}`} 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="peso-icon">₱</span> Donations
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  to="/about-us" 
                  className={`nav-link ${location.pathname.includes('/about') ? 'active' : ''}`} 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Info size={18} /> About Us
                </Link>
              </li>
            </ul>
          </nav>

          <div className="header-right">
            <UserSearch />
            <div className="user-menu">
              <div className="notification-icon">
                <Link to="/notifications" className="notification-button" title="Notifications">
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </Link>
              </div>
              <div className="user-profile">
                <div className="user-avatar">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt={user.name} />
                  ) : (
                    <ImagePlaceholder 
                      isAvatar 
                      size="small" 
                      name={user?.name || ''} 
                    />
                  )}
                </div>
                <div className="user-dropdown">
                  <div className="user-info">
                    <span className="user-name">{user?.name}</span>
                    <span className="user-batch">Batch {user?.batch}</span>
                  </div>
                  <div className="dropdown-menu">
                    <Link to="/profile" className="dropdown-item">
                      <UserIcon size={16} /> Profile
                    </Link>
                    <button onClick={onLogout} className="dropdown-item logout-button">
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="header-placeholder"></div>

      <main className="main-content">
        <div className="container">
          {children}
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Immaculate Mary Academy (IMA) Alumni. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 