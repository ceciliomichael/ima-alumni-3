import { useState, useEffect } from 'react';
import { Edit, Save, MapPin, Mail, Phone } from 'lucide-react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import {
  ContactInfo,
  updateContactInfo,
} from '../../../../../services/firebase/aboutService';

interface ContactManagementProps {
  contactInfo: ContactInfo | null;
  onRefresh: () => void;
}

const ContactManagement = ({ contactInfo, onRefresh }: ContactManagementProps) => {
  const { adminUser } = useAdminAuth();
  const [editingContact, setEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    address: '',
    email: '',
    phone: '',
    supportEmail: '',
    supportPhone: ''
  });

  // Initialize form when contactInfo data is available
  useEffect(() => {
    if (contactInfo) {
      setContactForm({
        address: contactInfo.address,
        email: contactInfo.email,
        phone: contactInfo.phone,
        supportEmail: contactInfo.supportEmail || '',
        supportPhone: contactInfo.supportPhone || ''
      });
    }
  }, [contactInfo]);

  const handleSaveContact = async () => {
    if (!adminUser) return;
    
    try {
      await updateContactInfo(contactForm, adminUser.name);
      await onRefresh();
      setEditingContact(false);
    } catch (error) {
      console.error('Error saving contact info:', error);
    }
  };

  return (
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
  );
};

export default ContactManagement;