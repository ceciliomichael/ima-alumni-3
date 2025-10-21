import { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Calendar, Briefcase, School, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAlumniById } from '../../../../services/firebase/alumniService';
import { AlumniRecord } from '../../../../types';
import { adminResetPassword } from '../../../../services/auth/passwordService';
import { getUserByAlumniId } from '../../../../services/firebase/userService';
import AdminLayout from '../../layout/AdminLayout';

const AlumniView = () => {
  const { id } = useParams<{ id: string }>();
  const [alumni, setAlumni] = useState<AlumniRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlumni = async () => {
      if (id) {
        try {
          const alumniData = await getAlumniById(id);
          setAlumni(alumniData);
        } catch (error) {
          console.error('Error fetching alumni data:', error);
          setAlumni(null);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchAlumni();
  }, [id]);

  const handleResetPassword = async () => {
    if (!alumni || !alumni.alumniId) {
      setResetMessage({ type: 'error', text: 'Cannot reset password: Alumni ID not found' });
      return;
    }

    // Confirm action
    const confirmed = window.confirm(
      `Are you sure you want to reset the password for ${alumni.name}?\n\nThe new password will be: ${alumni.name.split(' ').pop()?.toLowerCase()}${alumni.batch.match(/\d{4}/)?.[0] || ''}`
    );

    if (!confirmed) return;

    setResettingPassword(true);
    setResetMessage(null);

    try {
      // Find user by alumni ID
      const user = await getUserByAlumniId(alumni.alumniId);
      
      if (!user) {
        setResetMessage({ 
          type: 'error', 
          text: 'User account not found. The alumni may not have registered yet.' 
        });
        return;
      }

      // Reset password
      const result = await adminResetPassword(user.id);

      if (result.success && result.newPassword) {
        setResetMessage({
          type: 'success',
          text: `Password reset successfully! New password: ${result.newPassword}`
        });
      } else {
        setResetMessage({
          type: 'error',
          text: result.error || 'Failed to reset password'
        });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setResetMessage({
        type: 'error',
        text: 'An error occurred while resetting password'
      });
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Alumni Details">
        <div className="admin-container">
          <div className="loading-state">Loading alumni details...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!alumni) {
    return (
      <AdminLayout title="Alumni Details">
        <div className="admin-container">
          <div className="empty-state">
            <h3>Alumni record not found</h3>
            <p>The alumni record you're looking for doesn't exist or has been removed.</p>
            <button 
              className="primary-btn"
              onClick={() => navigate('/admin/alumni-records')}
            >
              Back to Alumni Records
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Alumni Details">
      <div className="admin-container">
        <div className="alumni-header">
          <button 
            className="back-button"
            onClick={() => navigate('/admin/alumni-records')}
          >
            <ArrowLeft size={18} />
            <span>Back to Alumni Records</span>
          </button>
        </div>
        
        <div className="alumni-view-content">
          <div className="alumni-profile-header">
            <div className="alumni-profile-avatar">
              {alumni.profileImage ? (
                <img 
                  src={alumni.profileImage}
                  alt={alumni.name}
                  className="profile-image"
                />
              ) : (
                <div className="profile-avatar-placeholder">
                  {alumni.name.charAt(0)}
                </div>
              )}
            </div>
            
            <div className="alumni-profile-info">
              <h1 className="alumni-profile-name">{alumni.name}</h1>
              
              <div className="alumni-profile-meta">
                <div className="alumni-meta-item">
                  <Mail size={16} />
                  <span>{alumni.email}</span>
                </div>
                <div className="alumni-meta-item">
                  <School size={16} />
                  <span>Batch {alumni.batch}</span>
                </div>
                {alumni.position && (
                  <div className="alumni-meta-item">
                    <Briefcase size={16} />
                    <span>{alumni.position}</span>
                  </div>
                )}
                <div className="alumni-meta-item">
                  <Calendar size={16} />
                  <span>Registered on {new Date(alumni.dateRegistered).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="alumni-status">
                <span className={`status-badge ${alumni.isActive ? 'status-active' : 'status-inactive'}`}>
                  {alumni.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="alumni-details-section">
            <h2 className="section-title">Alumni Details</h2>
            
            <div className="details-grid">
              <div className="detail-item">
                <div className="detail-label">Full Name</div>
                <div className="detail-value">{alumni.name}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Email Address</div>
                <div className="detail-value">{alumni.email}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Alumni ID (LRN)</div>
                <div className="detail-value">{alumni.alumniId || 'Not assigned'}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Batch Year</div>
                <div className="detail-value">{alumni.batch}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Current Position</div>
                <div className="detail-value">{alumni.position || 'Not specified'}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Registration Date</div>
                <div className="detail-value">{new Date(alumni.dateRegistered).toLocaleDateString()}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Account Status</div>
                <div className="detail-value">
                  <span className={`status-badge ${alumni.isActive ? 'status-active' : 'status-inactive'}`}>
                    {alumni.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Password Reset Section */}
          {alumni.isActive && alumni.alumniId && (
            <div className="alumni-details-section">
              <h2 className="section-title">Account Management</h2>
              
              {resetMessage && (
                <div className={`alert ${resetMessage.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '1.5rem' }}>
                  {resetMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  <span>{resetMessage.text}</span>
                </div>
              )}
              
              <div className="account-actions">
                <button
                  className="btn btn-secondary"
                  onClick={handleResetPassword}
                  disabled={resettingPassword}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Key size={18} />
                  <span>{resettingPassword ? 'Resetting Password...' : 'Reset Password to Default'}</span>
                </button>
                <p className="help-text" style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  This will reset the user's password to the default format: <strong>{alumni.name.split(' ').pop()?.toLowerCase()}{alumni.batch.match(/\d{4}/)?.[0] || ''}</strong>
                </p>
              </div>
            </div>
          )}
          
          {!alumni.isActive && (
            <div className="alumni-actions">
              <button 
                className="primary-btn"
                onClick={() => {
                  navigate('/admin/pending-registrations');
                }}
              >
                Go to Pending Registrations
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AlumniView;
