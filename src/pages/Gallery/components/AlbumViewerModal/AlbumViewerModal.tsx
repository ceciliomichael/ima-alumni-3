import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Bookmark, Calendar, User, Loader } from 'lucide-react';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { getCurrentUser } from '../../../../services/firebase/userService';
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
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [likeCount, setLikeCount] = useState(0);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        setUserId(user.id);
      }
    };
    fetchUser();
  }, []);

  // Check if user has liked/bookmarked when image changes
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!userId || albumImages.length === 0) return;
      
      const currentImage = albumImages[currentIndex];
      if (!currentImage) return;
      
      try {
        const galleryRef = doc(db, 'gallery_items', currentImage.id);
        const galleryDoc = await getDoc(galleryRef);
        
        if (galleryDoc.exists()) {
          const data = galleryDoc.data();
          setLiked(data.likedBy?.includes(userId) || false);
          setBookmarked(data.bookmarkedBy?.includes(userId) || false);
          setLikeCount(data.likedBy?.length || 0);
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };
    
    checkUserStatus();
  }, [userId, currentIndex, albumImages]);

  const loadAlbumImages = useCallback(async () => {
    if (!albumItem.albumId) {
      // Fallback: treat as single image
      setAlbumImages([albumItem]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const images = await getAlbumImages(albumItem.albumId);
      // If no images found, use the albumItem itself
      if (images.length === 0) {
        setAlbumImages([albumItem]);
      } else {
        setAlbumImages(images);
      }
    } catch (error) {
      console.error('Error loading album images:', error);
      // Fallback to showing the single item
      setAlbumImages([albumItem]);
    } finally {
      setIsLoading(false);
    }
  }, [albumItem]);

  useEffect(() => {
    if (isOpen) {
      // Reset image loaded state when modal opens
      setImageLoaded(false);
      
      if (albumItem.albumId && albumItem.isAlbum) {
        // It's an album - fetch all images in the album
        loadAlbumImages();
      } else {
        // It's a single image - just use the albumItem directly
        setAlbumImages([albumItem]);
        setIsLoading(false);
      }
    }
  }, [isOpen, albumItem, loadAlbumImages]);

  useEffect(() => {
    setCurrentIndex(currentImageIndex);
  }, [currentImageIndex]);

  const handlePrevious = useCallback(() => {
    if (albumImages.length > 0) {
      setImageLoaded(false);
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : albumImages.length - 1));
    }
  }, [albumImages.length]);

  const handleNext = useCallback(() => {
    if (albumImages.length > 0) {
      setImageLoaded(false);
      setCurrentIndex((prev) => (prev < albumImages.length - 1 ? prev + 1 : 0));
    }
  }, [albumImages.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
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
  }, [isOpen, onClose, handlePrevious, handleNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleLike = async () => {
    if (!userId) {
      alert('Please sign in to like photos');
      return;
    }
    
    const currentImage = albumImages[currentIndex];
    if (!currentImage) return;
    
    setIsLikeLoading(true);
    
    try {
      const galleryRef = doc(db, 'gallery_items', currentImage.id);
      
      if (liked) {
        await updateDoc(galleryRef, {
          likedBy: arrayRemove(userId)
        });
        setLikeCount(prev => prev - 1);
      } else {
        await updateDoc(galleryRef, {
          likedBy: arrayUnion(userId)
        });
        setLikeCount(prev => prev + 1);
      }
      
      setLiked(!liked);
    } catch (error) {
      console.error('Error updating like status:', error);
      alert('Failed to update like status. Please try again.');
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!userId) {
      alert('Please sign in to bookmark photos');
      return;
    }
    
    const currentImage = albumImages[currentIndex];
    if (!currentImage) return;
    
    setIsBookmarkLoading(true);
    
    try {
      const galleryRef = doc(db, 'gallery_items', currentImage.id);
      
      if (bookmarked) {
        await updateDoc(galleryRef, {
          bookmarkedBy: arrayRemove(userId)
        });
      } else {
        await updateDoc(galleryRef, {
          bookmarkedBy: arrayUnion(userId)
        });
      }
      
      setBookmarked(!bookmarked);
    } catch (error) {
      console.error('Error updating bookmark status:', error);
      alert('Failed to update bookmark status. Please try again.');
    } finally {
      setIsBookmarkLoading(false);
    }
  };

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
                  <button 
                    className={`action-button like-button ${liked ? 'active' : ''}`} 
                    aria-label="Like image"
                    onClick={handleLike}
                    disabled={isLikeLoading}
                  >
                    {isLikeLoading ? (
                      <Loader size={20} className="animate-spin" />
                    ) : (
                      <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
                    )}
                    <span>{likeCount}</span>
                  </button>
                  
                  <button 
                    className={`action-button bookmark-button ${bookmarked ? 'active' : ''}`} 
                    aria-label="Bookmark image"
                    onClick={handleBookmark}
                    disabled={isBookmarkLoading}
                  >
                    {isBookmarkLoading ? (
                      <Loader size={20} className="animate-spin" />
                    ) : (
                      <Bookmark size={20} fill={bookmarked ? 'currentColor' : 'none'} />
                    )}
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
