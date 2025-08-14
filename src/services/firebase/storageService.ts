import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

/**
 * Convert a file to a base64 string
 * @param file The file to convert
 * @returns A promise that resolves to the base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Upload a base64 image to Firestore
 * @param base64 The base64 string to upload
 * @param collectionName The collection to upload to
 * @param metadata Additional metadata for the image
 * @returns A promise that resolves to the document ID
 */
export const uploadBase64Image = async (
  base64: string,
  collectionName: string,
  metadata: Record<string, any>
): Promise<string> => {
  try {
    // Create a new document reference with an auto-generated ID
    const docRef = doc(collection(db, collectionName));
    
    // Set the document data with the base64 image and metadata
    await setDoc(docRef, {
      imageUrl: base64,
      ...metadata,
      createdAt: new Date().toISOString()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Validate an image file
 * @param file The file to validate
 * @param maxSizeMB The maximum file size in MB
 * @returns An object with validation result and error message
 */
export const validateImageFile = (file: File, maxSizeMB: number = 5): { valid: boolean; message?: string } => {
  // Check if file is an image
  if (!file.type.startsWith('image/')) {
    return { valid: false, message: 'File must be an image' };
  }
  
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { valid: false, message: `Image size must be less than ${maxSizeMB}MB` };
  }
  
  return { valid: true };
};

/**
 * Resize an image to a maximum width and height while maintaining aspect ratio
 * @param file The image file to resize
 * @param maxWidth The maximum width
 * @param maxHeight The maximum height
 * @param quality The quality of the resized image (0-1)
 * @param forceJpeg Whether to force JPEG format (smaller file size)
 * @returns A promise that resolves to a base64 string of the resized image
 */
export const resizeImage = (
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.6,
  forceJpeg: boolean = true
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      // Release object URL
      URL.revokeObjectURL(img.src);
      
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = Math.round(height * (maxWidth / width));
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = Math.round(width * (maxHeight / height));
        height = maxHeight;
      }
      
      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64 (use JPEG for smaller file size if requested)
      const outputType = forceJpeg ? 'image/jpeg' : file.type;
      const base64 = canvas.toDataURL(outputType, quality);
      
      // Check if the base64 string is too large for Firestore (max ~1MB)
      if (base64.length > 900000) {
        // If still too large, reduce quality further
        const reducedQuality = quality * 0.7;
        const reducedBase64 = canvas.toDataURL(outputType, reducedQuality);
        resolve(reducedBase64);
      } else {
        resolve(base64);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Error loading image'));
    };
  });
};
