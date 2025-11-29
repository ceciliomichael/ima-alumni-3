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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 sm:p-6 relative overflow-hidden">
      {/* Background image overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50 z-0"
        style={{ backgroundImage: "url('/login-bg.jpg')" }}
      />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Logo */}
          <div className="flex justify-center pt-6 pb-4 px-4">
            <img 
              src="/images/alumni-conlogo.png" 
              alt="IMA Alumni Logo" 
              className="h-16 sm:h-20 w-auto object-contain"
            />
          </div>
          
          {/* Form Container */}
          <div className="px-4 sm:px-8 pb-6 sm:pb-8">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="flex items-center justify-center gap-2 text-lg sm:text-xl font-bold text-gray-900 mb-2">
                <LogIn size={20} className="text-primary flex-shrink-0" />
                <span className="break-words">Access IMA Alumni Portal</span>
              </h1>
              <p className="text-sm text-gray-600">Enter your Alumni ID to access the alumni portal.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center">
                  {errors.general}
                </div>
              )}
              
              {/* Alumni ID Field */}
              <div>
                <label htmlFor="alumniId" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Alumni ID
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <CreditCard size={18} />
                  </div>
                  <input
                    type="text"
                    id="alumniId"
                    name="alumniId"
                    className={`w-full h-11 pl-10 pr-4 rounded-lg border ${errors.alumniId ? 'border-red-500' : 'border-gray-300'} bg-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all`}
                    placeholder="123456-A"
                    value={formData.alumniId}
                    onChange={handleChange}
                    autoComplete="username"
                    maxLength={8}
                  />
                </div>
                {errors.alumniId && <p className="mt-1.5 text-xs text-red-500">{errors.alumniId}</p>}
                <p className="mt-1.5 text-xs text-gray-500">Enter your Alumni ID (6 digits, dash, 1 letter)</p>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className={`w-full h-11 pl-10 pr-12 rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-300'} bg-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all`}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
              </div>
              
              {/* Submit Button */}
              <button 
                type="submit" 
                className="w-full h-11 mt-2 rounded-lg bg-secondary text-gray-900 font-semibold hover:bg-secondary-dark transition-colors disabled:opacity-50"
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
