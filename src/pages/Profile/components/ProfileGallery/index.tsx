import { Image } from 'lucide-react';
import './styles.css';

interface Post {
  id: string;
  imageUrl?: string;
  createdAt: string;
}

interface ProfileGalleryProps {
  posts: Post[];
}

const ProfileGallery = ({ posts }: ProfileGalleryProps) => {
  // Filter posts that have images
  const postsWithImages = posts.filter(post => post.imageUrl);
  
  // Get the first 6 images
  const galleryImages = postsWithImages.slice(0, 6);
  
  return (
    <div className="profile-gallery-card">
      <div className="gallery-header">
        <h3>
          <Image size={18} />
          Gallery
        </h3>
        <span className="gallery-count">{postsWithImages.length} photos</span>
      </div>
      
      {galleryImages.length > 0 ? (
        <div className="gallery-grid">
          {galleryImages.map((post) => (
            <div key={post.id} className="gallery-item">
              <img src={post.imageUrl} alt="Post" />
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
  );
};

export default ProfileGallery;

