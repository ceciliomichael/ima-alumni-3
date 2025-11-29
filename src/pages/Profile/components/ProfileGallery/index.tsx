import { useState } from 'react';
import { Image } from 'lucide-react';
import GalleryViewerModal from './GalleryViewerModal';
import './styles.css';

interface Post {
  id: string;
  images?: string[];
  imageUrl?: string; // Backward compatibility for single image posts
  createdAt: string;
}

interface ProfileGalleryProps {
  posts: Post[];
}

const ProfileGallery = ({ posts }: ProfileGalleryProps) => {
  const [showViewer, setShowViewer] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Extract all images from posts that have images (support both images array and single imageUrl)
  const allImages = posts
    .filter(post => (post.images && post.images.length > 0) || post.imageUrl)
    .flatMap(post => {
      // Handle posts with images array
      if (post.images && post.images.length > 0) {
        return post.images.map((imageUrl, index) => ({
          postId: post.id,
          imageUrl,
          key: `${post.id}-${index}`
        }));
      }
      // Handle posts with single imageUrl (backward compatibility)
      if (post.imageUrl) {
        return [{
          postId: post.id,
          imageUrl: post.imageUrl,
          key: `${post.id}-0`
        }];
      }
      return [];
    });
  
  // Get the first 6 images for display
  const galleryImages = allImages.slice(0, 6);
  
  // Count total number of images
  const totalImagesCount = allImages.length;

  const handleImageClick = (clickedIndex: number) => {
    setCurrentImageIndex(clickedIndex);
    setShowViewer(true);
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
  };

  const handleNavigate = (newIndex: number) => {
    setCurrentImageIndex(newIndex);
  };
  
  return (
    <>
      <div className="profile-gallery-card">
        <div className="gallery-header">
          <h3>
            <Image size={18} />
            Gallery
          </h3>
          <span className="gallery-count">{totalImagesCount} photos</span>
        </div>
        
        {galleryImages.length > 0 ? (
          <div className="gallery-grid">
            {galleryImages.map((image, index) => (
              <div 
                key={image.key} 
                className="gallery-item"
                onClick={() => handleImageClick(index)}
              >
                <img src={image.imageUrl} alt="Post" />
              </div>
            ))}
          </div>
        ) : (
          <div className="gallery-empty">
            <Image size={32} />
            <p>No photos yet</p>
          </div>
        )}
      </div>

      {showViewer && (
        <GalleryViewerModal
          images={allImages}
          currentIndex={currentImageIndex}
          onClose={handleCloseViewer}
          onNavigate={handleNavigate}
        />
      )}
    </>
  );
};

export default ProfileGallery;

