import { useState, useEffect } from 'react';
import { getAllOfficers } from '../../services/firebase/officerService';
import { getAllAlumni } from '../../services/firebase/alumniService';
import { OfficerPosition, AlumniRecord } from '../../types';
import './OfficersCarousel.css';

const OfficersCarousel = () => {
  const [officers, setOfficers] = useState<OfficerPosition[]>([]);
  const [alumniMap, setAlumniMap] = useState<Map<string, AlumniRecord>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    loadOfficers();
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    if (officers.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % officers.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [officers.length, isPaused]);

  const loadOfficers = async () => {
    try {
      setLoading(true);
      const [officersData, alumniData] = await Promise.all([
        getAllOfficers(),
        getAllAlumni()
      ]);

      // Filter active officers (no end date or end date in future)
      const activeOfficers = officersData.filter(officer => {
        if (!officer.endDate) return true;
        const endDate = new Date(officer.endDate);
        return endDate > new Date();
      });

      // Create alumni map for quick lookup
      const map = new Map<string, AlumniRecord>();
      alumniData.forEach(alumni => {
        map.set(alumni.id, alumni);
      });

      setOfficers(activeOfficers);
      setAlumniMap(map);
    } catch (error) {
      console.error('Error loading officers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="officers-carousel-container">
        <div className="officers-carousel-loading">
          <div className="loading-spinner"></div>
          <p>Loading officers...</p>
        </div>
      </div>
    );
  }

  if (officers.length === 0) {
    return null; // Don't show carousel if no officers
  }

  const getAlumniInfo = (alumniId: string) => {
    return alumniMap.get(alumniId);
  };

  return (
    <div className="officers-carousel-container">
      <h2 className="officers-carousel-title">Our Alumni Officers</h2>
      
      <div 
        className="officers-carousel"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="carousel-track">
          {officers.map((officer, index) => {
            const alumni = getAlumniInfo(officer.alumniId);
            const isActive = index === currentIndex;
            const isPrev = index === (currentIndex - 1 + officers.length) % officers.length;
            const isNext = index === (currentIndex + 1) % officers.length;

            let className = 'carousel-slide';
            if (isActive) className += ' active';
            else if (isPrev) className += ' prev';
            else if (isNext) className += ' next';
            else className += ' hidden';

            const photoSrc = officer.photo || alumni?.profileImage;

            return (
              <div key={officer.id} className={className}>
                <div className="officer-card">
                  <div className="officer-image-wrapper">
                    {photoSrc ? (
                      <img 
                        src={photoSrc} 
                        alt={alumni?.name || 'Officer'}
                        className="officer-image"
                      />
                    ) : (
                      <div className="officer-image-placeholder">
                        {alumni?.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  
                  <div className="officer-info">
                    <h3 className="officer-name">{alumni?.name || 'Unknown'}</h3>
                    <p className="officer-position">{officer.title}</p>
                    {alumni?.batch && (
                      <p className="officer-batch">Batch {alumni.batch}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OfficersCarousel;

