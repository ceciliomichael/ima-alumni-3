import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import './GalleryViewerModal.css';

interface GalleryImage {
  postId: string;
  imageUrl: string;
  key: string;
}

interface GalleryViewerModalProps {
  images: GalleryImage[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const GalleryViewerModal = ({ images, currentIndex, onClose, onNavigate }: GalleryViewerModalProps) => {
  const handlePrevious = useCallback(() => {
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    onNavigate(newIndex);
  }, [currentIndex, images.length, onNavigate]);

  const handleNext = useCallback(() => {
    const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    onNavigate(newIndex);
  }, [currentIndex, images.length, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevious, handleNext, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const currentImage = images[currentIndex];

  return (
    <div className="gallery-viewer-overlay" onClick={onClose}>
      <button className="gallery-viewer-close" onClick={onClose}>
        <X size={24} />
      </button>

      <div className="gallery-viewer-content" onClick={(e) => e.stopPropagation()}>
        {/* Previous Button */}
        {images.length > 1 && (
          <button 
            className="gallery-nav-btn gallery-nav-prev" 
            onClick={handlePrevious}
            aria-label="Previous image"
          >
            <ChevronLeft size={32} />
          </button>
        )}

        {/* Image Container */}
        <div className="gallery-image-container">
          <img 
            src={currentImage.imageUrl} 
            alt={`Gallery image ${currentIndex + 1}`}
            className="gallery-viewer-image"
          />
        </div>

        {/* Next Button */}
        {images.length > 1 && (
          <button 
            className="gallery-nav-btn gallery-nav-next" 
            onClick={handleNext}
            aria-label="Next image"
          >
            <ChevronRight size={32} />
          </button>
        )}
      </div>

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="gallery-counter">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};

export default GalleryViewerModal;

