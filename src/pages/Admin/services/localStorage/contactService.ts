import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'contact_messages';

// Define the contact message interface
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

// Get all contact messages
export const getAllContactMessages = (): ContactMessage[] => {
  const messages = localStorage.getItem(STORAGE_KEY);
  return messages ? JSON.parse(messages) : [];
};

// Add a new contact message
export const addContactMessage = (message: Omit<ContactMessage, 'id' | 'createdAt'>): ContactMessage => {
  const messages = getAllContactMessages();
  
  const newMessage: ContactMessage = {
    ...message,
    id: uuidv4(),
    createdAt: new Date().toISOString()
  };
  
  messages.push(newMessage);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  
  return newMessage;
};

// Delete a message
export const deleteContactMessage = (messageId: string): boolean => {
  const messages = getAllContactMessages();
  const filteredMessages = messages.filter(message => message.id !== messageId);
  
  if (filteredMessages.length === messages.length) {
    return false; // No message was deleted
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredMessages));
  return true; // Message was deleted
};

// Initialize with empty array if no data exists
export const initializeContactMessages = () => {
  const existingData = localStorage.getItem(STORAGE_KEY);
  
  if (!existingData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
}; 