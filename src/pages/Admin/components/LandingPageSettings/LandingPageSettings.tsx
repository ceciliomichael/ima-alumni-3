import { Info } from 'lucide-react';
import AdminLayout from '../../layout/AdminLayout';

import './LandingPageSettings.css';

const LandingPageSettings = () => {
  return (
    <AdminLayout title="Landing Page Settings">
      <div className="landing-settings-container">
        <div className="landing-settings-header">
          <div>
            <h2>Landing Page Configuration</h2>
            <p className="settings-description">
              The landing page now displays the Alumni Officers slideshow
            </p>
          </div>
        </div>

        <div className="landing-settings-content">
          <div className="settings-section info-card">
            <div className="info-icon">
              <Info size={48} />
            </div>
            <h3>Officers Slideshow Active</h3>
            <p>
              The landing page now always displays a crossfading slideshow of Alumni Officers with their names, positions, and photos.
              The quote section has been removed and replaced with this dynamic officers display.
            </p>
            <p className="info-note">
              To manage officers, go to <strong>Alumni Officers</strong> in the admin menu.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default LandingPageSettings;
