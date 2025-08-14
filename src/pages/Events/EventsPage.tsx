import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Filter, ChevronDown, Search, Zap } from 'lucide-react';
// Use the Firestore service
import { getAllEvents, Event as EventType } from '../../services/firebase/eventService'; 
import ImagePlaceholder from '../../components/ImagePlaceholder';
import './Events.css';

// Remove the local EventType interface, we imported the shared one
/*
interface EventType {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  image?: string;
}
*/

const EventsPage = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'past'>('all');
  const [isLoading, setIsLoading] = useState(true); // Start loading initially
  const [searchTerm, setSearchTerm] = useState('');
  const [allApprovedEvents, setAllApprovedEvents] = useState<EventType[]>([]); // Store all *approved* events

  // Fetch and filter events on initial load
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const fetchedEvents = await getAllEvents();
        const approvedEvents = fetchedEvents.filter(event => event.isApproved);
        setAllApprovedEvents(approvedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
        setAllApprovedEvents([]); // Set to empty on error
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  // Filter events based on search term AND active tab
  const filteredEvents = allApprovedEvents.filter(event => {
    const now = new Date();
    const eventDate = new Date(event.date);

    // Tab filtering
    let tabMatch = false;
    if (activeTab === 'all') {
      tabMatch = true;
    } else if (activeTab === 'upcoming') {
      tabMatch = eventDate >= now;
    } else if (activeTab === 'past') {
      tabMatch = eventDate < now;
    }

    // Search term filtering
    const searchMatch = searchTerm === '' || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()); // Added description search

    return tabMatch && searchMatch;
  }).sort((a, b) => { // Sort results, upcoming first, then past descending
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (activeTab === 'past') {
      return dateB - dateA; // Most recent past first
    }
    return dateA - dateB; // Earliest upcoming first
  });

  // Helper function to format date/time if needed (example)
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
  };

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, { 
      hour: 'numeric', minute: '2-digit', hour12: true 
    });
  };

  return (
    <div className="events-page">
      <div className="events-layout">
        <div className="events-content">
          <div className="events-header">
            <div className="events-title-section">
              <div className="events-icon">
                <Calendar size={24} />
              </div>
              <h1>Alumni Events</h1>
            </div>
            
            {/* Filter dropdown - Functionality TBD */}
            {/* 
            <div className="events-filter-wrapper">
              <div className="filter-dropdown">
                <button className="filter-button">
                  <Filter size={16} />
                  <span>Filter</span>
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>
            */}
          </div>
          
          <div className="events-controls">
            <div className="events-search">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="events-tabs">
              {/* Tabs remain the same */}
              <button 
                className={`events-tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <Zap size={16} />
                All Events
              </button>
              <button 
                className={`events-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
                onClick={() => setActiveTab('upcoming')}
              >
                <Calendar size={16} />
                Upcoming
              </button>
              <button 
                className={`events-tab ${activeTab === 'past' ? 'active' : ''}`}
                onClick={() => setActiveTab('past')}
              >
                <Clock size={16} />
                Past Events
              </button>
            </div>
          </div>

          <div className="events-section">
            <h2>
              {activeTab === 'upcoming' ? 'Upcoming Activities & Events' : 
               activeTab === 'past' ? 'Past Activities & Events' : 
               'All Activities & Events'}
            </h2>
            
            {isLoading ? (
              <div className="loading-events">
                {/* Skeleton remains the same */}
                <div className="events-skeleton-grid">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="event-skeleton-item"></div>
                  ))}
                </div>
              </div>
            ) : filteredEvents.length > 0 ? (
                <div className="events-grid">
                {filteredEvents.map(event => (
                  <div key={event.id} className="event-card">
                      <div className="event-image">
                      {event.coverImage ? (
                        <img src={event.coverImage} alt={event.title} /> // Use coverImage
                      ) : (
                        // Use ImagePlaceholder component
                        <ImagePlaceholder width="100%" height="200px" text={`${event.title} Event`} />
                      )}
                      </div>
                      <div className="event-content">
                        <h3 className="event-title">{event.title}</h3>
                        {/* Added description display */}
                        <p className="event-description">{event.description}</p> 
                        <div className="event-details">
                          <div className="event-detail">
                            <Calendar size={14} />
                            {/* Use formatter */}
                            <span>{formatEventDate(event.date)}</span> 
                          </div>
                          <div className="event-detail">
                            <Clock size={14} />
                             {/* Use formatter */}
                            <span>{formatEventTime(event.date)}</span>
                          </div>
                          <div className="event-detail">
                            <MapPin size={14} />
                            <span>{event.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            ) : (
              <div className="empty-events">
                <div className="empty-state-icon">
                  <Calendar size={64} strokeWidth={1} color="#64748b" />
                </div>
                <h3 className="empty-state-title">No events found</h3>
                <p className="empty-state-message">
                  {searchTerm ? 
                    "No approved events match your search criteria. Try a different search term." : 
                    activeTab === 'upcoming' ? 
                      "There are no approved upcoming events scheduled at this time. Check back later!" :
                      activeTab === 'past' ?
                      "There are no approved past events to display." :
                      "There are no approved events scheduled yet. Check back later for updates."
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
