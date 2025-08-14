import { useState } from 'react';
import { Bell, Calendar, Briefcase, AtSign, Check, Trash2, Filter } from 'lucide-react';
import './Notifications.css';

interface Notification {
  id: string;
  type: 'event' | 'job' | 'mention' | 'system';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');

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

  // Filter notifications based on active filter
  const filteredNotifications = notifications.filter(notification => {
    switch(activeFilter) {
      case 'unread':
        return !notification.isRead;
      case 'event':
        return notification.type === 'event';
      case 'job':
        return notification.type === 'job';
      default:
        return true;
    }
  });

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  // Delete notification
  const deleteNotification = (id: string) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== id)
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, isRead: true }))
    );
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
      default:
        return <Bell size={18} />;
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1 className="page-title">Notifications</h1>
        
        {notifications.length > 0 && (
          <button className="mark-all-read" onClick={markAllAsRead}>
            <Check size={16} />
            <span>Mark all as read</span>
          </button>
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
      </div>

      <div className="notifications-list">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
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
                    onClick={() => markAsRead(notification.id)}
                    title="Mark as read"
                  >
                    <Check size={16} />
                  </button>
                )}
                <button 
                  className="action-button delete-button" 
                  onClick={() => deleteNotification(notification.id)}
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