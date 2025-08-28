import { useState, useEffect } from 'react';
import { Heart, X } from 'lucide-react';
import './DonationNotification.css';

interface DonationNotificationData {
  id: string;
  donorName: string;
  amount: number;
  currency: string;
  isAnonymous?: boolean;
  timestamp: number;
}

interface DonationNotificationProps {
  notification: DonationNotificationData;
  onClose: (id: string) => void;
}

const DonationNotification = ({ notification, onClose }: DonationNotificationProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const entranceTimer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Auto-dismiss after 10 seconds
    const dismissTimer = setTimeout(() => {
      handleClose();
    }, 10000);

    return () => {
      clearTimeout(entranceTimer);
      clearTimeout(dismissTimer);
    };
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(notification.id);
    }, 300); // Match CSS animation duration
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'PHP') {
      return `₱${amount.toLocaleString()}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const displayName = notification.isAnonymous ? 'Anonymous Donor' : notification.donorName;

  return (
    <div 
      className={`donation-notification ${isVisible ? 'visible' : ''} ${isExiting ? 'exiting' : ''}`}
    >
      <div className="donation-notification-content">
        <div className="donation-notification-icon">
          <Heart size={16} fill="currentColor" />
        </div>
        
        <div className="donation-notification-text">
          <div className="donation-notification-donor">
            {displayName}
          </div>
          <div className="donation-notification-amount">
            donated {formatCurrency(notification.amount, notification.currency)}
          </div>
        </div>
        
        <button 
          className="donation-notification-close"
          onClick={handleClose}
          aria-label="Close notification"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default DonationNotification;
