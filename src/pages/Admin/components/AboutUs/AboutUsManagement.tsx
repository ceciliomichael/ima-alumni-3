import { useState, useEffect } from 'react';
import { 
  Info, Building, Mail, Plus, Edit, Trash2, Save, X, 
  MapPin, Phone, Target, History, Upload, Image
} from 'lucide-react';
import AdminLayout from '../../layout/AdminLayout';
import ConfirmDialog from '../../../../components/ConfirmDialog';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  getHistoryItems,
  getVisionMission,
  getOrganizationChart,
  getContactInfo,
  addHistoryItem,
  updateVisionMission,
  updateOrganizationChart,
  updateContactInfo,
  deleteAboutContent,
  updateAboutContent,
  HistoryItem,
  VisionMissionContent,
  OrganizationChart,
  ContactInfo,
  getAboutContentBySection
} from '../../../../services/firebase/aboutService';
import './AboutUsManagement.css';

type TabType = 'history' | 'vision' | 'organization' | 'contact';

const AboutUsManagement = () => {
  const [activeTab, setActiveTab] = useState<TabType>('history');
  const [loading, setLoading] = useState(true);
  const { adminUser } = useAdminAuth();
  
  // State for each section
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [visionMission, setVisionMission] = useState<VisionMissionContent | null>(null);
  const [organizationChart, setOrganizationChart] = useState<OrganizationChart | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  
  // Form states
  const [editingHistory, setEditingHistory] = useState<HistoryItem | null>(null);
  const [editingVisionMission, setEditingVisionMission] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  
  // Form data states
  const [historyForm, setHistoryForm] = useState({
    year: new Date().getFullYear(),
    title: '',
    description: '',
    order: 0
  });
  
  const [visionMissionForm, setVisionMissionForm] = useState({
    vision: '',
    mission: '',
    goals: ['', '', '', '']
  });
  
  const [organizationForm, setOrganizationForm] = useState({
    title: '',
    description: '',
    imageUrl: ''
  });
  
  const [contactForm, setContactForm] = useState({
    address: '',
    email: '',
    phone: '',
    supportEmail: '',
    supportPhone: ''
  });
  
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    itemId: string;
    itemType: string;
  }>({ isOpen: false, itemId: '', itemType: '' });

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
      
      // Set form data for vision & mission, organization, and contact
      if (vision) {
        setVisionMissionForm({
          vision: vision.vision,
          mission: vision.mission,
          goals: vision.goals.length >= 4 ? vision.goals : [...vision.goals, '', '', '', ''].slice(0, 4)
        });
      }
      
      if (organization) {
        setOrganizationForm({
          title: organization.title,
          description: organization.description || '',
          imageUrl: organization.imageUrl
        });
      }
      
      if (contact) {
        setContactForm({
          address: contact.address,
          email: contact.email,
          phone: contact.phone,
          supportEmail: contact.supportEmail || '',
          supportPhone: contact.supportPhone || ''
        });
      }
    } catch (error) {
      console.error('Error loading about data:', error);
    } finally {
      setLoading(false);
    }
  };

  // History functions
  const handleAddHistory = () => {
    setEditingHistory({
      id: '',
      year: new Date().getFullYear(),
      title: '',
      description: '',
      order: historyItems.length
    });
    setHistoryForm({
      year: new Date().getFullYear(),
      title: '',
      description: '',
      order: historyItems.length
    });
  };

  const handleEditHistory = (item: HistoryItem) => {
    setEditingHistory(item);
    setHistoryForm({
      year: item.year,
      title: item.title,
      description: item.description,
      order: item.order
    });
  };

  const handleSaveHistory = async () => {
    if (!adminUser) return;
    
    try {
      if (editingHistory?.id) {
        // Update existing - use the Firebase document ID
        const aboutContent = await getAboutContentBySection('history');
        const existingItem = aboutContent.find(item => item.id === editingHistory.id);
        
        if (existingItem) {
          await updateAboutContent(editingHistory.id, {
            content: {
              ...(existingItem.content as HistoryItem),
              year: historyForm.year,
              title: historyForm.title,
              description: historyForm.description,
              order: historyForm.order
            },
            updatedBy: adminUser.name
          });
        }
      } else {
        // Add new
        await addHistoryItem(historyForm, adminUser.name);
      }
      
      await loadAllData();
      setEditingHistory(null);
    } catch (error) {
      console.error('Error saving history item:', error);
    }
  };

  // Vision & Mission functions
  const handleSaveVisionMission = async () => {
    if (!adminUser) return;
    
    try {
      await updateVisionMission({
        vision: visionMissionForm.vision,
        mission: visionMissionForm.mission,
        goals: visionMissionForm.goals.filter(goal => goal.trim() !== '')
      }, adminUser.name);
      
      await loadAllData();
      setEditingVisionMission(false);
    } catch (error) {
      console.error('Error saving vision & mission:', error);
    }
  };

  // Organization functions
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setOrganizationForm(prev => ({
          ...prev,
          imageUrl: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveOrganization = async () => {
    if (!adminUser) return;
    
    try {
      await updateOrganizationChart({
        title: organizationForm.title,
        description: organizationForm.description,
        imageUrl: organizationForm.imageUrl
      }, adminUser.name);
      
      await loadAllData();
      setEditingOrganization(false);
    } catch (error) {
      console.error('Error saving organization chart:', error);
    }
  };

  // Contact functions
  const handleSaveContact = async () => {
    if (!adminUser) return;
    
    try {
      await updateContactInfo(contactForm, adminUser.name);
      await loadAllData();
      setEditingContact(false);
    } catch (error) {
      console.error('Error saving contact info:', error);
    }
  };

  // Delete function
  const handleDelete = async () => {
    try {
      if (confirmDelete.itemId === 'clear-org-chart') {
        // Clear organization chart
        const content = await getAboutContentBySection('organization_chart');
        if (content.length > 0) {
          await deleteAboutContent(content[0].id);
          // Reset the form
          setOrganizationForm({
            title: '',
            description: '',
            imageUrl: ''
          });
        }
      } else {
        await deleteAboutContent(confirmDelete.itemId);
      }
      await loadAllData();
      setConfirmDelete({ isOpen: false, itemId: '', itemType: '' });
    } catch (error) {
      console.error('Error deleting item:', error);
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
            <History size={18} />
            <span>History</span>
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
            <div className="history-management">
              <div className="section-header">
                <h3>History Timeline</h3>
                <button className="add-btn" onClick={handleAddHistory}>
                  <Plus size={16} />
                  Add History Item
                </button>
              </div>

              <div className="history-items">
                {historyItems.map((item) => (
                  <div key={item.id} className="history-item-card">
                    <div className="history-item-header">
                      <div className="history-year">{item.year}</div>
                      <div className="history-actions">
                        <button 
                          className="action-btn edit-btn"
                          onClick={() => handleEditHistory(item)}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => setConfirmDelete({
                            isOpen: true,
                            itemId: item.id,
                            itemType: 'history item'
                          })}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                  </div>
                ))}
              </div>

              {/* History Form Modal */}
              {editingHistory && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h3>{editingHistory.id ? 'Edit History Item' : 'Add History Item'}</h3>
                      <button 
                        className="close-btn"
                        onClick={() => setEditingHistory(null)}
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <div className="modal-body">
                      <div className="form-group">
                        <label>Year</label>
                        <input
                          type="number"
                          value={historyForm.year}
                          onChange={(e) => setHistoryForm(prev => ({
                            ...prev,
                            year: parseInt(e.target.value)
                          }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Title</label>
                        <input
                          type="text"
                          value={historyForm.title}
                          onChange={(e) => setHistoryForm(prev => ({
                            ...prev,
                            title: e.target.value
                          }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                          value={historyForm.description}
                          onChange={(e) => setHistoryForm(prev => ({
                            ...prev,
                            description: e.target.value
                          }))}
                          rows={4}
                        />
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button 
                        className="btn-secondary"
                        onClick={() => setEditingHistory(null)}
                      >
                        Cancel
                      </button>
                      <button 
                        className="btn-primary"
                        onClick={handleSaveHistory}
                      >
                        <Save size={16} />
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vision & Mission Tab */}
          {activeTab === 'vision' && (
            <div className="vision-management">
              <div className="section-header">
                <h3>Vision & Mission</h3>
                <button 
                  className="edit-btn"
                  onClick={() => setEditingVisionMission(true)}
                >
                  <Edit size={16} />
                  Edit Content
                </button>
              </div>

              {editingVisionMission ? (
                <div className="vision-form">
                  <div className="form-group">
                    <label>Vision</label>
                    <textarea
                      value={visionMissionForm.vision}
                      onChange={(e) => setVisionMissionForm(prev => ({
                        ...prev,
                        vision: e.target.value
                      }))}
                      rows={4}
                    />
                  </div>
                  <div className="form-group">
                    <label>Mission</label>
                    <textarea
                      value={visionMissionForm.mission}
                      onChange={(e) => setVisionMissionForm(prev => ({
                        ...prev,
                        mission: e.target.value
                      }))}
                      rows={4}
                    />
                  </div>
                  <div className="form-group">
                    <label>Goals</label>
                    {visionMissionForm.goals.map((goal, index) => (
                      <textarea
                        key={index}
                        placeholder={`Goal ${index + 1}`}
                        value={goal}
                        onChange={(e) => {
                          const newGoals = [...visionMissionForm.goals];
                          newGoals[index] = e.target.value;
                          setVisionMissionForm(prev => ({
                            ...prev,
                            goals: newGoals
                          }));
                        }}
                        rows={3}
                      />
                    ))}
                  </div>
                  <div className="form-actions">
                    <button 
                      className="btn-secondary"
                      onClick={() => setEditingVisionMission(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={handleSaveVisionMission}
                    >
                      <Save size={16} />
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="vision-display">
                  <div className="vision-card">
                    <h4>Vision</h4>
                    <p>{visionMission?.vision}</p>
                  </div>
                  <div className="mission-card">
                    <h4>Mission</h4>
                    <p>{visionMission?.mission}</p>
                  </div>
                  <div className="goals-card">
                    <h4>Goals</h4>
                    <ol>
                      {visionMission?.goals.map((goal, index) => (
                        <li key={index}>{goal}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Organization Tab */}
          {activeTab === 'organization' && (
            <div className="organization-management">
              <div className="section-header">
                <h3>Organization Chart</h3>
                <div className="section-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => setEditingOrganization(true)}
                  >
                    <Edit size={16} />
                    {organizationChart ? 'Update Chart' : 'Upload Chart'}
                  </button>
                  {organizationChart && (
                    <button 
                      className="btn-danger"
                      onClick={() => setConfirmDelete({
                        isOpen: true,
                        itemId: 'clear-org-chart',
                        itemType: 'organization chart'
                      })}
                    >
                      <Trash2 size={16} />
                      Clear Chart
                    </button>
                  )}
                </div>
              </div>

              {editingOrganization ? (
                <div className="organization-form">
                  <div className="form-group">
                    <label>Chart Title</label>
                    <input
                      type="text"
                      value={organizationForm.title}
                      onChange={(e) => setOrganizationForm(prev => ({
                        ...prev,
                        title: e.target.value
                      }))}
                      placeholder="e.g., Organizational Chart S.Y 2024-2025"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description (Optional)</label>
                    <textarea
                      value={organizationForm.description}
                      onChange={(e) => setOrganizationForm(prev => ({
                        ...prev,
                        description: e.target.value
                      }))}
                      rows={2}
                      placeholder="Brief description of the organizational chart"
                    />
                  </div>
                  <div className="form-group">
                    <label>Upload Organization Chart Image</label>
                    <div className="image-upload-area">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        id="org-chart-upload"
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="org-chart-upload" className="upload-button">
                        <Upload size={20} />
                        Choose Image
                      </label>
                      {organizationForm.imageUrl && (
                        <div className="image-preview">
                          <img 
                            src={organizationForm.imageUrl} 
                            alt="Organization Chart Preview"
                            style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="form-actions">
                    <button 
                      className="btn-secondary"
                      onClick={() => setEditingOrganization(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={handleSaveOrganization}
                      disabled={!organizationForm.imageUrl || !organizationForm.title}
                    >
                      <Save size={16} />
                      Save Chart
                    </button>
                  </div>
                </div>
              ) : (
                <div className="organization-display">
                  {organizationChart ? (
                    <div className="org-chart-display">
                      <div className="org-chart-header">
                        <h4>{organizationChart.title}</h4>
                        {organizationChart.description && (
                          <p>{organizationChart.description}</p>
                        )}
                      </div>
                      <div className="org-chart-image">
                        <img 
                          src={organizationChart.imageUrl} 
                          alt={organizationChart.title}
                          style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="org-chart-empty clickable-upload" 
                      onClick={() => setEditingOrganization(true)}
                    >
                      <div className="empty-icon">
                        <Image size={48} />
                      </div>
                      <h4>No Organization Chart Uploaded</h4>
                      <p>Click here to upload an organization chart image</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="contact-management">
              <div className="section-header">
                <h3>Contact Information</h3>
                <button 
                  className="edit-btn"
                  onClick={() => setEditingContact(true)}
                >
                  <Edit size={16} />
                  Edit Contact Info
                </button>
              </div>

              {editingContact ? (
                <div className="contact-form">
                  <div className="form-group">
                    <label>Address</label>
                    <textarea
                      value={contactForm.address}
                      onChange={(e) => setContactForm(prev => ({
                        ...prev,
                        address: e.target.value
                      }))}
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>Main Email</label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({
                        ...prev,
                        email: e.target.value
                      }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Main Phone</label>
                    <input
                      type="text"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm(prev => ({
                        ...prev,
                        phone: e.target.value
                      }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Support Email</label>
                    <input
                      type="email"
                      value={contactForm.supportEmail}
                      onChange={(e) => setContactForm(prev => ({
                        ...prev,
                        supportEmail: e.target.value
                      }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Support Phone</label>
                    <input
                      type="text"
                      value={contactForm.supportPhone}
                      onChange={(e) => setContactForm(prev => ({
                        ...prev,
                        supportPhone: e.target.value
                      }))}
                    />
                  </div>
                  <div className="form-actions">
                    <button 
                      className="btn-secondary"
                      onClick={() => setEditingContact(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={handleSaveContact}
                    >
                      <Save size={16} />
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="contact-display">
                  <div className="contact-card">
                    <div className="contact-icon">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h4>Address</h4>
                      <p>{contactInfo?.address}</p>
                    </div>
                  </div>
                  <div className="contact-card">
                    <div className="contact-icon">
                      <Mail size={24} />
                    </div>
                    <div>
                      <h4>Email</h4>
                      <p>{contactInfo?.email}</p>
                      {contactInfo?.supportEmail && (
                        <p>{contactInfo.supportEmail}</p>
                      )}
                    </div>
                  </div>
                  <div className="contact-card">
                    <div className="contact-icon">
                      <Phone size={24} />
                    </div>
                    <div>
                      <h4>Phone</h4>
                      <p>{contactInfo?.phone}</p>
                      {contactInfo?.supportPhone && (
                        <p>{contactInfo.supportPhone}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title={`Delete ${confirmDelete.itemType}`}
        message={`Are you sure you want to delete this ${confirmDelete.itemType}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, itemId: '', itemType: '' })}
        variant="danger"
      />
    </AdminLayout>
  );
};

export default AboutUsManagement;
