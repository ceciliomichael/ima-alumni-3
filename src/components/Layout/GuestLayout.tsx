import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogIn, Home, Info, Menu, X } from 'lucide-react';
import { useState } from 'react';
import './GuestLayout.css';

interface GuestLayoutProps {
  children: React.ReactNode;
}

const GuestLayout = ({ children }: GuestLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="guest-layout">
      <header className="guest-header">
        <div className="guest-header-container">
          <div className="guest-logo-container">
            <Link to="/" className="guest-logo">
              <img src="/images/alumni-conlogo.png" alt="IMA Alumni" className="guest-logo-image" />
            </Link>
          </div>

          <button className="guest-mobile-menu-button" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <nav className={`guest-nav-menu ${isMobileMenuOpen ? 'guest-mobile-menu-open' : ''}`}>
            <ul className="guest-nav-list">
              <li className="guest-nav-item">
                <Link 
                  to="/" 
                  className={`guest-nav-link ${location.pathname === '/' ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Home size={18} /> Home
                </Link>
              </li>
              <li className="guest-nav-item">
                <Link 
                  to="/about" 
                  className={`guest-nav-link ${location.pathname === '/about' ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Info size={18} /> About Us
                </Link>
              </li>
              <li className="guest-nav-item">
                <Link 
                  to="/donations" 
                  className={`guest-nav-link ${location.pathname === '/donations' ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="peso-icon">₱</span> Donations
                </Link>
              </li>
            </ul>
          </nav>

          <div className="guest-header-right">
            <button 
              className="guest-login-btn"
              onClick={() => navigate('/login')}
            >
              <LogIn size={18} />
              <span>Login</span>
            </button>
          </div>
        </div>
      </header>
      <div className="guest-header-placeholder"></div>

      <main className="guest-main">
        {children}
      </main>

      <footer className="guest-footer">
        <div className="guest-footer-content">
          <p>&copy; {new Date().getFullYear()} Immaculate Mary Academy Alumni Association. All rights reserved.</p>
          <p className="guest-footer-tagline">Once an Immaculatian, always an Immaculatian!</p>
        </div>
      </footer>
    </div>
  );
};

export default GuestLayout;

