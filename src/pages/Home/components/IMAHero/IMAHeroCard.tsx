import { ArrowRight, Heart, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import './IMAHeroCard.css';

const IMAHeroCard = () => {
  return (
    <div className="ima-hero-card">
      <div className="ima-hero-content">
        <div className="ima-hero-header">
          <div className="ima-logo-section">
            <img src="/images/alumni-conlogo.png" alt="IMA Logo" className="ima-hero-logo" />
            <div className="ima-title-section">
              <h1 className="ima-title">Immaculate Mary Academy (IMA)</h1>
              <p className="ima-subtitle">Alumni Community</p>
            </div>
          </div>
        </div>
        
        <div className="ima-hero-body">
          <p className="ima-description">
            Welcome to the official alumni portal of Immaculate Mary Academy. Connect with fellow graduates, 
            stay updated with school news, and be part of our growing community that continues to uphold 
            the values and traditions of IMA.
          </p>
          
          <div className="ima-stats">
            <div className="ima-stat">
              <Users size={20} />
              <span>Growing Alumni Network</span>
            </div>
            <div className="ima-stat">
              <Heart size={20} />
              <span>United by Values</span>
            </div>
          </div>
          
          <div className="ima-actions">
            <Link to="/about" className="ima-action-btn primary">
              <span>Learn More About IMA</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/events" className="ima-action-btn secondary">
              <span>Upcoming Events</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IMAHeroCard;
