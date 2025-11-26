import { useState, useEffect } from 'react';
import { ArrowRight, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { Donation } from '../../../../types';
import { getCurrentDisplayGoal } from '../../../../services/firebase/donationGoalService';
import './DonationProgressCard.css';

const DEFAULT_GOAL_AMOUNT = 1000000; // Default fallback: ₱1,000,000

const DonationProgressCard = () => {
  const [totalRaised, setTotalRaised] = useState(0);
  const [loading, setLoading] = useState(true);
  const [donationCount, setDonationCount] = useState(0);
  const [goalAmount, setGoalAmount] = useState(DEFAULT_GOAL_AMOUNT);
  const [goalLabel, setGoalLabel] = useState('goal');

  // Fetch the active donation goal
  useEffect(() => {
    const fetchGoal = async () => {
      try {
        const activeGoal = await getCurrentDisplayGoal();
        if (activeGoal) {
          setGoalAmount(activeGoal.amount);
          // Set label based on goal type
          if (activeGoal.goalType === 'monthly') {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthLabel = monthNames[(activeGoal.month || 1) - 1];
            setGoalLabel(`${monthLabel} ${activeGoal.year} goal`);
          } else {
            setGoalLabel(`${activeGoal.year} goal`);
          }
        }
      } catch (error) {
        console.error('Error fetching donation goal:', error);
        // Keep default values on error
      }
    };

    fetchGoal();
  }, []);

  // Fetch donations
  useEffect(() => {
    setLoading(true);
    
    // Set up real-time listener for public donations (no orderBy to avoid composite index)
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
        
        // Calculate total raised (assuming all donations are in PHP)
        const total = donations.reduce((acc, donation) => {
          return acc + donation.amount;
        }, 0);
        
        setTotalRaised(total);
        setDonationCount(donations.length);
      } catch (error) {
        console.error('Error processing donations:', error);
        setTotalRaised(0);
        setDonationCount(0);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Realtime donations listener error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Calculate progress percentage
  const progressPercentage = goalAmount > 0 ? Math.min((totalRaised / goalAmount) * 100, 100) : 0;

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
                <span className="goal-text">of {formatLargeNumber(goalAmount)} {goalLabel}</span>
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
