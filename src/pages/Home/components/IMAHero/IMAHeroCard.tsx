import { useState, useEffect } from 'react';
import { ArrowRight, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getHomepageHero, DEFAULT_HERO_CONTENT } from '../../../../services/firebase/homepageService';
import { HomepageHeroContent } from '../../../../types';
import './IMAHeroCard.css';

const IMAHeroCard = () => {
  const [heroContent, setHeroContent] = useState<HomepageHeroContent>(DEFAULT_HERO_CONTENT);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHeroContent = async () => {
      try {
        const content = await getHomepageHero();
        setHeroContent(content);
      } catch (error) {
        console.error('Error fetching hero content:', error);
        // Keep default content on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchHeroContent();
  }, []);

  return (
    <div className="ima-hero-card">
      <div className="ima-hero-content">
        <div className="ima-hero-header">
          <div className="ima-logo-section">
            <img src="/images/alumni-conlogo.png" alt="IMA Logo" className="ima-hero-logo" />
            <div className="ima-title-section">
              <h1 className="ima-title">{heroContent.title}</h1>
              <p className="ima-subtitle">{heroContent.subtitle}</p>
            </div>
          </div>
        </div>
        
        <div className="ima-hero-body">
          <p className={`ima-description ${isLoading ? 'loading' : ''}`}>
            {heroContent.description}
          </p>
          
          <div className="ima-stats">
            <div className="ima-stat">
              <Heart size={20} />
              <span>United by Values</span>
            </div>
          </div>
          
          <div className="ima-actions">
            <Link to={heroContent.ctaUrl} className="ima-action-btn primary">
              <span>{heroContent.ctaLabel}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IMAHeroCard;
