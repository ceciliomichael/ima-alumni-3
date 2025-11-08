import { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import './EventNotification.css';

interface EventNotificationData {
  id: string;
  title: string;
  date: string;
  location: string;
  timestamp: number;
}

interface EventNotificationProps {
  notification: EventNotificationData;
  onClose: (id: string) => void;
}

const EventNotification = ({ notification, onClose }: EventNotificationProps) => {
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div 
      className={`event-notification ${isVisible ? 'visible' : ''} ${isExiting ? 'exiting' : ''}`}
    >
      <div className="event-notification-content">
        <div className="event-notification-icon">
          <Calendar size={16} fill="currentColor" />
        </div>
        
        <div className="event-notification-text">
          <div className="event-notification-title">
            New Event
          </div>
          <div className="event-notification-details">
            {notification.title} on {formatDate(notification.date)} at {notification.location}
          </div>
        </div>
        
        <button 
          className="event-notification-close"
          onClick={handleClose}
          aria-label="Close notification"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default EventNotification;

