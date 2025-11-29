import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from '../../types';
import { Home, Image, Calendar, Info, Bell, LogOut, Menu, X, User as UserIcon, Briefcase } from 'lucide-react';
import UserSearch from '../UserSearch/UserSearch';
import ImagePlaceholder from '../ImagePlaceholder/ImagePlaceholder';
import { subscribeToUserNotifications } from '../../services/firebase/notificationService';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-profile')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Subscribe to user-specific notifications to get unread count
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const unsubscribe = subscribeToUserNotifications(user.id, (notifications) => {
        const unread = notifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      });

      return () => unsubscribe();
    }
  }, [isAuthenticated, user?.id]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

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

          {/* Mobile menu overlay */}
          {isMobileMenuOpen && (
            <div 
              className="mobile-menu-overlay active" 
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

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

          <div className="flex items-center gap-3 order-3 lg:order-none">
            {/* Search - order 1 on mobile */}
            <div className="order-1">
              <UserSearch />
            </div>
            
            {/* Notification - order 2 on mobile */}
            <div className="order-2 relative">
              <Link 
                to="/notifications" 
                className="flex items-center justify-center w-10 h-10 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200"
                title="Notifications"
              >
                <Bell size={20} color="#fff" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full ring-2 ring-primary">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            </div>
            
            {/* User Profile - order 3 on mobile */}
            <div className="order-3 relative user-profile">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden hover:bg-white/10 transition-all duration-200"
              >
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <ImagePlaceholder 
                    isAvatar 
                    size="small" 
                    name={user?.name || ''} 
                  />
                )}
              </button>
              
              {/* Dropdown - controlled by click */}
              <div className={`absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 transition-all duration-200 origin-top-right ${isDropdownOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'}`}>
                <div className="p-5 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                  <span className="block font-bold text-gray-900 text-lg">{user?.name}</span>
                  <span className="inline-block mt-1 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    Batch {user?.batch}
                  </span>
                </div>
                <div className="p-2">
                  <Link 
                    to="/profile" 
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors group"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <UserIcon size={16} />
                    </div>
                    <span className="font-medium">Profile</span>
                  </Link>
                  <button 
                    onClick={() => { setIsDropdownOpen(false); onLogout(); }} 
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors group mt-1"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-100 transition-colors">
                      <LogOut size={16} />
                    </div>
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Hamburger Menu - order 4 on mobile (last) */}
            <button 
              className="order-4 flex lg:hidden items-center justify-center w-10 h-10 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 ml-1 mr-2"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? <X size={24} color="#fff" /> : <Menu size={24} color="#fff" />}
            </button>
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