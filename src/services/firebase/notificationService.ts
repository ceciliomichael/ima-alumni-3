import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Notification } from '../../types';

const NOTIFICATIONS_COLLECTION = 'notifications';

// Get all notifications
export const getNotifications = async (): Promise<Notification[]> => {
  try {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(notificationsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(d => {
      const data: any = d.data();

      // Normalize createdAt to ISO string so UI can parse it reliably
      let createdAtIso = '';
      if (data.createdAt) {
        // Firestore Timestamp has toDate()
        if (typeof data.createdAt.toDate === 'function') {
          createdAtIso = data.createdAt.toDate().toISOString();
        } else if (typeof data.createdAt === 'number') {
          createdAtIso = new Date(data.createdAt).toISOString();
        } else if (typeof data.createdAt === 'string') {
          createdAtIso = data.createdAt;
        }
      }

      return {
        id: d.id,
        ...data,
        createdAt: createdAtIso
      } as Notification;
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};

// Real-time listener for notifications
export const subscribeToNotifications = (
  callback: (notifications: Notification[]) => void
): Unsubscribe => {
  const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
  const q = query(notificationsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(d => {
      const data: any = d.data();

      let createdAtIso = '';
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === 'function') {
          createdAtIso = data.createdAt.toDate().toISOString();
        } else if (typeof data.createdAt === 'number') {
          createdAtIso = new Date(data.createdAt).toISOString();
        } else if (typeof data.createdAt === 'string') {
          createdAtIso = data.createdAt;
        }
      }

      return {
        id: d.id,
        ...data,
        createdAt: createdAtIso
      } as Notification;
    });

    callback(notifications);
  });
};

// Add new notification
export const addNotification = async (
  notification: Omit<Notification, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const newNotification = {
      ...notification,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(notificationsRef, newNotification);
    return docRef.id;
  } catch (error) {
    console.error('Error adding notification:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (id: string): Promise<void> => {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, id);
    await updateDoc(notificationRef, {
      isRead: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (id: string): Promise<void> => {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, id);
    await deleteDoc(notificationRef);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Create donation notification
export const createDonationNotification = async (
  donorName: string,
  amount: number,
  currency: string,
  isAnonymous: boolean = false
): Promise<string> => {
  const title = 'New Donation';
  const message = isAnonymous
    ? `Anonymous donor contributed ${currency === 'PHP' ? '₱' : '$'}${amount.toLocaleString()}`
    : `${donorName} donated ${currency === 'PHP' ? '₱' : '$'}${amount.toLocaleString()}`;

  return addNotification({
    type: 'donation',
    title,
    message,
    isRead: false
  });
};
