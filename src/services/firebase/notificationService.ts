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
      const data = d.data();
      const createdAt = data.createdAt as { toDate?: () => Date } | number | string | undefined;

      // Normalize createdAt to ISO string so UI can parse it reliably
      let createdAtIso = '';
      if (createdAt) {
        // Firestore Timestamp has toDate()
        if (typeof createdAt === 'object' && createdAt !== null && typeof createdAt.toDate === 'function') {
          createdAtIso = createdAt.toDate().toISOString();
        } else if (typeof createdAt === 'number') {
          createdAtIso = new Date(createdAt).toISOString();
        } else if (typeof createdAt === 'string') {
          createdAtIso = createdAt;
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
      const data = d.data();
      const createdAt = data.createdAt as { toDate?: () => Date } | number | string | undefined;

      let createdAtIso = '';
      if (createdAt) {
        if (typeof createdAt === 'object' && createdAt !== null && typeof createdAt.toDate === 'function') {
          createdAtIso = createdAt.toDate().toISOString();
        } else if (typeof createdAt === 'number') {
          createdAtIso = new Date(createdAt).toISOString();
        } else if (typeof createdAt === 'string') {
          createdAtIso = createdAt;
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

// Real-time listener for user-specific notifications
// Returns global notifications (no recipientUserId) + notifications targeted to this user
export const subscribeToUserNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
): Unsubscribe => {
  const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
  const q = query(notificationsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const allNotifications = snapshot.docs.map(d => {
      const data = d.data();
      const createdAt = data.createdAt as { toDate?: () => Date } | number | string | undefined;

      let createdAtIso = '';
      if (createdAt) {
        if (typeof createdAt === 'object' && createdAt !== null && typeof createdAt.toDate === 'function') {
          createdAtIso = createdAt.toDate().toISOString();
        } else if (typeof createdAt === 'number') {
          createdAtIso = new Date(createdAt).toISOString();
        } else if (typeof createdAt === 'string') {
          createdAtIso = createdAt;
        }
      }

      return {
        id: d.id,
        ...data,
        createdAt: createdAtIso
      } as Notification;
    });

    // Filter: include global notifications (no recipientUserId) OR notifications for this user
    const userNotifications = allNotifications.filter(n => 
      !n.recipientUserId || n.recipientUserId === userId
    );

    callback(userNotifications);
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

// Create moderation notification for user (when their content is approved/rejected)
export const createModerationNotification = async (
  contentType: 'post' | 'job' | 'gallery',
  isApproved: boolean,
  recipientUserId: string,
  contentTitle?: string,
  rejectionReason?: string,
  sourceId?: string
): Promise<string> => {
  const contentTypeLabel = contentType === 'post' ? 'post' : contentType === 'job' ? 'job posting' : 'gallery item';
  const title = isApproved ? 'Content Approved' : 'Content Rejected';
  
  let message: string;
  if (isApproved) {
    message = contentTitle 
      ? `Your ${contentTypeLabel} "${contentTitle}" has been approved and is now visible to other alumni.`
      : `Your ${contentTypeLabel} has been approved and is now visible to other alumni.`;
  } else {
    message = contentTitle
      ? `Your ${contentTypeLabel} "${contentTitle}" has been rejected.`
      : `Your ${contentTypeLabel} has been rejected.`;
    if (rejectionReason) {
      message += ` Reason: ${rejectionReason}`;
    }
  }

  return addNotification({
    type: 'system',
    title,
    message,
    isRead: false,
    sourceId,
    recipientUserId
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

// Mark all notifications as read (global - use markAllUserNotificationsAsRead for per-user)
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

// Mark all notifications as read for a specific user
// Only marks global notifications (no recipientUserId) and notifications targeted to this user
export const markAllUserNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(notificationsRef, where('isRead', '==', false));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('No unread notifications to mark as read');
      return;
    }

    const batch = writeBatch(db);
    let count = 0;
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      // Only mark if global (no recipientUserId) or targeted to this user
      if (!data.recipientUserId || data.recipientUserId === userId) {
        batch.update(docSnap.ref, { isRead: true });
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`Marked ${count} notification(s) as read for user ${userId}`);
    } else {
      console.log('No notifications to mark as read for this user');
    }
  } catch (error) {
    console.error('Error marking user notifications as read:', error);
    throw error;
  }
};

// Clear all notifications (global - use clearAllUserNotifications for per-user)
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

// Clear all notifications for a specific user
// Only clears global notifications (no recipientUserId) and notifications targeted to this user
export const clearAllUserNotifications = async (userId: string): Promise<void> => {
  try {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const snapshot = await getDocs(notificationsRef);

    if (snapshot.empty) {
      console.log('No notifications to clear');
      return;
    }

    const batch = writeBatch(db);
    let count = 0;
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      // Only clear if global (no recipientUserId) or targeted to this user
      if (!data.recipientUserId || data.recipientUserId === userId) {
        batch.delete(docSnap.ref);
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`Cleared ${count} notification(s) for user ${userId}`);
    } else {
      console.log('No notifications to clear for this user');
    }
  } catch (error) {
    console.error('Error clearing user notifications:', error);
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

      // Skip system/moderation notifications - these are per-user and should persist
      // until the user reads/clears them, regardless of source item existence
      if (type === 'system') continue;

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
        } else {
          // For unknown types, assume source exists to avoid accidental deletion
          sourceExists = true;
        }
      } catch (error) {
        console.error(`Error checking source for notification ${notificationDoc.id}:`, error);
        // On error, assume source exists to avoid accidental deletion
        sourceExists = true;
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