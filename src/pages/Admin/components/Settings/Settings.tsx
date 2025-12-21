import { useState, useEffect } from 'react';
import { 
  Trash2, AlertTriangle, Lock, Eye, EyeOff, CheckCircle, Home, Save
} from 'lucide-react';
import AdminLayout from '../../layout/AdminLayout';
import ConfirmDialog from '../../../../components/ConfirmDialog';
import FormLabel from '../../../../components/ui/FormLabel';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { updateAdminPassword, verifyAdminPassword } from '../../../../services/firebase/adminService';
import { getHomepageHero, updateHomepageHero, DEFAULT_HERO_CONTENT } from '../../../../services/firebase/homepageService';
import { HomepageHeroContent } from '../../../../types';
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
  
  // Password reset state
  const { adminUser } = useAdminAuth();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Homepage Hero state
  const [heroContent, setHeroContent] = useState<HomepageHeroContent>(DEFAULT_HERO_CONTENT);
  const [isLoadingHero, setIsLoadingHero] = useState(true);
  const [isSavingHero, setIsSavingHero] = useState(false);
  const [heroSuccess, setHeroSuccess] = useState('');
  const [heroError, setHeroError] = useState('');

  // Load hero content on mount
  useEffect(() => {
    const loadHeroContent = async () => {
      try {
        const content = await getHomepageHero();
        setHeroContent(content);
      } catch (error) {
        console.error('Error loading hero content:', error);
      } finally {
        setIsLoadingHero(false);
      }
    };
    loadHeroContent();
  }, []);

  const handleHeroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setHeroContent(prev => ({ ...prev, [name]: value }));
    if (heroSuccess) setHeroSuccess('');
    if (heroError) setHeroError('');
  };

  const handleHeroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingHero(true);
    setHeroSuccess('');
    setHeroError('');

    try {
      await updateHomepageHero(heroContent, adminUser?.name);
      setHeroSuccess('Homepage hero content updated successfully!');
    } catch (error) {
      console.error('Error updating hero content:', error);
      setHeroError('Failed to update hero content. Please try again.');
    } finally {
      setIsSavingHero(false);
    }
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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
    // Clear success message when typing
    if (passwordSuccess) {
      setPasswordSuccess('');
    }
  };

  const validatePasswordForm = () => {
    const errors: Record<string, string> = {};
    
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm() || !adminUser) {
      return;
    }
    
    setIsChangingPassword(true);
    setPasswordSuccess('');
    
    try {
      // Verify current password
      const isValid = await verifyAdminPassword(adminUser.id, passwordForm.currentPassword);
      
      if (!isValid) {
        setPasswordErrors({ currentPassword: 'Current password is incorrect' });
        setIsChangingPassword(false);
        return;
      }
      
      // Update password
      const success = await updateAdminPassword(adminUser.id, passwordForm.newPassword);
      
      if (success) {
        setPasswordSuccess('Password updated successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordErrors({ submit: 'Failed to update password. Please try again.' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordErrors({ submit: 'An error occurred. Please try again.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <AdminLayout title="Settings">
      <div className="settings-container">
        {/* Password Management Section */}
        <div className="settings-section">
          <div className="settings-section-header">
            <h2 className="settings-section-title">
              <div className="settings-section-title-icon">
                <Lock size={20} />
              </div>
              Change Password
            </h2>
          </div>
          
          <div className="settings-section-content">
            {passwordSuccess && (
              <div style={{ 
                backgroundColor: 'oklch(0.7 0.15 145 / 0.1)', 
                color: 'oklch(0.45 0.15 145)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                border: '1px solid oklch(0.7 0.15 145 / 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CheckCircle size={18} />
                {passwordSuccess}
              </div>
            )}
            
            {passwordErrors.submit && (
              <div style={{ 
                backgroundColor: 'oklch(0.6 0.25 0 / 0.1)', 
                color: 'oklch(0.6 0.25 0)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                border: '1px solid oklch(0.6 0.25 0 / 0.2)'
              }}>
                {passwordErrors.submit}
              </div>
            )}
            
            <form onSubmit={handlePasswordSubmit} style={{ maxWidth: '400px' }}>
              <div style={{ marginBottom: '1rem' }}>
                <FormLabel style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }} required>
                  Current Password
                </FormLabel>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.5rem 0.75rem 0.75rem',
                      border: `1px solid ${passwordErrors.currentPassword ? 'var(--error-color)' : 'var(--border-color)'}`,
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#666',
                      padding: '4px',
                      display: 'flex'
                    }}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <div style={{ color: 'var(--error-color)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    {passwordErrors.currentPassword}
                  </div>
                )}
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <FormLabel style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }} required>
                  New Password
                </FormLabel>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.5rem 0.75rem 0.75rem',
                      border: `1px solid ${passwordErrors.newPassword ? 'var(--error-color)' : 'var(--border-color)'}`,
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#666',
                      padding: '4px',
                      display: 'flex'
                    }}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <div style={{ color: 'var(--error-color)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    {passwordErrors.newPassword}
                  </div>
                )}
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <FormLabel style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }} required>
                  Confirm New Password
                </FormLabel>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.5rem 0.75rem 0.75rem',
                      border: `1px solid ${passwordErrors.confirmPassword ? 'var(--error-color)' : 'var(--border-color)'}`,
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#666',
                      padding: '4px',
                      display: 'flex'
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <div style={{ color: 'var(--error-color)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    {passwordErrors.confirmPassword}
                  </div>
                )}
              </div>
              
              <button
                type="submit"
                disabled={isChangingPassword}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                  opacity: isChangingPassword ? 0.7 : 1
                }}
              >
                <Lock size={16} />
                {isChangingPassword ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        {/* Homepage Hero Section */}
        <div className="settings-section">
          <div className="settings-section-header">
            <h2 className="settings-section-title">
              <div className="settings-section-title-icon">
                <Home size={20} />
              </div>
              Homepage Hero Content
            </h2>
          </div>
          
          <div className="settings-section-content">
            {heroSuccess && (
              <div style={{ 
                backgroundColor: 'oklch(0.7 0.15 145 / 0.1)', 
                color: 'oklch(0.45 0.15 145)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                border: '1px solid oklch(0.7 0.15 145 / 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CheckCircle size={18} />
                {heroSuccess}
              </div>
            )}
            
            {heroError && (
              <div style={{ 
                backgroundColor: 'oklch(0.6 0.25 0 / 0.1)', 
                color: 'oklch(0.6 0.25 0)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                border: '1px solid oklch(0.6 0.25 0 / 0.2)'
              }}>
                {heroError}
              </div>
            )}
            
            {isLoadingHero ? (
              <p>Loading hero content...</p>
            ) : (
              <form onSubmit={handleHeroSubmit} style={{ maxWidth: '600px' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={heroContent.title}
                    onChange={handleHeroChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="e.g., Immaculate Mary Academy"
                  />
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    Subtitle
                  </label>
                  <input
                    type="text"
                    name="subtitle"
                    value={heroContent.subtitle}
                    onChange={handleHeroChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="e.g., Alumni Community"
                  />
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={heroContent.description}
                    onChange={handleHeroChange}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                    placeholder="Welcome message for the homepage..."
                  />
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    Button Label
                  </label>
                  <input
                    type="text"
                    name="ctaLabel"
                    value={heroContent.ctaLabel}
                    onChange={handleHeroChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="e.g., Learn More About IMA"
                  />
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    Button Link
                  </label>
                  <input
                    type="text"
                    name="ctaUrl"
                    value={heroContent.ctaUrl}
                    onChange={handleHeroChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="e.g., /about"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSavingHero}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    cursor: isSavingHero ? 'not-allowed' : 'pointer',
                    opacity: isSavingHero ? 0.7 : 1
                  }}
                >
                  <Save size={16} />
                  {isSavingHero ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            )}
          </div>
        </div>

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
