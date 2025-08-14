import { useState, ChangeEvent, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, GraduationCap, Camera, Image } from 'lucide-react';
import { registerUser } from '../../services/firebase/userService';
import './Auth.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    batch: '',
    password: '',
    confirmPassword: '',
  });
  
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Function to crop image to desired aspect ratio
  const cropImage = (imageData: string, type: 'profile' | 'cover'): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image() as HTMLImageElement;
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
            
            if (type === 'profile') {
              setProfileImage(croppedImage);
              // Clear error
              if (errors.profileImage) {
                setErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors.profileImage;
                  return newErrors;
                });
              }
            } else {
              setCoverPhoto(croppedImage);
              // Clear error
              if (errors.coverPhoto) {
                setErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors.coverPhoto;
                  return newErrors;
                });
              }
            }
          } catch (err) {
            setErrors(prev => ({
              ...prev,
              [type === 'profile' ? 'profileImage' : 'coverPhoto']: 'Error processing image'
            }));
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setErrors(prev => ({
        ...prev,
        [type === 'profile' ? 'profileImage' : 'coverPhoto']: 'Error reading file'
      }));
    }
  };

  const removeImage = (type: 'profile' | 'cover') => {
    if (type === 'profile') {
      setProfileImage(null);
    } else {
      setCoverPhoto(null);
    }
  };

  const validateForm = () => {
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
    } else if (!/^\d{4}$/.test(formData.batch)) {
      newErrors.batch = 'Batch year must be a 4-digit year';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Register user using our Firebase service
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        batch: formData.batch,
        profileImage: profileImage || undefined,
        coverPhoto: coverPhoto || undefined,
        // Initialize with empty values for optional fields
        bio: '',
        job: '',
        company: '',
        location: '',
        socialLinks: {
          linkedin: '',
          twitter: '',
          website: ''
        }
      };
      
      const newUser = await registerUser(userData);
      
      if (newUser) {
        // Registration successful
        setRegistrationSuccess(true);
      } else {
        // Email already exists
        setErrors(prev => ({
          ...prev,
          email: 'Email is already registered'
        }));
      }
    } catch (error) {
      console.error('Error registering user:', error);
      setErrors(prev => ({
        ...prev,
        general: 'An error occurred during registration. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="auth-container success-container">
        <div className="success-card">
          <div className="auth-logo">
            <img src="/images/alumni-conlogo.png" alt="IMA Alumni Logo" />
          </div>
          <div className="success-icon">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="40" fill="#10b981" fillOpacity="0.1" />
              <path d="M25 40L35 50L55 30" stroke="#10b981" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2>Registration Successful!</h2>
          <p>Your registration has been submitted successfully. Please wait for the admin or batch president approval.</p>
          <Link to="/login" className="btn btn-primary">Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-logo">
            <img src="/images/alumni-conlogo.png" alt="IMA Alumni Logo" />
          </div>
          
          <div className="auth-form-container">
            <div className="auth-header">
              <h1 className="auth-title">
                <UserPlus className="auth-icon" />
                Register for IMA Alumni
              </h1>
              <p className="auth-subtitle">Create your account to connect with fellow alumni</p>
            </div>
            
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="profile-images-section">
                <div className="form-group">
                  <label className="form-label">Profile Photo</label>
                  <div className="image-upload-container">
                    {profileImage ? (
                      <div className="image-preview">
                        <img src={profileImage} alt="Profile preview" />
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
                        <Camera size={20} />
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
                  <label className="form-label">Cover Photo</label>
                  <div className="image-upload-container cover-upload">
                    {coverPhoto ? (
                      <div className="image-preview cover-preview">
                        <img src={coverPhoto} alt="Cover preview" />
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
                        <Image size={20} />
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

              <div className="form-group">
                <label htmlFor="name" className="form-label">Full Name</label>
                <div className="input-group">
                  <div className="input-icon">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className={`form-control ${errors.name ? 'error' : ''}`}
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                {errors.name && <div className="form-error">{errors.name}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address</label>
                <div className="input-group">
                  <div className="input-icon">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`form-control ${errors.email ? 'error' : ''}`}
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="batch" className="form-label">Batch Year</label>
                <div className="input-group">
                  <div className="input-icon">
                    <GraduationCap size={18} />
                  </div>
                  <input
                    type="text"
                    id="batch"
                    name="batch"
                    className={`form-control ${errors.batch ? 'error' : ''}`}
                    placeholder="Enter your batch year (e.g., 2020)"
                    value={formData.batch}
                    onChange={handleChange}
                  />
                </div>
                {errors.batch && <div className="form-error">{errors.batch}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="input-group">
                  <div className="input-icon">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className={`form-control ${errors.password ? 'error' : ''}`}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                {errors.password && <div className="form-error">{errors.password}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <div className="input-group">
                  <div className="input-icon">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
                {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
              </div>
              
              <button
                type="submit"
                className="btn btn-primary register-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Registering...' : 'Create Account'}
              </button>
              
              <div className="auth-footer">
                <p>Already have an account? <Link to="/login" className="auth-link">Login</Link></p>
              </div>
            </form>
          </div>
        </div>
        
        <div className="auth-illustration">
          <img src="/images/register-illustration.svg" alt="Join the Alumni Community" />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
