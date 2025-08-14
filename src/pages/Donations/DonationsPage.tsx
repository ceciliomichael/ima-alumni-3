import { useState, useEffect } from 'react';
import { DollarSign, Filter, Calendar, Search, Heart } from 'lucide-react';
import { getPublicDonations } from '../../services/firebase/donationService';
import { Donation } from '../../types';
import './Donations.css';

// Define donation categories
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

const DonationsPage = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Categories');
  const [totalAmount, setTotalAmount] = useState(0);
  
  useEffect(() => {
    const fetchDonations = async () => {
      setLoading(true);
      try {
        const publicDonations = await getPublicDonations();
        setDonations(publicDonations);
        setFilteredDonations(publicDonations);
        
        // Calculate total amount
        const total = publicDonations.reduce((acc, donation) => {
          // For simplicity, we're assuming all donations are in the same currency
          // In a real app, you would need to handle currency conversion
          return acc + donation.amount;
        }, 0);
        
        setTotalAmount(total);
      } catch (error) {
        console.error('Error fetching donations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDonations();
  }, []);
  
  // Filter donations when search term or category changes
  useEffect(() => {
    let results = donations;
    
    // Apply search filter
    if (searchTerm) {
      const lowerCaseQuery = searchTerm.toLowerCase();
      results = results.filter(donation => 
        donation.purpose.toLowerCase().includes(lowerCaseQuery) ||
        donation.donorName.toLowerCase().includes(lowerCaseQuery) ||
        donation.category.toLowerCase().includes(lowerCaseQuery) ||
        (donation.description && donation.description.toLowerCase().includes(lowerCaseQuery))
      );
    }
    
    // Apply category filter
    if (activeCategory !== 'All Categories') {
      results = results.filter(donation => donation.category === activeCategory);
    }
    
    setFilteredDonations(results);
  }, [searchTerm, activeCategory, donations]);
  
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
  
  return (
    <div className="donations-page">
      <div className="donations-layout">
        <div className="donations-content">
          <div className="donations-header">
            <div className="donations-title-section">
              <div className="donations-icon">
                <DollarSign size={24} />
              </div>
              <h1>Donations</h1>
            </div>
          </div>
          
          <div className="donations-stats">
            <div className="donations-stat">
              <div className="donations-stat-label">Total Amount Raised</div>
              <div className="donations-stat-value">
                {formatCurrency(totalAmount, 'PHP')}
              </div>
              <div className="donations-stat-description">
                Thank you to all our generous donors for their support!
              </div>
            </div>
          </div>
          
          <div className="donations-controls">
            <div className="donations-search">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search donations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="donations-filters">
              {DONATION_CATEGORIES.map((category, index) => (
                <button 
                  key={index} 
                  className={`donation-filter ${activeCategory === category ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          {loading ? (
            <div className="loading-donations">
              <div className="donations-skeleton-grid">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="donations-skeleton-item"></div>
                ))}
              </div>
            </div>
          ) : filteredDonations.length > 0 ? (
            <div className="donations-grid">
              {filteredDonations.map(donation => (
                <div key={donation.id} className="donation-card">
                  <div className="donation-card-header">
                    <div className="donation-category">{donation.category}</div>
                    <div className="donation-amount">{formatCurrency(donation.amount, donation.currency)}</div>
                  </div>
                  
                  <div className="donation-card-content">
                    <h3 className="donation-title">{donation.purpose}</h3>
                    {donation.description && (
                      <p className="donation-description">{donation.description}</p>
                    )}
                  </div>
                  
                  <div className="donation-card-footer">
                    <div className="donation-donor">
                      <div className="donation-donor-icon">
                        <Heart size={16} />
                      </div>
                      <div className="donation-donor-name">{donation.donorName}</div>
                    </div>
                    
                    <div className="donation-date">
                      <Calendar size={14} />
                      <span>{formatDate(donation.donationDate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-donations">
              <div className="empty-state-icon">
                <DollarSign size={64} strokeWidth={1} color="#64748b" />
              </div>
              <h3 className="empty-state-title">No donations found</h3>
              <p className="empty-state-message">
                {searchTerm ? 
                  "No donations match your search criteria. Try a different search term." : 
                  activeCategory !== 'All Categories' ? 
                    `There are no donations in the ${activeCategory} category yet.` : 
                    "There are no donations yet. Check back later!"
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonationsPage; 