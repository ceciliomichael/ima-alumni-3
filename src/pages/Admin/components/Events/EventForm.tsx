import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, Image, MapPin, CheckCircle, Clock, Upload, Plus } from 'lucide-react';
import { fileToBase64, resizeImage, validateImageFile } from '../../../../services/firebase/storageService';
import { 
  addEvent, 
  getEventById, 
  updateEvent,
  Event
} from '../../../../services/firebase/eventService';
import AdminLayout from '../../layout/AdminLayout';
import './Events.css';
import './EventForm.css';

type EventFormData = Omit<Event, 'id' | 'createdAt'>;

const EventForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    location: '',
    date: new Date().toISOString(),
    isApproved: false,
    createdBy: 'admin',
    coverImage: ''
  });
  
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
    // If editing, fetch event data
    if (isEditing && id) {
      setLoading(true);
      getEventById(id)
        .then((eventData: Event | null) => {
          if (eventData) {
            // Exclude id and createdAt from the form
            const { id: _, createdAt: __, ...restData } = eventData;
            setFormData(restData);
            
            // If there's a cover image, set it as the preview
            if (restData.coverImage) {
              setPreviewUrl(restData.coverImage);
            }
          } else {
            // Handle case where event doesn't exist
            navigate('/admin/events');
          }
        })
        .catch((error: unknown) => {
          console.error('Error fetching event:', error);
          navigate('/admin/events');
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
      const validation = validateImageFile(file, 5); // 5MB max
      if (!validation.valid) {
        alert(validation.message);
        return;
      }
      
      setUploadFile(file);
      
      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      // Clear the coverImage URL field since we're using an uploaded file
      setFormData(prev => ({
        ...prev,
        coverImage: ''
      }));
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
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
    
    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Event description is required';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Event location is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Event date and time is required';
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
      // Process the uploaded image if any
      let eventData = { ...formData };
      
      if (uploadFile) {
        // Resize and convert to base64 with more aggressive compression
        const base64Image = await resizeImage(uploadFile, 800, 600, 0.6, true);
        eventData.coverImage = base64Image;
      }
      
      if (isEditing && id) {
        await updateEvent(id, eventData);
      } else {
        await addEvent(eventData);
      }
      
      navigate('/admin/events');
    } catch (error) {
      console.error('Error saving event:', error);
      setIsSubmitting(false);
    }
  };
  
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().substring(0, 16); // Format as YYYY-MM-DDThh:mm
  };
  
  return (
    <AdminLayout title={isEditing ? 'Edit Event' : 'Add Event'}>
      <div className="admin-toolbar">
        <button 
          className="admin-back-btn"
          onClick={() => navigate('/admin/events')}
        >
          <ArrowLeft size={20} />
          Back to Events
        </button>
      </div>
      
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">
            {isEditing ? 'Edit Event Information' : 'Add New Event'}
          </h2>
        </div>
        
        {loading ? (
          <div className="admin-loading">Loading event data...</div>
        ) : (
        
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-section">
            <h3 className="admin-form-section-title">Event Information</h3>
            
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label htmlFor="title" className="admin-form-label">
                  <Calendar size={16} className="admin-form-icon" />
                  Event Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className={`admin-form-input ${errors.title ? 'admin-input-error' : ''}`}
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter event title"
                />
                {errors.title && <div className="admin-form-error">{errors.title}</div>}
              </div>
            </div>
            
            <div className="admin-form-row admin-form-row-2">
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
                  placeholder="Enter event location"
                />
                {errors.location && <div className="admin-form-error">{errors.location}</div>}
              </div>
              
              <div className="admin-form-group">
                <label htmlFor="date" className="admin-form-label">
                  <Calendar size={16} className="admin-form-icon" />
                  Date and Time *
                </label>
                <input
                  type="datetime-local"
                  id="date"
                  name="date"
                  className={`admin-datetime-local ${errors.date ? 'admin-input-error' : ''}`}
                  value={formatDateForInput(formData.date)}
                  onChange={handleChange}
                />
                {errors.date && <div className="admin-form-error">{errors.date}</div>}
              </div>
            </div>
            
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label htmlFor="description" className="admin-form-label">
                  <Calendar size={16} className="admin-form-icon" />
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={6}
                  className={`admin-form-textarea ${errors.description ? 'admin-input-error' : ''}`}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter event description"
                ></textarea>
                {errors.description && <div className="admin-form-error">{errors.description}</div>}
              </div>
            </div>
          </div>
          
          <div className="admin-form-section">
            <h3 className="admin-form-section-title">Event Image</h3>
            
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">
                  <Upload size={16} className="admin-form-icon" />
                  Upload Cover Image
                </label>
                <div className="admin-upload-container">
                  <button 
                    type="button" 
                    className="admin-upload-btn"
                    onClick={triggerFileInput}
                  >
                    <Plus size={16} />
                    Select Image File
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
                <div className="admin-form-hint">Upload an image file (JPG, PNG, GIF). Maximum size: 5MB.</div>
              </div>
            </div>
            
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label htmlFor="coverImage" className="admin-form-label">
                  <Image size={16} className="admin-form-icon" />
                  Cover Image URL {!uploadFile && '(Alternative to upload)'}
                </label>
                <input
                  type="text"
                  id="coverImage"
                  name="coverImage"
                  className="admin-form-input"
                  value={formData.coverImage || ''}
                  onChange={handleChange}
                  placeholder={uploadFile ? "Image will be uploaded from file" : "Enter cover image URL"}
                  disabled={!!uploadFile}
                />
                <div className="admin-form-hint">
                  {uploadFile 
                    ? "Using uploaded image file instead of URL" 
                    : "Enter a URL for the event cover image or upload a file above."}
                </div>
                
                <div className="admin-image-preview">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Cover preview" />
                  ) : formData.coverImage ? (
                    <img src={formData.coverImage} alt="Cover preview" />
                  ) : (
                    <div className="admin-image-placeholder">
                      <Image size={32} />
                      <span>No image selected</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="admin-form-section">
            <h3 className="admin-form-section-title">Status</h3>
            
            <div className="admin-form-row">
              <div className="admin-event-status-container">
                <div>
                  <div className={`admin-event-status-badge ${formData.isApproved ? 'admin-event-status-badge-approved' : 'admin-event-status-badge-pending'}`}>
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
                    <span className="admin-form-checkbox-label">Approve Event</span>
                  </label>
                  <div className="admin-form-hint">
                    Approved events will be visible to all alumni. Unapproved events will be hidden.
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="admin-form-actions">
            <button 
              type="button" 
              className="admin-form-cancel"
              onClick={() => navigate('/admin/events')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="admin-form-submit"
              disabled={isSubmitting}
            >
              <Save size={18} />
              {isEditing ? 'Update Event' : 'Save Event'}
            </button>
          </div>
        </form>
        )}
      </div>
    </AdminLayout>
  );
};

export default EventForm;
