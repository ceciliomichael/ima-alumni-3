import { useState, useEffect, useRef } from 'react';
import { Image, Search, Bookmark, Upload, X, FileText, LayoutGrid } from 'lucide-react';
import GalleryCard from './components/GalleryCard';
import AlbumViewerModal from './components/AlbumViewerModal';
import FeaturedCarousel from '../../components/FeaturedCarousel';
import { addGalleryItem, subscribeToUniqueAlbums, createAlbum } from '../../services/firebase/galleryService';
import { GalleryPost, User } from '../../types';
import { getCurrentUser } from '../../services/firebase/userService';
import { resizeImage, validateImageFile } from '../../services/firebase/storageService';
import './Gallery.css';

const GalleryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [galleryImages, setGalleryImages] = useState<GalleryPost[]>([]);
  const [activeAlbum, setActiveAlbum] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStep, setUploadStep] = useState<'select' | 'details' | 'success'>('select');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadDetails, setUploadDetails] = useState({
    title: '',
    album: 'Homecoming'
  });
  
  const MAX_UPLOAD_FILES = 10;
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Album viewer modal state
  const [showAlbumViewer, setShowAlbumViewer] = useState(false);
  const [selectedAlbumItem, setSelectedAlbumItem] = useState<GalleryPost | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Albums categories
  const albumCategories = [
    'All Photos', 
    'Homecoming', 
    'Batch Reunions', 
    'Career Events', 
    'Awards', 
    'Community Service',
    'Other'
  ];
  
  // Known category slugs (excluding All Photos and Other)
  const knownCategorySlugs = [
    'homecoming',
    'batch-reunions',
    'career-events',
    'awards',
    'community-service'
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
  
  // Subscribe to gallery items from Firestore (real-time)
  useEffect(() => {
    setIsLoading(true);
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToUniqueAlbums((items) => {
      // Filter for approved items only
      const approvedItems = items.filter(item => item.isApproved);
      setGalleryImages(approvedItems);
      setIsLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Clean up the object URLs when the component unmounts
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Filter images based on search term, active album, and view mode (bookmarks)
  const filteredImages = galleryImages.filter(image => {
    // Search term filter
    const matchesSearch = searchTerm === '' || 
      image.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (image.description && image.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (image.albumTitle && image.albumTitle.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Album filter (using albumCategory)
    let matchesAlbum = false;
    if (activeAlbum === 'all') {
      matchesAlbum = true;
    } else if (activeAlbum === 'other') {
      // "Other" shows items that don't match any known category
      matchesAlbum = !knownCategorySlugs.includes(image.albumCategory || '');
    } else {
      // Compare the selected activeAlbum (e.g., 'batch-reunions')
      // with the stored image.albumCategory
      matchesAlbum = image.albumCategory === activeAlbum;
    }
    
    // Bookmarked filter (only when in masonry view)
    let matchesBookmarked = true;
    if (viewMode === 'masonry' && currentUser) {
      // Check if the image is bookmarked by the current user
      const isBookmarked: boolean = image.bookmarkedBy && 
                          Array.isArray(image.bookmarkedBy) && 
                          image.bookmarkedBy.includes(currentUser.id) || false;
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
    setUploadFiles([]);
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setUploadDetails({
      title: '',
      album: 'Homecoming'
    });
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setUploadFiles([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Convert FileList to array and filter for images only
      const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'));
      
      if (fileArray.length === 0) {
        alert('Please select image files only.');
        return;
      }
      
      if (fileArray.length > MAX_UPLOAD_FILES) {
        alert(`You can upload a maximum of ${MAX_UPLOAD_FILES} images at once. You selected ${fileArray.length}.`);
        return;
      }
      
      // Clean up old preview URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
      // Create preview URLs for all files
      const newPreviewUrls = fileArray.map(file => URL.createObjectURL(file));
      
      setUploadFiles(fileArray);
      setPreviewUrls(newPreviewUrls);
      setUploadStep('details');
      
      // Set default title based on first file or "Album" if multiple
      const defaultTitle = fileArray.length === 1 
        ? fileArray[0].name.split('.')[0].replace(/[_-]/g, ' ')
        : `Photo Album (${fileArray.length} photos)`;
      
      setUploadDetails({
        ...uploadDetails,
        title: defaultTitle
      });
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
    if (uploadFiles.length === 0) {
      alert('Please select at least one image to upload');
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
      
      // Validate all files
      for (const file of uploadFiles) {
        const validation = validateImageFile(file, 5); // 5MB max per file
        if (!validation.valid) {
          alert(`File "${file.name}": ${validation.message}`);
          return;
        }
      }
      
      // Format the album category properly for storage
      const albumCategory = uploadDetails.album.toLowerCase().replace(/\s+/g, '-');
      
      if (uploadFiles.length === 1) {
        // Single image upload - use existing logic
        const base64Image = await resizeImage(uploadFiles[0], 800, 800, 0.6, true);
        
        const newGalleryItem: Omit<GalleryPost, 'id' | 'postedDate'> = {
          title: uploadDetails.title,
          description: `Uploaded by ${currentUser.name}`,
          imageUrl: base64Image,
          albumCategory: albumCategory,
          event: '',
          isApproved: false,
          postedBy: currentUser.id,
          likedBy: [],
          bookmarkedBy: []
        };
        
        await addGalleryItem(newGalleryItem);
      } else {
        // Multiple images - create an album
        const processedImages: Array<{ url: string; title: string }> = [];
        
        for (let i = 0; i < uploadFiles.length; i++) {
          const file = uploadFiles[i];
          const base64Image = await resizeImage(file, 800, 800, 0.6, true);
          processedImages.push({
            url: base64Image,
            title: file.name.split('.')[0].replace(/[_-]/g, ' ')
          });
        }
        
        await createAlbum(
          uploadDetails.title,
          albumCategory,
          `Album uploaded by ${currentUser.name}`,
          processedImages,
          currentUser.id
        );
      }
      
      // Show success message
      setUploadStep('success');
      
      // Refresh gallery after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error uploading photo(s):', error);
      alert('There was an error uploading your photo(s). Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTryAgain = () => {
    setUploadStep('select');
    setUploadFiles([]);
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
  };
  
  const removeSelectedFile = (index: number) => {
    const newFiles = [...uploadFiles];
    const newUrls = [...previewUrls];
    
    URL.revokeObjectURL(newUrls[index]);
    newFiles.splice(index, 1);
    newUrls.splice(index, 1);
    
    setUploadFiles(newFiles);
    setPreviewUrls(newUrls);
    
    // If no files left, go back to select step
    if (newFiles.length === 0) {
      setUploadStep('select');
    } else {
      // Update title if it was auto-generated
      const defaultTitle = newFiles.length === 1 
        ? newFiles[0].name.split('.')[0].replace(/[_-]/g, ' ')
        : `Photo Album (${newFiles.length} photos)`;
      setUploadDetails(prev => ({ ...prev, title: defaultTitle }));
    }
  };

  // Album viewer handlers
  const handleImageClick = (galleryItem: GalleryPost, imageIndex: number = 0) => {
    setSelectedAlbumItem(galleryItem);
    setSelectedImageIndex(imageIndex);
    setShowAlbumViewer(true);
  };

  const closeAlbumViewer = () => {
    setShowAlbumViewer(false);
    setSelectedAlbumItem(null);
    setSelectedImageIndex(0);
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
                  onClick={() => setViewMode('grid')}
                  aria-label="Gallery view"
                  title="Show all photos"
                >
                  <LayoutGrid size={18} />
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
            
            {/* Swipeable filter buttons */}
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
              {albumCategories.map((album, index) => (
                <button 
                  key={index} 
                  className={`flex-shrink-0 snap-start px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                    ${album.toLowerCase() === 'all photos' 
                      ? activeAlbum === 'all' 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : activeAlbum === album.toLowerCase().replace(/\s+/g, '-') 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
            viewMode === 'masonry' ? (
              <div className="gallery-grid masonry-layout">
                {filteredImages.map(image => (
                  <div key={image.id} className="gallery-item masonry-item">
                    <GalleryCard 
                      image={{
                        id: image.id,
                        title: image.title,
                        url: image.imageUrl,
                        date: image.postedDate,
                        album: getDisplayCategoryName(image.albumCategory),
                        likes: (image.likedBy?.length || 0)
                      }}
                      galleryItem={image}
                      onImageClick={handleImageClick}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <FeaturedCarousel
                items={filteredImages}
                getKey={(item) => item.id}
                renderFeatured={(item) => (
                  <div 
                    className="gallery-featured-item"
                    onClick={() => handleImageClick(item, 0)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img 
                      src={item.imageUrl} 
                      alt={item.title}
                      className="gallery-featured-image"
                    />
                    <div className="gallery-featured-overlay">
                      <h3>{item.title}</h3>
                      <div className="gallery-featured-meta">
                        <span className="featured-album">{getDisplayCategoryName(item.albumCategory)}</span>
                        <span className="featured-date">{new Date(item.postedDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )}
                renderThumb={(item) => (
                  <img 
                    src={item.imageUrl} 
                    alt={item.title}
                  />
                )}
                loop={true}
              />
            )
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
              <h2>Upload Photos</h2>
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
                    <h3>Select photos to upload</h3>
                    <p>Click to browse or drag and drop (up to {MAX_UPLOAD_FILES} photos)</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                    />
                  </div>

                  <div className="upload-guidelines">
                    <FileText size={24} />
                    <div>
                      <h4>Upload Guidelines</h4>
                      <ul>
                        <li>Accepted formats: JPG, PNG, GIF</li>
                        <li>Maximum file size: 5MB per image</li>
                        <li>Upload up to {MAX_UPLOAD_FILES} images at once</li>
                        <li>All uploads require admin approval</li>
                        <li>Photos must be appropriate for all audiences</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {uploadStep === 'details' && previewUrls.length > 0 && (
                <div className="upload-details-step">
                  <div className="form-group">
                    <label htmlFor="title">{uploadFiles.length > 1 ? 'Album Title*' : 'Photo Title*'}</label>
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
                    <label htmlFor="album">Category*</label>
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

                  <div className="preview-images-grid">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="preview-image-item">
                        <img src={url} alt={`Preview ${index + 1}`} className="preview-image" />
                        <button 
                          type="button" 
                          className="remove-image-btn"
                          onClick={() => removeSelectedFile(index)}
                          title="Remove image"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="selected-count">{uploadFiles.length} {uploadFiles.length === 1 ? 'photo' : 'photos'} selected</p>
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
                  <p>Your {uploadFiles.length > 1 ? 'photos have' : 'photo has'} been successfully uploaded and {uploadFiles.length > 1 ? 'are' : 'is'} pending admin approval.</p>
                  <p>You'll be notified when your {uploadFiles.length > 1 ? 'photos are' : 'photo is'} approved and added to the gallery.</p>
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
                    {isSubmitting ? 'Uploading...' : `Upload ${uploadFiles.length > 1 ? 'Photos' : 'Photo'}`}
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

      {/* Album Viewer Modal */}
      {showAlbumViewer && selectedAlbumItem && (
        <AlbumViewerModal
          isOpen={showAlbumViewer}
          onClose={closeAlbumViewer}
          albumItem={selectedAlbumItem}
          currentImageIndex={selectedImageIndex}
        />
      )}
    </div>
  );
};

export default GalleryPage;
