import { useState, useEffect } from 'react';
import { 
  Info, Building, Mail, Target, Award
} from 'lucide-react';
import AdminLayout from '../../layout/AdminLayout';
import {
  getHistoryItems,
  getVisionMission,
  getOrganizationChart,
  getContactInfo,
  HistoryItem,
  VisionMissionContent,
  OrganizationChart,
  ContactInfo
} from '../../../../services/firebase/aboutService';
import { 
  HistoryManagement,
  VisionMissionManagement,
  OrganizationManagement,
  ContactManagement
} from './components';
import './AboutUsManagement.css';

type TabType = 'history' | 'vision' | 'organization' | 'contact';

const AboutUsManagement = () => {
  const [activeTab, setActiveTab] = useState<TabType>('history');
  const [loading, setLoading] = useState(true);
  
  // State for each section
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [visionMission, setVisionMission] = useState<VisionMissionContent | null>(null);
  const [organizationChart, setOrganizationChart] = useState<OrganizationChart | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);

  // Load all data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
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
      console.error('Error loading about data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="About Us Management">
        <div className="about-management-loading">
          <div className="loading-spinner"></div>
          <p>Loading about us content...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="About Us Management">
      <div className="about-management-container">
        <div className="about-management-header">
          <div className="about-management-title">
            <div className="about-management-icon">
              <Info size={20} />
            </div>
            <h2>About Us Content Management</h2>
          </div>
        </div>

        <div className="about-management-tabs">
          <button 
            className={`about-management-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <Award size={18} />
            <span>Achievements</span>
          </button>
          <button 
            className={`about-management-tab ${activeTab === 'vision' ? 'active' : ''}`}
            onClick={() => setActiveTab('vision')}
          >
            <Target size={18} />
            <span>Vision & Mission</span>
          </button>
          <button 
            className={`about-management-tab ${activeTab === 'organization' ? 'active' : ''}`}
            onClick={() => setActiveTab('organization')}
          >
            <Building size={18} />
            <span>Organization</span>
          </button>
          <button 
            className={`about-management-tab ${activeTab === 'contact' ? 'active' : ''}`}
            onClick={() => setActiveTab('contact')}
          >
            <Mail size={18} />
            <span>Contact</span>
          </button>
        </div>

        <div className="about-management-content">
          {/* History Tab */}
          {activeTab === 'history' && (
            <HistoryManagement 
              historyItems={historyItems} 
              onRefresh={loadAllData} 
            />
          )}

          {/* Vision & Mission Tab */}
          {activeTab === 'vision' && (
            <VisionMissionManagement 
              visionMission={visionMission} 
              onRefresh={loadAllData} 
            />
          )}

          {/* Organization Tab */}
          {activeTab === 'organization' && (
            <OrganizationManagement 
              organizationChart={organizationChart} 
              onRefresh={loadAllData} 
            />
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <ContactManagement 
              contactInfo={contactInfo} 
              onRefresh={loadAllData} 
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AboutUsManagement;
