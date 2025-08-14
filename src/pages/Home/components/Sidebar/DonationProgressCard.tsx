import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, ArrowRight, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPublicDonations } from '../../../../services/firebase/donationService';
import { Donation } from '../../../../types';
import './DonationProgressCard.css';

const DonationProgressCard = () => {
  const [totalRaised, setTotalRaised] = useState(0);
  const [loading, setLoading] = useState(true);
  const [donationCount, setDonationCount] = useState(0);
  
  // Configurable goal amount (in PHP)
  const GOAL_AMOUNT = 1000000; // ₱1,000,000

  useEffect(() => {
    const fetchDonations = async () => {
      setLoading(true);
      try {
        const donations = await getPublicDonations();
        
        // Calculate total raised (assuming all donations are in PHP)
        const total = donations.reduce((acc, donation) => {
          return acc + donation.amount;
        }, 0);
        
        setTotalRaised(total);
        setDonationCount(donations.length);
      } catch (error) {
        console.error('Error fetching donations:', error);
        setTotalRaised(0);
        setDonationCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, []);

  // Calculate progress percentage
  const progressPercentage = Math.min((totalRaised / GOAL_AMOUNT) * 100, 100);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format large numbers
  const formatLargeNumber = (amount: number) => {
    if (amount >= 1000000) {
      return `₱${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `₱${(amount / 1000).toFixed(0)}K`;
    }
    return formatCurrency(amount);
  };

  return (
    <div className="donation-progress-card">
      <div className="donation-card-header">
        <div className="donation-icon">
          <Heart size={18} />
        </div>
        <h3 className="donation-card-title">Community Support</h3>
      </div>

      <div className="donation-card-content">
        {loading ? (
          <div className="donation-loading">
            <div className="donation-skeleton"></div>
            <div className="donation-skeleton short"></div>
          </div>
        ) : (
          <>
            <div className="donation-amounts">
              <div className="amount-raised">
                <span className="amount-value">{formatLargeNumber(totalRaised)}</span>
                <span className="amount-label">raised</span>
              </div>
              <div className="amount-goal">
                <span className="goal-text">of {formatLargeNumber(GOAL_AMOUNT)} goal</span>
              </div>
            </div>

            <div className="progress-section">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="progress-stats">
                <span className="progress-percentage">{progressPercentage.toFixed(1)}%</span>
                <span className="donation-count">{donationCount} donors</span>
              </div>
            </div>

            <div className="donation-description">
              <p>Together we're building a brighter future for Immaculate Mary Academy (IMA).</p>
            </div>
          </>
        )}
      </div>

      <div className="donation-card-footer">
        <Link to="/donations" className="donation-view-all">
          <span>View All Donations</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};

export default DonationProgressCard;
