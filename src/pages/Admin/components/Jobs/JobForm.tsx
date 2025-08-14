import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Briefcase, Building, MapPin, 
  DollarSign, Mail, Calendar, Link, FileText, CheckCircle, Clock,
  Upload, Plus, Image
} from 'lucide-react';
import { 
  addJob, 
  getJobById, 
  updateJob,
  Job
} from '../../../../services/firebase/jobService';
import { fileToBase64, resizeImage, validateImageFile } from '../../../../services/firebase/storageService';
import AdminLayout from '../../layout/AdminLayout';
import './Jobs.css';
import './JobForm.css';

type JobFormData = Omit<Job, 'id' | 'postedDate'>;

const JobForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const initialFormData: JobFormData = {
    title: '',
    company: '',
    location: '',
    description: '',
    requirements: '',
    contactEmail: '',
    isApproved: false,
    postedBy: 'admin',
    jobType: 'fullTime',
    salary: '',
    applicationType: 'email',
    applicationUrl: '',
    deadline: '',
    companyLogo: ''
  };
  
  const [formData, setFormData] = useState<JobFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up the object URL when the component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl && !previewUrl.startsWith('data:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    // If editing, fetch job data
    if (isEditing && id) {
      setLoading(true);
      getJobById(id)
        .then((jobData: Job | null) => {
          if (jobData) {
            // Exclude id and postedDate from the form
            const { id: _, postedDate: __, ...restData } = jobData;
            
            // Format date for input field
            if (restData.deadline) {
              const date = new Date(restData.deadline);
              // Format as YYYY-MM-DD for date input
              restData.deadline = date.toISOString().split('T')[0];
            }
            
            setFormData(restData);
            
            // If there's a company logo, set it as the preview
            if (restData.companyLogo) {
              setPreviewUrl(restData.companyLogo);
            }
          } else {
            // Handle case where job doesn't exist
            navigate('/admin/jobs');
          }
        })
        .catch((error: unknown) => {
          console.error('Error fetching job:', error);
          navigate('/admin/jobs');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, isEditing, navigate]);
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate file
      const validation = validateImageFile(file, 2); // 2MB max for logos
      if (!validation.valid) {
        alert(validation.message);
        return;
      }
      
      setUploadFile(file);
      
      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
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

  const handleJobTypeSelect = (jobType: Job['jobType']) => {
    setFormData(prev => ({
      ...prev,
      jobType
    }));
  };

  const handleApplicationTypeSelect = (applicationType: NonNullable<Job['applicationType']>) => {
    setFormData(prev => ({
      ...prev,
      applicationType
    }));
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    }
    
    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Job location is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Job description is required';
    }
    
    if (!formData.requirements.trim()) {
      newErrors.requirements = 'Job requirements are required';
    }
    
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }
    
    if (formData.applicationType === 'website' && !formData.applicationUrl?.trim()) {
      newErrors.applicationUrl = 'Application URL is required for website application type';
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
      // Convert deadline to ISO date if it exists
      let submissionData = { ...formData };
      if (submissionData.deadline) {
        submissionData.deadline = new Date(submissionData.deadline).toISOString();
      }
      
      // If a file was uploaded, process it
      if (uploadFile) {
        // Resize and convert to base64 with more aggressive compression
        const base64Image = await resizeImage(uploadFile, 400, 400, 0.6, true);
        
        // Update the form data with the base64 image
        submissionData.companyLogo = base64Image;
      }

      if (isEditing && id) {
        await updateJob(id, submissionData);
      } else {
        await addJob(submissionData);
      }
      
      navigate('/admin/jobs');
    } catch (error) {
      console.error('Error saving job:', error);
      setIsSubmitting(false);
    }
  };

  const getJobTypeIcon = (jobType: Job['jobType']) => {
    switch (jobType) {
      case 'fullTime':
        return <Briefcase size={16} className="admin-job-type-icon-fullTime" />;
      case 'partTime':
        return <Briefcase size={16} className="admin-job-type-icon-partTime" />;
      case 'contract':
        return <Briefcase size={16} className="admin-job-type-icon-contract" />;
      case 'internship':
        return <Briefcase size={16} className="admin-job-type-icon-internship" />;
      default:
        return <Briefcase size={16} />;
    }
  };
  
  return (
    <AdminLayout title={isEditing ? 'Edit Job' : 'Add Job'}>
      <div className="admin-toolbar">
        <button 
          className="admin-back-btn"
          onClick={() => navigate('/admin/jobs')}
        >
          <ArrowLeft size={20} />
          Back to Jobs
        </button>
      </div>
      
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">
            {isEditing ? 'Edit Job Details' : 'Add New Job'}
          </h2>
        </div>
        
        {loading ? (
          <div className="admin-loading">Loading job data...</div>
        ) : (
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-section">
            <h3 className="admin-form-section-title">Basic Information</h3>
            
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label htmlFor="title" className="admin-form-label">
                  <Briefcase size={16} className="admin-form-icon" />
                  Job Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className={`admin-form-input ${errors.title ? 'admin-input-error' : ''}`}
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter job title"
                />
                {errors.title && <div className="admin-form-error">{errors.title}</div>}
              </div>
            </div>
            
            <div className="admin-form-row admin-form-row-2">
              <div className="admin-form-group">
                <label htmlFor="company" className="admin-form-label">
                  <Building size={16} className="admin-form-icon" />
                  Company *
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  className={`admin-form-input ${errors.company ? 'admin-input-error' : ''}`}
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Enter company name"
                />
                {errors.company && <div className="admin-form-error">{errors.company}</div>}
              </div>
              
              <div className="admin-form-group">
                <label htmlFor="location" className="admin-form-label">
                  <MapPin size={16} className="admin-form-icon" />
                  Location *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  className={`admin-form-input ${errors.location ? 'admin-input-error' : ''}`}
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Enter job location"
                />
                {errors.location && <div className="admin-form-error">{errors.location}</div>}
              </div>
            </div>
            
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">
                  <Image size={16} className="admin-form-icon" />
                  Company Logo (Optional)
                </label>
                <div className="admin-upload-container">
                  <button 
                    type="button" 
                    className="admin-upload-btn"
                    onClick={triggerFileInput}
                  >
                    <Plus size={16} />
                    Select Logo Image
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  {uploadFile && (
                    <div className="admin-selected-file">
                      <span>{uploadFile.name}</span>
                      <span className="admin-file-size">({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  )}
                </div>
                <div className="admin-form-hint">Upload a company logo (JPG, PNG). Maximum size: 2MB.</div>
                
                {(previewUrl || formData.companyLogo) && (
                  <div className="admin-logo-preview">
                    <img 
                      src={previewUrl || formData.companyLogo} 
                      alt="Company logo preview" 
                      className="admin-logo-preview-image"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">
                  <Briefcase size={16} className="admin-form-icon" />
                  Job Type *
                </label>
                <div className="admin-job-type-options">
                  <div className="admin-job-type-option admin-job-type-fullTime">
                    <input
                      type="radio"
                      id="jobType-fullTime"
                      name="jobType"
                      className="admin-job-type-input"
                      checked={formData.jobType === 'fullTime'}
                      onChange={() => handleJobTypeSelect('fullTime')}
                    />
                    <label htmlFor="jobType-fullTime" className="admin-job-type-label">
                      {getJobTypeIcon('fullTime')}
                      Full-time
                    </label>
                  </div>
                  
                  <div className="admin-job-type-option admin-job-type-partTime">
                    <input
                      type="radio"
                      id="jobType-partTime"
                      name="jobType"
                      className="admin-job-type-input"
                      checked={formData.jobType === 'partTime'}
                      onChange={() => handleJobTypeSelect('partTime')}
                    />
                    <label htmlFor="jobType-partTime" className="admin-job-type-label">
                      {getJobTypeIcon('partTime')}
                      Part-time
                    </label>
                  </div>
                  
                  <div className="admin-job-type-option admin-job-type-contract">
                    <input
                      type="radio"
                      id="jobType-contract"
                      name="jobType"
                      className="admin-job-type-input"
                      checked={formData.jobType === 'contract'}
                      onChange={() => handleJobTypeSelect('contract')}
                    />
                    <label htmlFor="jobType-contract" className="admin-job-type-label">
                      {getJobTypeIcon('contract')}
                      Contract
                    </label>
                  </div>
                  
                  <div className="admin-job-type-option admin-job-type-internship">
                    <input
                      type="radio"
                      id="jobType-internship"
                      name="jobType"
                      className="admin-job-type-input"
                      checked={formData.jobType === 'internship'}
                      onChange={() => handleJobTypeSelect('internship')}
                    />
                    <label htmlFor="jobType-internship" className="admin-job-type-label">
                      {getJobTypeIcon('internship')}
                      Internship
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="admin-form-row admin-form-row-2">
              <div className="admin-form-group">
                <label htmlFor="salary" className="admin-form-label">
                  <DollarSign size={16} className="admin-form-icon" />
                  Salary (Optional)
                </label>
                <input
                  type="text"
                  id="salary"
                  name="salary"
                  className="admin-form-input"
                  value={formData.salary || ''}
                  onChange={handleChange}
                  placeholder="e.g. $60,000 - $80,000"
                />
              </div>
              
              <div className="admin-form-group">
                <label htmlFor="deadline" className="admin-form-label">
                  <Calendar size={16} className="admin-form-icon" />
                  Application Deadline (Optional)
                </label>
                <input
                  type="date"
                  id="deadline"
                  name="deadline"
                  className="admin-form-input"
                  value={formData.deadline || ''}
                  onChange={handleChange}
                />
                <div className="admin-form-hint">Leave blank if there is no deadline.</div>
              </div>
            </div>
          </div>
          
          <div className="admin-form-section">
            <h3 className="admin-form-section-title">Job Details</h3>
            
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label htmlFor="description" className="admin-form-label">
                  <FileText size={16} className="admin-form-icon" />
                  Job Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={6}
                  className={`admin-form-textarea ${errors.description ? 'admin-input-error' : ''}`}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter job description"
                ></textarea>
                {errors.description && <div className="admin-form-error">{errors.description}</div>}
              </div>
            </div>
            
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label htmlFor="requirements" className="admin-form-label">
                  <FileText size={16} className="admin-form-icon" />
                  Job Requirements *
                </label>
                <textarea
                  id="requirements"
                  name="requirements"
                  rows={5}
                  className={`admin-form-textarea ${errors.requirements ? 'admin-input-error' : ''}`}
                  value={formData.requirements}
                  onChange={handleChange}
                  placeholder="Enter job requirements"
                ></textarea>
                {errors.requirements && <div className="admin-form-error">{errors.requirements}</div>}
              </div>
            </div>
          </div>
          
          <div className="admin-form-section">
            <h3 className="admin-form-section-title">Application Information</h3>
            
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">
                  <Mail size={16} className="admin-form-icon" />
                  Application Method *
                </label>
                <div className="admin-job-application-options">
                  <div className="admin-job-application-option">
                    <input
                      type="radio"
                      id="applicationType-email"
                      name="applicationType"
                      className="admin-job-application-input"
                      checked={formData.applicationType === 'email'}
                      onChange={() => handleApplicationTypeSelect('email')}
                    />
                    <label htmlFor="applicationType-email" className="admin-job-application-label">
                      <Mail size={16} />
                      Email
                    </label>
                  </div>
                  
                  <div className="admin-job-application-option">
                    <input
                      type="radio"
                      id="applicationType-website"
                      name="applicationType"
                      className="admin-job-application-input"
                      checked={formData.applicationType === 'website'}
                      onChange={() => handleApplicationTypeSelect('website')}
                    />
                    <label htmlFor="applicationType-website" className="admin-job-application-label">
                      <Link size={16} />
                      Website
                    </label>
                  </div>
                  
                  <div className="admin-job-application-option">
                    <input
                      type="radio"
                      id="applicationType-inPerson"
                      name="applicationType"
                      className="admin-job-application-input"
                      checked={formData.applicationType === 'inPerson'}
                      onChange={() => handleApplicationTypeSelect('inPerson')}
                    />
                    <label htmlFor="applicationType-inPerson" className="admin-job-application-label">
                      <MapPin size={16} />
                      In Person
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label htmlFor="contactEmail" className="admin-form-label">
                  <Mail size={16} className="admin-form-icon" />
                  Contact Email *
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  className={`admin-form-input ${errors.contactEmail ? 'admin-input-error' : ''}`}
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="Enter contact email"
                />
                {errors.contactEmail && <div className="admin-form-error">{errors.contactEmail}</div>}
              </div>
            </div>
            
            {formData.applicationType === 'website' && (
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label htmlFor="applicationUrl" className="admin-form-label">
                    <Link size={16} className="admin-form-icon" />
                    Application URL *
                  </label>
                  <input
                    type="url"
                    id="applicationUrl"
                    name="applicationUrl"
                    className={`admin-form-input ${errors.applicationUrl ? 'admin-input-error' : ''}`}
                    value={formData.applicationUrl || ''}
                    onChange={handleChange}
                    placeholder="Enter application URL"
                  />
                  {errors.applicationUrl && <div className="admin-form-error">{errors.applicationUrl}</div>}
                </div>
              </div>
            )}
          </div>
          
          <div className="admin-form-section">
            <h3 className="admin-form-section-title">Status</h3>
            
            <div className="admin-form-row">
              <div className="admin-job-status-container">
                <div>
                  <div className={`admin-job-status-badge ${formData.isApproved ? 'admin-job-status-badge-approved' : 'admin-job-status-badge-pending'}`}>
                    {formData.isApproved ? (
                      <>
                        <CheckCircle size={14} />
                        Approved
                      </>
                    ) : (
                      <>
                        <Clock size={14} />
                        Pending Approval
                      </>
                    )}
                  </div>
                </div>
                
                <div className="admin-form-checkbox-group">
                  <label className="admin-form-checkbox-container">
                    <input
                      type="checkbox"
                      name="isApproved"
                      checked={formData.isApproved}
                      onChange={handleChange}
                    />
                    <span className="admin-form-checkbox-label">Approve Job Posting</span>
                  </label>
                  <div className="admin-form-hint">
                    Approved job postings will be visible to all alumni. Unapproved postings will be hidden.
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="admin-form-actions">
            <button 
              type="button" 
              className="admin-form-cancel"
              onClick={() => navigate('/admin/jobs')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="admin-form-submit"
              disabled={isSubmitting}
            >
              <Save size={18} />
              {isEditing ? 'Update Job' : 'Save Job'}
            </button>
          </div>
        </form>
        )}
      </div>
    </AdminLayout>
  );
};

export default JobForm;
