import { useState } from 'react';
import { 
  Trash2, AlertTriangle
} from 'lucide-react';
import AdminLayout from '../../layout/AdminLayout';
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

import './Settings.css';

const Settings = () => {
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);

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
      

      
      // Clear localStorage data (keep admin session)
      const keysToKeep = ['admin_user'];
      const allKeys = Object.keys(localStorage);
      
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      
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

  return (
    <AdminLayout title="Settings">
      <div className="settings-container">
        {/* System Management Section */}
        <div className="settings-section">
          <div className="settings-section-header">
            <h2 className="settings-section-title">
              <div className="settings-section-title-icon">
                <Trash2 size={20} />
              </div>
              System Management
            </h2>
          </div>
          
          <div className="settings-section-content">
            <div className="settings-clear-data-section">
              <div className="settings-clear-data-info">
                <div className="settings-clear-data-icon">
                  <AlertTriangle size={32} color="#f59e0b" />
                </div>
                <div className="settings-clear-data-text">
                  <h3>Clear All Data</h3>
                  <p>This action will permanently delete ALL data from Firebase including posts, users, events, jobs, gallery items, alumni records, officers, and donations. Only admin accounts will be preserved.</p>
                  <div className="settings-clear-data-warning">
                    <strong>Warning:</strong> This action cannot be undone and may take several minutes to complete.
                  </div>
                </div>
              </div>
              <button 
                className="settings-clear-data-button"
                onClick={() => setShowClearDataDialog(true)}
                disabled={isClearingData}
              >
                <Trash2 size={16} />
                {isClearingData ? 'Clearing All Data...' : 'Clear All Data'}
              </button>
            </div>
          </div>
        </div>

        {/* Future Settings Sections Can Be Added Here */}
        <div className="settings-section">
          <div className="settings-section-header">
            <h2 className="settings-section-title">
              System Information
            </h2>
          </div>
          
          <div className="settings-section-content">
            <div className="settings-info-grid">
              <div className="settings-info-item">
                <div className="settings-info-label">Application Version</div>
                <div className="settings-info-value">1.0.0</div>
              </div>
              <div className="settings-info-item">
                <div className="settings-info-label">Database</div>
                <div className="settings-info-value">Firebase Firestore</div>
              </div>
              <div className="settings-info-item">
                <div className="settings-info-label">Storage</div>
                <div className="settings-info-value">Firebase Storage</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Data Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={showClearDataDialog}
        title="Clear All Data"
        message="Are you absolutely sure you want to delete ALL data from Firebase? This action cannot be undone and will permanently remove all posts, users, events, jobs, gallery items, alumni records, officers, donations, and other content from the database. Only admin accounts will be preserved. This process may take several minutes to complete."
        confirmText="Yes, Clear All Data"
        cancelText="Cancel"
        onConfirm={handleClearAllData}
        onCancel={() => setShowClearDataDialog(false)}
        variant="danger"
      />
    </AdminLayout>
  );
};

export default Settings;
