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
  Unsubscribe,
  where,
  writeBatch,
  getDoc
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
  isAnonymous: boolean = false,
  donationId?: string
): Promise<string> => {
  const title = 'New Donation';
  const message = isAnonymous
    ? `Anonymous donor contributed ${currency === 'PHP' ? '₱' : '$'}${amount.toLocaleString()}`
    : `${donorName} donated ${currency === 'PHP' ? '₱' : '$'}${amount.toLocaleString()}`;

  // Check for duplicate notification if sourceId is provided
  if (donationId) {
    const existingNotifications = await getDocs(
      query(collection(db, NOTIFICATIONS_COLLECTION), where('sourceId', '==', donationId))
    );
    if (!existingNotifications.empty) {
      console.log('Duplicate donation notification prevented for:', donationId);
      return existingNotifications.docs[0].id;
    }
  }

  return addNotification({
    type: 'donation',
    title,
    message,
    isRead: false,
    sourceId: donationId
  });
};

// Create job notification
export const createJobNotification = async (
  jobTitle: string,
  company: string,
  jobId?: string
): Promise<string> => {
  const title = 'New Job Posting';
  const message = `${company} is hiring for ${jobTitle}`;

  // Check for duplicate notification if sourceId is provided
  if (jobId) {
    const existingNotifications = await getDocs(
      query(collection(db, NOTIFICATIONS_COLLECTION), where('sourceId', '==', jobId))
    );
    if (!existingNotifications.empty) {
      console.log('Duplicate job notification prevented for:', jobId);
      return existingNotifications.docs[0].id;
    }
  }

  return addNotification({
    type: 'job',
    title,
    message,
    isRead: false,
    sourceId: jobId
  });
};

// Create event notification
export const createEventNotification = async (
  eventTitle: string,
  eventDate: string,
  location: string,
  eventId?: string
): Promise<string> => {
  const title = 'New Event';
  const date = new Date(eventDate);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const message = `${eventTitle} on ${formattedDate} at ${location}`;

  // Check for duplicate notification if sourceId is provided
  if (eventId) {
    const existingNotifications = await getDocs(
      query(collection(db, NOTIFICATIONS_COLLECTION), where('sourceId', '==', eventId))
    );
    if (!existingNotifications.empty) {
      console.log('Duplicate event notification prevented for:', eventId);
      return existingNotifications.docs[0].id;
    }
  }

  return addNotification({
    type: 'event',
    title,
    message,
    isRead: false,
    sourceId: eventId
  });
};

// Delete notifications by source ID (when the source item is deleted)
export const deleteNotificationsBySourceId = async (sourceId: string): Promise<void> => {
  try {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(notificationsRef, where('sourceId', '==', sourceId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('No notifications found for sourceId:', sourceId);
      return;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Deleted ${snapshot.size} notification(s) for sourceId:`, sourceId);
  } catch (error) {
    console.error('Error deleting notifications by sourceId:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(notificationsRef, where('isRead', '==', false));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('No unread notifications to mark as read');
      return;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { isRead: true });
    });

    await batch.commit();
    console.log(`Marked ${snapshot.size} notification(s) as read`);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Clear all notifications
export const clearAllNotifications = async (): Promise<void> => {
  try {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const snapshot = await getDocs(notificationsRef);

    if (snapshot.empty) {
      console.log('No notifications to clear');
      return;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Cleared ${snapshot.size} notification(s)`);
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    throw error;
  }
};

// Validate and clean up orphaned notifications (notifications whose source items no longer exist)
export const validateAndCleanupNotifications = async (): Promise<void> => {
  try {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const snapshot = await getDocs(notificationsRef);

    if (snapshot.empty) {
      console.log('No notifications to validate');
      return;
    }

    const orphanedNotifications: string[] = [];

    for (const notificationDoc of snapshot.docs) {
      const notification = notificationDoc.data();
      const sourceId = notification.sourceId;
      const type = notification.type;

      // Skip notifications without sourceId (system notifications, etc.)
      if (!sourceId) continue;

      // Check if the source item still exists
      let sourceExists = false;
      try {
        if (type === 'event') {
          const eventDoc = await getDoc(doc(db, 'events', sourceId));
          sourceExists = eventDoc.exists();
        } else if (type === 'job') {
          const jobDoc = await getDoc(doc(db, 'jobs', sourceId));
          sourceExists = jobDoc.exists();
        } else if (type === 'donation') {
          const donationDoc = await getDoc(doc(db, 'donations', sourceId));
          sourceExists = donationDoc.exists();
        }
      } catch (error) {
        console.error(`Error checking source for notification ${notificationDoc.id}:`, error);
      }

      if (!sourceExists) {
        orphanedNotifications.push(notificationDoc.id);
      }
    }

    // Delete orphaned notifications in batch
    if (orphanedNotifications.length > 0) {
      const batch = writeBatch(db);
      orphanedNotifications.forEach((notificationId) => {
        batch.delete(doc(db, NOTIFICATIONS_COLLECTION, notificationId));
      });

      await batch.commit();
      console.log(`Cleaned up ${orphanedNotifications.length} orphaned notification(s)`);
    } else {
      console.log('No orphaned notifications found');
    }
  } catch (error) {
    console.error('Error validating and cleaning up notifications:', error);
    throw error;
  }
};