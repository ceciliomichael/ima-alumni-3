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
  isRead: boolean;
}

// Get all contact messages
export const getAllContactMessages = (): ContactMessage[] => {
  const messages = localStorage.getItem(STORAGE_KEY);
  return messages ? JSON.parse(messages) : [];
};

// Add a new contact message
export const addContactMessage = (message: Omit<ContactMessage, 'id' | 'createdAt' | 'isRead'>): ContactMessage => {
  const messages = getAllContactMessages();
  
  const newMessage: ContactMessage = {
    ...message,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    isRead: false
  };
  
  messages.push(newMessage);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  
  return newMessage;
};

// Mark a message as read
export const markMessageAsRead = (messageId: string): ContactMessage | null => {
  const messages = getAllContactMessages();
  const index = messages.findIndex(message => message.id === messageId);
  
  if (index === -1) return null;
  
  const updatedMessage = {
    ...messages[index],
    isRead: true
  };
  
  messages[index] = updatedMessage;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  
  return updatedMessage;
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

// Get unread messages count
export const getUnreadMessagesCount = (): number => {
  const messages = getAllContactMessages();
  return messages.filter(message => !message.isRead).length;
};

// Initialize with empty array if no data exists
export const initializeContactMessages = () => {
  const existingData = localStorage.getItem(STORAGE_KEY);
  
  if (!existingData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
}; 