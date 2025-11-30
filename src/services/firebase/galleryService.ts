import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { GalleryPost } from '../../types';
import { createModerationNotification } from './notificationService';

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

// Subscribe to all gallery items (real-time)
export const subscribeToGalleryItems = (
  callback: (items: GalleryPost[]) => void
): Unsubscribe => {
  const galleryRef = collection(db, COLLECTION_NAME);
  const q = query(galleryRef);

  return onSnapshot(q, (snapshot) => {
    const allItems = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as GalleryPost));

    callback(allItems);
  });
};

export const subscribeToPendingGalleryItems = (
  callback: (items: GalleryPost[]) => void
): Unsubscribe => {
  const galleryRef = collection(db, COLLECTION_NAME);
  const q = query(galleryRef);

  return onSnapshot(q, (snapshot) => {
    const allItems = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as GalleryPost));

    const pendingItems = allItems.filter(
      item => !item.isApproved && item.moderationStatus !== 'rejected'
    );
    callback(pendingItems);
  });
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
export const approveGalleryItem = async (id: string, approve: boolean, rejectionReason?: string): Promise<GalleryPost | null> => {
  // Get the gallery item first to access postedBy for notification
  const galleryItem = await getGalleryItemById(id);

  const update: Partial<GalleryPost> = {
    isApproved: approve,
    moderationStatus: approve ? 'approved' : 'rejected',
  };

  if (!approve && rejectionReason) {
    update.rejectionReason = rejectionReason;
  }

  const result = await updateGalleryItem(id, update);
  
  // Send notification to the poster about moderation decision
  if (galleryItem?.postedBy) {
    createModerationNotification(
      'gallery',
      approve,
      galleryItem.postedBy,
      galleryItem.title || galleryItem.albumTitle,
      rejectionReason,
      id
    ).catch((error) => {
      console.error('Failed to create gallery moderation notification:', error);
    });
  }
  
  return result;
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

// Album-specific functions

// Create a new album
export const createAlbum = async (
  albumTitle: string,
  albumCategory: string,
  description: string,
  images: Array<{ url: string; title: string }>,
  postedBy: string
): Promise<string> => {
  try {
    const albumId = `album_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create album items for each image
    const albumItems = images.map((image, index) => ({
      title: image.title,
      description: description,
      imageUrl: image.url,
      images: images.map((img, idx) => ({
        id: `img_${idx}`,
        url: img.url,
        title: img.title,
        order: idx
      })),
      albumId: albumId,
      albumTitle: albumTitle,
      imageOrder: index,
      isAlbum: true,
      albumCategory: albumCategory,
      event: '',
      isApproved: false,
      postedBy: postedBy,
      likedBy: [],
      bookmarkedBy: [],
      postedDate: new Date().toISOString()
    }));
    
    // Add all album items to Firestore
    const promises = albumItems.map(item => addDoc(collection(db, COLLECTION_NAME), item));
    await Promise.all(promises);
    
    return albumId;
  } catch (error) {
    console.error('Error creating album:', error);
    throw error;
  }
};

// Get all images in an album
export const getAlbumImages = async (albumId: string): Promise<GalleryPost[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("albumId", "==", albumId));
    const querySnapshot = await getDocs(q);
    
    const images = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as GalleryPost));
    
    // Sort by imageOrder
    return images.sort((a, b) => (a.imageOrder || 0) - (b.imageOrder || 0));
  } catch (error) {
    console.error('Error getting album images:', error);
    return [];
  }
};

// Subscribe to unique albums (real-time) - groups by albumId
export const subscribeToUniqueAlbums = (
  callback: (items: GalleryPost[]) => void
): Unsubscribe => {
  const galleryRef = collection(db, COLLECTION_NAME);
  const q = query(galleryRef);

  return onSnapshot(q, (snapshot) => {
    const allItems = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as GalleryPost));

    // Group by albumId and get the first image of each album for preview
    const albumMap = new Map<string, GalleryPost>();
    const singleImages: GalleryPost[] = [];

    allItems.forEach(item => {
      if (item.isAlbum && item.albumId) {
        // For albums, keep only the first image (order 0) for preview
        if (!albumMap.has(item.albumId) || (item.imageOrder || 0) === 0) {
          albumMap.set(item.albumId, item);
        }
      } else {
        // Single images
        singleImages.push(item);
      }
    });

    callback([...Array.from(albumMap.values()), ...singleImages]);
  });
};

// Get unique albums (grouped by albumId)
export const getUniqueAlbums = async (): Promise<GalleryPost[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const allItems = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as GalleryPost));
    
    // Group by albumId and get the first image of each album for preview
    const albumMap = new Map<string, GalleryPost>();
    const singleImages: GalleryPost[] = [];
    
    allItems.forEach(item => {
      if (item.isAlbum && item.albumId) {
        // For albums, keep only the first image (order 0) for preview
        if (!albumMap.has(item.albumId) || (item.imageOrder || 0) === 0) {
          albumMap.set(item.albumId, item);
        }
      } else {
        // Single images
        singleImages.push(item);
      }
    });
    
    return [...Array.from(albumMap.values()), ...singleImages];
  } catch (error) {
    console.error('Error getting unique albums:', error);
    return [];
  }
};

// Add image to existing album
export const addImageToAlbum = async (
  albumId: string,
  imageUrl: string,
  imageTitle: string
): Promise<GalleryPost | null> => {
  try {
    // Get existing album images to determine next order
    const existingImages = await getAlbumImages(albumId);
    const nextOrder = existingImages.length;
    
    // Get album info from first image
    const albumInfo = existingImages[0];
    if (!albumInfo) {
      throw new Error('Album not found');
    }
    
    // Update all existing images in the album to include the new image
    const updatedImagesArray = [
      ...(albumInfo.images || []),
      {
        id: `img_${nextOrder}`,
        url: imageUrl,
        title: imageTitle,
        order: nextOrder
      }
    ];
    
    // Create new album item for the new image
    const newAlbumItem = {
      title: imageTitle,
      description: albumInfo.description,
      imageUrl: imageUrl,
      images: updatedImagesArray,
      albumId: albumId,
      albumTitle: albumInfo.albumTitle,
      imageOrder: nextOrder,
      isAlbum: true,
      albumCategory: albumInfo.albumCategory,
      event: albumInfo.event,
      isApproved: false,
      postedBy: albumInfo.postedBy,
      likedBy: [],
      bookmarkedBy: [],
      postedDate: new Date().toISOString()
    };
    
    // Add the new image to the album
    const docRef = await addDoc(collection(db, COLLECTION_NAME), newAlbumItem);
    
    // Update all existing images in the album to include the new image in their images array
    const updatePromises = existingImages.map(img => 
      updateDoc(doc(db, COLLECTION_NAME, img.id), {
        images: updatedImagesArray
      })
    );
    await Promise.all(updatePromises);
    
    return {
      id: docRef.id,
      ...newAlbumItem
    };
  } catch (error) {
    console.error('Error adding image to album:', error);
    return null;
  }
};
