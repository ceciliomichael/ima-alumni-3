import { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import DonationNotification from './DonationNotification';
import { Donation } from '../../../../types';
import './DonationNotification.css';

interface DonationNotificationData {
  id: string;
  donorName: string;
  amount: number;
  currency: string;
  isAnonymous?: boolean;
  timestamp: number;
}

const DonationNotificationsContainer = () => {
  const [notifications, setNotifications] = useState<DonationNotificationData[]>([]);
  const donationInitializedRef = useRef<boolean>(false);

  // Set up donation notifications listener
  useEffect(() => {
    const donationsRef = collection(db, 'donations');
    const q = query(
      donationsRef,
      where('isPublic', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // First snapshot is the current data; do not trigger notifications
      if (!donationInitializedRef.current) {
        donationInitializedRef.current = true;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const donation = {
            id: change.doc.id,
            ...change.doc.data()
          } as Donation;

          // Skip notifications for test items
          if (donation.isTest) {
            return;
          }

          const notification: DonationNotificationData = {
            id: `donation-${donation.id}`,
            donorName: donation.donorName,
            amount: donation.amount,
            currency: donation.currency,
            isAnonymous: donation.isAnonymous,
            timestamp: donation.createdAt?.toMillis?.() || Date.now()
          };

          setNotifications(prev => [notification, ...prev].slice(0, 10));
        }
      });
    }, (error) => {
      console.error('Realtime donation notifications error:', error);
    });

    return () => unsubscribe();
  }, []);

  const handleCloseNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="donation-notifications-container">
      {notifications.map((notification) => (
        <DonationNotification
          key={notification.id}
          notification={notification}
          onClose={handleCloseNotification}
        />
      ))}
    </div>
  );
};

export default DonationNotificationsContainer;
