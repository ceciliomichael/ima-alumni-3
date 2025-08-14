import { useEffect, useState } from 'react';
import { 
  Users, Award, Calendar, Briefcase, 
  Image, ArrowUp, ArrowDown, UserPlus,
  MessageSquare, Activity, Trash2, AlertTriangle
} from 'lucide-react';
import AdminLayout from '../../layout/AdminLayout';
import { initializeAlumniData, getAlumniStatistics } from '../../services/localStorage/alumniService';
import { initializeOfficerData } from '../../services/localStorage/officerService';
import { initializeEventData, getEventsStatistics } from '../../services/localStorage/eventService';
import { initializeJobData, getJobStatistics } from '../../services/localStorage/jobService';
import { initializeGalleryData, getGalleryStatistics } from '../../services/localStorage/galleryService';
import { getAllOfficers } from '../../services/localStorage/officerService';
import { getAllContactMessages } from '../../services/localStorage/contactService';
import ConfirmDialog from '../../../../components/ConfirmDialog';
// Import Firebase services for data deletion
import { getAllUsers, deleteUser } from '../../../../services/firebase/userService';
import { getAllPosts, deletePost } from '../../../../services/firebase/postService';
import { getAllEvents, deleteEvent } from '../../../../services/firebase/eventService';
import { getAllJobs, deleteJob } from '../../../../services/firebase/jobService';
import { getAllGalleryItems, deleteGalleryItem } from '../../../../services/firebase/galleryService';
import { getAllAlumni, deleteAlumni } from '../../../../services/firebase/alumniService';
import { getAllOfficers as getAllFirebaseOfficers, deleteOfficer } from '../../../../services/firebase/officerService';
import { getAllDonations, deleteDonation } from '../../../../services/firebase/donationService';
import { getAllContactMessages as getAllFirebaseMessages, deleteContactMessage } from '../../../../services/firebase/contactService';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalAlumni: 0,
    activeAlumni: 0,
    inactiveAlumni: 0,
    alumniByBatch: {} as Record<string, number>,
    totalOfficers: 0,
    totalEvents: 0,
    upcomingEvents: 0,
    totalJobs: 0,
    activeJobs: 0,
    totalGalleryItems: 0,
    unreadMessages: 0
  });

  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    // Initialize empty data structures if needed
    initializeAlumniData();
    initializeOfficerData();
    initializeEventData();
    initializeJobData();
    initializeGalleryData();
    
    // Get statistics from each service
    const alumniStats = getAlumniStatistics();
    const officers = getAllOfficers();
    const eventStats = getEventsStatistics();
    const jobStats = getJobStatistics();
    const galleryStats = getGalleryStatistics();
    
    // Get unread contact messages
    const messages = getAllContactMessages();
    const unreadMessages = messages.filter(msg => !msg.isRead).length;
    
    setStats({
      ...alumniStats,
      totalOfficers: officers.length,
      totalEvents: eventStats.totalEvents,
      upcomingEvents: eventStats.upcomingEvents,
      totalJobs: jobStats.totalJobs,
      activeJobs: jobStats.activeJobs,
      totalGalleryItems: galleryStats.totalItems,
      unreadMessages
    });
  };

  const handleClearAllData = async () => {
    setIsClearingData(true);
    
    try {
      console.log('Starting to clear all Firebase data...');
      
      // Delete all posts
      const posts = await getAllPosts();
      console.log(`Deleting ${posts.length} posts...`);
      for (const post of posts) {
        await deletePost(post.id);
      }
      
      // Delete all users (except those we want to preserve)
      const users = await getAllUsers();
      console.log(`Deleting ${users.length} users...`);
      for (const user of users) {
        await deleteUser(user.id);
      }
      
      // Delete all events
      const events = await getAllEvents();
      console.log(`Deleting ${events.length} events...`);
      for (const event of events) {
        await deleteEvent(event.id);
      }
      
      // Delete all jobs
      const jobs = await getAllJobs();
      console.log(`Deleting ${jobs.length} jobs...`);
      for (const job of jobs) {
        await deleteJob(job.id);
      }
      
      // Delete all gallery items
      const galleryItems = await getAllGalleryItems();
      console.log(`Deleting ${galleryItems.length} gallery items...`);
      for (const item of galleryItems) {
        await deleteGalleryItem(item.id);
      }
      
      // Delete all alumni records
      const alumni = await getAllAlumni();
      console.log(`Deleting ${alumni.length} alumni records...`);
      for (const alumnus of alumni) {
        await deleteAlumni(alumnus.id);
      }
      
      // Delete all officers
      const officers = await getAllFirebaseOfficers();
      console.log(`Deleting ${officers.length} officers...`);
      for (const officer of officers) {
        await deleteOfficer(officer.id);
      }
      
      // Delete all donations
      const donations = await getAllDonations();
      console.log(`Deleting ${donations.length} donations...`);
      for (const donation of donations) {
        await deleteDonation(donation.id);
      }
      
      // Delete all contact messages
      const messages = await getAllFirebaseMessages();
      console.log(`Deleting ${messages.length} contact messages...`);
      for (const message of messages) {
        await deleteContactMessage(message.id);
      }
      
      // Clear localStorage data (keep admin session)
      const keysToKeep = ['admin_user'];
      const allKeys = Object.keys(localStorage);
      
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      
      // Re-initialize empty data structures
      initializeAlumniData();
      initializeOfficerData();
      initializeEventData();
      initializeJobData();
      initializeGalleryData();
      
      // Reload stats to reflect cleared data
      loadStats();
      
      console.log('All data cleared successfully!');
      alert('All data has been cleared successfully from Firebase and localStorage!');
    } catch (error) {
      console.error('Error clearing data:', error);
      alert(`Error clearing data: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsClearingData(false);
      setShowClearDataDialog(false);
    }
  };

  // Get top batches by alumni count
  const topBatches = Object.entries(stats.alumniByBatch)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <AdminLayout title="Dashboard">
      {/* Statistics Cards */}
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-header">
            <div className="dashboard-stat-icon" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary-color)' }}>
              <Users size={24} />
            </div>
          </div>
          <div className="dashboard-stat-value">{stats.totalAlumni}</div>
          <div className="dashboard-stat-label">Total Alumni</div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-header">
            <div className="dashboard-stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Award size={24} />
            </div>
          </div>
          <div className="dashboard-stat-value">{stats.totalOfficers}</div>
          <div className="dashboard-stat-label">Officers</div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-header">
            <div className="dashboard-stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Calendar size={24} />
            </div>
          </div>
          <div className="dashboard-stat-value">{stats.totalEvents}</div>
          <div className="dashboard-stat-label">Events</div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-header">
            <div className="dashboard-stat-icon" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
              <Briefcase size={24} />
            </div>
          </div>
          <div className="dashboard-stat-value">{stats.totalJobs}</div>
          <div className="dashboard-stat-label">Jobs</div>
        </div>
        
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-header">
            <div className="dashboard-stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Image size={24} />
            </div>
          </div>
          <div className="dashboard-stat-value">{stats.totalGalleryItems}</div>
          <div className="dashboard-stat-label">Gallery Items</div>
        </div>
        
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-header">
            <div className="dashboard-stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <MessageSquare size={24} />
            </div>
          </div>
          <div className="dashboard-stat-value">{stats.unreadMessages}</div>
          <div className="dashboard-stat-label">Unread Messages</div>
        </div>
      </div>

      {/* Alumni Status Card */}
      <div className="dashboard-overview-card">
        <div className="dashboard-card-header">
          <h2 className="dashboard-card-title">
            <div className="dashboard-card-title-icon">
              <Users size={16} />
            </div>
            Alumni Status
          </h2>
        </div>
        
        <div className="dashboard-card-content">
          {stats.totalAlumni > 0 ? (
            <div className="dashboard-alumni-status">
              <div className="dashboard-status-item">
                <div className="dashboard-status-label">
                  Active Alumni
                </div>
                <div className="dashboard-status-value-row">
                  <div className="dashboard-status-value">
                    {stats.activeAlumni}
                  </div>
                  <div className="dashboard-percentage-badge dashboard-badge-positive">
                    <ArrowUp size={14} />
                    {stats.totalAlumni > 0 ? Math.round((stats.activeAlumni / stats.totalAlumni) * 100) : 0}%
                  </div>
                </div>
                
                <div className="dashboard-status-label" style={{ marginTop: '1rem' }}>
                  Inactive Alumni
                </div>
                <div className="dashboard-status-value-row">
                  <div className="dashboard-status-value">
                    {stats.inactiveAlumni}
                  </div>
                  <div className="dashboard-percentage-badge dashboard-badge-negative">
                    <ArrowDown size={14} />
                    {stats.totalAlumni > 0 ? Math.round((stats.inactiveAlumni / stats.totalAlumni) * 100) : 0}%
                  </div>
                </div>
              </div>
              
              <div className="dashboard-status-item">
                <div className="dashboard-status-label">
                  Top Batches
                </div>
                
                {topBatches.length > 0 ? (
                  <div>
                    {topBatches.map(([batch, count]) => (
                      <div key={batch} className="dashboard-batch-item">
                        <div className="dashboard-batch-name">Batch {batch}</div>
                        <div className="dashboard-batch-count">{count} alumni</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                    No batch data available
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="dashboard-empty-state">
              <div className="dashboard-empty-icon">
                <UserPlus size={32} />
              </div>
              <h3 className="dashboard-empty-title">No Alumni Data</h3>
              <p className="dashboard-empty-description">
                There are no alumni records in the system yet. Alumni data will appear here once users register and are approved.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Activity Overview */}
      <div className="dashboard-overview-card">
        <div className="dashboard-card-header">
          <h2 className="dashboard-card-title">
            <div className="dashboard-card-title-icon">
              <Activity size={16} />
            </div>
            Platform Activity
          </h2>
        </div>
        
        <div className="dashboard-card-content">
          <div className="dashboard-alumni-status">
            <div className="dashboard-status-item">
              <div className="dashboard-status-label">Events</div>
              <div className="dashboard-status-value-row">
                <div className="dashboard-status-value">
                  {stats.upcomingEvents}
                </div>
                <div className="dashboard-percentage-badge dashboard-badge-positive">
                  Upcoming
                </div>
              </div>
              
              <div className="dashboard-status-label" style={{ marginTop: '1rem' }}>Jobs</div>
              <div className="dashboard-status-value-row">
                <div className="dashboard-status-value">
                  {stats.activeJobs}
                </div>
                <div className="dashboard-percentage-badge dashboard-badge-positive">
                  Active
                </div>
              </div>
            </div>
            
            <div className="dashboard-status-item">
              <div className="dashboard-status-label">Recent Activity</div>
              <div className="dashboard-empty-state" style={{ padding: '2rem 0' }}>
                <div className="dashboard-empty-icon" style={{ width: '48px', height: '48px' }}>
                  <Activity size={24} />
                </div>
                <h3 className="dashboard-empty-title">No Recent Activity</h3>
                <p className="dashboard-empty-description">
                  There is no recent activity to display. Activity will appear here once users start interacting with the system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Management Card - Moved to bottom */}
      <div className="dashboard-overview-card">
        <div className="dashboard-card-header">
          <h2 className="dashboard-card-title">
            <div className="dashboard-card-title-icon">
              <Trash2 size={16} />
            </div>
            System Management
          </h2>
        </div>
        
        <div className="dashboard-card-content">
          <div className="dashboard-clear-data-section">
            <div className="dashboard-clear-data-info">
              <div className="dashboard-clear-data-icon">
                <AlertTriangle size={32} color="#f59e0b" />
              </div>
              <div className="dashboard-clear-data-text">
                <h3>Clear All Data</h3>
                <p>This action will permanently delete ALL data from Firebase including posts, users, events, jobs, gallery items, alumni records, officers, donations, and contact messages. Only admin accounts will be preserved.</p>
              </div>
            </div>
            <button 
              className="dashboard-clear-data-button"
              onClick={() => setShowClearDataDialog(true)}
              disabled={isClearingData}
            >
              <Trash2 size={16} />
              {isClearingData ? 'Clearing All Data...' : 'Clear All Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Clear Data Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={showClearDataDialog}
        title="Clear All Data"
        message="Are you absolutely sure you want to delete ALL data from Firebase? This action cannot be undone and will permanently remove all posts, users, events, jobs, gallery items, alumni records, officers, donations, contact messages, and other content from the database. Only admin accounts will be preserved. This process may take several minutes to complete."
        confirmText="Yes, Clear All Data"
        cancelText="Cancel"
        onConfirm={handleClearAllData}
        onCancel={() => setShowClearDataDialog(false)}
        variant="danger"
      />
    </AdminLayout>
  );
};

export default Dashboard; 