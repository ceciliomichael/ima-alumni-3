import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash, Image, CheckCircle, XCircle, Filter, Calendar, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  getAllGalleryItems, 
  searchGalleryItems, 
  deleteGalleryItem, 
  approveGalleryItem
} from '../../../../services/firebase/galleryService';
import { GalleryPost } from '../../../../types';
import { getAllEvents, Event } from '../../../../services/firebase/eventService';
import AdminLayout from '../../layout/AdminLayout';
import './Gallery.css';

// Define album categories to match the user-facing gallery
const EVENT_CATEGORIES = [
  'All Categories',
  'Homecoming',
  'Batch Reunions', 
  'Career Events',
  'Awards',
  'Community Service'
];

const GalleryManagement = () => {
  const [galleryItems, setGalleryItems] = useState<GalleryPost[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Load gallery data
        await loadGalleryData();
        
        // Load events for filtering
        const eventsData = await getAllEvents();
        setEvents(eventsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const loadGalleryData = async () => {
    try {
      setLoading(true);
      let filteredItems = await getAllGalleryItems();
      
      // Apply specific event filter (uses item.event)
      if (eventFilter !== 'all') {
        filteredItems = filteredItems.filter(item => item.event === eventFilter);
      }
      
      // Apply category filter (uses item.albumCategory)
      if (categoryFilter !== 'All Categories') {
        const formattedCategory = categoryFilter.toLowerCase().replace(/\s+/g, '-');
        // Filter based on the albumCategory field
        filteredItems = filteredItems.filter(item => item.albumCategory === formattedCategory);
      }
      
      // Apply approval filter
      if (approvalFilter !== 'all') {
        const isApproved = approvalFilter === 'approved';
        filteredItems = filteredItems.filter(item => item.isApproved === isApproved);
      }
      
      setGalleryItems(filteredItems);
    } catch (error) {
      console.error('Error loading gallery data:', error);
      setGalleryItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Trigger reload when filters change
    if (!loading) {
      loadGalleryData();
    }
  }, [eventFilter, categoryFilter, approvalFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    // Loading is handled by the useEffect with searchQuery dependency
  };

  useEffect(() => {
    // Apply search filter (client-side for now, consider server-side for large datasets)
    if (searchQuery.trim()) {
      const fetchSearchResults = async () => {
        try {
          setLoading(true);
          // In a real app, searchGalleryItems would ideally hit a search index (e.g., Algolia)
          // For now, it fetches all and filters, which is inefficient at scale.
          const allItems = await getAllGalleryItems();
          const lowerCaseQuery = searchQuery.toLowerCase();
          const results = allItems.filter(item => 
            item.title.toLowerCase().includes(lowerCaseQuery) ||
            item.description.toLowerCase().includes(lowerCaseQuery)
          );
          setGalleryItems(results);
        } catch (error) {
          console.error('Error searching gallery items:', error);
          setGalleryItems([]);
        } finally {
          setLoading(false);
        }
      };
      
      fetchSearchResults();
    } else if (!loading) {
      // Reload data if search query is cleared
      loadGalleryData();
    }
  }, [searchQuery]); // Rerun search when query changes

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this gallery item?')) {
      try {
        setLoading(true);
        await deleteGalleryItem(id);
        await loadGalleryData(); // Refresh list after delete
      } catch (error) {
        console.error('Error deleting gallery item:', error);
        alert('Failed to delete item. Please try again.'); // User feedback
      } finally {
        setLoading(false);
      }
    }
  };

  const handleApprove = async (id: string, approve: boolean) => {
    try {
      setLoading(true);
      await approveGalleryItem(id, approve);
      await loadGalleryData(); // Refresh list after approval change
    } catch (error) {
      console.error('Error updating gallery item approval status:', error);
      alert('Failed to update approval status. Please try again.'); // User feedback
    } finally {
      setLoading(false);
    }
  };

  // Gets the title of a specific linked event using the item.event (Event ID)
  const getEventTitle = (eventId?: string) => {
    if (!eventId) return 'No Linked Event';
    const event = events.find(e => e.id === eventId);
    return event ? event.title : 'Unknown Event';
  };

  // Gets the display name of the category from item.albumCategory
  const getCategoryName = (categoryString?: string) => {
    if (!categoryString) return 'Uncategorized';
    
    // Convert hyphenated category string back to title case for display
    const normalizedCategory = categoryString.replace(/-/g, ' ');
    const titleCaseCategory = normalizedCategory.replace(/\b\w/g, char => char.toUpperCase());

    // Check if it's one of the known categories
    const knownCategory = EVENT_CATEGORIES.find(cat => cat.toLowerCase() === normalizedCategory.toLowerCase());
    
    return knownCategory ? titleCaseCategory : 'Uncategorized'; // Return title case or Uncategorized
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Methods to handle gallery items
  const handleViewGalleryItem = (item: GalleryPost) => {
    // Open a view modal or navigate to a view page
    // For now, we'll just alert
    alert(`Viewing: ${item.title}`);
  };
  
  const handleEditGalleryItem = (id: string) => {
    navigate(`/admin/gallery/edit/${id}`);
  };
  
  const handleDeleteGalleryItem = (id: string) => {
    handleDelete(id);
  };

  return (
    <AdminLayout title="Gallery Management">
      <div className="admin-toolbar">
        <div className="admin-search">
          <Search className="admin-search-icon" size={20} />
          <input
            type="text"
            placeholder="Search gallery..."
            className="admin-search-input"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        
        <div className="admin-filters">
          {/* Album category filter (uses item.albumCategory) */}
          <div className="admin-filter-group">
            <Filter size={14} className="admin-filter-icon" />
            <select 
              className="admin-filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
            >
              {EVENT_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          {/* Specific Event filter (uses item.event) */}
          <div className="admin-filter-group">
            <Calendar size={14} className="admin-filter-icon" />
            <select 
              className="admin-filter-select"
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              aria-label="Filter by specific event"
            >
              <option value="all">All Linked Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))}
            </select>
          </div>
          
          {/* Approval filter */}
          <div className="admin-filter-group">
            <CheckCircle size={14} className="admin-filter-icon" />
            <select 
              className="admin-filter-select"
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value as 'all' | 'approved' | 'pending')}
              aria-label="Filter by approval status"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
        
        <button 
          className="admin-add-btn"
          onClick={() => navigate('/admin/gallery/add')}
        >
          <Plus size={20} />
          Add Gallery Item
        </button>
      </div>
      
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Gallery Items</h2>
          <div>{galleryItems.length} Items Found</div>
        </div>
        
        {loading ? (
          <div className="admin-loading">Loading gallery items...</div>
        ) : (
        <div className={galleryItems.length > 0 ? "admin-gallery-grid" : "admin-gallery-empty-container"}>
          {galleryItems.length > 0 ? (
            galleryItems.map(item => (
              <div key={item.id} className="admin-gallery-card">
                <div className="admin-gallery-image">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} loading="lazy" />
                  ) : (
                    <div className="admin-gallery-image-placeholder">
                      <Image size={40} />
                    </div>
                  )}
                </div>
                
                <div className="admin-gallery-content">
                  <h3 className="admin-gallery-title" title={item.title}>{item.title}</h3>
                  
                  {/* Use item.albumCategory for category display */}
                  <div className="admin-gallery-meta">
                    <span className="admin-gallery-category">
                      {getCategoryName(item.albumCategory)} 
                    </span>
                    
                    {/* Use item.event for specific linked event display */}
                    {item.event && (
                      <span className="admin-gallery-event">
                        Linked Event: {getEventTitle(item.event)}
                      </span>
                    )}
                  </div>
                  
                  <div className="admin-gallery-date">
                    <span>Posted: {formatDate(item.postedDate)}</span>
                  </div>
                  
                  <p className="admin-gallery-description" title={item.description}>
                    {item.description}
                  </p>
                  
                  <div className="admin-gallery-footer">
                    <div className={`admin-gallery-badge ${item.isApproved ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                      {item.isApproved ? 'Approved' : 'Pending'}
                    </div>
                    
                    <div className="admin-gallery-actions">
                      {!item.isApproved && (
                        <button 
                          className="admin-action-btn admin-action-approve"
                          onClick={() => handleApprove(item.id, true)}
                          title="Approve"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {item.isApproved && (
                        <button 
                          className="admin-action-btn admin-action-reject"
                          onClick={() => handleApprove(item.id, false)}
                          title="Unapprove (Set Pending)"
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                      <button className="admin-action-btn admin-action-view" onClick={() => handleViewGalleryItem(item)}>
                        <Eye size={16} />
                      </button>
                      <button className="admin-action-btn admin-action-edit" onClick={() => handleEditGalleryItem(item.id)}>
                        <Edit size={16} />
                      </button>
                      <button className="admin-action-btn admin-action-delete" onClick={() => handleDeleteGalleryItem(item.id)}>
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="admin-empty-state">
              <Image size={48} />
              <h3>No gallery items found</h3>
              <p>There are no gallery items matching your current filters.</p>
              {/* Optional: Add a button to clear filters or add item */}
              <button 
                className="admin-btn-primary" 
                onClick={() => navigate('/admin/gallery/add')}
              >
                Add First Gallery Item
              </button>
            </div>
          )}
        </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default GalleryManagement;
