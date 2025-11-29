import { useState, useEffect } from 'react';
import { Calendar, Heart, TrendingUp } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Donation } from '../../types';
import { User } from '../../types';
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

interface DonationsPageProps {
  user?: User | null;
}

const DonationsPage = ({ user }: DonationsPageProps) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All Categories');
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Check if user is authenticated
  const isAuthenticated = !!user;
  
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
      currency: currency || 'PHP',
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
  
  // Render public view for guests
  if (!isAuthenticated) {
    return (
      <div className="donations-page donations-public">
        <div className="donations-layout">
          <div className="donations-content">
            <div className="donations-header">
              <div className="donations-title-section">
                <div className="donations-icon">
                  <span className="peso-icon" style={{ fontSize: '24px' }}>₱</span>
                </div>
                <h1>Donation Progress</h1>
              </div>
              <p className="donations-subtitle">Supporting the growth and development of our alumni community</p>
            </div>
            
            <div className="donations-stats-public">
              <div className="donations-stat-card">
                <div className="stat-icon">
                  <TrendingUp size={32} />
                </div>
                <div className="stat-content">
                  <div className="donations-stat-label">Total Amount Raised</div>
                  <div className="donations-stat-value">
                    {loading ? (
                      <div className="stat-loading">Loading...</div>
                    ) : (
                      formatCurrency(totalAmount, 'PHP')
                    )}
                  </div>
                  <div className="donations-stat-description">
                    Thank you to all our generous donors for their support!
                  </div>
                </div>
              </div>
            </div>

            <div className="public-notice">
              <p>
                <strong>Privacy Notice:</strong> Individual donor information and donation details are kept private. 
                Only the total amount raised is displayed to the public.
              </p>
              <p className="login-prompt">
                Want to see more details and make a donation? <a href="/login">Login to your account</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated user view (full details)
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
          
          {/* Swipeable category filters */}
          <div className="mb-6">
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
              {DONATION_CATEGORIES.map((category, index) => (
                <button 
                  key={index} 
                  className={`flex-shrink-0 snap-start px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                    ${activeCategory === category 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
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
            <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
              {filteredDonations.map((donation) => (
                <div 
                  key={donation.id}
                  className="flex-shrink-0 snap-start w-[calc(100vw-3rem)] sm:w-80 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  {/* Donation Title (Category) */}
                  <div className="bg-primary/5 px-4 py-3 border-b border-gray-100">
                    <span className="text-sm font-semibold text-primary">{donation.category}</span>
                  </div>
                  
                  {/* Donation Amount */}
                  <div className="px-4 pt-4">
                    <div className="text-2xl font-bold text-success">
                      {formatCurrency(donation.amount, donation.currency)}
                    </div>
                  </div>
                  
                  {/* Purpose Title */}
                  <div className="px-4 pt-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {donation.purpose}
                    </h3>
                  </div>
                  
                  {/* Purpose Description */}
                  {donation.description && (
                    <div className="px-4 pt-2">
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {donation.description}
                      </p>
                    </div>
                  )}
                  
                  {/* Bottom Row: Donator name (left) | Date (right) */}
                  <div className="flex items-center justify-between px-4 py-4 mt-3 border-t border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <Heart size={16} className="text-warning" />
                      <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                        {donation.isAnonymous ? 'Anonymous' : donation.donorName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
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