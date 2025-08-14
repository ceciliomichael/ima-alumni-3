import { v4 as uuidv4 } from 'uuid';

// Define the Gallery interface (consider moving this to types/index.ts later)
export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  eventId?: string;
  postedDate: string;
  isApproved: boolean;
  postedBy: string;
}

const STORAGE_KEY = 'gallery_items';

// Get all gallery items
export const getAllGalleryItems = (): GalleryItem[] => {
  const galleryItems = localStorage.getItem(STORAGE_KEY);
  return galleryItems ? JSON.parse(galleryItems) : [];
};

// Get gallery item by ID
export const getGalleryItemById = (id: string): GalleryItem | null => {
  const galleryItems = getAllGalleryItems();
  return galleryItems.find(item => item.id === id) || null;
};

// Get gallery items by event ID
export const getGalleryItemsByEvent = (eventId: string): GalleryItem[] => {
  const galleryItems = getAllGalleryItems();
  return galleryItems.filter(item => item.eventId === eventId);
};

// Add new gallery item
export const addGalleryItem = (item: Omit<GalleryItem, 'id' | 'postedDate'>): GalleryItem => {
  const galleryItems = getAllGalleryItems();
  const newItem: GalleryItem = {
    ...item,
    id: uuidv4(),
    postedDate: new Date().toISOString()
  };
  
  galleryItems.push(newItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(galleryItems));
  
  return newItem;
};

// Update gallery item
export const updateGalleryItem = (id: string, updatedData: Partial<GalleryItem>): GalleryItem | null => {
  const galleryItems = getAllGalleryItems();
  const index = galleryItems.findIndex(item => item.id === id);
  
  if (index === -1) return null;
  
  const updatedItem = {
    ...galleryItems[index],
    ...updatedData
  };
  
  galleryItems[index] = updatedItem;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(galleryItems));
  
  return updatedItem;
};

// Delete gallery item
export const deleteGalleryItem = (id: string): boolean => {
  const galleryItems = getAllGalleryItems();
  const filteredItems = galleryItems.filter(item => item.id !== id);
  
  if (filteredItems.length === galleryItems.length) {
    return false; // No item was deleted
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredItems));
  return true; // Item was deleted
};

// Search gallery items
export const searchGalleryItems = (query: string): GalleryItem[] => {
  const galleryItems = getAllGalleryItems();
  const lowerCaseQuery = query.toLowerCase();
  
  return galleryItems.filter(item => 
    item.title.toLowerCase().includes(lowerCaseQuery) ||
    item.description.toLowerCase().includes(lowerCaseQuery)
  );
};

// Approve or reject a gallery item
export const approveGalleryItem = (id: string, approve: boolean): GalleryItem | null => {
  return updateGalleryItem(id, { isApproved: approve });
};

// Get gallery statistics
export const getGalleryStatistics = () => {
  const galleryItems = getAllGalleryItems();
  
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
};

// Initialize with empty array if no data exists
export const initializeGalleryData = () => {
  const existingData = localStorage.getItem(STORAGE_KEY);
  
  if (!existingData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
}; 