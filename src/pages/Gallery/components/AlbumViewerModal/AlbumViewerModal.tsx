import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Bookmark, Calendar, User, Download, Share2 } from 'lucide-react';
import { GalleryPost } from '../../../../types';
import { getAlbumImages } from '../../../../services/firebase/galleryService';
import './AlbumViewerModal.css';

interface AlbumViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  albumItem: GalleryPost;
  currentImageIndex?: number;
}

const AlbumViewerModal = ({ isOpen, onClose, albumItem, currentImageIndex = 0 }: AlbumViewerModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(currentImageIndex);
  const [albumImages, setAlbumImages] = useState<GalleryPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (isOpen && albumItem.albumId) {
      loadAlbumImages();
    }
  }, [isOpen, albumItem.albumId]);

  useEffect(() => {
    setCurrentIndex(currentImageIndex);
  }, [currentImageIndex]);

  const loadAlbumImages = async () => {
    if (!albumItem.albumId) return;
    
    setIsLoading(true);
    try {
      const images = await getAlbumImages(albumItem.albumId);
      setAlbumImages(images);
    } catch (error) {
      console.error('Error loading album images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    if (albumImages.length > 0) {
      setImageLoaded(false);
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : albumImages.length - 1));
    }
  };

  const handleNext = () => {
    if (albumImages.length > 0) {
      setImageLoaded(false);
      setCurrentIndex((prev) => (prev < albumImages.length - 1 ? prev + 1 : 0));
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        handlePrevious();
        break;
      case 'ArrowRight':
        handleNext();
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, albumImages.length]);

  const currentImage = albumImages[currentIndex];

  if (!isOpen) return null;

  return (
    <div className="album-viewer-backdrop" onClick={onClose}>
      <div className="album-viewer-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="album-viewer-header">
          <div className="album-header-info">
            <h2 className="album-title">{albumItem.albumTitle || albumItem.title}</h2>
            <div className="album-meta-info">
              <span className="image-counter">
                {albumImages.length > 0 ? `${currentIndex + 1} of ${albumImages.length}` : '0 of 0'}
              </span>
              <span className="album-category">{albumItem.albumCategory?.replace('-', ' ')}</span>
            </div>
          </div>
          
          <button className="close-button" onClick={onClose} aria-label="Close album viewer">
            <X size={24} />
          </button>
        </div>

        {/* Main Content */}
        <div className="album-viewer-main">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading album...</p>
            </div>
          ) : currentImage ? (
            <>
              {/* Image Display Area */}
              <div className="image-display-container">
                <div className="image-wrapper">
                  <img 
                    src={currentImage.imageUrl} 
                    alt={currentImage.title}
                    className={`main-image ${imageLoaded ? 'loaded' : ''}`}
                    onLoad={() => setImageLoaded(true)}
                  />
                  
                  {!imageLoaded && (
                    <div className="image-loading">
                      <div className="image-loading-spinner"></div>
                    </div>
                  )}
                </div>

                {/* Navigation Controls */}
                {albumImages.length > 1 && (
                  <>
                    <button 
                      className="nav-control nav-prev" 
                      onClick={handlePrevious}
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={28} />
                    </button>
                    
                    <button 
                      className="nav-control nav-next" 
                      onClick={handleNext}
                      aria-label="Next image"
                    >
                      <ChevronRight size={28} />
                    </button>
                  </>
                )}
              </div>

              {/* Image Info Sidebar */}
              <div className="image-info-sidebar">
                <div className="image-details">
                  <h3 className="image-title">{currentImage.title}</h3>
                  {currentImage.description && (
                    <p className="image-description">{currentImage.description}</p>
                  )}
                  
                  <div className="image-metadata">
                    <div className="meta-item">
                      <Calendar size={16} />
                      <span>{new Date(currentImage.postedDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</span>
                    </div>
                    <div className="meta-item">
                      <User size={16} />
                      <span>Posted by Admin</span>
                    </div>
                  </div>
                </div>

                <div className="image-actions">
                  <button className="action-button like-button" aria-label="Like image">
                    <Heart size={20} />
                    <span>{currentImage.likedBy?.length || 0}</span>
                  </button>
                  
                  <button className="action-button bookmark-button" aria-label="Bookmark image">
                    <Bookmark size={20} />
                  </button>
                  
                  <button className="action-button share-button" aria-label="Share image">
                    <Share2 size={20} />
                  </button>
                </div>

                {/* Thumbnail Navigation */}
                {albumImages.length > 1 && (
                  <div className="thumbnail-navigation">
                    <h4 className="thumbnail-title">Album Images</h4>
                    <div className="thumbnail-grid">
                      {albumImages.map((image, index) => (
                        <button
                          key={image.id}
                          className={`thumbnail-item ${index === currentIndex ? 'active' : ''}`}
                          onClick={() => {
                            setImageLoaded(false);
                            setCurrentIndex(index);
                          }}
                          aria-label={`View image ${index + 1}: ${image.title}`}
                        >
                          <img src={image.imageUrl} alt={image.title} />
                          <div className="thumbnail-overlay">
                            <span className="thumbnail-number">{index + 1}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="error-container">
              <p>No images found in this album.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlbumViewerModal;
