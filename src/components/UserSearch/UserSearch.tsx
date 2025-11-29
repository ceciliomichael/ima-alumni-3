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
    <div className="relative flex items-center" ref={searchRef}>
      {/* Mobile toggle button - visible on small screens */}
      <button 
        className="flex lg:hidden items-center justify-center w-10 h-10 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200"
        onClick={toggleSearch}
      >
        {isSearchOpen ? <X size={20} /> : <Search size={20} />}
      </button>
      
      {/* Search container - always visible on desktop, toggleable on mobile */}
      <div className={`
        ${isSearchOpen ? 'flex' : 'hidden'} lg:flex
        fixed lg:relative
        top-[70px] lg:top-auto
        left-4 right-4 lg:left-auto lg:right-auto
        w-auto lg:w-60
        max-w-none
        p-2 lg:p-0
        bg-white lg:bg-transparent
        rounded-lg lg:rounded-none
        shadow-lg lg:shadow-none
        border border-gray-200 lg:border-0
        z-50
      `}>
        <div className="relative flex items-center w-full">
          <Search size={16} className="absolute left-3 text-gray-400 pointer-events-none" />
          <input
            type="text"
            className="w-full h-10 pl-9 pr-9 rounded-full border border-gray-300 bg-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
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
              className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors"
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
        
        {/* Search results dropdown */}
        {isResultsVisible && (
          <div className="absolute top-full left-0 right-0 mt-1 lg:mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto z-50">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <p>Searching...</p>
              </div>
            ) : results.length > 0 ? (
              results.map(alumni => (
                <div
                  key={alumni.id}
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => navigateToProfile(alumni)}
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-primary flex-shrink-0">
                    {alumni.profileImage ? (
                      <img src={alumni.profileImage} alt={alumni.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImagePlaceholder
                        isAvatar
                        size="small"
                        name={alumni.name}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{alumni.name}</h4>
                    <p className="text-xs text-gray-500">{alumni.batch}</p>
                  </div>
                </div>
              ))
            ) : query.trim() ? (
              <div className="p-4 text-center text-gray-500">
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