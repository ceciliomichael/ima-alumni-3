import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash, 
  Filter, 
  Eye, 
  EyeOff, 
  Calendar,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllDonations, deleteDonation, toggleDonationVisibility, addDonation } from '../../../../services/firebase/donationService';
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
  const [anonymityFilter, setAnonymityFilter] = useState<'all' | 'anonymous' | 'named'>('all');
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
      
      // Apply anonymity filter
      if (anonymityFilter !== 'all') {
        const isAnonymous = anonymityFilter === 'anonymous';
        allDonations = allDonations.filter(donation => 
          (donation.isAnonymous || false) === isAnonymous
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
  }, [categoryFilter, visibilityFilter, anonymityFilter]);

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

  // Test donation function
  const handleTestDonation = async () => {
    try {
      setLoading(true);
      
      // Generate random test data
      const testDonors = [
        'John Doe', 'Maria Santos', 'Pedro Reyes', 'Ana Cruz', 'Carlos Garcia',
        'Lisa Wang', 'Miguel Torres', 'Sarah Johnson', 'David Lee', 'Grace Kim'
      ];
      const testAmounts = [1000, 2500, 5000, 7500, 10000, 15000, 20000, 25000, 50000];
      const testPurposes = [
        'Computer Lab Equipment', 'Scholarship Fund', 'Library Books', 
        'Building Renovation', 'Alumni Homecoming', 'Sports Equipment',
        'Science Laboratory', 'Student Activities', 'Faculty Development'
      ];
      const testCategories = [
        'Equipment Fund', 'Scholarship Fund', 'Library Fund', 
        'Building Fund', 'Special Projects', 'General Operations'
      ];

      const randomDonor = testDonors[Math.floor(Math.random() * testDonors.length)];
      const randomAmount = testAmounts[Math.floor(Math.random() * testAmounts.length)];
      const randomPurpose = testPurposes[Math.floor(Math.random() * testPurposes.length)];
      const randomCategory = testCategories[Math.floor(Math.random() * testCategories.length)];
      const isAnonymous = Math.random() < 0.3; // 30% chance of being anonymous

      const testDonation = {
        donorName: isAnonymous ? 'Anonymous Donor' : randomDonor,
        donorEmail: isAnonymous ? undefined : `${randomDonor.toLowerCase().replace(' ', '.')}@example.com`,
        amount: randomAmount,
        currency: 'PHP',
        purpose: randomPurpose,
        category: randomCategory,
        description: `Test donation for ${randomPurpose.toLowerCase()}. This is a simulated donation for testing purposes.`,
        isPublic: true,
        isAnonymous: isAnonymous,
        isTest: true, // Mark as test item to skip notifications
        donationDate: new Date().toISOString()
      };

      await addDonation(testDonation);
      await loadDonationsData();
      
      alert(`Test donation added successfully!\nDonor: ${testDonation.donorName}\nAmount: ₱${testDonation.amount.toLocaleString()}\nPurpose: ${testDonation.purpose}`);
    } catch (error) {
      console.error('Error adding test donation:', error);
      alert('Failed to add test donation. Please try again.');
    } finally {
      setLoading(false);
    }
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
          
          {/* Anonymity filter */}
          <div className="admin-filter-group">
            <EyeOff size={14} className="admin-filter-icon" />
            <select 
              className="admin-filter-select"
              value={anonymityFilter}
              onChange={(e) => setAnonymityFilter(e.target.value as 'all' | 'anonymous' | 'named')}
              aria-label="Filter by anonymity"
            >
              <option value="all">All Donors</option>
              <option value="anonymous">Anonymous Only</option>
              <option value="named">Named Only</option>
            </select>
          </div>
        </div>
        
        <button 
          className="admin-add-btn admin-test-btn"
          onClick={handleTestDonation}
          title="Add a random test donation for testing notifications"
        >
          <Zap size={20} />
          Test Donate
        </button>
        
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
                      {donation.isAnonymous && (
                        <span className="admin-anonymous-badge">Anonymous</span>
                      )}
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
                <span className="peso-icon" style={{ fontSize: '48px', color: '#64748b' }}>₱</span>
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