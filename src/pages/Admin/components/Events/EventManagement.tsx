import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  getAllEvents, 
  searchEvents, 
  deleteEvent, 
  approveEvent,
  getUpcomingEvents,
  getPastEvents,
  Event
} from '../../../../services/firebase/eventService';
import AdminLayout from '../../layout/AdminLayout';
import './Events.css';

const EventManagement = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load events data
    loadEventsData();
  }, []);

  const loadEventsData = async () => {
    setLoading(true);
    try {
      let filteredEvents: Event[] = [];
      
      // Apply time filter
      if (filter === 'upcoming') {
        filteredEvents = await getUpcomingEvents();
      } else if (filter === 'past') {
        filteredEvents = await getPastEvents();
      } else {
        filteredEvents = await getAllEvents();
      }
      
      // Apply approval filter
      if (approvalFilter !== 'all') {
        const isApproved = approvalFilter === 'approved';
        filteredEvents = filteredEvents.filter(event => event.isApproved === isApproved);
      }
      
      setEvents(filteredEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      loadEventsData();
    }
  }, [filter, approvalFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    // Loading is handled by the useEffect with searchQuery dependency
  };

  useEffect(() => {
    // Apply search filter
    if (searchQuery.trim()) {
      const fetchSearchResults = async () => {
        try {
          setLoading(true);
          const results = await searchEvents(searchQuery);
          setEvents(results);
        } catch (error) {
          console.error('Error searching events:', error);
          setEvents([]);
        } finally {
          setLoading(false);
        }
      };
      
      fetchSearchResults();
    } else if (!loading) {
      loadEventsData();
    }
  }, [searchQuery]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        setLoading(true);
        await deleteEvent(id);
        await loadEventsData();
      } catch (error) {
        console.error('Error deleting event:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleApprove = async (id: string, approve: boolean) => {
    try {
      setLoading(true);
      await approveEvent(id, approve);
      await loadEventsData();
    } catch (error) {
      console.error('Error updating event approval status:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = (dateString: string) => {
    const eventDate = new Date(dateString);
    return eventDate >= new Date();
  };

  return (
    <AdminLayout title="Event Management">
      <div className="admin-toolbar">
        <div className="admin-search">
          <Search className="admin-search-icon" size={20} />
          <input
            type="text"
            placeholder="Search events..."
            className="admin-search-input"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        
        <div className="admin-filters">
          <select 
            className="admin-filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'upcoming' | 'past')}
          >
            <option value="all">All Events</option>
            <option value="upcoming">Upcoming Events</option>
            <option value="past">Past Events</option>
          </select>
          
          <select 
            className="admin-filter-select"
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value as 'all' | 'approved' | 'pending')}
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        
        <button 
          className="admin-add-btn"
          onClick={() => navigate('/admin/events/add')}
        >
          <Plus size={20} />
          Add Event
        </button>
      </div>
      
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Events List</h2>
          <div>{events.length} Events Found</div>
        </div>
        
        {loading ? (
          <div className="admin-loading">Loading events...</div>
        ) : (
        <div className="admin-events-grid">
          {events.length > 0 ? (
            events.map(event => (
              <div key={event.id} className="admin-event-card">
                <div className="admin-event-image">
                  {event.coverImage ? (
                    <img src={event.coverImage} alt={event.title} />
                  ) : (
                    <div className="admin-event-image-placeholder">
                      <Calendar size={40} />
                    </div>
                  )}
                  <div className={`admin-event-badge ${isUpcoming(event.date) ? 'admin-badge-success' : 'admin-badge-secondary'}`}>
                    {isUpcoming(event.date) ? 'Upcoming' : 'Past'}
                  </div>
                  <div className={`admin-event-badge admin-event-approval-badge ${event.isApproved ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                    {event.isApproved ? 'Approved' : 'Pending'}
                  </div>
                </div>
                
                <div className="admin-event-content">
                  <h3 className="admin-event-title">{event.title}</h3>
                  
                  <div className="admin-event-details">
                    <div className="admin-event-date">
                      <Calendar size={16} />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="admin-event-location">
                      <span>{event.location}</span>
                    </div>
                  </div>
                  
                  <p className="admin-event-description">
                    {event.description.length > 120 
                      ? `${event.description.substring(0, 120)}...` 
                      : event.description}
                  </p>
                  
                  <div className="admin-event-actions">
                    {!event.isApproved && (
                      <button 
                        className="admin-action-btn admin-action-approve"
                        onClick={() => handleApprove(event.id, true)}
                        title="Approve"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    {event.isApproved && (
                      <button 
                        className="admin-action-btn admin-action-reject"
                        onClick={() => handleApprove(event.id, false)}
                        title="Unapprove"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                    <button 
                      className="admin-action-btn admin-action-edit"
                      onClick={() => navigate(`/admin/events/edit/${event.id}`)}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="admin-action-btn admin-action-delete"
                      onClick={() => handleDelete(event.id)}
                      title="Delete"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="admin-empty-state">
              <Calendar size={48} />
              <h3>No events found</h3>
              <p>There are no events matching your search criteria.</p>
              <button 
                className="admin-btn-primary"
                onClick={() => navigate('/admin/events/add')}
              >
                Add New Event
              </button>
            </div>
          )}
        </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default EventManagement;
