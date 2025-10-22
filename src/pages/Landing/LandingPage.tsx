import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getLandingConfig } from '../../services/firebase/landingService';
import OfficersCarousel from '../../components/OfficersCarousel';
import './Landing.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [showCarousel, setShowCarousel] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLandingConfig();
  }, []);

  const loadLandingConfig = async () => {
    try {
      const config = await getLandingConfig();
      setWelcomeMessage(config.welcomeMessage);
      setShowCarousel(config.showOfficersCarousel);
    } catch (error) {
      console.error('Error loading landing config:', error);
      // Use default message on error
      setWelcomeMessage(
        "Once an Immaculatian, always an Immaculatian! Proud to be part of Immaculate Mary Academy, where dreams begin and success continues. Forever grateful for the memories and lessons!"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    navigate('/home');
  };

  return (
    <div className="landing-container">
      <div className="landing-logos">
        <div className="logo-left">
          <div className="logo-circle">
            <img src="/images/alumni-conlogo.png" alt="IMA Alumni Logo" />
          </div>
        </div>
        <div className="logo-right">
          <div className="logo-circle">
            <img src="/images/church-logo.png" alt="Catholic Church Logo" />
          </div>
        </div>
      </div>
      
      <div className="landing-center">
        <div className="welcome-section">
          <h1 className="welcome-title">WELCOME</h1>
          <h2 className="welcome-subtitle">ALUMNIANS</h2>
        </div>
        
        <div className="quote-section">
          {loading ? (
            <div className="quote-loading">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <p className="quote-text">"{welcomeMessage}"</p>
          )}
        </div>

        {showCarousel && !loading && (
          <div className="landing-carousel-section">
            <OfficersCarousel />
          </div>
        )}
        
        <div className="action-section">
          <button className="proceed-btn" onClick={handleProceed}>
            <span>Proceed to Home</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
