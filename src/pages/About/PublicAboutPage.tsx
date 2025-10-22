import { useState, useEffect } from 'react';
import { Eye, Target, CheckSquare, MapPin, Mail, Phone } from 'lucide-react';
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
import '../About/About.css';

const PublicAboutPage = () => {
  const [activeTab, setActiveTab] = useState('history');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [visionMission, setVisionMission] = useState<VisionMissionContent | null>(null);
  const [organizationChart, setOrganizationChart] = useState<OrganizationChart | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);

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
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
          <button 
            className={`about-tab ${activeTab === 'vision' ? 'active' : ''}`}
            onClick={() => setActiveTab('vision')}
          >
            Vision & Mission
          </button>
          <button 
            className={`about-tab ${activeTab === 'organization' ? 'active' : ''}`}
            onClick={() => setActiveTab('organization')}
          >
            Organizational Chart
          </button>
          <button 
            className={`about-tab ${activeTab === 'contact' ? 'active' : ''}`}
            onClick={() => setActiveTab('contact')}
          >
            Contact Us
          </button>
        </div>

        <div className="about-content">
          {activeTab === 'history' && (
            <div className="history-section">
              <div className="section-header">
                <h2>Our History</h2>
                <p>A timeline of our journey and achievements</p>
              </div>
              
              {historyItems.length > 0 ? (
                <div className="timeline">
                  {historyItems.map((item) => (
                    <div key={item.id} className="timeline-item">
                      <div className="timeline-marker">
                        <div className="timeline-year">{item.year}</div>
                      </div>
                      <div className="timeline-content">
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
                <div className="vision-content">
                  <div className="vision-card">
                    <div className="card-icon">
                      <div className="icon-circle">
                        <Eye size={24} />
                      </div>
                    </div>
                    <div className="card-content">
                      <h3>Vision</h3>
                      <p>{visionMission.vision}</p>
                    </div>
                  </div>

                  <div className="mission-card">
                    <div className="card-icon">
                      <div className="icon-circle">
                        <Target size={24} />
                      </div>
                    </div>
                    <div className="card-content">
                      <h3>Mission</h3>
                      <p>{visionMission.mission}</p>
                    </div>
                  </div>

                  {visionMission.goals && visionMission.goals.length > 0 && (
                    <div className="goals-card">
                      <div className="card-icon">
                        <div className="icon-circle">
                          <CheckSquare size={24} />
                        </div>
                      </div>
                      <div className="card-content">
                        <h3>Goals</h3>
                        <ol className="goals-list">
                          {visionMission.goals.map((goal, index) => (
                            <li key={index}>{goal}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
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

export default PublicAboutPage;

