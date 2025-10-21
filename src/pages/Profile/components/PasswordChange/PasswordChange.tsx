import { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { changePassword } from '../../../../services/auth/passwordService';
import './PasswordChange.css';

interface PasswordChangeProps {
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PasswordChange = ({ userId, onSuccess, onCancel }: PasswordChangeProps) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Clear success message when user starts typing
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const result = await changePassword(
        userId,
        formData.currentPassword,
        formData.newPassword,
        formData.confirmPassword
      );

      if (result.success) {
        setSuccessMessage('Password changed successfully!');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } else {
        setErrors({ general: result.error || 'Failed to change password' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setErrors({ general: 'An error occurred while changing password' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="password-change-container">
      <div className="password-change-header">
        <Lock size={24} />
        <h3>Change Password</h3>
      </div>

      {errors.general && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{errors.general}</span>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="password-change-form">
        <div className="form-group">
          <label htmlFor="currentPassword" className="form-label">
            Current Password
          </label>
          <div className="password-input-wrapper">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              id="currentPassword"
              name="currentPassword"
              className="form-control"
              value={formData.currentPassword}
              onChange={handleChange}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('current')}
              className="password-toggle-btn"
            >
              {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="newPassword" className="form-label">
            New Password
          </label>
          <div className="password-input-wrapper">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              id="newPassword"
              name="newPassword"
              className="form-control"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Enter new password"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('new')}
              className="password-toggle-btn"
            >
              {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="form-hint">
            Password must be at least 6 characters long
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm New Password
          </label>
          <div className="password-input-wrapper">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              className="form-control"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirm')}
              className="password-toggle-btn"
            >
              {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="password-change-actions">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-outline"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Changing Password...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PasswordChange;

