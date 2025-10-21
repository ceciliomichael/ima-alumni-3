/**
 * Password utility functions for IMA Alumni System
 */

/**
 * Generates initial password in format: [lastname][batch_year]
 * @param fullName - The full name of the user (e.g., "John Smith")
 * @param batchYear - The batch year of the user (e.g., "2020", "2023")
 * @returns Password in format lastname[year] (e.g., "smith2020")
 */
export const generateInitialPassword = (fullName: string, batchYear?: string): string => {
  if (!fullName || !fullName.trim()) {
    const year = batchYear || new Date().getFullYear().toString();
    return `ima${year}`; // Fallback password if no name provided
  }

  // Split name and get the last part (lastname)
  const nameParts = fullName.trim().split(/\s+/);
  const lastname = nameParts[nameParts.length - 1];

  // Extract year from batch (e.g., "2020" from "2020" or "Batch 2020")
  let year = new Date().getFullYear().toString();
  if (batchYear) {
    // Extract 4-digit year from batch string
    const yearMatch = batchYear.match(/\d{4}/);
    if (yearMatch) {
      year = yearMatch[0];
    }
  }

  // Convert to lowercase and append year
  return `${lastname.toLowerCase()}${year}`;
};

/**
 * Validates password strength
 * @param password - The password to validate
 * @returns Validation result with isValid flag and optional error message
 */
export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (!password || !password.trim()) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long' };
  }

  return { isValid: true };
};

/**
 * Validates password change requirements
 * @param currentPassword - Current password
 * @param newPassword - New password
 * @param confirmPassword - Confirmation of new password
 * @returns Validation result
 */
export const validatePasswordChange = (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): { isValid: boolean; error?: string } => {
  if (!currentPassword || !currentPassword.trim()) {
    return { isValid: false, error: 'Current password is required' };
  }

  const newPasswordValidation = validatePassword(newPassword);
  if (!newPasswordValidation.isValid) {
    return newPasswordValidation;
  }

  if (newPassword !== confirmPassword) {
    return { isValid: false, error: 'New passwords do not match' };
  }

  if (currentPassword === newPassword) {
    return { isValid: false, error: 'New password must be different from current password' };
  }

  return { isValid: true };
};

/**
 * Checks if user is using default password format
 * @param password - Password to check
 * @param fullName - User's full name
 * @returns true if password matches default format
 */
export const isDefaultPassword = (password: string, fullName: string): boolean => {
  const defaultPassword = generateInitialPassword(fullName);
  return password === defaultPassword;
};

