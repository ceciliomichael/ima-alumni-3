import { useState, useEffect } from 'react';
import { Edit, Trash2, Save, Upload, Image } from 'lucide-react';
import ConfirmDialog from '../../../../../components/ConfirmDialog';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import {
  OrganizationChart,
  updateOrganizationChart,
  getAboutContentBySection,
  deleteAboutContent
} from '../../../../../services/firebase/aboutService';

interface OrganizationManagementProps {
  organizationChart: OrganizationChart | null;
  onRefresh: () => void;
}

const OrganizationManagement = ({ organizationChart, onRefresh }: OrganizationManagementProps) => {
  const { adminUser } = useAdminAuth();
  const [editingOrganization, setEditingOrganization] = useState(false);
  const [organizationForm, setOrganizationForm] = useState({
    title: '',
    description: '',
    imageUrl: ''
  });
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    itemId: string;
    itemType: string;
  }>({ isOpen: false, itemId: '', itemType: '' });

  // Initialize form when organizationChart data is available
  useEffect(() => {
    if (organizationChart) {
      setOrganizationForm({
        title: organizationChart.title,
        description: organizationChart.description || '',
        imageUrl: organizationChart.imageUrl
      });
    }
  }, [organizationChart]);

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
      
      await onRefresh();
      setEditingOrganization(false);
    } catch (error) {
      console.error('Error saving organization chart:', error);
    }
  };

  const handleDelete = async () => {
    try {
      // Clear organization chart
      const content = await getAboutContentBySection('organization_chart');
      if (content.length > 0) {
        await deleteAboutContent(content[0].id);
      }
      await onRefresh();
      setConfirmDelete({ isOpen: false, itemId: '', itemType: '' });
      // Reset the form
      setOrganizationForm({
        title: '',
        description: '',
        imageUrl: ''
      });
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  return (
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
    </div>
  );
};

export default OrganizationManagement;