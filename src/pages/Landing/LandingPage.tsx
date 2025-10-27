import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import OfficersCarousel from '../../components/OfficersCarousel';
import './Landing.css';

const LandingPage = () => {
  const navigate = useNavigate();

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
        
        <div className="landing-carousel-section">
          <OfficersCarousel />
        </div>
        
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
