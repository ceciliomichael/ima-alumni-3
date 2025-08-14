import { v4 as uuidv4 } from 'uuid';

// Define the Event interface (consider moving this to types/index.ts later)
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

const STORAGE_KEY = 'events';

// Get all events
export const getAllEvents = (): Event[] => {
  const events = localStorage.getItem(STORAGE_KEY);
  return events ? JSON.parse(events) : [];
};

// Get event by ID
export const getEventById = (id: string): Event | null => {
  const events = getAllEvents();
  return events.find(event => event.id === id) || null;
};

// Add new event
export const addEvent = (event: Omit<Event, 'id' | 'createdAt'>): Event => {
  const events = getAllEvents();
  const newEvent: Event = {
    ...event,
    id: uuidv4(),
    createdAt: new Date().toISOString()
  };
  
  events.push(newEvent);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  
  return newEvent;
};

// Update event
export const updateEvent = (id: string, updatedData: Partial<Event>): Event | null => {
  const events = getAllEvents();
  const index = events.findIndex(event => event.id === id);
  
  if (index === -1) return null;
  
  const updatedEvent = {
    ...events[index],
    ...updatedData
  };
  
  events[index] = updatedEvent;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  
  return updatedEvent;
};

// Delete event
export const deleteEvent = (id: string): boolean => {
  const events = getAllEvents();
  const filteredEvents = events.filter(event => event.id !== id);
  
  if (filteredEvents.length === events.length) {
    return false; // No event was deleted
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredEvents));
  return true; // Event was deleted
};

// Search events
export const searchEvents = (query: string): Event[] => {
  const events = getAllEvents();
  const lowerCaseQuery = query.toLowerCase();
  
  return events.filter(event => 
    event.title.toLowerCase().includes(lowerCaseQuery) ||
    event.description.toLowerCase().includes(lowerCaseQuery) ||
    event.location.toLowerCase().includes(lowerCaseQuery)
  );
};

// Get upcoming events (events with a future date)
export const getUpcomingEvents = (): Event[] => {
  const events = getAllEvents();
  const now = new Date();
  
  return events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= now;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// Get past events (events with a past date)
export const getPastEvents = (): Event[] => {
  const events = getAllEvents();
  const now = new Date();
  
  return events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate < now;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Approve or reject an event
export const approveEvent = (id: string, approve: boolean): Event | null => {
  return updateEvent(id, { isApproved: approve });
};

// Get events statistics
export const getEventsStatistics = () => {
  const events = getAllEvents();
  
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
};

// Initialize with empty array if no data exists
export const initializeEventData = () => {
  const existingData = localStorage.getItem(STORAGE_KEY);
  
  if (!existingData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
}; 