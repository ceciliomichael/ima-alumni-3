import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, User as UserIcon, GraduationCap } from 'lucide-react';
import { loginByName, loginWithSelectedUser, NameLoginResult } from '../../services/auth/nameLoginService';
import { User as ServiceUser } from '../../services/firebase/userService';
import ImagePlaceholder from '../../components/ImagePlaceholder/ImagePlaceholder';
import './Auth.css';

interface LoginPageProps {
  onLoginSuccess: (user: ServiceUser) => void;
}

const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
  const [formData, setFormData] = useState({
    name: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [multipleMatches, setMultipleMatches] = useState<ServiceUser[]>([]);
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Please enter your full name';
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
    setMultipleMatches([]);
    
    try {
      const result: NameLoginResult = await loginByName(formData.name);
      
      if (result.success && result.user) {
        // Successful login
        onLoginSuccess(result.user);
        navigate('/');
      } else if (result.multipleMatches && result.multipleMatches.length > 0) {
        // Multiple matches found - show selection
        setMultipleMatches(result.multipleMatches);
        setErrors({
          name: result.error || 'Multiple accounts found. Please select your profile below.'
        });
      } else {
        // Failed login
        setErrors({
          name: result.error || 'Login failed. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setErrors({
        name: 'An error occurred during login. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserSelection = async (user: ServiceUser) => {
    setIsSubmitting(true);
    
    try {
      const result = await loginWithSelectedUser(user);
      
      if (result.success && result.user) {
        onLoginSuccess(result.user);
        navigate('/');
      } else {
        setErrors({
          name: result.error || 'Login failed. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error selecting user:', error);
      setErrors({
        name: 'An error occurred during login. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
      setMultipleMatches([]);
    }
  };

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
                <LogIn className="auth-icon" />
                Access IMA Alumni Portal
              </h1>
              <p className="auth-subtitle">Enter your full name to access the alumni portal.</p>
            </div>
            
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name" className="form-label">Full Name</label>
                <div className="input-group">
                  <div className="input-icon">
                    <UserIcon size={18} />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className={`form-control ${errors.name ? 'error' : ''}`}
                    placeholder="Enter your full name as registered"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
                  />
                </div>
                {errors.name && <div className="form-error">{errors.name}</div>}
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary login-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Verifying...' : 'Enter Portal'}
              </button>
            </form>

            {/* Multiple matches selection */}
            {multipleMatches.length > 0 && (
              <div className="multiple-matches-section">
                <h3>Select Your Profile</h3>
                <div className="user-selection-list">
                  {multipleMatches.map((user) => (
                    <button
                      key={user.id}
                      className="user-selection-item"
                      onClick={() => handleUserSelection(user)}
                      disabled={isSubmitting}
                    >
                      <div className="user-avatar-small">
                        {user.profileImage ? (
                          <img src={user.profileImage} alt={user.name} />
                        ) : (
                          <ImagePlaceholder 
                            isAvatar 
                            size="small" 
                            name={user.name} 
                          />
                        )}
                      </div>
                      <div className="user-info">
                        <div className="user-name">{user.name}</div>
                        <div className="user-batch">
                          <GraduationCap size={14} />
                          Batch {user.batch || 'N/A'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="auth-illustration">
          <div className="illustration-content">
            <div className="illustration-logo">
              <img src="/images/alumni-conlogo.png" alt="IMA Alumni Logo" />
            </div>
            <h2>Welcome to Immaculate Mary Academy (IMA)</h2>
            <p>Connect with fellow alumni and stay updated with your alma mater community.</p>
            <div className="illustration-image">
              <img src="/images/alumni-connection.svg" alt="Alumni Connection" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
