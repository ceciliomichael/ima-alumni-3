import { Heart, Bookmark, Calendar, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { getCurrentUser } from '../../../../services/firebase/userService';
import './GalleryCard.css';

interface GalleryImage {
  id: string;
  title: string;
  url: string;
  date: string;
  album: string;
  likes: number;
}

interface GalleryCardProps {
  image: GalleryImage;
}

const GalleryCard = ({ image }: GalleryCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch current user and check if user has liked/bookmarked this image
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setUserId(user.id);
          
          // Check if user has liked this image
          const galleryRef = doc(db, 'gallery_items', image.id);
          const galleryDoc = await getDoc(galleryRef);
          
          if (galleryDoc.exists()) {
            const data = galleryDoc.data();
            // Check if likedBy array contains current user ID
            if (data.likedBy && Array.isArray(data.likedBy)) {
              setLiked(data.likedBy.includes(user.id));
            }
            
            // Check if bookmarkedBy array contains current user ID
            if (data.bookmarkedBy && Array.isArray(data.bookmarkedBy)) {
              setBookmarked(data.bookmarkedBy.includes(user.id));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    fetchUserData();
  }, [image.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!userId) {
      alert('Please sign in to like photos');
      return;
    }
    
    setIsLikeLoading(true);
    
    try {
      const galleryRef = doc(db, 'gallery_items', image.id);
      
      if (liked) {
        // Remove like
        await updateDoc(galleryRef, {
          likedBy: arrayRemove(userId)
        });
      } else {
        // Add like
        await updateDoc(galleryRef, {
          likedBy: arrayUnion(userId)
        });
      }
      
      // Toggle local state
      setLiked(!liked);
    } catch (error) {
      console.error('Error updating like status:', error);
      alert('Failed to update like status. Please try again.');
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!userId) {
      alert('Please sign in to bookmark photos');
      return;
    }
    
    setIsBookmarkLoading(true);
    
    try {
      const galleryRef = doc(db, 'gallery_items', image.id);
      
      if (bookmarked) {
        // Remove bookmark
        await updateDoc(galleryRef, {
          bookmarkedBy: arrayRemove(userId)
        });
      } else {
        // Add bookmark
        await updateDoc(galleryRef, {
          bookmarkedBy: arrayUnion(userId)
        });
      }
      
      // Toggle local state
      setBookmarked(!bookmarked);
    } catch (error) {
      console.error('Error updating bookmark status:', error);
      alert('Failed to update bookmark status. Please try again.');
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  return (
    <div 
      className="gallery-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="gallery-card-image">
        <img src={image.url} alt={image.title} />
        <div className={`image-overlay ${isHovered ? 'visible' : ''}`}>
          <div className="overlay-actions">
            <button 
              className={`overlay-btn ${liked ? 'active' : ''}`}
              onClick={handleLike}
              aria-label="Like image"
              disabled={isLikeLoading}
            >
              {isLikeLoading ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <Heart size={18} />
              )}
            </button>
            <button 
              className={`overlay-btn ${bookmarked ? 'active' : ''}`}
              onClick={handleBookmark}
              aria-label="Bookmark image"
              disabled={isBookmarkLoading}
            >
              {isBookmarkLoading ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <Bookmark size={18} />
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="gallery-card-info">
        <h3>{image.title}</h3>
        <div className="gallery-card-meta">
          <span className="album-tag">{image.album}</span>
          <span className="date-info">
            <Calendar size={14} />
            {new Date(image.date).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GalleryCard; 