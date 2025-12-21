import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, Calendar, CreditCard, Upload, X } from 'lucide-react';
import { 
  addAlumni, 
  getAlumniById, 
  updateAlumni,
  initializeAlumniData,
  checkAlumniIdExistsInRecords
} from '../../../../services/firebase/alumniService';
import { AlumniRecord } from '../../../../types';
import { generateAlumniId, validateAndFormatAlumniId, formatAlumniId, cleanAlumniId } from '../../../../utils/alumniIdUtils';
import { processImageFile } from '../../../../utils/imageUtils';
import { validateName } from '../../../../utils/formValidation';
import AdminLayout from '../../layout/AdminLayout';
import FormLabel from '../../../../components/ui/FormLabel';
import './AlumniRecords.css';

const AlumniForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState<Omit<AlumniRecord, 'id' | 'dateRegistered'>>({
    name: '',
    email: '',
    alumniId: '',
    batch: '',
    isActive: true,
    profileImage: '',
    position: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string>('');
  
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
            void _; void __;
            
            // Format Alumni ID for display
            if (restData.alumniId) {
              restData.alumniId = formatAlumniId(restData.alumniId);
            }
            
            setFormData(restData);
            
            // Set image preview if profile image exists
            if (restData.profileImage) {
              setImagePreview(restData.profileImage);
            }
          } else {
            // Handle case where alumni record doesn't exist
            navigate('/admin/alumni-records');
          }
        } else {
          // For new records, generate Alumni ID
          await generateNewAlumniId();
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
    
    // Format Alumni ID as user types
    if (name === 'alumniId') {
      // Allow digits, letters, and dash, limit to 8 characters (6 digits + dash + 1 letter)
      const cleaned = value.replace(/[^0-9A-Za-z-]/g, '').slice(0, 8).toUpperCase();
      
      setFormData(prev => ({
        ...prev,
        [name]: cleaned
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
    
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await processImageFile(file, true);
      
      if (result.success && result.base64) {
        setImagePreview(result.base64);
        setFormData(prev => ({
          ...prev,
          profileImage: result.base64!
        }));
        
        // Clear any existing image errors
        if (errors.profileImage) {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.profileImage;
            return newErrors;
          });
        }
      } else {
        setErrors(prev => ({
          ...prev,
          profileImage: result.error || 'Failed to process image'
        }));
      }
    } catch {
      setErrors(prev => ({
        ...prev,
        profileImage: 'Error processing image file'
      }));
    }
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    setFormData(prev => ({
      ...prev,
      profileImage: ''
    }));
    
    // Clear file input
    const fileInput = document.getElementById('profileImageFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const generateNewAlumniId = async () => {
    let newId = generateAlumniId();
    let attempts = 0;
    
    // Ensure uniqueness (max 10 attempts)
    while (attempts < 10) {
      const exists = await checkAlumniIdExistsInRecords(newId);
      if (!exists) break;
      
      newId = generateAlumniId();
      attempts++;
    }
    
    setFormData(prev => ({
      ...prev,
      alumniId: newId
    }));
  };
  
  const validateForm = async () => {
    const newErrors: Record<string, string> = {};
    
    // Validate name
    const nameValidation = validateName(formData.name);
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error || 'Name is required';
    }
    
    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Validate Alumni ID
    if (!formData.alumniId?.trim()) {
      newErrors.alumniId = 'Alumni ID is required';
    } else {
      const validation = validateAndFormatAlumniId(formData.alumniId);
      if (!validation.isValid) {
        newErrors.alumniId = validation.error || 'Invalid Alumni ID format';
      } else if (!isEditing) {
        // Check uniqueness for new records
        const exists = await checkAlumniIdExistsInRecords(formData.alumniId);
        if (exists) {
          newErrors.alumniId = 'Alumni ID already exists. Please use a different ID.';
        }
      }
    }
    
    // Validate batch year
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
    
    const isValid = await validateForm();
    if (!isValid) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare alumni data with clean Alumni ID
      const alumniData = {
        ...formData,
        alumniId: formData.alumniId ? cleanAlumniId(formData.alumniId) : '', // Store clean ID
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
                <FormLabel htmlFor="name" className="admin-form-label" required>
                  <User size={16} className="form-icon" /> Full Name
                </FormLabel>
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
                <FormLabel htmlFor="alumniId" className="admin-form-label" required>
                  <CreditCard size={16} className="form-icon" /> Alumni ID
                </FormLabel>
                <div className="alumni-id-input-group">
                  <input
                    type="text"
                    id="alumniId"
                    name="alumniId"
                    className={`admin-form-input ${errors.alumniId ? 'admin-input-error' : ''}`}
                    value={formData.alumniId}
                    onChange={handleChange}
                    placeholder="123456-A"
                    disabled={isSubmitting}
                    maxLength={8}
                  />
                  {!isEditing && (
                    <button
                      type="button"
                      className="generate-id-btn"
                      onClick={generateNewAlumniId}
                      disabled={isSubmitting}
                      title="Generate new Alumni ID"
                    >
                      Generate
                    </button>
                  )}
                </div>
                {errors.alumniId && <div className="admin-form-error">{errors.alumniId}</div>}
                <div className="form-hint">
                  Alumni ID format: 6 digits, dash, 1 letter (e.g., 123456-A)
                </div>
              </div>
              
              <div className="form-section">
                <FormLabel htmlFor="email" className="admin-form-label" required>
                  <Mail size={16} className="form-icon" /> Email Address
                </FormLabel>
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
                <FormLabel htmlFor="batch" className="admin-form-label" required>
                  <Calendar size={16} className="form-icon" /> Batch Year
                </FormLabel>
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
                <label className="admin-form-label">Profile Image</label>
                
                <div className="profile-image-section">
                  <div className="profile-avatar-preview">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Profile preview" className="profile-preview-image" />
                    ) : (
                      <div className="profile-placeholder">
                        <User size={32} />
                      </div>
                    )}
                  </div>
                  
                  <div className="profile-image-actions">
                    <input
                      type="file"
                      id="profileImageFile"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isSubmitting}
                      style={{ display: 'none' }}
                    />
                    
                    {imagePreview ? (
                      <div className="profile-action-buttons">
                        <label htmlFor="profileImageFile" className="profile-action-btn replace">
                          <Upload size={16} />
                          Replace
                        </label>
                        <button
                          type="button"
                          className="profile-action-btn remove"
                          onClick={handleRemoveImage}
                          disabled={isSubmitting}
                        >
                          <X size={16} />
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label htmlFor="profileImageFile" className="profile-action-btn upload">
                        <Upload size={16} />
                        Upload Image
                      </label>
                    )}
                    
                    <div className="profile-image-hint">
                      <small>JPEG, PNG, GIF, WebP (Max 5MB)</small>
                    </div>
                  </div>
                </div>
                
                {errors.profileImage && <div className="admin-form-error">{errors.profileImage}</div>}
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
