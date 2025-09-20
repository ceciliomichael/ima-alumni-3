import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldAlert } from 'lucide-react';
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
  const { adminLogin, isAdminAuthenticated, isLoading } = useAdminAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAdminAuthenticated) {
      navigate('/admin');
    }
  }, [isAdminAuthenticated, isLoading, navigate]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="auth-container single-column">
        <div className="auth-wrapper single-column">
          <div className="auth-card single-column">
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <div>Checking admin authentication...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      const user = await adminLogin(formData.username, formData.password, formData.rememberMe);
      
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
    <div className="auth-container single-column">
      <div className="auth-wrapper single-column">
        <div className="auth-card single-column">
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
                backgroundColor: 'oklch(0.6 0.25 0 / 0.1)', 
                color: 'oklch(0.6 0.25 0)',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                border: '2px solid oklch(0.6 0.25 0 / 0.2)'
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
      </div>
    </div>
  );
};

export default AdminLoginPage; 