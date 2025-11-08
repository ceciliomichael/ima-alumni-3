import { useState, useEffect } from 'react';
import { Bell, Calendar, Briefcase, AtSign, Check, Trash2, Heart, X } from 'lucide-react';
import './Notifications.css';
import { subscribeToNotifications, markNotificationAsRead, deleteNotification as deleteNotificationFromDB, markAllNotificationsAsRead, clearAllNotifications, validateAndCleanupNotifications } from '../../services/firebase/notificationService';

interface Notification {
  id: string;
  type: 'event' | 'job' | 'mention' | 'system' | 'donation';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Format date helper
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  // Set up real-time listener for notifications
  useEffect(() => {
    setLoading(true);
    
    // Clean up orphaned notifications on page load
    validateAndCleanupNotifications().catch((error) => {
      console.error('Error cleaning up notifications:', error);
    });
    
    const unsubscribe = subscribeToNotifications((fetchedNotifications) => {
      setNotifications(fetchedNotifications);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter notifications based on active filter
  const filteredNotifications = notifications.filter(notification => {
    switch(activeFilter) {
      case 'unread':
        return !notification.isRead;
      case 'event':
        return notification.type === 'event';
      case 'job':
        return notification.type === 'job';
      case 'donation':
        return notification.type === 'donation';
      default:
        return true;
    }
  });

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      await deleteNotificationFromDB(id);
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification.id !== id)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      // The real-time listener will automatically update the UI
      console.log('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Clear all notifications
  const clearAllNotifs = async () => {
    try {
      await clearAllNotifications();
      // The real-time listener will automatically update the UI
      console.log('All notifications cleared');
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'event':
        return <Calendar size={18} />;
      case 'job':
        return <Briefcase size={18} />;
      case 'mention':
        return <AtSign size={18} />;
      case 'donation':
        return <Heart size={18} />;
      default:
        return <Bell size={18} />;
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1 className="page-title">Notifications</h1>
        
        {notifications.length > 0 && (
          <div className="notifications-actions">
            <button className="mark-all-read" onClick={markAllAsRead}>
              <Check size={16} />
              <span>Mark all as read</span>
            </button>
            <button className="clear-all-notifications" onClick={clearAllNotifs}>
              <X size={16} />
              <span>Clear notifications</span>
            </button>
          </div>
        )}
      </div>

      <div className="notifications-filters">
        <button 
          className={`filter-button ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All
        </button>
        <button 
          className={`filter-button ${activeFilter === 'unread' ? 'active' : ''}`}
          onClick={() => setActiveFilter('unread')}
        >
          Unread
        </button>
        <button 
          className={`filter-button ${activeFilter === 'event' ? 'active' : ''}`}
          onClick={() => setActiveFilter('event')}
        >
          Events
        </button>
        <button 
          className={`filter-button ${activeFilter === 'job' ? 'active' : ''}`}
          onClick={() => setActiveFilter('job')}
        >
          Jobs
        </button>
        <button 
          className={`filter-button ${activeFilter === 'donation' ? 'active' : ''}`}
          onClick={() => setActiveFilter('donation')}
        >
          Donations
        </button>
      </div>

      <div className="notifications-list">
        {loading ? (
          <div className="empty-notifications">
            <div className="empty-icon">
              <Bell size={64} />
            </div>
            <h3>Loading notifications...</h3>
            <p>Please wait while we fetch your notifications.</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
              onClick={() => !notification.isRead && markAsRead(notification.id)}
            >
              <div className={`notification-icon ${notification.type}`}>
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="notification-content">
                <h3 className="notification-title">{notification.title}</h3>
                <p className="notification-message">{notification.message}</p>
                <span className="notification-time">{formatDate(notification.createdAt)}</span>
              </div>
              
              <div className="notification-actions">
                {!notification.isRead && (
                  <button 
                    className="action-button read-button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                    title="Mark as read"
                  >
                    <Check size={16} />
                  </button>
                )}
                <button 
                  className="action-button delete-button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  title="Delete notification"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-notifications">
            <div className="empty-icon">
              <Bell size={64} />
            </div>
            <h3>No notifications</h3>
            <p>You're all caught up! New notifications will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage; 