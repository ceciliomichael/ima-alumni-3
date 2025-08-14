import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, ShieldAlert } from 'lucide-react';
import { useAdminAuth } from './context/AdminAuthContext';
import '../Auth/Auth.css';

const AdminLoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();
  const { adminLogin } = useAdminAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
    
    // Clear login error
    if (loginError) {
      setLoginError('');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.password) {
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
      const user = await adminLogin(formData.username, formData.password);
      
      if (user) {
        navigate('/admin');
      } else {
        setLoginError('Invalid username or password. Please try again.');
      }
    } catch (error) {
      setLoginError('An error occurred during login. Please try again.');
    } finally {
      setIsSubmitting(false);
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
                <ShieldAlert className="auth-icon" />
                Admin Login
              </h1>
              <p className="auth-subtitle">Sign in to access the admin dashboard</p>
            </div>
            
            {loginError && (
              <div style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                color: 'var(--error-color)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem'
              }}>
                {loginError}
              </div>
            )}
            
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username" className="form-label">Username</label>
                <div className="input-group">
                  <div className="input-icon">
                    <Mail size={18} />
                  </div>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    className={`form-control ${errors.username ? 'error' : ''}`}
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>
                {errors.username && <div className="form-error">{errors.username}</div>}
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
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                {errors.password && <div className="form-error">{errors.password}</div>}
              </div>
              
              <div className="form-options">
                <div className="checkbox-group">
                  <input 
                    type="checkbox" 
                    id="rememberMe" 
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <label htmlFor="rememberMe">Remember me</label>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary login-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging in...' : 'Login to Admin Panel'}
              </button>
              
              <div className="auth-footer">
                <p>
                  <small>Default credentials: admin / admin123</small>
                </p>
              </div>
            </form>
          </div>
        </div>
        
        <div className="auth-illustration">
          <div className="illustration-content">
            <h2>Administration Portal</h2>
            <p>Manage alumni records, events, jobs, and more.</p>
            <div className="illustration-image">
              <img src="/images/admin-illustration.svg" alt="Admin Portal" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage; 