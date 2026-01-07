import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { ReportSignatory } from '../../../../types';

interface SignatorySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ReportSignatory) => void;
  initialData: ReportSignatory;
}

const SignatorySettingsModal: React.FC<SignatorySettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [formData, setFormData] = useState<ReportSignatory>(initialData);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Report Settings</h3>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <p className="modal-description">
              Update the signatory details that appear at the bottom of the donation report.
            </p>

            <div className="form-group">
              <label>Signatory Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., HON. MARIANO L. MAGLAHUS JR."
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>Position / Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Alumni President"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>Organization / School</label>
              <input
                type="text"
                value={formData.organization}
                onChange={e => setFormData({ ...formData, organization: e.target.value })}
                placeholder="e.g., Immaculate Mary Academy"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g., Poblacion Weste, Catigbian, Bohol"
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save">
              <Save size={16} />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignatorySettingsModal;