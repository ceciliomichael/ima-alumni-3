import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, CreditCard, Lock, Eye, EyeOff } from 'lucide-react';
import { loginByAlumniIdAndPassword, AlumniIdLoginResult, validateAlumniIdInput } from '../../services/auth/alumniIdLoginService';
import { User as ServiceUser } from '../../services/firebase/userService';
import './Auth.css';

interface LoginPageProps {
  onLoginSuccess: (user: ServiceUser) => void;
}

const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
  const [formData, setFormData] = useState({
    alumniId: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Format Alumni ID as user types
    if (name === 'alumniId') {
      // Allow digits, letters, and dash, limit to 8 characters (6 digits + dash + 1 letter)
      const cleaned = value.replace(/[^0-9A-Za-z-]/g, '').slice(0, 8).toUpperCase();
      
      setFormData((prev) => ({
        ...prev,
        [name]: cleaned,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    
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
    
    const validation = validateAlumniIdInput(formData.alumniId);
    if (!validation.isValid) {
      newErrors.alumniId = validation.error || 'Please enter a valid Alumni ID';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
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
      const result: AlumniIdLoginResult = await loginByAlumniIdAndPassword(formData.alumniId, formData.password);
      
      if (result.success && result.user) {
        // Successful login
        onLoginSuccess(result.user);
        navigate('/landing');
      } else {
        // Failed login
        setErrors({
          general: result.error || 'Login failed. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setErrors({
        general: 'An error occurred during login. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container single-column">
      <div className="auth-wrapper single-column">
        <div className="auth-card single-column">
          <div className="auth-logo">
            <img src="/images/alumni-conlogo.png" alt="IMA Alumni Logo" />
          </div>
          
          <div className="auth-form-container">
            <div className="auth-header">
              <h1 className="auth-title">
                <LogIn className="auth-icon" />
                Access IMA Alumni Portal
              </h1>
              <p className="auth-subtitle">Enter your Alumni ID to access the alumni portal.</p>
            </div>
            
            <form className="auth-form" onSubmit={handleSubmit}>
              {errors.general && <div className="form-error" style={{ marginBottom: '1rem', textAlign: 'center' }}>{errors.general}</div>}
              
              <div className="form-group">
                <label htmlFor="alumniId" className="form-label">Alumni ID</label>
                <div className="input-group">
                  <div className="input-icon">
                    <CreditCard size={18} />
                  </div>
                  <input
                    type="text"
                    id="alumniId"
                    name="alumniId"
                    className={`form-control ${errors.alumniId ? 'error' : ''}`}
                    placeholder="123456-A"
                    value={formData.alumniId}
                    onChange={handleChange}
                    autoComplete="username"
                    maxLength={8}
                  />
                </div>
                {errors.alumniId && <div className="form-error">{errors.alumniId}</div>}
                <div className="form-hint">
                  Enter your Alumni ID (6 digits, dash, 1 letter)
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="input-group">
                  <div className="input-icon">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className={`form-control ${errors.password ? 'error' : ''}`}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    style={{ paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--text-muted)'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <div className="form-error">{errors.password}</div>}
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary login-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Verifying...' : 'Enter Portal'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
