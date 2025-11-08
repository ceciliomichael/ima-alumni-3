import { useState, useEffect } from 'react';
import { Briefcase, X } from 'lucide-react';
import './JobNotification.css';

interface JobNotificationData {
  id: string;
  title: string;
  company: string;
  timestamp: number;
}

interface JobNotificationProps {
  notification: JobNotificationData;
  onClose: (id: string) => void;
}

const JobNotification = ({ notification, onClose }: JobNotificationProps) => {
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

  return (
    <div 
      className={`job-notification ${isVisible ? 'visible' : ''} ${isExiting ? 'exiting' : ''}`}
    >
      <div className="job-notification-content">
        <div className="job-notification-icon">
          <Briefcase size={16} fill="currentColor" />
        </div>
        
        <div className="job-notification-text">
          <div className="job-notification-title">
            New Job Posting
          </div>
          <div className="job-notification-details">
            {notification.company} is hiring for {notification.title}
          </div>
        </div>
        
        <button 
          className="job-notification-close"
          onClick={handleClose}
          aria-label="Close notification"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default JobNotification;

