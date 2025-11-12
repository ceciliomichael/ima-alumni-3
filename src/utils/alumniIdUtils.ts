/**
 * Alumni ID format: 123456-A (6 digits + dash + 1 letter)
 */

/**
 * Validates if an Alumni ID follows the correct format
 */
export const validateAlumniId = (alumniId: string): boolean => {
  return /^\d{6}-[A-Z]$/i.test(alumniId.trim());
};

/**
 * Formats an Alumni ID to the standard format with dash
 */
export const formatAlumniId = (alumniId: string): string => {
  const cleaned = alumniId.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  
  // If it already has the correct format, return as is
  if (/^\d{6}-[A-Z]$/.test(alumniId)) return alumniId.toUpperCase();
  
  // Extract digits and letter
  const digits = cleaned.replace(/[^0-9]/g, '').slice(0, 6);
  const letter = cleaned.replace(/[^A-Z]/g, '').slice(0, 1);
  
  if (digits.length === 6 && letter.length === 1) {
    return `${digits}-${letter}`;
  }
  
  return alumniId;
};

/**
 * Normalizes Alumni ID for storage/comparison (uppercase)
 */
export const cleanAlumniId = (alumniId: string): string => {
  return alumniId.trim().toUpperCase();
};

/**
 * Generates a new Alumni ID
 * Note: In production, this should ensure uniqueness against the database
 */
export const generateAlumniId = (): string => {
  const digits = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
  return `${digits}-${letter}`;
};

/**
 * Validates Alumni ID input and returns formatted version or error
 */
export const validateAndFormatAlumniId = (input: string): { isValid: boolean; formatted?: string; error?: string } => {
  if (!input.trim()) {
    return { isValid: false, error: 'Alumni ID is required' };
  }

  const formatted = formatAlumniId(input);
  
  if (!validateAlumniId(formatted)) {
    return { isValid: false, error: 'Alumni ID must be in format: 123456-A (6 digits, dash, 1 letter)' };
  }

  return { isValid: true, formatted };
};
