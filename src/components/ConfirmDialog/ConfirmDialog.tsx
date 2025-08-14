import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  icon,
  onConfirm,
  onCancel,
  variant = 'warning'
}) => {
  if (!isOpen) return null;

  // Default icons by variant
  const getDefaultIcon = () => {
    switch (variant) {
      case 'danger':
        return <Trash2 size={24} />;
      case 'warning':
      default:
        return <AlertTriangle size={24} />;
    }
  };

  // Backdrop click handler - close the dialog
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };
  
  // Stop propagation from the dialog content
  const handleDialogClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <div className="confirm-dialog-backdrop" onClick={handleBackdropClick}>
      <div className={`confirm-dialog-container ${variant}`} onClick={handleDialogClick}>
        <button className="confirm-dialog-close" onClick={onCancel}>
          <X size={20} />
        </button>
        
        <div className="confirm-dialog-header">
          <div className="confirm-dialog-icon">
            {icon || getDefaultIcon()}
          </div>
          <h3 className="confirm-dialog-title">{title}</h3>
        </div>
        
        <div className="confirm-dialog-body">
          <p className="confirm-dialog-message">{message}</p>
        </div>
        
        <div className="confirm-dialog-actions">
          <button 
            className="btn btn-outline confirm-dialog-cancel" 
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'} confirm-dialog-confirm`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog; 