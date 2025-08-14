import { useState, useEffect } from 'react';
import { Trash2, Mail, Eye, Check, Search, MessageSquare, RefreshCw, ArrowDown, ArrowUp } from 'lucide-react';
import { 
  getAllContactMessages, 
  markMessageAsRead, 
  deleteContactMessage, 
  ContactMessage 
} from '../../services/localStorage/contactService';
import AdminLayout from '../../layout/AdminLayout';
import './ContactMessages.css';

const ContactMessages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'read' | 'unread'>('all');

  // Load messages on mount or when search/filters change
  useEffect(() => {
    loadMessages();
    
    // Add event listener for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [sortDirection, filterStatus, searchTerm]);

  // Handler for storage changes
  const handleStorageChange = () => {
    loadMessages();
  };

  // Load messages from localStorage
  const loadMessages = () => {
    setLoading(true);
    const allMessages = getAllContactMessages();
    
    // Apply read/unread filter
    let filteredMessages = allMessages;
    if (filterStatus === 'read') {
      filteredMessages = allMessages.filter(message => message.isRead);
    } else if (filterStatus === 'unread') {
      filteredMessages = allMessages.filter(message => !message.isRead);
    }
    
    // Sort by date
    const sortedMessages = filteredMessages.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
    });
    
    // Apply search filter
    const searchFiltered = sortedMessages.filter(message => 
      searchTerm === '' || 
      message.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      message.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
      message.message.toLowerCase().includes(searchTerm.toLowerCase())
    );
      
    setMessages(searchFiltered);
    setLoading(false);
  };

  // View a message
  const handleViewMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    
    // Mark as read if it isn't already
    if (!message.isRead) {
      markMessageAsRead(message.id);
      loadMessages(); // Refresh the list
    }
  };

  // Delete a message
  const handleDeleteMessage = (id: string) => {
    if (confirmDelete === id) {
      deleteContactMessage(id);
      loadMessages();
      setConfirmDelete(null);
      
      // If the deleted message is currently selected, clear the selection
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(null);
      }
    } else {
      setConfirmDelete(id);
      
      // Auto-clear after 3 seconds
      setTimeout(() => {
        setConfirmDelete(null);
      }, 3000);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get unread count
  const getUnreadCount = () => {
    return messages.filter(message => !message.isRead).length;
  };

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  return (
    <AdminLayout title="Contact Messages">
      <div className="admin-container">
        <div className="contact-messages-header">
          <div className="contact-messages-title">
            <div className="contact-messages-icon">
              <MessageSquare size={20} />
            </div>
            <h2>Contact Messages</h2>
            {getUnreadCount() > 0 && (
              <span className="unread-badge">{getUnreadCount()} unread</span>
            )}
          </div>
          
          <div className="contact-messages-actions">
            <button className="refresh-btn" onClick={loadMessages} title="Refresh messages">
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="contact-toolbar">
          <div className="contact-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="contact-search-input"
            />
          </div>
          
          <div className="contact-filters">
            <div className="filter-group">
              <select 
                className="filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'read' | 'unread')}
              >
                <option value="all">All Messages</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>
            </div>
            
            <button 
              className="sort-btn" 
              onClick={toggleSortDirection}
              title={sortDirection === 'desc' ? 'Showing newest first' : 'Showing oldest first'}
            >
              {sortDirection === 'desc' ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
              <span>Date</span>
            </button>
          </div>
        </div>

        <div className="contact-messages-content">
          <div className="contact-messages-list">
            {loading ? (
              <div className="contact-messages-loading">
                <RefreshCw size={24} className="loading-icon" />
                <p>Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="contact-messages-empty">
                <Mail size={48} />
                <h3>No messages found</h3>
                <p>
                  {searchTerm 
                    ? "Try adjusting your search term or filter settings" 
                    : "When visitors send messages through the contact form, they will appear here."}
                </p>
              </div>
            ) : (
              <div className="message-list">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`message-item ${message.isRead ? 'read' : 'unread'} ${selectedMessage?.id === message.id ? 'selected' : ''}`}
                    onClick={() => handleViewMessage(message)}
                  >
                    <div className="message-status">
                      {!message.isRead && <div className="unread-indicator"></div>}
                    </div>
                    <div className="message-info">
                      <div className="message-sender">{message.name}</div>
                      <div className="message-subject">{message.subject}</div>
                      <div className="message-snippet">{message.message.substring(0, 70)}...</div>
                      <div className="message-date">{formatDate(message.createdAt)}</div>
                    </div>
                    <div className="message-actions">
                      <button
                        className={`delete-btn ${confirmDelete === message.id ? 'confirm' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMessage(message.id);
                        }}
                        title={confirmDelete === message.id ? "Confirm delete" : "Delete message"}
                      >
                        {confirmDelete === message.id ? <Check size={16} /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="contact-message-detail">
            {selectedMessage ? (
              <div className="message-detail">
                <div className="message-detail-header">
                  <h3>{selectedMessage.subject}</h3>
                  <div className="message-detail-meta">
                    <div className="message-detail-sender">
                      From: <strong>{selectedMessage.name}</strong> &lt;{selectedMessage.email}&gt;
                    </div>
                    <div className="message-detail-date">
                      {formatDate(selectedMessage.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="message-detail-content">
                  <p>{selectedMessage.message}</p>
                </div>
                <div className="message-detail-actions">
                  <a 
                    href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`} 
                    className="reply-btn"
                  >
                    Reply via Email
                  </a>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteMessage(selectedMessage.id)}
                  >
                    {confirmDelete === selectedMessage.id ? 'Confirm Delete' : 'Delete Message'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="no-message-selected">
                <Eye size={48} />
                <h3>Select a message to view its contents</h3>
                <p>Click on any message from the list to view its details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ContactMessages; 