import { ReactNode } from 'react';
import './UnifiedNotificationContainer.css';

interface UnifiedNotificationContainerProps {
  children: ReactNode;
}

const UnifiedNotificationContainer = ({ children }: UnifiedNotificationContainerProps) => {
  return (
    <div className="unified-notifications-container">
      {children}
    </div>
  );
};

export default UnifiedNotificationContainer;

