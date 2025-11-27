import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAdminAuth } from './context/AdminAuthContext';
import { updateAdminPassword, clearAllAdminSessions } from '../../services/firebase/adminService';
import '../Auth/Auth.css';

const AdminPasswordSetupPage = () => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { adminUser, adminLogout, isLoading } = useAdminAuth();

  // Redirect if not authenticated or doesn't need password change
  if (!isLoading && !adminUser) {
    navigate('/admin/login');
    return null;
  }

  if (!isLoading && adminUser && !adminUser.mustChangePassword) {
    navigate('/admin');
    return null;
  }

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="auth-container single-column">
        <div className="auth-wrapper single-column">
          <div className="auth-card single-column">
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <div>Loading...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
    
    // Clear submit error
    if (submitError) {
      setSubmitError('');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
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
    
    if (!adminUser) {
      setSubmitError('No admin user found. Please log in again.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const success = await updateAdminPassword(adminUser.id, formData.newPassword);
      
      if (success) {
        // Clear all sessions to force re-login with new password
        clearAllAdminSessions();
        adminLogout();
        
        // Redirect to login with success message
        navigate('/admin/login', { 
          state: { message: 'Password updated successfully. Please log in with your new password.' }
        });
      } else {
        setSubmitError('Failed to update password. Please try again.');
      }
    } catch {
      setSubmitError('An error occurred while updating password. Please try again.');
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
                <ShieldCheck className="auth-icon" />
                Set Up Your Password
              </h1>
              <p className="auth-subtitle">
                For security, please set a new password for your admin account
              </p>
            </div>
            
            {submitError && (
              <div style={{ 
                backgroundColor: 'oklch(0.6 0.25 0 / 0.1)', 
                color: 'oklch(0.6 0.25 0)',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                border: '2px solid oklch(0.6 0.25 0 / 0.2)'
              }}>
                {submitError}
              </div>
            )}
            
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="newPassword" className="form-label">New Password</label>
                <div className="input-group">
                  <div className="input-icon">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    name="newPassword"
                    className={`form-control ${errors.newPassword ? 'error' : ''}`}
                    placeholder="Enter new password"
                    value={formData.newPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666'
                    }}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.newPassword && <div className="form-error">{errors.newPassword}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <div className="input-group">
                  <div className="input-icon">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666'
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary login-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Setting Password...' : 'Set Password & Continue'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPasswordSetupPage;
