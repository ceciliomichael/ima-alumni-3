import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash, 
  DollarSign, 
  Filter, 
  Eye, 
  EyeOff, 
  Calendar 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllDonations, deleteDonation, toggleDonationVisibility } from '../../../../services/firebase/donationService';
import { Donation } from '../../../../types';
import AdminLayout from '../../layout/AdminLayout';
import './Donations.css';

// Donation categories
const DONATION_CATEGORIES = [
  'All Categories',
  'Scholarship Fund',
  'Building Fund',
  'Equipment Fund',
  'Library Fund',
  'General Operations',
  'Special Projects',
  'Other'
];

const DonationsManagement = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDonations = async () => {
      setLoading(true);
      try {
        await loadDonationsData();
      } catch (error) {
        console.error('Error fetching donations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDonations();
  }, []);

  const loadDonationsData = async () => {
    try {
      setLoading(true);
      let allDonations = await getAllDonations();
      
      // Apply category filter
      if (categoryFilter !== 'All Categories') {
        allDonations = allDonations.filter(donation => 
          donation.category === categoryFilter
        );
      }
      
      // Apply visibility filter
      if (visibilityFilter !== 'all') {
        const isPublic = visibilityFilter === 'public';
        allDonations = allDonations.filter(donation => 
          donation.isPublic === isPublic
        );
      }
      
      setDonations(allDonations);
    } catch (error) {
      console.error('Error loading donations data:', error);
      setDonations([]);
    } finally {
      setLoading(false);
    }
  };

  // Reload data when filters change
  useEffect(() => {
    if (!loading) {
      loadDonationsData();
    }
  }, [categoryFilter, visibilityFilter]);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  // Apply search filter
  useEffect(() => {
    if (searchQuery.trim()) {
      const fetchSearchResults = async () => {
        try {
          setLoading(true);
          const allDonations = await getAllDonations();
          const lowerCaseQuery = searchQuery.toLowerCase();
          
          const results = allDonations.filter(donation => 
            donation.donorName.toLowerCase().includes(lowerCaseQuery) ||
            donation.purpose.toLowerCase().includes(lowerCaseQuery) ||
            (donation.description && donation.description.toLowerCase().includes(lowerCaseQuery))
          );
          
          setDonations(results);
        } catch (error) {
          console.error('Error searching donations:', error);
          setDonations([]);
        } finally {
          setLoading(false);
        }
      };
      
      fetchSearchResults();
    } else if (!loading) {
      loadDonationsData();
    }
  }, [searchQuery]);

  // Delete donation
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this donation?')) {
      try {
        setLoading(true);
        await deleteDonation(id);
        await loadDonationsData();
      } catch (error) {
        console.error('Error deleting donation:', error);
        alert('Failed to delete donation. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Toggle donation visibility
  const handleToggleVisibility = async (id: string, currentVisibility: boolean) => {
    try {
      setLoading(true);
      await toggleDonationVisibility(id, !currentVisibility);
      await loadDonationsData();
    } catch (error) {
      console.error('Error toggling donation visibility:', error);
      alert('Failed to update donation visibility. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Add new donation
  const handleAddDonation = () => {
    navigate('/admin/donations/add');
  };

  // Edit donation
  const handleEditDonation = (id: string) => {
    navigate(`/admin/donations/edit/${id}`);
  };

  return (
    <AdminLayout title="Donations Management">
      <div className="admin-toolbar">
        <div className="admin-search">
          <Search className="admin-search-icon" size={20} />
          <input
            type="text"
            placeholder="Search donations..."
            className="admin-search-input"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        
        <div className="admin-filters">
          {/* Category filter */}
          <div className="admin-filter-group">
            <Filter size={14} className="admin-filter-icon" />
            <select 
              className="admin-filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
            >
              {DONATION_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          {/* Visibility filter */}
          <div className="admin-filter-group">
            <Eye size={14} className="admin-filter-icon" />
            <select 
              className="admin-filter-select"
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value as 'all' | 'public' | 'private')}
              aria-label="Filter by visibility"
            >
              <option value="all">All Visibility</option>
              <option value="public">Public Only</option>
              <option value="private">Private Only</option>
            </select>
          </div>
        </div>
        
        <button 
          className="admin-add-btn"
          onClick={handleAddDonation}
        >
          <Plus size={20} />
          Add Donation
        </button>
      </div>
      
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Donations</h2>
          <div>{donations.length} Donations Found</div>
        </div>
        
        {loading ? (
          <div className="admin-loading">Loading donations...</div>
        ) : (
          <div className={donations.length > 0 ? "admin-donations-grid" : "admin-donations-empty-container"}>
            {donations.length > 0 ? (
              donations.map(donation => (
                <div key={donation.id} className="admin-donation-card">
                  <div className="admin-donation-content">
                    <div className="admin-donation-header">
                      <h3 className="admin-donation-title" title={donation.purpose}>
                        {donation.purpose}
                      </h3>
                      <div className="admin-donation-amount">
                        {formatCurrency(donation.amount, donation.currency)}
                      </div>
                    </div>
                    
                    <div className="admin-donation-meta">
                      <span className="admin-donation-category">
                        {donation.category}
                      </span>
                      <span className="admin-donation-date">
                        <Calendar size={14} />
                        {formatDate(donation.donationDate)}
                      </span>
                    </div>
                    
                    <div className="admin-donation-donor">
                      <strong>Donor:</strong> {donation.donorName}
                    </div>
                    
                    {donation.description && (
                      <p className="admin-donation-description" title={donation.description}>
                        {donation.description}
                      </p>
                    )}
                    
                    <div className="admin-donation-footer">
                      <div className={`admin-donation-badge ${donation.isPublic ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                        {donation.isPublic ? 'Public' : 'Private'}
                      </div>
                      
                      <div className="admin-donation-actions">
                        <button 
                          className="admin-action-btn admin-action-visibility"
                          onClick={() => handleToggleVisibility(donation.id, donation.isPublic)}
                          title={donation.isPublic ? "Make Private" : "Make Public"}
                        >
                          {donation.isPublic ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button 
                          className="admin-action-btn admin-action-edit"
                          onClick={() => handleEditDonation(donation.id)}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="admin-action-btn admin-action-delete"
                          onClick={() => handleDelete(donation.id)}
                          title="Delete"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="admin-empty-state">
                <DollarSign size={48} />
                <h3>No donations found</h3>
                <p>There are no donations matching your current filters.</p>
                <button 
                  className="admin-btn-primary" 
                  onClick={handleAddDonation}
                >
                  Add First Donation
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default DonationsManagement; 