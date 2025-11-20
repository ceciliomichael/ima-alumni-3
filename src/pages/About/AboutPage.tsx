import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Mail, Phone } from 'lucide-react';
import {
  getHistoryItems,
  getVisionMission,
  getOrganizationChart,
  getContactInfo,
  HistoryItem,
  VisionMissionContent,
  OrganizationChart,
  ContactInfo
} from '../../services/firebase/aboutService';
import AboutSlideshow from '../../components/AboutSlideshow';
import './About.css';

const AboutPage = () => {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(tab || 'history');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [visionMission, setVisionMission] = useState<VisionMissionContent | null>(null);
  const [organizationChart, setOrganizationChart] = useState<OrganizationChart | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Update active tab when URL parameter changes
  useEffect(() => {
    if (tab && ['history', 'vision', 'organization', 'contact'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [tab]);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const [history, vision, organization, contact] = await Promise.all([
          getHistoryItems(),
          getVisionMission(),
          getOrganizationChart(),
          getContactInfo()
        ]);

        setHistoryItems(history);
        setVisionMission(vision);
        setOrganizationChart(organization);
        setContactInfo(contact);
      } catch (error) {
        console.error('Error loading about content:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  if (loading) {
    return (
      <div className="about-loading">
        <div className="loading-spinner"></div>
        <p>Loading about us content...</p>
      </div>
    );
  }

  return (
    <div className="about-page">
      <div className="about-header">
        <div className="about-title">
          <h1>About Us</h1>
          <p>Learn more about Immaculate Mary Academy Alumni Association</p>
        </div>
      </div>

      <div className="about-container">
        <div className="about-tabs">
          <button 
            className={`about-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => navigate('/about-us/history')}
          >
            History
          </button>
          <button 
            className={`about-tab ${activeTab === 'vision' ? 'active' : ''}`}
            onClick={() => navigate('/about-us/vision')}
          >
            Vision & Mission
          </button>
          <button 
            className={`about-tab ${activeTab === 'organization' ? 'active' : ''}`}
            onClick={() => navigate('/about-us/organization')}
          >
            Organizational Chart
          </button>
          <button 
            className={`about-tab ${activeTab === 'contact' ? 'active' : ''}`}
            onClick={() => navigate('/about-us/contact')}
          >
            Contact Us
          </button>
        </div>

        <div className="about-content">
          {activeTab === 'history' && (
            <div className="history-section">
              <div className="section-header">
                <h2>Achievements</h2>
                <p>A timeline of our journey and achievements</p>
              </div>
              
              {historyItems.length > 0 ? (
                <AboutSlideshow
                  type="history"
                  historyItems={historyItems}
                  autoPlayMs={4000}
                />
              ) : (
                <div className="empty-content">
                  <p>No history items available at the moment.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vision' && (
            <div className="vision-section">
              <div className="section-header">
                <h2>Vision & Mission</h2>
                <p>Our guiding principles and aspirations</p>
              </div>
              
              {visionMission ? (
                <AboutSlideshow
                  type="vision"
                  visionMission={visionMission}
                  autoPlayMs={5000}
                />
              ) : (
                <div className="empty-content">
                  <p>Vision and mission information will be available soon.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'organization' && (
            <div className="organization-section">
              <div className="section-header">
                <h2>Organizational Chart</h2>
                <p>Our organizational structure and leadership</p>
              </div>
              
              {organizationChart ? (
                <div className="org-chart-container">
                  <div className="org-chart-header">
                    <h3>{organizationChart.title}</h3>
                    {organizationChart.description && (
                      <p className="org-chart-description">{organizationChart.description}</p>
                    )}
                  </div>
                  <div className="org-chart-image-container">
                    <img 
                      src={organizationChart.imageUrl} 
                      alt={organizationChart.title}
                      className="org-chart-image"
                    />
                  </div>
                </div>
              ) : (
                <div className="empty-content">
                  <div className="empty-icon">📊</div>
                  <h3>Organizational Chart Coming Soon</h3>
                  <p>Our organizational chart will be available shortly.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="contact-section">
              <div className="section-header">
                <h2>Contact Us</h2>
                <p>Get in touch with us</p>
              </div>
              
              {contactInfo ? (
                <div className="contact-grid">
                  <div className="contact-card">
                    <div className="contact-icon">
                      <MapPin size={24} />
                    </div>
                    <div className="contact-info">
                      <h3>Address</h3>
                      <p>{contactInfo.address}</p>
                    </div>
                  </div>

                  <div className="contact-card">
                    <div className="contact-icon">
                      <Mail size={24} />
                    </div>
                    <div className="contact-info">
                      <h3>Email</h3>
                      <p>
                        <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>
                      </p>
                      {contactInfo.supportEmail && (
                        <p>
                          <a href={`mailto:${contactInfo.supportEmail}`}>{contactInfo.supportEmail}</a>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="contact-card">
                    <div className="contact-icon">
                      <Phone size={24} />
                    </div>
                    <div className="contact-info">
                      <h3>Phone</h3>
                      <p>
                        <a href={`tel:${contactInfo.phone}`}>{contactInfo.phone}</a>
                      </p>
                      {contactInfo.supportPhone && (
                        <p>
                          <a href={`tel:${contactInfo.supportPhone}`}>{contactInfo.supportPhone}</a>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-content">
                  <p>Contact information will be available soon.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AboutPage; 