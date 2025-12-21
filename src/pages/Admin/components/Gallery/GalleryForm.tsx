import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Image, Calendar, CheckCircle, Clock, Upload, Plus, Filter, Trash2, Images } from 'lucide-react';
import { 
  addGalleryItem, 
  getGalleryItemById, 
  updateGalleryItem,
  createAlbum
} from '../../../../services/firebase/galleryService';
import { GalleryPost } from '../../../../types';
import { getAllEvents, Event } from '../../../../services/firebase/eventService';
import { resizeImage, validateImageFile } from '../../../../services/firebase/storageService';
import { validateTitle } from '../../../../utils/formValidation';
import AdminLayout from '../../layout/AdminLayout';
import FormLabel from '../../../../components/ui/FormLabel';
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

interface UploadedImage {
  id: string;
  file: File;
  url: string;
  title: string;
  base64?: string;
}

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
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Album state - simplified
  const [albumTitle, setAlbumTitle] = useState('');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Automatically determine if this is an album based on number of images
  const isAlbum = uploadedImages.length > 1 || (isEditing && formData.isAlbum);

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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, postedDate, ...restData } = galleryData;
            setFormData(restData);
            
            // Set album title if it's an album
            if (galleryData.isAlbum) {
              setAlbumTitle(galleryData.albumTitle || '');
            }
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
      // Clean up album image URLs
      uploadedImages.forEach(img => {
        if (img.url && !img.url.startsWith('data:')) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [previewUrl, uploadedImages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: UploadedImage[] = [];
    
    // Handle multiple files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file
      const validation = validateImageFile(file, 5); // 5MB max
      if (!validation.valid) {
        alert(`${file.name}: ${validation.message}`);
        continue;
      }
      
      const objectUrl = URL.createObjectURL(file);
      const fileName = file.name.split('.')[0].replace(/[_-]/g, ' ');
      
      newImages.push({
        id: `img_${Date.now()}_${i}`,
        file,
        url: objectUrl,
        title: fileName
      });
    }
    
    if (newImages.length === 1) {
      // Single image - use the original single image workflow
      setUploadFile(newImages[0].file);
      setPreviewUrl(newImages[0].url);
      
      // Auto-fill title from filename if empty
      if (!formData.title) {
        setFormData(prev => ({
          ...prev,
          title: newImages[0].title
        }));
      }
    } else if (newImages.length > 1) {
      // Multiple images - automatically switch to album mode
      setUploadedImages(newImages);
      
      // Auto-fill album title if empty
      if (!albumTitle) {
        setAlbumTitle(`New Album - ${new Date().toLocaleDateString()}`);
      }
      
      // Clear single image data
      setUploadFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
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
    
    // Format category value to match user-facing gallery
    const formattedCategory = category.toLowerCase().replace(/\s+/g, '-');
    
    setFormData(prev => ({
      ...prev,
      albumCategory: formattedCategory // Set albumCategory field for proper categorization
    }));
  };

  const handleImageTitleChange = (imageId: string, newTitle: string) => {
    setUploadedImages(prev => 
      prev.map(img => 
        img.id === imageId ? { ...img, title: newTitle } : img
      )
    );
  };

  const handleRemoveImage = (imageId: string) => {
    setUploadedImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove && imageToRemove.url && !imageToRemove.url.startsWith('data:')) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      const newImages = prev.filter(img => img.id !== imageId);
      
      // If only one image left, switch back to single image mode
      if (newImages.length === 1) {
        const singleImage = newImages[0];
        setUploadFile(singleImage.file);
        setPreviewUrl(singleImage.url);
        setFormData(prevForm => ({
          ...prevForm,
          title: singleImage.title
        }));
        return [];
      }
      
      return newImages;
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (isAlbum) {
      // Validate album title
      const albumTitleValidation = validateTitle(albumTitle);
      if (!albumTitleValidation.isValid) {
        newErrors.albumTitle = albumTitleValidation.error || 'Album title is required';
      }
      
      if (uploadedImages.length === 0) {
        newErrors.images = 'At least one image is required for an album';
      }
      
      // Check if all images have titles
      const imagesWithoutTitles = uploadedImages.filter(img => !img.title.trim());
      if (imagesWithoutTitles.length > 0) {
        newErrors.imageTitles = 'All images must have titles';
      }
    } else {
      // Validate single image title
      const titleValidation = validateTitle(formData.title);
      if (!titleValidation.isValid) {
        newErrors.title = titleValidation.error || 'Title is required';
      }
      
      if (!formData.description.trim()) {
        newErrors.description = 'Description is required';
      }
      
      // Only require imageUrl if no file is being uploaded
      if (!formData.imageUrl.trim() && !uploadFile) {
        newErrors.imageUrl = 'Image is required - either upload a file or provide a URL';
      }
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
      if (isAlbum) {
        // Process album creation
        const processedImages: Array<{ url: string; title: string }> = [];
        
        for (const image of uploadedImages) {
          // Convert to base64 if not already processed
          if (!image.base64) {
            const base64Image = await resizeImage(image.file, 800, 800, 0.6, true);
            image.base64 = base64Image;
          }
          
          processedImages.push({
            url: image.base64,
            title: image.title
          });
        }
        
        // Create album
        await createAlbum(
          albumTitle,
          formData.albumCategory || selectedCategory?.toLowerCase().replace(/\s+/g, '-') || EVENT_CATEGORIES[0].toLowerCase().replace(/\s+/g, '-'),
          `Album with ${processedImages.length} images`,
          processedImages,
          'admin'
        );
      } else {
        // Process single image
        if (uploadFile) {
          // Resize and convert to base64 with more aggressive compression
          const base64Image = await resizeImage(uploadFile, 800, 800, 0.6, true);
          
          // Save with the base64 image
          if (isEditing && id) {
            await updateGalleryItem(id, {
              ...formData,
              imageUrl: base64Image,
              albumCategory: formData.albumCategory || selectedCategory?.toLowerCase().replace(/\s+/g, '-') || EVENT_CATEGORIES[0].toLowerCase().replace(/\s+/g, '-')
            });
          } else {
            await addGalleryItem({
              ...formData,
              imageUrl: base64Image,
              albumCategory: formData.albumCategory || selectedCategory?.toLowerCase().replace(/\s+/g, '-') || EVENT_CATEGORIES[0].toLowerCase().replace(/\s+/g, '-')
            });
          }
        } else {
          // No file uploaded, use the URL provided
          if (isEditing && id) {
            await updateGalleryItem(id, {
              ...formData,
              albumCategory: formData.albumCategory || selectedCategory?.toLowerCase().replace(/\s+/g, '-') || EVENT_CATEGORIES[0].toLowerCase().replace(/\s+/g, '-')
            });
          } else {
            await addGalleryItem({
              ...formData,
              albumCategory: formData.albumCategory || selectedCategory?.toLowerCase().replace(/\s+/g, '-') || EVENT_CATEGORIES[0].toLowerCase().replace(/\s+/g, '-')
            });
          }
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
          
          {isAlbum && (
            <div className="admin-album-indicator">
              <Images size={16} />
              <span>Album Mode ({uploadedImages.length} images)</span>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="admin-loading">Loading gallery data...</div>
        ) : (
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-section">
            <h3 className="admin-form-section-title">
              {isAlbum ? 'Album Information' : 'Gallery Item Information'}
            </h3>
            
            {isAlbum ? (
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <FormLabel htmlFor="albumTitle" className="admin-form-label" required>
                    <Images size={16} className="admin-form-icon" />
                    Album Title
                  </FormLabel>
                  <input
                    type="text"
                    id="albumTitle"
                    value={albumTitle}
                    onChange={(e) => setAlbumTitle(e.target.value)}
                    className={`admin-form-input ${errors.albumTitle ? 'admin-input-error' : ''}`}
                    placeholder="Enter album title"
                  />
                  {errors.albumTitle && <div className="admin-form-error">{errors.albumTitle}</div>}
                </div>
              </div>
            ) : (
              <>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <FormLabel htmlFor="title" className="admin-form-label" required>
                      <Image size={16} className="admin-form-icon" />
                      Title
                    </FormLabel>
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
                    <FormLabel htmlFor="description" className="admin-form-label" required>
                      <Image size={16} className="admin-form-icon" />
                      Description
                    </FormLabel>
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
              </>
            )}
            
            <div className="admin-form-row">
              <div className="admin-form-group">
                <FormLabel className="admin-form-label" required>
                  <Filter size={16} className="admin-form-icon" />
                  Album Category
                </FormLabel>
                <div className="admin-gallery-category-selector">
                  {EVENT_CATEGORIES.map(category => (
                    <div 
                      key={category}
                      className={`admin-gallery-category-item ${
                        selectedCategory === category || 
                        (formData.albumCategory === category.toLowerCase().replace(/\s+/g, '-') && !selectedCategory) 
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
                  Note: This links the {isAlbum ? 'album' : 'image'} to a specific event. Album category above is used for filtering.
                </div>
              </div>
            </div>
          </div>
          
          <div className="admin-form-section">
            <h3 className="admin-form-section-title">
              {isAlbum ? 'Album Images' : 'Image Upload'}
            </h3>
            
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">
                  <Upload size={16} className="admin-form-icon" />
                  {isAlbum ? 'Manage Album Images' : 'Upload Image(s)'}
                </label>
                <div className="admin-upload-container">
                  <button 
                    type="button" 
                    className="admin-upload-btn"
                    onClick={triggerFileInput}
                  >
                    <Plus size={16} />
                    {isAlbum ? 'Add More Images' : 'Select Image(s)'}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                  />
                </div>
                <div className="admin-form-hint">
                  {isAlbum 
                    ? 'Add more images to this album. Each image can have its own title.'
                    : 'Select one or multiple images. Multiple images will automatically create an album.'
                  }
                </div>
                {errors.images && <div className="admin-form-error">{errors.images}</div>}
                {errors.imageTitles && <div className="admin-form-error">{errors.imageTitles}</div>}
              </div>
            </div>

            {/* Album Images Grid */}
            {isAlbum && uploadedImages.length > 0 && (
              <div className="admin-album-images-grid">
                {uploadedImages.map((image) => (
                  <div key={image.id} className="admin-album-image-item">
                    <div className="admin-album-image-preview">
                      <img src={image.url} alt={image.title} />
                      <button
                        type="button"
                        className="admin-album-image-remove"
                        onClick={() => handleRemoveImage(image.id)}
                        aria-label="Remove image"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="admin-album-image-details">
                      <input
                        type="text"
                        value={image.title}
                        onChange={(e) => handleImageTitleChange(image.id, e.target.value)}
                        className="admin-album-image-title"
                        placeholder="Image title"
                      />
                      <div className="admin-album-image-info">
                        <span>{(image.file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Single Image Preview */}
            {!isAlbum && (uploadFile || formData.imageUrl) && (
              <>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <FormLabel htmlFor="imageUrl" className="admin-form-label" required={!uploadFile}>
                      <Image size={16} className="admin-form-icon" />
                      Image URL
                    </FormLabel>
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
                  </div>
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
              </>
            )}
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
                    <span className="admin-form-checkbox-label">
                      Approve {isAlbum ? 'Album' : 'Gallery Item'}
                    </span>
                  </label>
                  <div className="admin-form-hint">
                    Approved {isAlbum ? 'albums' : 'gallery items'} will be visible to all alumni. Unapproved items will be hidden.
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
              {isAlbum 
                ? (isEditing ? 'Update Album' : 'Create Album')
                : (isEditing ? 'Update Gallery Item' : 'Save Gallery Item')
              }
            </button>
          </div>
        </form>
        )}
      </div>
    </AdminLayout>
  );
};

export default GalleryForm;
