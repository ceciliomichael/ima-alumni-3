import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

const COLLECTION_NAME = 'contact_messages';

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
export const getAllContactMessages = async (): Promise<ContactMessage[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ContactMessage));
  } catch (error) {
    console.error('Error getting contact messages:', error);
    return [];
  }
};

// Add a new contact message
export const addContactMessage = async (message: Omit<ContactMessage, 'id' | 'createdAt' | 'isRead'>): Promise<ContactMessage> => {
  try {
    const newMessage = {
      ...message,
      createdAt: new Date().toISOString(),
      isRead: false
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), newMessage);
    
    return {
      id: docRef.id,
      ...newMessage
    };
  } catch (error) {
    console.error('Error adding contact message:', error);
    throw error;
  }
};

// Mark a message as read
export const markMessageAsRead = async (messageId: string): Promise<ContactMessage | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, messageId);
    await updateDoc(docRef, { isRead: true });
    
    // Get the updated document
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as ContactMessage;
    }
    return null;
  } catch (error) {
    console.error('Error marking message as read:', error);
    return null;
  }
};

// Delete a message
export const deleteContactMessage = async (messageId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, messageId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting contact message:', error);
    return false;
  }
};

// Get unread messages count
export const getUnreadMessagesCount = async (): Promise<number> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("isRead", "==", false));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting unread messages count:', error);
    return 0;
  }
};

// Initialize with empty array if no data exists
export const initializeContactMessages = async () => {
  // No need to initialize in Firestore as collections are created automatically
  // This function is kept for API compatibility
};
