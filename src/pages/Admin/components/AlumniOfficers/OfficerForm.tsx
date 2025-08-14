import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { 
  addOfficer, 
  getOfficerById, 
  updateOfficer,
  initializeOfficerData
} from '../../services/localStorage/officerService';
import { 
  getAllAlumni, 
  initializeAlumniData 
} from '../../services/localStorage/alumniService';
import { OfficerPosition, AlumniRecord } from '../../../../types';
import AdminLayout from '../../layout/AdminLayout';
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
  const [formData, setFormData] = useState<Omit<OfficerPosition, 'id'>>({
    title: '',
    alumniId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    batchYear: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    // Initialize sample data if empty
    initializeOfficerData();
    initializeAlumniData();
    
    // Load all alumni for the dropdown
    const alumni = getAllAlumni();
    setAllAlumni(alumni);
    
    // If editing, fetch officer data
    if (isEditing && id) {
      const officerData = getOfficerById(id);
      
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
        const { id: _, ...dataWithoutId } = formattedData;
        setFormData(dataWithoutId);
      } else {
        // Handle case where officer record doesn't exist
        navigate('/admin/alumni-officers');
      }
    }
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format dates for storage
      const formattedData = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate 
          ? new Date(formData.endDate).toISOString()
          : undefined
      };
      
      if (isEditing && id) {
        updateOfficer(id, formattedData);
      } else {
        addOfficer(formattedData);
      }
      
      navigate('/admin/alumni-officers');
    } catch (error) {
      console.error('Error saving officer position:', error);
      setIsSubmitting(false);
    }
  };
  
  const isBatchPosition = formData.title === 'Batch President';
  
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
        
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-section">
            <h3 className="admin-form-section-title">Position Information</h3>
            
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label htmlFor="title" className="admin-form-label">Position Title *</label>
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
                  <label htmlFor="batchYear" className="admin-form-label">Batch Year *</label>
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
                <label htmlFor="alumniId" className="admin-form-label">Assigned Alumni *</label>
                <select
                  id="alumniId"
                  name="alumniId"
                  className={`admin-form-input ${errors.alumniId ? 'admin-input-error' : ''}`}
                  value={formData.alumniId}
                  onChange={handleChange}
                >
                  <option value="">Select Alumni</option>
                  {allAlumni.map(alumni => (
                    <option key={alumni.id} value={alumni.id}>
                      {alumni.name} (Batch {alumni.batch})
                    </option>
                  ))}
                </select>
                {errors.alumniId && <div className="admin-form-error">{errors.alumniId}</div>}
              </div>
            </div>
            
            <div className="admin-form-row admin-form-row-2">
              <div className="admin-form-group">
                <label htmlFor="startDate" className="admin-form-label">Start Date *</label>
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
              disabled={isSubmitting}
            >
              <Save size={20} />
              {isSubmitting ? 'Saving...' : 'Save Position'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default OfficerForm; 