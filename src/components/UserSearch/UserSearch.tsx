import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AlumniRecord } from '../../types';
import { searchAlumni } from '../../services/firebase/alumniService';
import ImagePlaceholder from '../ImagePlaceholder/ImagePlaceholder';
import './UserSearch.css';

const UserSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AlumniRecord[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isResultsVisible, setIsResultsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Handle search input change
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim()) {
      setIsLoading(true);
      try {
        const searchResults = await searchAlumni(value);
        setResults(searchResults);
        setIsResultsVisible(true);
      } catch (error) {
        console.error('Error searching alumni:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setResults([]);
      setIsResultsVisible(false);
      setIsLoading(false);
    }
  };

  // Handle click outside of search component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsResultsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Navigate to user profile
  const navigateToProfile = async (alumni: AlumniRecord) => {
    setIsResultsVisible(false);
    setQuery('');
    
    // If alumni has a linked userId, navigate to their profile
    if (alumni.userId) {
      navigate(`/profile/${alumni.userId}`);
    } else {
      // If no userId, show an alert that the alumni hasn't registered yet
      alert(`${alumni.name} hasn't registered an account yet.`);
    }
  };

  // Toggle search input on mobile
  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setTimeout(() => {
        const input = document.querySelector('.user-search-input') as HTMLInputElement;
        if (input) input.focus();
      }, 100);
    } else {
      setQuery('');
      setResults([]);
      setIsResultsVisible(false);
    }
  };

  return (
    <div className={`user-search ${isSearchOpen ? 'open' : ''}`} ref={searchRef}>
      <button className="user-search-toggle" onClick={toggleSearch}>
        {isSearchOpen ? <X size={20} /> : <Search size={20} />}
      </button>
      
      <div className="user-search-container">
        <div className="user-search-input-wrapper">
          <Search size={16} className="user-search-icon" />
          <input
            type="text"
            className="user-search-input"
            placeholder={isLoading ? "Searching..." : "Search alumni..."}
            value={query}
            onChange={handleSearchChange}
            onFocus={() => {
              if (query.trim() && results.length > 0) {
                setIsResultsVisible(true);
              }
            }}
          />
          {query && (
            <button
              className="user-search-clear"
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsResultsVisible(false);
                setIsLoading(false);
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        {isResultsVisible && (
          <div className="user-search-results">
            {isLoading ? (
              <div className="user-search-no-results">
                <p>Searching...</p>
              </div>
            ) : results.length > 0 ? (
              results.map(alumni => (
                <div
                  key={alumni.id}
                  className="user-search-result"
                  onClick={() => navigateToProfile(alumni)}
                >
                  <div className="user-search-avatar">
                    {alumni.profileImage ? (
                      <img src={alumni.profileImage} alt={alumni.name} />
                    ) : (
                      <ImagePlaceholder
                        isAvatar
                        size="small"
                        name={alumni.name}
                      />
                    )}
                  </div>
                  <div className="user-search-info">
                    <h4 className="user-search-name">{alumni.name}</h4>
                    <p className="user-search-batch">{alumni.batch}</p>
                  </div>
                </div>
              ))
            ) : query.trim() ? (
              <div className="user-search-no-results">
                <p>No alumni found</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearch; 