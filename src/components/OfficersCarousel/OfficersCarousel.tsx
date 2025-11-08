import { useState, useEffect } from 'react';
import { getAllOfficers } from '../../services/firebase/officerService';
import { getAllAlumni } from '../../services/firebase/alumniService';
import { OfficerPosition, AlumniRecord } from '../../types';
import './OfficersCarousel.css';

const MAX_DISPLAYED_OFFICERS = 6;

const OfficersCarousel = () => {
  const [officers, setOfficers] = useState<OfficerPosition[]>([]);
  const [alumniMap, setAlumniMap] = useState<Map<string, AlumniRecord>>(new Map());
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    loadOfficers();
  }, []);

  // Auto-rotate pages if more than MAX_DISPLAYED_OFFICERS
  useEffect(() => {
    if (officers.length <= MAX_DISPLAYED_OFFICERS || isPaused) return;

    const totalPages = Math.ceil(officers.length / MAX_DISPLAYED_OFFICERS);
    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 5000); // Change every 5 seconds

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
        // If no endDate, officer is active
        if (!officer.endDate) return true;
        
        // Parse the endDate and check if it's in the future
        const endDate = new Date(officer.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
        
        return endDate >= today;
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

  // Get officers for current page
  const startIndex = currentPage * MAX_DISPLAYED_OFFICERS;
  const endIndex = startIndex + MAX_DISPLAYED_OFFICERS;
  const displayedOfficers = officers.slice(startIndex, endIndex);
  const totalPages = Math.ceil(officers.length / MAX_DISPLAYED_OFFICERS);

  return (
    <div className="officers-carousel-container">
      <h2 className="officers-carousel-title">Our Alumni Officers</h2>
      
      <div
        className="officers-grid-wrapper"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="officers-grid">
          {displayedOfficers.map((officer) => {
            const alumni = getAlumniInfo(officer.alumniId);
            const photoSrc = officer.photo || alumni?.profileImage;

            return (
              <div key={officer.id} className="officer-card-grid">
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
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="pagination-dots">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                className={`pagination-dot ${index === currentPage ? 'active' : ''}`}
                onClick={() => setCurrentPage(index)}
                aria-label={`Go to page ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficersCarousel;

