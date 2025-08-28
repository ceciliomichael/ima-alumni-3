/**
 * Utility functions for image handling and base64 conversion
 */

/**
 * Converts a File object to base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (reader.result) {
        resolve(reader.result as string);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Validates image file type and size
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Please select a valid image file (JPEG, PNG, GIF, or WebP)'
    };
  }
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Image size must be less than 5MB'
    };
  }
  
  return { isValid: true };
};

/**
 * Resizes an image file before converting to base64
 */
export const resizeImage = (file: File, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL(file.type, quality);
        resolve(base64);
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Converts and validates image file to base64 with optional resizing
 */
export const processImageFile = async (file: File, resize: boolean = true): Promise<{ success: boolean; base64?: string; error?: string }> => {
  try {
    // Validate file first
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }
    
    // Convert to base64 with optional resizing
    const base64 = resize 
      ? await resizeImage(file)
      : await fileToBase64(file);
    
    return { success: true, base64 };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to process image' 
    };
  }
};
