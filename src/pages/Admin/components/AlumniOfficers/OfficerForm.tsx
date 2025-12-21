import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import { 
  addOfficer, 
  getOfficerById, 
  updateOfficer,
  getOfficersByTitle
} from '../../../../services/firebase';
import { 
  getAllAlumni 
} from '../../../../services/firebase';
import { OfficerPosition, AlumniRecord } from '../../../../types';
import { processImageFile } from '../../../../utils/imageUtils';
import AdminLayout from '../../layout/AdminLayout';
import FormLabel from '../../../../components/ui/FormLabel';
import './AlumniOfficers.css';

const OFFICER_POSITIONS = [
  'President',
  'Vice President',
  'Secretary',
  'Treasurer',
  'Events Coordinator',
  'Alumni Recruitment Officer',
  'Communications Director',
  'Career Development Officer',
  'Batch President'
];

const OfficerForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [allAlumni, setAllAlumni] = useState<AlumniRecord[]>([]);
  const [loadingAlumni, setLoadingAlumni] = useState(true);
  const [loadingOfficer, setLoadingOfficer] = useState(false);
  const [formData, setFormData] = useState<Omit<OfficerPosition, 'id'>>({
    title: '',
    alumniId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    batchYear: '',
    photo: ''
  });
  
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all alumni for the dropdown
        setLoadingAlumni(true);
        const alumni = await getAllAlumni();
        setAllAlumni(alumni);
        
        // If editing, fetch officer data
        if (isEditing && id) {
          setLoadingOfficer(true);
          const officerData = await getOfficerById(id);
          
          if (officerData) {
            // Format dates for form inputs
            const formattedData = {
              ...officerData,
              startDate: new Date(officerData.startDate).toISOString().split('T')[0],
              endDate: officerData.endDate 
                ? new Date(officerData.endDate).toISOString().split('T')[0] 
                : ''
            };
            
            // Remove id as we don't need it in the form
            const { id: _id, ...dataWithoutId } = formattedData;
            void _id;
            setFormData(dataWithoutId);
            
            // Set photo preview if exists
            if (officerData.photo) {
              setPhotoPreview(officerData.photo);
            }
          } else {
            // Handle case where officer record doesn't exist
            navigate('/admin/alumni-officers');
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setAllAlumni([]);
      } finally {
        setLoadingAlumni(false);
        setLoadingOfficer(false);
      }
    };
    
    loadData();
  }, [id, isEditing, navigate]);
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Special handling for batch president
    if (name === 'title' && value === 'Batch President') {
      if (!formData.batchYear) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          batchYear: '' // Ensure this field is available
        }));
      }
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await processImageFile(file, true);
      
      if (result.success && result.base64) {
        setPhotoPreview(result.base64);
        setFormData(prev => ({
          ...prev,
          photo: result.base64!
        }));
        
        // Clear any existing photo errors
        if (errors.photo) {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.photo;
            return newErrors;
          });
        }
      } else {
        setErrors(prev => ({
          ...prev,
          photo: result.error || 'Failed to process image'
        }));
      }
    } catch {
      setErrors(prev => ({
        ...prev,
        photo: 'Error processing image file'
      }));
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview('');
    setFormData(prev => ({
      ...prev,
      photo: ''
    }));
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title) {
      newErrors.title = 'Position title is required';
    }
    
    if (!formData.alumniId) {
      newErrors.alumniId = 'Please select an alumni';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    if (formData.title === 'Batch President' && !formData.batchYear) {
      newErrors.batchYear = 'Batch year is required for Batch President';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const checkPositionAvailability = async (): Promise<boolean> => {
    if (!formData.title) {
      return true;
    }

    try {
      const existingPositions = await getOfficersByTitle(formData.title);
      const normalizedBatchYear = formData.batchYear?.trim();

      const hasConflict = existingPositions.some(officer => {
        if (isEditing && id && officer.id === id) {
          return false;
        }

        if (formData.title === 'Batch President') {
          return (
            !!normalizedBatchYear &&
            !!officer.batchYear &&
            officer.batchYear.trim() === normalizedBatchYear
          );
        }

        return true;
      });

      if (hasConflict) {
        setErrors(prev => ({
          ...prev,
          title: formData.title === 'Batch President'
            ? 'This batch already has a Batch President assigned.'
            : 'An officer is already assigned to this position.'
        }));
      }

      return !hasConflict;
    } catch (error) {
      console.error('Error validating officer position:', error);
      setErrors(prev => ({
        ...prev,
        title: 'Unable to verify position availability. Please try again.'
      }));
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const isPositionAvailable = await checkPositionAvailability();
      if (!isPositionAvailable) {
        setIsSubmitting(false);
        return;
      }

      // Format dates for storage
      const formattedData = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate 
          ? new Date(formData.endDate).toISOString()
          : undefined
      };
      
      if (isEditing && id) {
        await updateOfficer(id, formattedData);
      } else {
        await addOfficer(formattedData);
      }
      
      navigate('/admin/alumni-officers');
    } catch (error) {
      console.error('Error saving officer position:', error);
      alert('An error occurred while saving the officer position. Please try again.');
      setIsSubmitting(false);
    }
  };
  
  const isBatchPosition = formData.title === 'Batch President';
  const isLoading = loadingAlumni || loadingOfficer;
  
  return (
    <AdminLayout title={isEditing ? 'Edit Officer Position' : 'Add Officer Position'}>
      <div className="admin-toolbar">
        <button 
          className="admin-back-btn"
          onClick={() => navigate('/admin/alumni-officers')}
        >
          <ArrowLeft size={20} />
          Back to Officers
        </button>
      </div>
      
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">
            {isEditing ? 'Edit Officer Position' : 'Add New Officer Position'}
          </h2>
        </div>
        
        {isLoading ? (
          <div className="loading-state">Loading...</div>
        ) : (
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-form-section">
              <h3 className="admin-form-section-title">Position Information</h3>
              
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <FormLabel htmlFor="title" className="admin-form-label" required>Position Title</FormLabel>
                  <select
                    id="title"
                    name="title"
                    className={`admin-form-input ${errors.title ? 'admin-input-error' : ''}`}
                    value={formData.title}
                    onChange={handleChange}
                  >
                    <option value="">Select Position</option>
                    {OFFICER_POSITIONS.map(position => (
                      <option key={position} value={position}>{position}</option>
                    ))}
                  </select>
                  {errors.title && <div className="admin-form-error">{errors.title}</div>}
                </div>
              </div>
              
              {isBatchPosition && (
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <FormLabel htmlFor="batchYear" className="admin-form-label" required>Batch Year</FormLabel>
                    <input
                      type="text"
                      id="batchYear"
                      name="batchYear"
                      className={`admin-form-input ${errors.batchYear ? 'admin-input-error' : ''}`}
                      value={formData.batchYear || ''}
                      onChange={handleChange}
                      placeholder="Enter batch year (e.g., 2020)"
                    />
                    {errors.batchYear && <div className="admin-form-error">{errors.batchYear}</div>}
                  </div>
                </div>
              )}
              
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <FormLabel htmlFor="alumniId" className="admin-form-label" required>Assigned Alumni</FormLabel>
                  <select
                    id="alumniId"
                    name="alumniId"
                    className={`admin-form-input ${errors.alumniId ? 'admin-input-error' : ''}`}
                    value={formData.alumniId}
                    onChange={handleChange}
                    disabled={loadingAlumni}
                  >
                    <option value="">
                      {loadingAlumni ? 'Loading alumni...' : 'Select Alumni'}
                    </option>
                    {!loadingAlumni && allAlumni.map(alumni => (
                      <option key={alumni.id} value={alumni.id}>
                        {alumni.name} (Batch {alumni.batch})
                      </option>
                    ))}
                  </select>
                  {errors.alumniId && <div className="admin-form-error">{errors.alumniId}</div>}
                  {!loadingAlumni && allAlumni.length === 0 && (
                    <div className="admin-form-hint">No alumni records found. Please add alumni records first.</div>
                  )}
                </div>
              </div>
              
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label htmlFor="photo" className="admin-form-label">Officer Photo</label>
                  <div className="photo-upload-container">
                    {photoPreview ? (
                      <div className="photo-preview-wrapper">
                        <img src={photoPreview} alt="Officer preview" className="photo-preview" />
                        <button
                          type="button"
                          className="photo-remove-btn"
                          onClick={handleRemovePhoto}
                        >
                          <X size={16} />
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label htmlFor="photo-input" className="photo-upload-label">
                        <Upload size={24} />
                        <span>Click to upload photo</span>
                        <span className="photo-hint">PNG, JPG, GIF up to 5MB</span>
                      </label>
                    )}
                    <input
                      id="photo-input"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                  {errors.photo && <div className="admin-form-error">{errors.photo}</div>}
                </div>
              </div>
              
              <div className="admin-form-row admin-form-row-2">
                <div className="admin-form-group">
                  <FormLabel htmlFor="startDate" className="admin-form-label" required>Start Date</FormLabel>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    className={`admin-form-input ${errors.startDate ? 'admin-input-error' : ''}`}
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                  {errors.startDate && <div className="admin-form-error">{errors.startDate}</div>}
                </div>
                
                <div className="admin-form-group">
                  <label htmlFor="endDate" className="admin-form-label">End Date</label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    className="admin-form-input"
                    value={formData.endDate || ''}
                    onChange={handleChange}
                  />
                  <div className="admin-form-hint">Leave blank if no end date.</div>
                </div>
              </div>
            </div>
            
            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => navigate('/admin/alumni-officers')}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="admin-btn-primary"
                disabled={isSubmitting || loadingAlumni}
              >
                <Save size={20} />
                {isSubmitting ? 'Saving...' : 'Save Position'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
};

export default OfficerForm; 