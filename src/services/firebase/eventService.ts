import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { sendBulkEventNotifications, getEventUrl } from '../email/emailService';
import { getAllUsers } from './userService';
import { createEventNotification } from './notificationService';

// Define the Event interface
export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  isApproved: boolean;
  createdBy: string;
  coverImage?: string;
  createdAt: string;
}

const COLLECTION_NAME = 'events';

// Get all events
export const getAllEvents = async (): Promise<Event[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Event));
  } catch (error) {
    console.error('Error getting events:', error);
    return [];
  }
};

// Get event by ID
export const getEventById = async (id: string): Promise<Event | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Event;
    }
    return null;
  } catch (error) {
    console.error('Error getting event by ID:', error);
    return null;
  }
};

// Add new event
export const addEvent = async (event: Omit<Event, 'id' | 'createdAt'>): Promise<Event> => {
  try {
    const newEvent = {
      ...event,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), newEvent);
    
    const createdEvent = {
      id: docRef.id,
      ...newEvent
    };
    
    // If event is created as approved, send notification emails and create in-app notification
    if (createdEvent.isApproved && !createdEvent.isTest) {
      // Fire and forget - don't wait for email sending
      sendEventNotifications(createdEvent).catch((error) => {
        console.error('Failed to send event notifications:', error);
      });

      // Also create in-app notification
      createEventNotification(createdEvent.title, createdEvent.date, createdEvent.location).catch((error) => {
        console.error('Failed to create event notification:', error);
      });
    }
    
    return createdEvent;
  } catch (error) {
    console.error('Error adding event:', error);
    throw error;
  }
};

// Update event
export const updateEvent = async (id: string, updatedData: Partial<Event>): Promise<Event | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updatedData);
    
    // Get the updated document
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as Event;
    }
    return null;
  } catch (error) {
    console.error('Error updating event:', error);
    return null;
  }
};

// Delete event
export const deleteEvent = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    return false;
  }
};

// Search events
export const searchEvents = async (query: string): Promise<Event[]> => {
  try {
    // Firestore doesn't support direct text search like localStorage
    // We'll get all events and filter them client-side
    // In a production app, consider using a more scalable approach like Algolia
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const events = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Event));
    
    const lowerCaseQuery = query.toLowerCase();
    return events.filter(event => 
      event.title.toLowerCase().includes(lowerCaseQuery) ||
      event.description.toLowerCase().includes(lowerCaseQuery) ||
      event.location.toLowerCase().includes(lowerCaseQuery)
    );
  } catch (error) {
    console.error('Error searching events:', error);
    return [];
  }
};

// Get upcoming events (events with a future date)
export const getUpcomingEvents = async (): Promise<Event[]> => {
  try {
    const events = await getAllEvents();
    const now = new Date();
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= now;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    return [];
  }
};

// Get past events (events with a past date)
export const getPastEvents = async (): Promise<Event[]> => {
  try {
    const events = await getAllEvents();
    const now = new Date();
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate < now;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error getting past events:', error);
    return [];
  }
};

// Approve or reject an event
export const approveEvent = async (id: string, approve: boolean): Promise<Event | null> => {
  // Get current event state before updating
  const currentEvent = await getEventById(id);
  const wasApproved = currentEvent?.isApproved || false;
  
  const updatedEvent = await updateEvent(id, { isApproved: approve });
  
  // Only send notification emails if event is being approved for the FIRST time
  // (transitioning from unapproved to approved)
  if (approve && updatedEvent && !wasApproved && !updatedEvent.isTest) {
    // Fire and forget - don't wait for email sending
    sendEventNotifications(updatedEvent).catch((error) => {
      console.error('Failed to send event notifications:', error);
    });

    // Also create in-app notification
    createEventNotification(updatedEvent.title, updatedEvent.date, updatedEvent.location).catch((error) => {
      console.error('Failed to create event notification:', error);
    });
  }
  
  return updatedEvent;
};

/**
 * Send event notification emails to all active users
 * @param event - The event to notify users about
 */
export const sendEventNotifications = async (event: Event): Promise<void> => {
  try {
    // Get all active users
    const allUsers = await getAllUsers();
    const activeUsers = allUsers.filter(
      (user) => user.isActive && user.email && !user.email.includes('noreply')
    );

    if (activeUsers.length === 0) {
      console.log('No active users with valid emails to notify');
      return;
    }

    // Format event date and time
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = eventDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    // Prepare recipients
    const recipients = activeUsers.map((user) => ({
      email: user.email,
      name: user.name,
    }));

    // Send bulk notifications
    console.log(`Sending event notifications to ${recipients.length} users...`);
    const results = await sendBulkEventNotifications(recipients, {
      event_title: event.title,
      event_date: formattedDate,
      event_time: formattedTime,
      event_location: event.location,
      event_description: event.description,
      event_url: getEventUrl(event.id),
    });

    // Log results
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;
    console.log(
      `Event notifications sent: ${successCount} successful, ${failureCount} failed`
    );

    if (failureCount > 0) {
      const failedEmails = results.filter((r) => !r.success).map((r) => r.email);
      console.warn('Failed to send to:', failedEmails);
    }
  } catch (error) {
    console.error('Error sending event notifications:', error);
    throw error;
  }
};

// Get events statistics
export const getEventsStatistics = async () => {
  try {
    const events = await getAllEvents();
    
    // Get total count
    const totalEvents = events.length;
    
    // Get upcoming vs past
    const now = new Date();
    const upcomingEvents = events.filter(event => new Date(event.date) >= now).length;
    const pastEvents = totalEvents - upcomingEvents;
    
    // Get approved vs pending
    const approvedEvents = events.filter(event => event.isApproved).length;
    const pendingEvents = totalEvents - approvedEvents;
    
    return {
      totalEvents,
      upcomingEvents,
      pastEvents,
      approvedEvents,
      pendingEvents
    };
  } catch (error) {
    console.error('Error getting events statistics:', error);
    return {
      totalEvents: 0,
      upcomingEvents: 0,
      pastEvents: 0,
      approvedEvents: 0,
      pendingEvents: 0
    };
  }
};

// Initialize with empty array if no data exists
export const initializeEventData = async () => {
  // No need to initialize in Firestore as collections are created automatically
  // This function is kept for API compatibility
};
