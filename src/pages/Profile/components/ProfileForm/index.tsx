import { useState, ChangeEvent } from 'react';
import { Save, X, User, AtSign, Briefcase, Building, MapPin, FileText, Linkedin, Twitter, Globe, Camera, Image } from 'lucide-react';
import { User as UserType } from '../../../../types';
import './styles.css';

interface ProfileFormProps {
  user: UserType;
  onSave: (formData: ProfileFormData) => void;
  onCancel: () => void;
}

export interface ProfileFormData {
  name: string;
  email: string;
  batch: string;
  job: string;
  company: string;
  location: string;
  bio: string;
  linkedin: string;
  twitter: string;
  website: string;
  profileImage?: string;
  coverPhoto?: string;
  showOfficerInfo?: boolean;
}

const ProfileForm = ({ user, onSave, onCancel }: ProfileFormProps) => {
  const [formData, setFormData] = useState<ProfileFormData>({
    name: user.name || '',
    email: user.email || '',
    batch: user.batch || '',
    job: user.job || '',
    company: user.company || '',
    location: user.location || '',
    bio: user.bio || '',
    linkedin: user.socialLinks?.linkedin || '',
    twitter: user.socialLinks?.twitter || '',
    website: user.socialLinks?.website || '',
    profileImage: user.profileImage,
    coverPhoto: user.coverPhoto,
    showOfficerInfo: user.showOfficerInfo !== undefined ? user.showOfficerInfo : true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Function to crop image to desired aspect ratio
  const cropImage = (imageData: string, type: 'profile' | 'cover'): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject('Could not get canvas context');
          return;
        }
        
        let width, height, sourceX, sourceY, sourceWidth, sourceHeight;
        
        if (type === 'profile') {
          // For profile images, crop to square (1:1 aspect ratio)
          if (img.width > img.height) {
            // Landscape image - crop sides
            sourceWidth = img.height;
            sourceHeight = img.height;
            sourceX = (img.width - img.height) / 2;
            sourceY = 0;
          } else {
            // Portrait or square image - crop top/bottom
            sourceWidth = img.width;
            sourceHeight = img.width;
            sourceX = 0;
            sourceY = (img.height - img.width) / 2;
          }
          
          // Set canvas size to appropriate dimensions (max 400x400)
          const maxSize = 400;
          width = Math.min(sourceWidth, maxSize);
          height = width;
        } else {
          // For cover photos, crop to 3:1 aspect ratio
          const targetRatio = 3/1;
          
          if (img.width / img.height > targetRatio) {
            // If image is wider than target ratio, crop sides
            sourceHeight = img.height;
            sourceWidth = img.height * targetRatio;
            sourceX = (img.width - sourceWidth) / 2;
            sourceY = 0;
          } else {
            // If image is taller than target ratio, crop top/bottom
            sourceWidth = img.width;
            sourceHeight = img.width / targetRatio;
            sourceX = 0;
            sourceY = (img.height - sourceHeight) / 2;
          }
          
          // Set canvas size to appropriate dimensions (max 800px width)
          const maxWidth = 800;
          width = Math.min(sourceWidth, maxWidth);
          height = width / targetRatio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw cropped image to canvas
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, width, height
        );
        
        // Convert canvas to data URL
        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(croppedDataUrl);
      };
      
      img.onerror = () => {
        reject('Error loading image');
      };
      
      img.src = imageData;
    });
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        [type === 'profile' ? 'profileImage' : 'coverPhoto']: 'Image size should be less than 2MB'
      }));
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({
        ...prev,
        [type === 'profile' ? 'profileImage' : 'coverPhoto']: 'Only image files are allowed'
      }));
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          try {
            // Crop the image
            const croppedImage = await cropImage(reader.result, type);
            
            // Update the form data with the processed image
            setFormData(prev => ({
              ...prev,
              [type === 'profile' ? 'profileImage' : 'coverPhoto']: croppedImage
            }));
            
            // Clear error
            if (errors[type === 'profile' ? 'profileImage' : 'coverPhoto']) {
              setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[type === 'profile' ? 'profileImage' : 'coverPhoto'];
                return newErrors;
              });
            }
            
            // Reset the file input to allow selecting the same file again
            e.target.value = '';
          } catch (err) {
            console.error('Error processing image:', err);
            setErrors(prev => ({
              ...prev,
              [type === 'profile' ? 'profileImage' : 'coverPhoto']: 'Error processing image'
            }));
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error reading file:', err);
      setErrors(prev => ({
        ...prev,
        [type === 'profile' ? 'profileImage' : 'coverPhoto']: 'Error reading file'
      }));
    }
  };

  const removeImage = (type: 'profile' | 'cover') => {
    setFormData(prev => ({
      ...prev,
      [type === 'profile' ? 'profileImage' : 'coverPhoto']: undefined
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.batch) {
      newErrors.batch = 'Batch year is required';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSave(formData);
    }
  };

  return (
    <div className="profile-form-container">
      <div className="form-header">
        <h2>Edit Profile</h2>
        <button type="button" className="close-btn" onClick={onCancel}>
          <X size={18} />
        </button>
      </div>

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Profile Images</h3>
          
          <div className="form-images">
            <div className="form-group">
              <label>Profile Photo</label>
              <div className="image-upload-container">
                {formData.profileImage ? (
                  <div className="image-preview">
                    <img src={formData.profileImage} alt="Profile preview" />
                    <button 
                      type="button" 
                      className="remove-image" 
                      onClick={() => removeImage('profile')}
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <label className="upload-label">
                    <Camera size={24} />
                    <span>Upload Profile Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'profile')}
                      className="hidden-input"
                    />
                  </label>
                )}
              </div>
              {errors.profileImage && <div className="form-error">{errors.profileImage}</div>}
            </div>
            
            <div className="form-group">
              <label>Cover Photo</label>
              <div className="image-upload-container cover-upload">
                {formData.coverPhoto ? (
                  <div className="image-preview cover-preview">
                    <img src={formData.coverPhoto} alt="Cover preview" />
                    <button 
                      type="button" 
                      className="remove-image" 
                      onClick={() => removeImage('cover')}
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <label className="upload-label">
                    <Image size={24} />
                    <span>Upload Cover Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'cover')}
                      className="hidden-input"
                    />
                  </label>
                )}
              </div>
              {errors.coverPhoto && <div className="form-error">{errors.coverPhoto}</div>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Personal Information</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">
                <User size={16} />
                <span>Full Name</span>
              </label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                placeholder="Your full name"
                required
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="email">
                <AtSign size={16} />
                <span>Email</span>
              </label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                value={formData.email} 
                onChange={handleInputChange} 
                placeholder="Your email address"
                required
              />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="batch">
                <User size={16} />
                <span>Batch</span>
              </label>
              <input 
                type="text" 
                id="batch" 
                name="batch" 
                value={formData.batch} 
                onChange={handleInputChange} 
                placeholder="Your batch year"
                required
              />
              {errors.batch && <div className="form-error">{errors.batch}</div>}
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Professional Information</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="job">
                <Briefcase size={16} />
                <span>Job Title</span>
              </label>
              <input 
                type="text" 
                id="job" 
                name="job" 
                value={formData.job} 
                onChange={handleInputChange} 
                placeholder="Your job title"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="company">
                <Building size={16} />
                <span>Company</span>
              </label>
              <input 
                type="text" 
                id="company" 
                name="company" 
                value={formData.company} 
                onChange={handleInputChange} 
                placeholder="Company name"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="location">
                <MapPin size={16} />
                <span>Location</span>
              </label>
              <input 
                type="text" 
                id="location" 
                name="location" 
                value={formData.location} 
                onChange={handleInputChange} 
                placeholder="City, Country"
              />
            </div>
          </div>
          
          <div className="form-group full-width">
            <label htmlFor="bio">
              <FileText size={16} />
              <span>Bio</span>
            </label>
            <textarea 
              id="bio" 
              name="bio" 
              rows={4} 
              value={formData.bio} 
              onChange={handleInputChange} 
              placeholder="Tell us about yourself"
            ></textarea>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Social Media</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="linkedin">
                <Linkedin size={16} />
                <span>LinkedIn</span>
              </label>
              <input 
                type="text" 
                id="linkedin" 
                name="linkedin" 
                value={formData.linkedin} 
                onChange={handleInputChange} 
                placeholder="LinkedIn profile URL"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="twitter">
                <Twitter size={16} />
                <span>Twitter</span>
              </label>
              <input 
                type="text" 
                id="twitter" 
                name="twitter" 
                value={formData.twitter} 
                onChange={handleInputChange} 
                placeholder="Twitter handle"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="website">
                <Globe size={16} />
                <span>Website</span>
              </label>
              <input 
                type="text" 
                id="website" 
                name="website" 
                value={formData.website} 
                onChange={handleInputChange} 
                placeholder="Personal website URL"
              />
            </div>
          </div>
        </div>
        
        {/* Officer Information section - only show if user has an officer position */}
        {user.officerPosition && (
          <div className="form-section">
            <h3 className="form-section-header">Officer Information</h3>
            <p className="form-section-description">
              You are assigned as {user.officerPosition.title}
              {user.officerPosition.batchYear ? ` for Batch ${user.officerPosition.batchYear}` : ''}.
            </p>
            <div className="form-input-group checkbox-group">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={formData.showOfficerInfo}
                  onChange={(e) => setFormData({
                    ...formData,
                    showOfficerInfo: e.target.checked
                  })}
                />
                <span className="checkbox-label">
                  Display officer position on my profile
                </span>
              </label>
              <p className="form-hint">
                When enabled, your position will be visible to other alumni on your profile.
              </p>
            </div>
          </div>
        )}
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-button"
            onClick={onCancel}
          >
            <X size={16} />
            <span>Cancel</span>
          </button>
          <button 
            type="submit" 
            className="save-button"
          >
            <Save size={16} />
            <span>Save Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm; 