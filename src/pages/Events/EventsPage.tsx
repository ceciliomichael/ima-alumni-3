import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Search, Zap, Play } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
// Use the Firestore service for Event type
import { Event as EventType } from '../../services/firebase/eventService'; 
import ImagePlaceholder from '../../components/ImagePlaceholder';
import FeaturedCarousel from '../../components/FeaturedCarousel';
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
  const [activeTab, setActiveTab] = useState<'all' | 'current' | 'upcoming' | 'past'>('all');
  const [isLoading, setIsLoading] = useState(true); // Start loading initially
  const [searchTerm, setSearchTerm] = useState('');
  const [allApprovedEvents, setAllApprovedEvents] = useState<EventType[]>([]); // Store all *approved* events

  // Set up real-time listener for approved events
  useEffect(() => {
    setIsLoading(true);
    
    // Set up real-time listener for approved events
    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('isApproved', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const approvedEvents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as EventType[];
        
        setAllApprovedEvents(approvedEvents);
      } catch (error) {
        console.error('Error processing events:', error);
        setAllApprovedEvents([]);
      } finally {
        setIsLoading(false);
      }
    }, (error) => {
      console.error('Realtime events listener error:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter events based on search term AND active tab
  const filteredEvents = allApprovedEvents.filter(event => {
    const now = new Date();
    const start = new Date(event.date);
    const end = new Date(event.endDate || event.date);

    // Tab filtering
    let tabMatch = false;
    if (activeTab === 'all') {
      tabMatch = true;
    } else if (activeTab === 'current') {
      tabMatch = start <= now && end >= now;
    } else if (activeTab === 'upcoming') {
      tabMatch = start > now;
    } else if (activeTab === 'past') {
      tabMatch = end < now;
    }

    // Search term filtering
    const searchMatch = searchTerm === '' || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()); // Added description search

    return tabMatch && searchMatch;
  }).sort((a, b) => { // Sort results, upcoming first, then past descending
    const startA = new Date(a.date).getTime();
    const startB = new Date(b.date).getTime();
    const endA = new Date(a.endDate || a.date).getTime();
    const endB = new Date(b.endDate || b.date).getTime();

    if (activeTab === 'past') {
      return endB - endA; // Most recent past first
    }

    return startA - startB; // Earliest upcoming/current first
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

  // Format time range (start - end) if endDate exists
  const formatEventTimeRange = (startDateString: string, endDateString?: string) => {
    const startTime = formatEventTime(startDateString);
    if (!endDateString) {
      return startTime;
    }
    const endTime = formatEventTime(endDateString);
    // Only show range if times are different
    if (startTime === endTime) {
      return startTime;
    }
    return `${startTime} - ${endTime}`;
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
              <button 
                className={`events-tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <Zap size={16} />
                All Events
              </button>
              <button 
                className={`events-tab ${activeTab === 'current' ? 'active' : ''}`}
                onClick={() => setActiveTab('current')}
              >
                <Play size={16} />
                Current
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
              {activeTab === 'current' ? 'Current Activities & Events' :
               activeTab === 'upcoming' ? 'Upcoming Activities & Events' : 
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
              <FeaturedCarousel
                items={filteredEvents}
                getKey={(event) => event.id}
                renderFeatured={(event) => (
                  <div className="event-featured-item">
                    <div className="event-featured-image">
                      {event.coverImage ? (
                        <img src={event.coverImage} alt={event.title} />
                      ) : (
                        <ImagePlaceholder width="100%" height="100%" text={`${event.title} Event`} />
                      )}
                    </div>
                    <div className="event-featured-overlay">
                      <h3 className="event-featured-title">{event.title}</h3>
                      <p className="event-featured-description">{event.description}</p>
                      <div className="event-featured-details">
                        <div className="event-featured-detail">
                          <Calendar size={16} />
                          <span>{formatEventDate(event.date)}</span>
                        </div>
                        <div className="event-featured-detail">
                          <Clock size={16} />
                          <span>{formatEventTimeRange(event.date, event.endDate)}</span>
                        </div>
                        <div className="event-featured-detail">
                          <MapPin size={16} />
                          <span>{event.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                renderThumb={(event) => (
                  <div className="event-thumb">
                    {event.coverImage ? (
                      <img src={event.coverImage} alt={event.title} />
                    ) : (
                      <ImagePlaceholder width="100%" height="100%" text={event.title.substring(0, 3)} />
                    )}
                    <div className="event-thumb-title">{event.title}</div>
                  </div>
                )}
                loop={true}
              />
            ) : (
              <div className="empty-events">
                <div className="empty-state-icon">
                  <Calendar size={64} strokeWidth={1} color="#64748b" />
                </div>
                <h3 className="empty-state-title">No events found</h3>
                <p className="empty-state-message">
                  {searchTerm ? 
                    "No approved events match your search criteria. Try a different search term." : 
                    activeTab === 'current' ?
                      "There are no events happening today. Check back later!" :
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
