import { User, UserCircle, Users, Calendar, Briefcase, BookOpen, Building, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { User as UserType } from '../../../../types';
import ImagePlaceholder from '../../../../components/ImagePlaceholder/ImagePlaceholder';
import './Sidebar.css';

interface SidebarLeftProps {
  user: UserType | null;
}

const SidebarLeft = ({ user }: SidebarLeftProps) => {
  const location = useLocation();
  
  if (!user) return null;

  // Check if a path is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Check if a path starts with a prefix
  const isActivePrefix = (prefix: string) => {
    return location.pathname.startsWith(prefix);
  };

  return (
    <div className="sidebar-container">
      <div className="sidebar-card user-profile-card">
        <div className="sidebar-profile-header">
          {user.coverPhoto && (
            <div className="sidebar-cover-photo">
              <img src={user.coverPhoto} alt="Cover" />
            </div>
          )}
          <div className="profile-avatar-large">
            {user.profileImage ? (
              <img src={user.profileImage} alt={user.name || 'User Avatar'} />
            ) : (
              <ImagePlaceholder 
                isAvatar 
                size="large" 
                name={user.name || ''} 
                className="avatar-placeholder-large"
              />
            )}
          </div>
          <h2 className="sidebar-profile-name">{user.name || 'User'}</h2>
          <p className="sidebar-profile-batch">Batch {user.batch || 'N/A'}</p>
        </div>
        <Link to="/profile" className="profile-view-link">
          <UserCircle size={18} />
          <span>View Profile</span>
        </Link>
      </div>

      <div className="sidebar-card">
        <h3 className="sidebar-title">Menu</h3>
        <ul className="sidebar-menu">
          <li className={`sidebar-menu-item ${isActive('/') ? 'active' : ''}`}>
            <Link to="/" className="sidebar-menu-link">
              <User size={20} />
              <span>My Feed</span>
            </Link>
          </li>
          <li className={`sidebar-menu-item ${isActive('/events') ? 'active' : ''}`}>
            <Link to="/events" className="sidebar-menu-link">
              <Calendar size={20} />
              <span>Events</span>
            </Link>
          </li>
          <li className={`sidebar-menu-item ${isActive('/jobs') ? 'active' : ''}`}>
            <Link to="/jobs" className="sidebar-menu-link">
              <Briefcase size={20} />
              <span>Jobs</span>
            </Link>
          </li>
        </ul>
      </div>

      <div className="sidebar-card">
        <h3 className="sidebar-title">About</h3>
        <ul className="sidebar-menu">
          <li className={`sidebar-menu-item ${isActive('/about/history') || (isActive('/about') && !isActivePrefix('/about/')) ? 'active' : ''}`}>
            <Link to="/about/history" className="sidebar-menu-link">
              <BookOpen size={20} />
              <span>History</span>
            </Link>
          </li>
          <li className={`sidebar-menu-item ${isActive('/about/vision') ? 'active' : ''}`}>
            <Link to="/about/vision" className="sidebar-menu-link">
              <Building size={20} />
              <span>Vision & Mission</span>
            </Link>
          </li>
          <li className={`sidebar-menu-item ${isActive('/about/organization') ? 'active' : ''}`}>
            <Link to="/about/organization" className="sidebar-menu-link">
              <Users size={20} />
              <span>Organization</span>
            </Link>
          </li>
          <li className={`sidebar-menu-item ${isActive('/about/contact') ? 'active' : ''}`}>
            <Link to="/about/contact" className="sidebar-menu-link">
              <Settings size={20} />
              <span>Contact Us</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SidebarLeft; 