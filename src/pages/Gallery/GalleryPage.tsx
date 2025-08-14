import { useState, useEffect, useRef } from 'react';
import { Image, Search, Grid, Bookmark, RefreshCw, Upload, Plus, X, ImagePlus, FileText } from 'lucide-react';
import ImagePlaceholder from '../../components/ImagePlaceholder';
import GalleryCard from './components/GalleryCard';
import { getAllGalleryItems, addGalleryItem } from '../../services/firebase/galleryService';
import { GalleryPost } from '../../types';
import { getCurrentUser } from '../../services/firebase/userService';
import { fileToBase64, resizeImage, validateImageFile } from '../../services/firebase/storageService';
import './Gallery.css';

const GalleryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [galleryImages, setGalleryImages] = useState<GalleryPost[]>([]);
  const [activeAlbum, setActiveAlbum] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStep, setUploadStep] = useState<'select' | 'details' | 'success'>('select');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploadDetails, setUploadDetails] = useState({
    title: '',
    album: 'Homecoming'
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Albums categories
  const albumCategories = [
    'All Photos', 
    'Homecoming', 
    'Batch Reunions', 
    'Career Events', 
    'Awards', 
    'Community Service'
  ];
  
  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    
    fetchUser();
  }, []);
  
  // Load gallery items from Firestore
  useEffect(() => {
    const fetchGalleryItems = async () => {
      setIsLoading(true);
      try {
        const items = await getAllGalleryItems();
        // Filter for approved items only
        const approvedItems = items.filter(item => item.isApproved);
        setGalleryImages(approvedItems);
      } catch (error) {
        console.error('Error fetching gallery items:', error);
        setGalleryImages([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGalleryItems();
  }, []);

  // Clean up the object URL when the component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Filter images based on search term, active album, and view mode (bookmarks)
  const filteredImages = galleryImages.filter(image => {
    // Search term filter
    const matchesSearch = searchTerm === '' || 
      image.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (image.description && image.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Album filter (using albumCategory)
    let matchesAlbum = false;
    if (activeAlbum === 'all') {
      matchesAlbum = true;
    } else {
      // Compare the selected activeAlbum (e.g., 'batch-reunions')
      // with the stored image.albumCategory
      matchesAlbum = image.albumCategory === activeAlbum;
    }
    
    // Bookmarked filter (only when in masonry view)
    let matchesBookmarked = true;
    if (viewMode === 'masonry' && currentUser) {
      // Check if the image is bookmarked by the current user
      const isBookmarked = image.bookmarkedBy && 
                          Array.isArray(image.bookmarkedBy) && 
                          image.bookmarkedBy.includes(currentUser.id);
      matchesBookmarked = isBookmarked;
    }
    
    return matchesSearch && matchesAlbum && matchesBookmarked;
  });

  // Helper function to convert category slug to display name
  const getDisplayCategoryName = (categorySlug?: string) => {
    if (!categorySlug) return 'Uncategorized';
    const words = categorySlug.split('-');
    return words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Generate placeholder colors by album category
  const getColorByCategory = (category: string) => {
    const colorMap: Record<string, string> = {
      'Homecoming': '#4f46e5',
      'Batch Reunions': '#ec4899',
      'Career Events': '#8b5cf6',
      'Awards': '#f59e0b',
      'Community Service': '#14b8a6',
    };
    return colorMap[category] || '#64748b';
  };
  
  const handleRefreshGallery = async () => {
    setIsLoading(true);
    try {
      const items = await getAllGalleryItems();
      // Filter for approved items only
      const approvedItems = items.filter(item => item.isApproved);
      setGalleryImages(approvedItems);
    } catch (error) {
      console.error('Error refreshing gallery items:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAlbumChange = (album: string) => {
    if (album.toLowerCase() === 'all photos') {
      setActiveAlbum('all');
    } else {
      setActiveAlbum(album.toLowerCase().replace(/\s+/g, '-'));
    }
  };

  const handleViewModeChange = (mode: 'grid' | 'masonry') => {
    if (mode === 'masonry' && !currentUser) {
      alert('Please sign in to view your bookmarks');
      return;
    }
    setViewMode(mode);
  };

  const openUploadModal = () => {
    if (!currentUser) {
      alert('Please sign in to upload photos');
      return;
    }
    
    setShowUploadModal(true);
    setUploadStep('select');
    setUploadFile(null);
    setPreviewUrl('');
    setUploadDetails({
      title: '',
      album: 'Homecoming'
    });
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setUploadFile(file);
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setUploadStep('details');
        setUploadDetails({
          ...uploadDetails,
          title: file.name.split('.')[0].replace(/[_-]/g, ' ')
        });
      } else {
        alert('Please select an image file.');
      }
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUploadDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setUploadDetails({
      ...uploadDetails,
      [e.target.name]: e.target.value
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      alert('Please select an image to upload');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Get current user
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        alert('You must be logged in to upload photos');
        return;
      }
      
      // Validate file
      const validation = validateImageFile(uploadFile, 5); // 5MB max
      if (!validation.valid) {
        alert(validation.message);
        return;
      }
      
      // Resize and convert to base64 with more aggressive compression
      const base64Image = await resizeImage(uploadFile, 800, 800, 0.6, true);
      
      // Format the album category properly for storage
      const albumCategory = uploadDetails.album.toLowerCase().replace(/\s+/g, '-');
      
      // Create gallery item
      const newGalleryItem: Omit<GalleryPost, 'id' | 'postedDate'> = {
        title: uploadDetails.title,
        description: `Uploaded by ${currentUser.name}`,
        imageUrl: base64Image,
        albumCategory: albumCategory, // Save to albumCategory field
        event: '', // Keep event empty - would be linked to a specific event in admin
        isApproved: false, // Needs admin approval
        postedBy: currentUser.id,
        likedBy: [], // Initialize with empty array
        bookmarkedBy: [] // Initialize with empty array
      };
      
      // Add to Firestore
      await addGalleryItem(newGalleryItem);
      
      // Show success message
      setUploadStep('success');
      
      // Refresh gallery after a short delay
      setTimeout(() => {
        handleRefreshGallery();
      }, 2000);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('There was an error uploading your photo. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTryAgain = () => {
    setUploadStep('select');
    setUploadFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  return (
    <div className="gallery-page">
      <div className="gallery-layout">
        <div className="gallery-content">
          <div className="gallery-header">
            <div className="gallery-title-section">
              <div className="gallery-icon">
                <Image size={24} />
              </div>
              <h1>Photo Gallery</h1>
            </div>
            
            <div className="gallery-actions">
              <button 
                className="upload-button" 
                onClick={openUploadModal}
                aria-label="Upload photo"
              >
                <Upload size={16} />
                <span>Upload</span>
              </button>
              <div className="view-toggle">
                <button 
                  className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => handleViewModeChange('grid')}
                  aria-label="Grid view (all photos)"
                  title="Show all photos"
                >
                  <Grid size={18} />
                </button>
                <button 
                  className={`view-mode-btn ${viewMode === 'masonry' ? 'active' : ''}`}
                  onClick={() => handleViewModeChange('masonry')}
                  aria-label="Bookmarks view"
                  title="Show bookmarked photos"
                >
                  <Bookmark size={18} />
                </button>
              </div>
              
              <button className="refresh-button" onClick={handleRefreshGallery} disabled={isLoading}>
                <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
              </button>
            </div>
          </div>
          
          <div className="gallery-controls">
            <div className="gallery-search">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search photos by title or album..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="gallery-filters">
              {albumCategories.map((album, index) => (
                <button 
                  key={index} 
                  className={`album-filter ${
                    album.toLowerCase() === 'all photos' 
                      ? activeAlbum === 'all' ? 'active' : ''
                      : activeAlbum === album.toLowerCase().replace(/\s+/g, '-') ? 'active' : ''
                  }`}
                  onClick={() => handleAlbumChange(album)}
                >
                  {album}
                </button>
              ))}
            </div>
          </div>
          
          {isLoading ? (
            <div className="loading-gallery">
              <div className="gallery-skeleton-grid">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="gallery-skeleton-item"></div>
                ))}
              </div>
            </div>
          ) : filteredImages.length > 0 ? (
            <div className={`gallery-grid ${viewMode === 'masonry' ? 'masonry-layout' : ''}`}>
              {filteredImages.map(image => (
                <div key={image.id} className={`gallery-item ${viewMode === 'masonry' ? 'masonry-item' : ''}`}>
                  <GalleryCard 
                    image={{
                      id: image.id,
                      title: image.title,
                      url: image.imageUrl,
                      date: image.postedDate,
                      album: getDisplayCategoryName(image.albumCategory),
                      likes: (image.likedBy?.length || 0)
                    }} 
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-gallery">
              <div className="empty-state-icon">
                <Image size={64} strokeWidth={1} color="#64748b" />
              </div>
              <h3 className="empty-state-title">
                {viewMode === 'masonry' ? 'No bookmarked photos found' : 'No photos found'}
              </h3>
              <p className="empty-state-message">
                {viewMode === 'masonry' ? 
                  "You haven't bookmarked any photos yet. Browse the gallery and bookmark photos you like!" :
                  searchTerm ? 
                    "No photos match your search criteria. Try a different search term." : 
                    activeAlbum !== 'all' ? 
                      `There are no photos in the ${activeAlbum.replace('-', ' ')} album yet.` : 
                      "There are no photos in the gallery yet. Check back later or upload photos yourself!"
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="upload-modal">
            <div className="modal-header">
              <h2>Upload a Photo</h2>
              <button className="close-modal" onClick={closeUploadModal}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-content">
              {uploadStep === 'select' && (
                <div className="upload-select-step">
                  <div className="upload-drop-area" onClick={triggerFileInput}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                      <path d="M12 12 L18 18"></path>
                    </svg>
                    <h3>Select a photo to upload</h3>
                    <p>Click to browse or drag and drop your photo here</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                  </div>

                  <div className="upload-guidelines">
                    <FileText size={24} />
                    <div>
                      <h4>Upload Guidelines</h4>
                      <ul>
                        <li>Accepted formats: JPG, PNG, GIF</li>
                        <li>Maximum file size: 10MB</li>
                        <li>All uploads require admin approval</li>
                        <li>Photos must be appropriate for all audiences</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {uploadStep === 'details' && previewUrl && (
                <div className="upload-details-step">
                  <div className="form-group">
                    <label htmlFor="title">Photo Title*</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={uploadDetails.title}
                      onChange={handleUploadDetailsChange}
                      required
                      className="form-control"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="album">Album*</label>
                    <select
                      id="album"
                      name="album"
                      value={uploadDetails.album}
                      onChange={handleUploadDetailsChange}
                      className="form-control"
                    >
                      {albumCategories.slice(1).map((album, index) => (
                        <option key={index} value={album}>
                          {album}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="admin-notice">
                    <div className="admin-notice-icon">!</div>
                    <p>Your upload will be reviewed by an admin before appearing in the gallery.</p>
                  </div>

                  <div className="preview-image-container">
                    <img src={previewUrl} alt="Preview" className="preview-image" />
                  </div>
                </div>
              )}

              {uploadStep === 'success' && (
                <div className="upload-success-step">
                  <div className="success-icon">
                    <svg viewBox="0 0 24 24" width="64" height="64">
                      <path
                        fill="#10b981"
                        d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10zm0-18c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm3.3 5.3l-4.6 4.6-2-2L7.3 13.3l3.4 3.4 6-6-1.4-1.4z"
                      ></path>
                    </svg>
                  </div>
                  <h3>Thank you for your submission!</h3>
                  <p>Your photo has been successfully uploaded and is pending admin approval.</p>
                  <p>You'll be notified when your photo is approved and added to the gallery.</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {uploadStep === 'select' && (
                <button className="btn btn-secondary" onClick={closeUploadModal}>
                  Cancel
                </button>
              )}
              
              {uploadStep === 'details' && (
                <>
                  <button className="btn btn-secondary" onClick={handleTryAgain}>
                    Back
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleUploadSubmit}
                    disabled={!uploadDetails.title || isSubmitting}
                  >
                    {isSubmitting ? 'Uploading...' : 'Upload Photo'}
                  </button>
                </>
              )}
              
              {uploadStep === 'success' && (
                <>
                  <button className="btn btn-secondary" onClick={openUploadModal}>
                    Upload Another
                  </button>
                  <button className="btn btn-primary" onClick={closeUploadModal}>
                    Done
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
