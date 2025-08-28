import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, CreditCard, GraduationCap } from 'lucide-react';
import { loginByAlumniId, AlumniIdLoginResult, validateAlumniIdInput } from '../../services/auth/alumniIdLoginService';
import { User as ServiceUser } from '../../services/firebase/userService';
import { formatAlumniId } from '../../utils/alumniIdUtils';
import './Auth.css';

interface LoginPageProps {
  onLoginSuccess: (user: ServiceUser) => void;
}

const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
  const [formData, setFormData] = useState({
    alumniId: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Format Alumni ID as user types
    if (name === 'alumniId') {
      // Remove non-digits and limit to 12 digits
      const digitsOnly = value.replace(/\D/g, '').slice(0, 12);
      const formatted = formatAlumniId(digitsOnly);
      
      setFormData((prev) => ({
        ...prev,
        [name]: formatted,
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
      const result: AlumniIdLoginResult = await loginByAlumniId(formData.alumniId);
      
      if (result.success && result.user) {
        // Successful login
        onLoginSuccess(result.user);
        navigate('/landing');
      } else {
        // Failed login
        setErrors({
          alumniId: result.error || 'Login failed. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setErrors({
        alumniId: 'An error occurred during login. Please try again.'
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
                    placeholder="1234 5678 9012"
                    value={formData.alumniId}
                    onChange={handleChange}
                    autoComplete="off"
                    maxLength={14}
                  />
                </div>
                {errors.alumniId && <div className="form-error">{errors.alumniId}</div>}
                <div className="form-hint">
                  Enter your 12-digit Alumni ID provided by the administrator
                </div>
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
