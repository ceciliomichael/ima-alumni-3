/**
 * Form validation utilities for admin-side input validation
 * Ensures data quality and prevents invalid input types
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates that text input contains letters and is not purely numeric
 * Used for fields like names, titles, locations, company names
 */
export const validateTextOnly = (value: string, fieldName: string = 'Field'): ValidationResult => {
  if (!value || !value.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const trimmedValue = value.trim();
  
  // Check if input is purely numeric
  if (/^\d+$/.test(trimmedValue)) {
    return { 
      isValid: false, 
      error: `${fieldName} must contain letters, not just numbers` 
    };
  }

  // Check if input starts with numbers only (e.g., "123abc" is suspicious)
  if (/^[\d\s]+$/.test(trimmedValue)) {
    return { 
      isValid: false, 
      error: `${fieldName} cannot contain only numbers and spaces` 
    };
  }

  return { isValid: true };
};

/**
 * Validates name fields (person names)
 * Accepts letters, spaces, hyphens, apostrophes, periods
 * Rejects purely numeric input
 */
export const validateName = (name: string): ValidationResult => {
  if (!name || !name.trim()) {
    return { isValid: false, error: 'Name is required' };
  }

  const trimmedName = name.trim();

  // Check if purely numeric
  if (/^\d+$/.test(trimmedName)) {
    return { 
      isValid: false, 
      error: 'Name must contain letters, not just numbers' 
    };
  }

  // Check if contains at least one letter
  if (!/[a-zA-Z]/.test(trimmedName)) {
    return { 
      isValid: false, 
      error: 'Name must contain at least one letter' 
    };
  }

  // Validate name pattern (letters, spaces, hyphens, apostrophes, periods)
  if (!/^[a-zA-Z\s\-'.]+$/.test(trimmedName)) {
    return { 
      isValid: false, 
      error: 'Name can only contain letters, spaces, hyphens, apostrophes, and periods' 
    };
  }

  return { isValid: true };
};

/**
 * Validates title/heading fields (event titles, job titles, etc.)
 * More permissive than name validation - allows numbers but not ONLY numbers
 */
export const validateTitle = (title: string): ValidationResult => {
  if (!title || !title.trim()) {
    return { isValid: false, error: 'Title is required' };
  }

  const trimmedTitle = title.trim();

  // Check if purely numeric
  if (/^\d+$/.test(trimmedTitle)) {
    return { 
      isValid: false, 
      error: 'Title must contain letters, not just numbers' 
    };
  }

  // Check if contains at least one letter
  if (!/[a-zA-Z]/.test(trimmedTitle)) {
    return { 
      isValid: false, 
      error: 'Title must contain at least one letter' 
    };
  }

  return { isValid: true };
};

/**
 * Validates location fields (addresses, venue names)
 * Allows letters, numbers, spaces, and common punctuation
 * But must contain at least one letter
 */
export const validateLocation = (location: string): ValidationResult => {
  if (!location || !location.trim()) {
    return { isValid: false, error: 'Location is required' };
  }

  const trimmedLocation = location.trim();

  // Check if purely numeric
  if (/^\d+$/.test(trimmedLocation)) {
    return { 
      isValid: false, 
      error: 'Location must contain letters, not just numbers' 
    };
  }

  // Check if contains at least one letter
  if (!/[a-zA-Z]/.test(trimmedLocation)) {
    return { 
      isValid: false, 
      error: 'Location must contain at least one letter' 
    };
  }

  return { isValid: true };
};

/**
 * Validates company name fields
 * Allows letters, numbers, spaces, and common business characters (&, ., -, etc.)
 * But must contain at least one letter
 */
export const validateCompanyName = (company: string): ValidationResult => {
  if (!company || !company.trim()) {
    return { isValid: false, error: 'Company name is required' };
  }

  const trimmedCompany = company.trim();

  // Check if purely numeric
  if (/^\d+$/.test(trimmedCompany)) {
    return { 
      isValid: false, 
      error: 'Company name must contain letters, not just numbers' 
    };
  }

  // Check if contains at least one letter
  if (!/[a-zA-Z]/.test(trimmedCompany)) {
    return { 
      isValid: false, 
      error: 'Company name must contain at least one letter' 
    };
  }

  return { isValid: true };
};
