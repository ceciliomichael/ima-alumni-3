import { useState } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import ConfirmDialog from '../../../../../components/ConfirmDialog';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import {
  HistoryItem,
  addHistoryItem,
  updateAboutContent,
  getAboutContentBySection,
  deleteAboutContent
} from '../../../../../services/firebase/aboutService';

interface HistoryManagementProps {
  historyItems: HistoryItem[];
  onRefresh: () => void;
}

const HistoryManagement = ({ historyItems, onRefresh }: HistoryManagementProps) => {
  const { adminUser } = useAdminAuth();
  const [editingHistory, setEditingHistory] = useState<HistoryItem | null>(null);
  const [historyForm, setHistoryForm] = useState({
    year: new Date().getFullYear(),
    title: '',
    description: '',
    order: 0
  });
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    itemId: string;
    itemType: string;
  }>({ isOpen: false, itemId: '', itemType: '' });

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
      
      await onRefresh();
      setEditingHistory(null);
    } catch (error) {
      console.error('Error saving history item:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAboutContent(confirmDelete.itemId);
      await onRefresh();
      setConfirmDelete({ isOpen: false, itemId: '', itemType: '' });
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  return (
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

export default HistoryManagement;