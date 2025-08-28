/**
 * Alumni ID format: 1234 5678 9012 (12 digits with spaces)
 */

/**
 * Validates if an Alumni ID follows the correct format
 */
export const validateAlumniId = (alumniId: string): boolean => {
  const cleanId = alumniId.replace(/\s/g, '');
  return /^\d{12}$/.test(cleanId);
};

/**
 * Formats an Alumni ID to the standard format with spaces
 */
export const formatAlumniId = (alumniId: string): string => {
  const cleanId = alumniId.replace(/\s/g, '');
  if (cleanId.length !== 12) return alumniId;
  
  return `${cleanId.slice(0, 4)} ${cleanId.slice(4, 8)} ${cleanId.slice(8, 12)}`;
};

/**
 * Removes spaces from Alumni ID for storage/comparison
 */
export const cleanAlumniId = (alumniId: string): string => {
  return alumniId.replace(/\s/g, '');
};

/**
 * Generates a new Alumni ID
 * Note: In production, this should ensure uniqueness against the database
 */
export const generateAlumniId = (): string => {
  const id = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
  return formatAlumniId(id);
};

/**
 * Validates Alumni ID input and returns formatted version or error
 */
export const validateAndFormatAlumniId = (input: string): { isValid: boolean; formatted?: string; error?: string } => {
  if (!input.trim()) {
    return { isValid: false, error: 'Alumni ID is required' };
  }

  const cleanInput = cleanAlumniId(input);
  
  if (cleanInput.length !== 12) {
    return { isValid: false, error: 'Alumni ID must be exactly 12 digits' };
  }

  if (!validateAlumniId(input)) {
    return { isValid: false, error: 'Alumni ID must contain only numbers' };
  }

  return { isValid: true, formatted: formatAlumniId(cleanInput) };
};
