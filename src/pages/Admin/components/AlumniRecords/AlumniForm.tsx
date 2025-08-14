import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, Calendar } from 'lucide-react';
import { 
  addAlumni, 
  getAlumniById, 
  updateAlumni,
  initializeAlumniData
} from '../../../../services/firebase/alumniService';
import { AlumniRecord } from '../../../../types';
import AdminLayout from '../../layout/AdminLayout';
import './AlumniRecords.css';

const AlumniForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState<Omit<AlumniRecord, 'id' | 'dateRegistered'>>({
    name: '',
    email: '',
    batch: '',
    isActive: true,
    profileImage: '',
    position: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize sample data if empty
        await initializeAlumniData();
        
        // If editing, fetch alumni data
        if (isEditing && id) {
          const alumniData = await getAlumniById(id);
          
          if (alumniData) {
            // Exclude id and dateRegistered from the form
            const { id: _, dateRegistered: __, ...restData } = alumniData;
            setFormData(restData);
          } else {
            // Handle case where alumni record doesn't exist
            navigate('/admin/alumni-records');
          }
        }
      } catch (error) {
        console.error('Error initializing or fetching alumni data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, [id, isEditing, navigate]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.batch.trim()) {
      newErrors.batch = 'Batch year is required';
    } else if (isNaN(Number(formData.batch))) {
      newErrors.batch = 'Batch year must be a number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Add dateRegistered field for new alumni
      const alumniData = {
        ...formData,
        dateRegistered: new Date().toISOString()
      };
      
      if (isEditing && id) {
        await updateAlumni(id, alumniData);
      } else {
        await addAlumni(alumniData);
      }
      
      navigate('/admin/alumni-records');
    } catch (error) {
      console.error('Error saving alumni record:', error);
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <AdminLayout title={isEditing ? 'Edit Alumni' : 'Add Alumni'}>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title={isEditing ? 'Edit Alumni' : 'Add Alumni'}>
      <div className="admin-container">
        <div className="alumni-records-header">
          <button 
            className="back-button"
            onClick={() => navigate('/admin/alumni-records')}
          >
            <ArrowLeft size={20} />
            <span>Back to Alumni Records</span>
          </button>
        </div>
        
        <div className="admin-card">
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-section">
                <label htmlFor="name" className="admin-form-label">
                  <User size={16} className="form-icon" /> Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className={`admin-form-input ${errors.name ? 'admin-input-error' : ''}`}
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  disabled={isSubmitting}
                />
                {errors.name && <div className="admin-form-error">{errors.name}</div>}
              </div>
              
              <div className="form-section">
                <label htmlFor="email" className="admin-form-label">
                  <Mail size={16} className="form-icon" /> Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`admin-form-input ${errors.email ? 'admin-input-error' : ''}`}
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  disabled={isSubmitting}
                />
                {errors.email && <div className="admin-form-error">{errors.email}</div>}
              </div>
              
              <div className="form-section">
                <label htmlFor="batch" className="admin-form-label">
                  <Calendar size={16} className="form-icon" /> Batch Year *
                </label>
                <input
                  type="text"
                  id="batch"
                  name="batch"
                  className={`admin-form-input ${errors.batch ? 'admin-input-error' : ''}`}
                  value={formData.batch}
                  onChange={handleChange}
                  placeholder="Enter batch year (e.g., 2020)"
                  disabled={isSubmitting}
                />
                {errors.batch && <div className="admin-form-error">{errors.batch}</div>}
              </div>
              
              <div className="form-section">
                <label htmlFor="position" className="admin-form-label">Position</label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  className="admin-form-input"
                  value={formData.position || ''}
                  onChange={handleChange}
                  placeholder="Enter position (if any)"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="form-section">
                <label htmlFor="profileImage" className="admin-form-label">Profile Image URL</label>
                <input
                  type="text"
                  id="profileImage"
                  name="profileImage"
                  className="admin-form-input"
                  value={formData.profileImage || ''}
                  onChange={handleChange}
                  placeholder="Enter profile image URL"
                  disabled={isSubmitting}
                />
                <div className="form-hint">Leave blank to use default avatar.</div>
              </div>
              
              <div className="form-section checkbox-section">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  <span className="checkbox-label">Active Account</span>
                </label>
                <div className="form-hint">
                  Inactive accounts cannot log in or access alumni features.
                </div>
              </div>
            </div>
            
            <div className="admin-form-actions">
              <button 
                type="button"
                className="admin-form-cancel"
                onClick={() => navigate('/admin/alumni-records')}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                className="admin-form-submit"
                disabled={isSubmitting}
              >
                <Save size={18} />
                <span>{isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Save')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AlumniForm;
