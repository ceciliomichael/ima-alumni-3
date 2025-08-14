import { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Calendar, Briefcase, School } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAlumniById } from '../../../../services/firebase/alumniService';
import { AlumniRecord } from '../../../../types';
import AdminLayout from '../../layout/AdminLayout';

const AlumniView = () => {
  const { id } = useParams<{ id: string }>();
  const [alumni, setAlumni] = useState<AlumniRecord | null>(null);
  const [loading, setLoading] = useState(true);
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
