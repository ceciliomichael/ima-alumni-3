import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { GalleryPost } from '../../types';

const COLLECTION_NAME = 'gallery_items';

// Get all gallery items
export const getAllGalleryItems = async (): Promise<GalleryPost[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as GalleryPost));
  } catch (error) {
    console.error('Error getting gallery items:', error);
    return [];
  }
};

// Get gallery item by ID
export const getGalleryItemById = async (id: string): Promise<GalleryPost | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as GalleryPost;
    }
    return null;
  } catch (error) {
    console.error('Error getting gallery item by ID:', error);
    return null;
  }
};

// Get gallery items by event ID
export const getGalleryItemsByEvent = async (eventId: string): Promise<GalleryPost[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("event", "==", eventId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as GalleryPost));
  } catch (error) {
    console.error('Error getting gallery items by event:', error);
    return [];
  }
};

// Add new gallery item
export const addGalleryItem = async (item: Omit<GalleryPost, 'id' | 'postedDate'>): Promise<GalleryPost> => {
  try {
    const newItem = {
      ...item,
      postedDate: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), newItem);
    
    return {
      id: docRef.id,
      ...newItem
    };
  } catch (error) {
    console.error('Error adding gallery item:', error);
    throw error;
  }
};

// Update gallery item
export const updateGalleryItem = async (id: string, updatedData: Partial<GalleryPost>): Promise<GalleryPost | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updatedData);
    
    // Get the updated document
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as GalleryPost;
    }
    return null;
  } catch (error) {
    console.error('Error updating gallery item:', error);
    return null;
  }
};

// Delete gallery item
export const deleteGalleryItem = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting gallery item:', error);
    return false;
  }
};

// Search gallery items
export const searchGalleryItems = async (query: string): Promise<GalleryPost[]> => {
  try {
    // Firestore doesn't support direct text search like localStorage
    // We'll get all gallery items and filter them client-side
    // In a production app, consider using a more scalable approach like Algolia
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const galleryItems = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as GalleryPost));
    
    const lowerCaseQuery = query.toLowerCase();
    return galleryItems.filter(item => 
      item.title.toLowerCase().includes(lowerCaseQuery) ||
      item.description.toLowerCase().includes(lowerCaseQuery)
    );
  } catch (error) {
    console.error('Error searching gallery items:', error);
    return [];
  }
};

// Approve or reject a gallery item
export const approveGalleryItem = async (id: string, approve: boolean): Promise<GalleryPost | null> => {
  return updateGalleryItem(id, { isApproved: approve });
};

// Get gallery statistics
export const getGalleryStatistics = async () => {
  try {
    const galleryItems = await getAllGalleryItems();
    
    // Get total count
    const totalItems = galleryItems.length;
    
    // Get approved vs pending
    const approvedItems = galleryItems.filter(item => item.isApproved).length;
    const pendingItems = totalItems - approvedItems;
    
    return {
      totalItems,
      approvedItems,
      pendingItems
    };
  } catch (error) {
    console.error('Error getting gallery statistics:', error);
    return {
      totalItems: 0,
      approvedItems: 0,
      pendingItems: 0
    };
  }
};

// Initialize with empty array if no data exists
export const initializeGalleryData = async () => {
  // No need to initialize in Firestore as collections are created automatically
  // This function is kept for API compatibility
};
