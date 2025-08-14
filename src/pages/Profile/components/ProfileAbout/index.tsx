import { Briefcase, Building, MapPin, Link, Github, Linkedin, Twitter } from 'lucide-react';
import './styles.css';

interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  website?: string;
}

interface ProfileAboutProps {
  bio: string;
  job: string;
  company: string;
  location: string;
  socialLinks: SocialLinks;
}

const ProfileAbout = ({ bio, job, company, location, socialLinks }: ProfileAboutProps) => {
  const hasSocialLinks = socialLinks && (socialLinks.linkedin || socialLinks.twitter || socialLinks.website);
  const hasWorkInfo = job || company;
  const hasInfo = bio || hasWorkInfo || location || hasSocialLinks;

  return (
    <div className="profile-about">
      <div className="section-header">
        <h3>About</h3>
      </div>
      
      {hasInfo ? (
        <div className="about-content">
          {bio && (
            <div className="bio">
              <p>{bio}</p>
            </div>
          )}
          
          <div className="details">
            {hasWorkInfo && (
              <div className="detail-item">
                <Briefcase size={18} />
                <div className="detail-text">
                  <span>{job || ''}{job && company ? ' at ' : ''}{company || ''}</span>
                </div>
              </div>
            )}
            
            {location && (
              <div className="detail-item">
                <MapPin size={18} />
                <div className="detail-text">
                  <span>{location}</span>
                </div>
              </div>
            )}
          </div>
          
          {hasSocialLinks && (
            <div className="social-links">
              {socialLinks.linkedin && (
                <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="social-link">
                  <Linkedin size={18} />
                </a>
              )}
              
              {socialLinks.twitter && (
                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="social-link">
                  <Twitter size={18} />
                </a>
              )}
              
              {socialLinks.website && (
                <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="social-link">
                  <Link size={18} />
                </a>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <p>No information available</p>
        </div>
      )}
    </div>
  );
};

export default ProfileAbout; 