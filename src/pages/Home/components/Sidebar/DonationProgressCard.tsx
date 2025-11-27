import { useState, useEffect } from 'react';
import { ArrowRight, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { Donation, DonationGoal } from '../../../../types';
import { getActiveGoalByType } from '../../../../services/firebase/donationGoalService';
import './DonationProgressCard.css';

const DonationProgressCard = () => {
  const [loading, setLoading] = useState(true);
  const [donationCount, setDonationCount] = useState(0);
  
  // Monthly goal state
  const [monthlyGoal, setMonthlyGoal] = useState<DonationGoal | null>(null);
  const [monthlyRaised, setMonthlyRaised] = useState(0);
  
  // Yearly goal state
  const [yearlyGoal, setYearlyGoal] = useState<DonationGoal | null>(null);
  const [yearlyRaised, setYearlyRaised] = useState(0);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Fetch active monthly and yearly goals
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const [monthly, yearly] = await Promise.all([
          getActiveGoalByType('monthly'),
          getActiveGoalByType('yearly')
        ]);
        setMonthlyGoal(monthly);
        setYearlyGoal(yearly);
      } catch (error) {
        console.error('Error fetching donation goals:', error);
      }
    };

    fetchGoals();
  }, []);

  // Fetch donations and calculate monthly/yearly totals
  useEffect(() => {
    setLoading(true);
    
    const donationsRef = collection(db, 'donations');
    const q = query(
      donationsRef,
      where('isPublic', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const donations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Donation[];
        
        // Calculate monthly raised (donations in current month)
        const monthlyTotal = donations.reduce((acc, donation) => {
          const donationDate = new Date(donation.donationDate);
          if (donationDate.getFullYear() === currentYear && 
              donationDate.getMonth() + 1 === currentMonth) {
            return acc + donation.amount;
          }
          return acc;
        }, 0);
        
        // Calculate yearly raised (donations in current year)
        const yearlyTotal = donations.reduce((acc, donation) => {
          const donationDate = new Date(donation.donationDate);
          if (donationDate.getFullYear() === currentYear) {
            return acc + donation.amount;
          }
          return acc;
        }, 0);
        
        setMonthlyRaised(monthlyTotal);
        setYearlyRaised(yearlyTotal);
        setDonationCount(donations.length);
      } catch (error) {
        console.error('Error processing donations:', error);
        setMonthlyRaised(0);
        setYearlyRaised(0);
        setDonationCount(0);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Realtime donations listener error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentYear, currentMonth]);

  // Calculate progress percentages
  const monthlyPercentage = monthlyGoal && monthlyGoal.amount > 0 
    ? Math.min((monthlyRaised / monthlyGoal.amount) * 100, 100) 
    : 0;
  const yearlyPercentage = yearlyGoal && yearlyGoal.amount > 0 
    ? Math.min((yearlyRaised / yearlyGoal.amount) * 100, 100) 
    : 0;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
            {/* Monthly Goal Section */}
            {monthlyGoal && (
              <div className="donation-goal-section">
                <div className="goal-header">
                  <span className="goal-type-label">{monthNames[(monthlyGoal.month || 1) - 1]} {monthlyGoal.year} Goal</span>
                </div>
                <div className="donation-amounts">
                  <div className="amount-raised">
                    <span className="amount-value">{formatLargeNumber(monthlyRaised)}</span>
                    <span className="amount-label">raised</span>
                  </div>
                  <div className="amount-goal">
                    <span className="goal-text">of {formatLargeNumber(monthlyGoal.amount)}</span>
                  </div>
                </div>
                <div className="progress-section">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill monthly" 
                      style={{ width: `${monthlyPercentage}%` }}
                    ></div>
                  </div>
                  <div className="progress-stats">
                    <span className="progress-percentage">{monthlyPercentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Yearly Goal Section */}
            {yearlyGoal && (
              <div className="donation-goal-section">
                <div className="goal-header">
                  <span className="goal-type-label">{yearlyGoal.year} Yearly Goal</span>
                </div>
                <div className="donation-amounts">
                  <div className="amount-raised">
                    <span className="amount-value">{formatLargeNumber(yearlyRaised)}</span>
                    <span className="amount-label">raised</span>
                  </div>
                  <div className="amount-goal">
                    <span className="goal-text">of {formatLargeNumber(yearlyGoal.amount)}</span>
                  </div>
                </div>
                <div className="progress-section">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill yearly" 
                      style={{ width: `${yearlyPercentage}%` }}
                    ></div>
                  </div>
                  <div className="progress-stats">
                    <span className="progress-percentage">{yearlyPercentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Show message if no goals are set */}
            {!monthlyGoal && !yearlyGoal && (
              <div className="donation-amounts">
                <div className="amount-raised">
                  <span className="amount-value">{formatLargeNumber(yearlyRaised)}</span>
                  <span className="amount-label">raised this year</span>
                </div>
              </div>
            )}

            <div className="progress-stats donation-total-stats">
              <span className="donation-count">{donationCount} total donors</span>
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
