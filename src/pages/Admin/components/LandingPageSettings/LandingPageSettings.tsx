import { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { getLandingConfig, updateLandingConfig } from '../../../../services/firebase/landingService';
import AdminLayout from '../../layout/AdminLayout';
import './LandingPageSettings.css';

const LandingPageSettings = () => {
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [showOfficersCarousel, setShowOfficersCarousel] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const DEFAULT_MESSAGE = 
    "Once an Immaculatian, always an Immaculatian! Proud to be part of Immaculate Mary Academy, where dreams begin and success continues. Forever grateful for the memories and lessons!";

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const config = await getLandingConfig();
      setWelcomeMessage(config.welcomeMessage);
      setShowOfficersCarousel(config.showOfficersCarousel);
    } catch (error) {
      console.error('Error loading landing config:', error);
      setMessage({ type: 'error', text: 'Failed to load landing page configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const result = await updateLandingConfig(
        {
          welcomeMessage,
          showOfficersCarousel
        },
        'admin' // In production, use actual admin ID
      );

      if (result) {
        setMessage({ type: 'success', text: 'Landing page settings saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
      }
    } catch (error) {
      console.error('Error saving landing config:', error);
      setMessage({ type: 'error', text: 'An error occurred while saving settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Are you sure you want to reset the welcome message to default?')) {
      setWelcomeMessage(DEFAULT_MESSAGE);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Landing Page Settings">
        <div className="landing-settings-loading">
          <div className="loading-spinner"></div>
          <p>Loading settings...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Landing Page Settings">
      <div className="landing-settings-container">
        <div className="landing-settings-header">
          <div>
            <h2>Landing Page Configuration</h2>
            <p className="settings-description">
              Customize the content displayed on the public landing page
            </p>
          </div>
        </div>

        {message && (
          <div className={`settings-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="landing-settings-content">
          {/* Welcome Message Section */}
          <div className="settings-section">
            <div className="section-header">
              <h3>Welcome Message</h3>
              <button 
                className="reset-btn"
                onClick={handleResetToDefault}
                type="button"
              >
                <RefreshCw size={16} />
                Reset to Default
              </button>
            </div>
            
            <div className="form-group">
              <label htmlFor="welcomeMessage">Message Text</label>
              <textarea
                id="welcomeMessage"
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={5}
                placeholder="Enter welcome message..."
                className="welcome-textarea"
              />
              <span className="form-hint">
                This message appears on the landing page. Make it welcoming and inspiring!
              </span>
            </div>

            <div className="preview-section">
              <h4>Preview</h4>
              <div className="preview-box">
                <p className="preview-text">"{welcomeMessage}"</p>
              </div>
            </div>
          </div>

          {/* Officers Carousel Section */}
          <div className="settings-section">
            <h3>Officers Carousel</h3>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showOfficersCarousel}
                  onChange={(e) => setShowOfficersCarousel(e.target.checked)}
                  className="checkbox-input"
                />
                <span>Display Alumni Officers Carousel</span>
              </label>
              <span className="form-hint">
                When enabled, the landing page will show a carousel featuring current alumni officers
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="settings-actions">
            <button 
              className="save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="btn-spinner"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default LandingPageSettings;

