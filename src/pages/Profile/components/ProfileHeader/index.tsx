import { useState, ChangeEvent } from 'react';
import { Camera, Edit, Award, Briefcase, Building, MapPin, X } from 'lucide-react';
import { User } from '../../../../types';
import ImagePlaceholder from '../../../../components/ImagePlaceholder/ImagePlaceholder';
import './styles.css';

interface ProfileHeaderProps {
  user: User;
  onEditClick: () => void;
  showEditButton?: boolean;
  currentUserId?: string | null;
  isFollowing?: boolean;

  onImageChange?: (type: 'profile' | 'cover', imageData: string) => void;
}

const ProfileHeader = ({ 
  user, 
  onEditClick, 
  showEditButton = true,
  currentUserId,
  onImageChange
}: ProfileHeaderProps) => {
  const isViewingSelf = currentUserId === user.id;
  const [isUploading, setIsUploading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed');
      return;
    }
    
    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string' && onImageChange) {
        onImageChange(type, reader.result);
        
        // Trigger event to update user data across tabs
        window.dispatchEvent(new Event('storage'));
        
        // Force a refresh of the app state
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'currentUser'
        }));
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };
  
  // Format dates for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
  };
  
  // Determine if officer information should be shown
  const showOfficerInfo = 
    user.officerPosition && 
    (user.showOfficerInfo !== false || currentUserId === user.id);
  
  return (
    <div className="profile-header">
      <div className="profile-cover" style={user.coverPhoto ? { backgroundImage: `url(${user.coverPhoto})` } : {}}>
        <div className="cover-overlay"></div>
        {isViewingSelf && (
          <label className="change-cover-btn">
            <Camera size={16} />
            <span>{isUploading ? 'Uploading...' : 'Change Cover'}</span>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'cover')}
              className="hidden-input"
              disabled={isUploading}
            />
          </label>
        )}
      </div>
      
      <div className="profile-info-wrapper">
        <div
          className="profile-avatar clickable-avatar"
          onClick={() => setShowImageModal(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowImageModal(true);
            }
          }}
          aria-label="View profile picture"
        >
          {user.profileImage ? (
            <img src={user.profileImage} alt={user.name} />
          ) : (
            <ImagePlaceholder 
              isAvatar 
              size="large" 
              name={user.name || ''}
              className="avatar-placeholder" 
            />
          )}
          {isViewingSelf && (
            <label 
              className="change-avatar-btn" 
              aria-label="Change profile picture"
              onClick={(e) => e.stopPropagation()}
            >
              <Camera size={16} />
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'profile')}
                className="hidden-input"
                disabled={isUploading}
              />
            </label>
          )}
        </div>
        
        <div className="profile-info">
          <div className="profile-info-row">
            <div className="profile-left-section">
              <h3 className="section-title">About Me</h3>
              <p className="user-bio">{user.bio || 'No bio available'}</p>
              {(user.job || user.company || user.location) && (
                <div className="personal-info-row">
                  {user.job && (
                    <div className="personal-info-item">
                      <Briefcase size={14} />
                      <span>{user.job}</span>
                    </div>
                  )}
                  {user.company && (
                    <div className="personal-info-item">
                      <Building size={14} />
                      <span>{user.company}</span>
                    </div>
                  )}
                  {user.location && (
                    <div className="personal-info-item">
                      <MapPin size={14} />
                      <span>{user.location}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="profile-name-section">
              <div className="name-and-badge">
                <h1>
                  {user.name}
                  {/* Officer badge - only show if user has an officer position and has chosen to display it */}
                  {showOfficerInfo && user.officerPosition && (
                    <div className="officer-badge" title={`${user.officerPosition.title} since ${formatDate(user.officerPosition.startDate)}`}>
                      <Award size={16} />
                      <span>{user.officerPosition.title}</span>
                      {user.officerPosition.batchYear && (
                        <span className="batch-year">Batch {user.officerPosition.batchYear}</span>
                      )}
                    </div>
                  )}
                </h1>
              </div>
            </div>
            
            <div className="profile-right-section">
              <div className="profile-quick-info">
                <div className="profile-batch">Batch {user.batch}</div>
                {showEditButton && (
                  <button 
                    className="edit-profile-btn"
                    onClick={onEditClick}
                  >
                    <Edit size={16} />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>
              
              {/* Officer details section - only show if user has enabled it */}
              {showOfficerInfo && user.officerPosition && (
                <div className="officer-details">
                  <span className="officer-title">
                    {user.officerPosition.title}
                    {user.officerPosition.batchYear && ` (Batch ${user.officerPosition.batchYear})`}
                  </span>
                  <span className="officer-tenure">
                    Since {formatDate(user.officerPosition.startDate)}
                    {user.officerPosition.endDate && ` until ${formatDate(user.officerPosition.endDate)}`}
                  </span>
                  {currentUserId === user.id && !user.showOfficerInfo && (
                    <span className="officer-visibility-note">
                      (Only visible to you)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Image Modal */}
      {showImageModal && (
        <div
          className="image-modal-overlay"
          onClick={() => setShowImageModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Profile picture preview"
        >
          <div className="image-modal-content">
            <button
              className="image-modal-close"
              onClick={() => setShowImageModal(false)}
              aria-label="Close"
            >
              <X size={24} />
            </button>
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <ImagePlaceholder
                isAvatar
                size="large"
                name={user.name || ''}
                className="modal-avatar-placeholder"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileHeader; 