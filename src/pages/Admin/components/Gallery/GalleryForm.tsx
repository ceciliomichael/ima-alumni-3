import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Image, Calendar, CheckCircle, Clock, Upload, Plus, Filter } from 'lucide-react';
import { 
  addGalleryItem, 
  getGalleryItemById, 
  updateGalleryItem
} from '../../../../services/firebase/galleryService';
import { GalleryPost } from '../../../../types';
import { getAllEvents, Event } from '../../../../services/firebase/eventService';
import { fileToBase64, resizeImage, validateImageFile } from '../../../../services/firebase/storageService';
import AdminLayout from '../../layout/AdminLayout';
import './Gallery.css';
import './GalleryForm.css';

type GalleryFormData = Omit<GalleryPost, 'id' | 'postedDate'>;

// Define album categories to match the user-facing gallery
const EVENT_CATEGORIES = [
  'Homecoming',
  'Batch Reunions',
  'Career Events',
  'Awards',
  'Community Service'
];

const GalleryForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState<GalleryFormData>({
    title: '',
    description: '',
    imageUrl: '',
    event: '',
    isApproved: false,
    postedBy: 'admin'
  });
  
  const [events, setEvents] = useState<Event[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Load events for the dropdown
        const allEvents = await getAllEvents();
        setEvents(allEvents);
        
        // If editing, fetch gallery item data
        if (isEditing && id) {
          const galleryData = await getGalleryItemById(id);
          
          if (galleryData) {
            // Exclude id and postedDate from the form
            const { id: _, postedDate: __, ...restData } = galleryData;
            setFormData(restData);
          } else {
            // Handle case where gallery item doesn't exist
            navigate('/admin/gallery');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
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
  
  // Clean up the object URL when the component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl && !previewUrl.startsWith('data:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
      
      // Auto-fill title from filename if empty
      if (!formData.title) {
        const fileName = file.name.split('.')[0].replace(/[_-]/g, ' ');
        setFormData(prev => ({
          ...prev,
          title: fileName
        }));
      }
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    
    // Format event value to match user-facing gallery
    const formattedCategory = category.toLowerCase().replace(/\s+/g, '-');
    
    setFormData(prev => ({
      ...prev,
      event: formattedCategory
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    // Only require imageUrl if no file is being uploaded
    if (!formData.imageUrl.trim() && !uploadFile) {
      newErrors.imageUrl = 'Image is required - either upload a file or provide a URL';
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
      // If a file was uploaded, process it
      if (uploadFile) {
        // Resize and convert to base64 with more aggressive compression
        const base64Image = await resizeImage(uploadFile, 800, 800, 0.6, true);
        
        // Update the form data with the base64 image
        setFormData(prev => ({
          ...prev,
          imageUrl: base64Image
        }));
        
        // Save with the base64 image
        if (isEditing && id) {
          await updateGalleryItem(id, {
            ...formData,
            imageUrl: base64Image
          });
        } else {
          await addGalleryItem({
            ...formData,
            imageUrl: base64Image
          });
        }
      } else {
        // No file uploaded, use the URL provided
        if (isEditing && id) {
          await updateGalleryItem(id, formData);
        } else {
          await addGalleryItem(formData);
        }
      }
      
      navigate('/admin/gallery');
    } catch (error) {
      console.error('Error saving gallery item:', error);
      setIsSubmitting(false);
    }
  };
  
  return (
    <AdminLayout title={isEditing ? 'Edit Gallery Item' : 'Add Gallery Item'}>
      <div className="admin-toolbar">
        <button 
          className="admin-back-btn"
          onClick={() => navigate('/admin/gallery')}
        >
          <ArrowLeft size={20} />
          Back to Gallery
        </button>
      </div>
      
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">
            {isEditing ? 'Edit Gallery Item' : 'Add New Gallery Item'}
          </h2>
        </div>
        
        {loading ? (
          <div className="admin-loading">Loading gallery data...</div>
        ) : (
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-section">
            <h3 className="admin-form-section-title">Gallery Item Information</h3>
            
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label htmlFor="title" className="admin-form-label">
                  <Image size={16} className="admin-form-icon" />
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className={`admin-form-input ${errors.title ? 'admin-input-error' : ''}`}
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter gallery item title"
                />
                {errors.title && <div className="admin-form-error">{errors.title}</div>}
              </div>
            </div>
            
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">
                  <Filter size={16} className="admin-form-icon" />
                  Album Category *
                </label>
                <div className="admin-gallery-category-selector">
                  {EVENT_CATEGORIES.map(category => (
                    <div 
                      key={category}
                      className={`admin-gallery-category-item ${
                        selectedCategory === category || 
                        (formData.event === category.toLowerCase().replace(/\s+/g, '-') && !selectedCategory) 
                          ? 'active' 
                          : ''
                      }`}
                      onClick={() => handleCategorySelect(category)}
                    >
                      {category}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label htmlFor="event" className="admin-form-label">
                  <Calendar size={16} className="admin-form-icon" />
                  Event (Optional)
                </label>
                <select
                  id="event"
                  name="event"
                  className="admin-form-select"
                  value={formData.event}
                  onChange={handleChange}
                >
                  <option value="">Select an event</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>{event.title}</option>
                  ))}
                </select>
                <div className="admin-form-hint">
                  Note: This links the image to a specific event. Album category above is used for filtering.
                </div>
              </div>
            </div>
            
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label htmlFor="description" className="admin-form-label">
                  <Image size={16} className="admin-form-icon" />
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className={`admin-form-textarea ${errors.description ? 'admin-input-error' : ''}`}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter description"
                ></textarea>
                {errors.description && <div className="admin-form-error">{errors.description}</div>}
              </div>
            </div>
          </div>
          
          <div className="admin-form-section">
            <h3 className="admin-form-section-title">Image</h3>
            
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">
                  <Upload size={16} className="admin-form-icon" />
                  Upload Image
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
                <label htmlFor="imageUrl" className="admin-form-label">
                  <Image size={16} className="admin-form-icon" />
                  Image URL {!uploadFile && '*'}
                </label>
                <input
                  type="text"
                  id="imageUrl"
                  name="imageUrl"
                  className={`admin-form-input ${errors.imageUrl ? 'admin-input-error' : ''}`}
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder={uploadFile ? "Image will be uploaded from file" : "Enter image URL"}
                  disabled={!!uploadFile}
                />
                {errors.imageUrl && <div className="admin-form-error">{errors.imageUrl}</div>}
                <div className="admin-form-hint">
                  {uploadFile 
                    ? "Using uploaded image file instead of URL" 
                    : "Enter the URL for the gallery image or upload a file above."}
                </div>
                
                <div className="admin-gallery-image-preview">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Gallery preview" />
                  ) : formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Gallery preview" />
                  ) : (
                    <div className="admin-gallery-image-placeholder">
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
              <div className="admin-gallery-status-container">
                <div>
                  <div className={`admin-gallery-status-badge ${formData.isApproved ? 'admin-gallery-status-badge-approved' : 'admin-gallery-status-badge-pending'}`}>
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
                    <span className="admin-form-checkbox-label">Approve Gallery Item</span>
                  </label>
                  <div className="admin-form-hint">
                    Approved gallery items will be visible to all alumni. Unapproved items will be hidden.
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="admin-form-actions">
            <button 
              type="button" 
              className="admin-form-cancel"
              onClick={() => navigate('/admin/gallery')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="admin-form-submit"
              disabled={isSubmitting}
            >
              <Save size={18} />
              {isEditing ? 'Update Gallery Item' : 'Save Gallery Item'}
            </button>
          </div>
        </form>
        )}
      </div>
    </AdminLayout>
  );
};

export default GalleryForm;
