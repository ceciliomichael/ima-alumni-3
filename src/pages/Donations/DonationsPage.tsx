import { useState, useEffect } from 'react';
import { Filter, Calendar, Heart } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
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
  const [activeCategory, setActiveCategory] = useState('All Categories');
  const [totalAmount, setTotalAmount] = useState(0);
  
  useEffect(() => {
    setLoading(true);
    
    // Set up real-time listener for public donations
    const donationsRef = collection(db, 'donations');
    const q = query(
      donationsRef,
      where('isPublic', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const publicDonations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Donation[];
        
        // Sort by donation date (newest first)
        const sortedDonations = publicDonations.sort((a, b) => {
          const dateA = new Date(a.donationDate).getTime();
          const dateB = new Date(b.donationDate).getTime();
          return dateB - dateA;
        });
        
        setDonations(sortedDonations);
        setFilteredDonations(sortedDonations);
        
        // Calculate total amount
        const total = sortedDonations.reduce((acc, donation) => {
          // For simplicity, we're assuming all donations are in the same currency
          // In a real app, you would need to handle currency conversion
          return acc + donation.amount;
        }, 0);
        
        setTotalAmount(total);
      } catch (error) {
        console.error('Error processing donations:', error);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Realtime donations listener error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  // Filter donations when category changes
  useEffect(() => {
    let results = donations;
    
    // Apply category filter
    if (activeCategory !== 'All Categories') {
      results = results.filter(donation => donation.category === activeCategory);
    }
    
    setFilteredDonations(results);
  }, [activeCategory, donations]);
  
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
                <span className="peso-icon" style={{ fontSize: '24px' }}>₱</span>
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
                      <div className="donation-donor-name">
                        {donation.isAnonymous ? 'Anonymous Donor' : donation.donorName}
                      </div>
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
                <span className="peso-icon" style={{ fontSize: '64px', color: '#64748b', fontWeight: '100' }}>₱</span>
              </div>
              <h3 className="empty-state-title">No donations found</h3>
              <p className="empty-state-message">
                {activeCategory !== 'All Categories' ? 
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