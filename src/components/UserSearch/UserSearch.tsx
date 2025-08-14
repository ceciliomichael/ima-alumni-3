import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../types';
import { searchUsers } from '../../pages/Admin/services/localStorage/userService';
import ImagePlaceholder from '../ImagePlaceholder/ImagePlaceholder';
import './UserSearch.css';

const UserSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isResultsVisible, setIsResultsVisible] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim()) {
      const searchResults = searchUsers(value);
      setResults(searchResults);
      setIsResultsVisible(true);
    } else {
      setResults([]);
      setIsResultsVisible(false);
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
  const navigateToProfile = (userId: string) => {
    setIsResultsVisible(false);
    setQuery('');
    navigate(`/profile/${userId}`);
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
            placeholder="Search alumni..."
            value={query}
            onChange={handleSearchChange}
            onFocus={() => {
              if (query.trim() && results.length > 0) {
                setIsResultsVisible(true);
              }
            }}
          />
          {query && (
            <button className="user-search-clear" onClick={() => {
              setQuery('');
              setResults([]);
              setIsResultsVisible(false);
            }}>
              <X size={16} />
            </button>
          )}
        </div>
        
        {isResultsVisible && (
          <div className="user-search-results">
            {results.length > 0 ? (
              results.map(user => (
                <div 
                  key={user.id}
                  className="user-search-result"
                  onClick={() => navigateToProfile(user.id)}
                >
                  <div className="user-search-avatar">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt={user.name} />
                    ) : (
                      <ImagePlaceholder
                        isAvatar
                        size="small"
                        name={user.name}
                      />
                    )}
                  </div>
                  <div className="user-search-info">
                    <h4 className="user-search-name">{user.name}</h4>
                    <p className="user-search-batch">{user.batch}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="user-search-no-results">
                <p>No users found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearch; 