import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DollarSign, Calendar, ChevronLeft } from 'lucide-react';
import { 
  addDonation, 
  updateDonation,
  getAllDonations
} from '../../../../services/firebase/donationService';
import { Donation } from '../../../../types';
import AdminLayout from '../../layout/AdminLayout';

// Donation categories
const DONATION_CATEGORIES = [
  'Scholarship Fund',
  'Building Fund',
  'Equipment Fund',
  'Library Fund',
  'General Operations',
  'Special Projects',
  'Other'
];

// Currency options
const CURRENCIES = [
  'PHP', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY'
];

const DonationForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [formData, setFormData] = useState<Omit<Donation, 'id'>>({
    donorName: '',
    donorEmail: '',
    amount: 0,
    currency: 'PHP',
    purpose: '',
    category: 'General Operations',
    description: '',
    isPublic: true,
    donationDate: new Date().toISOString().split('T')[0]
  });
  
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    if (isEditing && id) {
      const fetchDonation = async () => {
        try {
          setLoading(true);
          const donations = await getAllDonations();
          const donation = donations.find(d => d.id === id);
          
          if (donation) {
            // Format date to YYYY-MM-DD for input
            const formattedDate = new Date(donation.donationDate)
              .toISOString()
              .split('T')[0];
            
            setFormData({
              donorName: donation.donorName,
              donorEmail: donation.donorEmail || '',
              amount: donation.amount,
              currency: donation.currency,
              purpose: donation.purpose,
              category: donation.category,
              description: donation.description || '',
              isPublic: donation.isPublic,
              donationDate: formattedDate
            });
          } else {
            alert('Donation not found');
            navigate('/admin/donations');
          }
        } catch (error) {
          console.error('Error fetching donation:', error);
          alert('Error loading donation. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchDonation();
    }
  }, [id, isEditing, navigate]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else if (name === 'amount') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.donorName || !formData.purpose || formData.amount <= 0) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (isEditing && id) {
        await updateDonation(id, formData);
      } else {
        await addDonation(formData);
      }
      
      navigate('/admin/donations');
    } catch (error) {
      console.error('Error saving donation:', error);
      alert('Error saving donation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <AdminLayout title={isEditing ? 'Edit Donation' : 'Add Donation'}>
        <div className="admin-loading">Loading donation data...</div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title={isEditing ? 'Edit Donation' : 'Add Donation'}>
      <button 
        className="admin-back-btn"
        onClick={() => navigate('/admin/donations')}
      >
        <ChevronLeft size={20} />
        Back to Donations
      </button>
      
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">
            {isEditing ? 'Edit Donation Details' : 'Add New Donation'}
          </h2>
        </div>
        
        <form className="admin-donation-form" onSubmit={handleSubmit}>
          <div className="admin-form-section">
            <h3 className="admin-form-section-title">Donor Information</h3>
            
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label htmlFor="donorName" className="admin-form-label">
                  Donor Name*
                </label>
                <input
                  type="text"
                  id="donorName"
                  name="donorName"
                  value={formData.donorName}
                  onChange={handleChange}
                  className="admin-form-control"
                  required
                />
              </div>
              
              <div className="admin-form-group">
                <label htmlFor="donorEmail" className="admin-form-label">
                  Donor Email
                </label>
                <input
                  type="email"
                  id="donorEmail"
                  name="donorEmail"
                  value={formData.donorEmail}
                  onChange={handleChange}
                  className="admin-form-control"
                />
                <small className="admin-form-hint">
                  Optional. For internal record keeping only.
                </small>
              </div>
            </div>
          </div>
          
          <div className="admin-form-section">
            <h3 className="admin-form-section-title">Donation Details</h3>
            
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label htmlFor="amount" className="admin-form-label">
                  Amount*
                </label>
                <div className="admin-form-amount-group">
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    className="admin-form-control"
                    required
                  />
                </div>
              </div>
              
              <div className="admin-form-group">
                <label htmlFor="currency" className="admin-form-label">
                  Currency*
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="admin-form-select"
                  required
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label htmlFor="purpose" className="admin-form-label">
                  Purpose/Title*
                </label>
                <input
                  type="text"
                  id="purpose"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  className="admin-form-control"
                  required
                />
                <small className="admin-form-hint">
                  Brief title explaining the purpose of this donation
                </small>
              </div>
              
              <div className="admin-form-group">
                <label htmlFor="category" className="admin-form-label">
                  Category*
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="admin-form-select"
                  required
                >
                  {DONATION_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="admin-form-group">
              <label htmlFor="description" className="admin-form-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="admin-form-control admin-form-textarea"
                rows={4}
              />
              <small className="admin-form-hint">
                Optional. Additional details about the donation.
              </small>
            </div>
            
            <div className="admin-form-group">
              <label htmlFor="donationDate" className="admin-form-label">
                Donation Date*
              </label>
              <input
                type="date"
                id="donationDate"
                name="donationDate"
                value={formData.donationDate}
                onChange={handleChange}
                className="admin-form-control"
                required
              />
            </div>
            
            <div className="admin-form-checkbox-group">
              <input
                type="checkbox"
                id="isPublic"
                name="isPublic"
                checked={formData.isPublic}
                onChange={(e) => 
                  setFormData(prev => ({
                    ...prev,
                    isPublic: e.target.checked
                  }))
                }
                className="admin-form-checkbox"
              />
              <label htmlFor="isPublic" className="admin-form-checkbox-label">
                Display this donation publicly
              </label>
            </div>
            <small className="admin-form-hint">
              When checked, this donation will be visible on the public donations page.
              Private donations are only visible to administrators.
            </small>
          </div>
          
          <div className="admin-form-actions">
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={() => navigate('/admin/donations')}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : isEditing ? 'Update Donation' : 'Add Donation'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default DonationForm; 