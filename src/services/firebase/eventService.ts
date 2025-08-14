import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';

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
    
    return {
      id: docRef.id,
      ...newEvent
    };
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
  return updateEvent(id, { isApproved: approve });
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
