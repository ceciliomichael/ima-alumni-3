import { updateUser, getUserById } from '../firebase/userService';
import { generateInitialPassword, validatePasswordChange } from '../../utils/passwordUtils';
import { sendPasswordResetEmail, getLoginUrl } from '../email/emailService';

/**
 * Change user password
 * @param userId - User ID
 * @param currentPassword - Current password
 * @param newPassword - New password
 * @param confirmPassword - Confirmation of new password
 * @returns Success status and optional error message
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate inputs
    const validation = validatePasswordChange(currentPassword, newPassword, confirmPassword);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Get user
    const user = await getUserById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Verify current password
    if (user.password !== currentPassword) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Update password
    const updated = await updateUser(userId, { password: newPassword });
    if (!updated) {
      return { success: false, error: 'Failed to update password' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error changing password:', error);
    return { success: false, error: 'An error occurred while changing password' };
  }
};

/**
 * Admin reset user password to default ([lastname][batch_year])
 * @param userId - User ID
 * @returns Success status, new password, and optional error message
 */
export const adminResetPassword = async (
  userId: string
): Promise<{ success: boolean; newPassword?: string; error?: string }> => {
  try {
    // Get user
    const user = await getUserById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Generate default password based on user's batch year
    const newPassword = generateInitialPassword(user.name, user.batch);

    // Update password
    const updated = await updateUser(userId, { password: newPassword });
    if (!updated) {
      return { success: false, error: 'Failed to reset password' };
    }

    // Send password reset email
    if (user.email && user.email !== '' && !user.email.includes('noreply')) {
      const emailResult = await sendPasswordResetEmail(user.email, {
        user_name: user.name,
        temp_password: newPassword,
        login_url: getLoginUrl(),
      });

      if (!emailResult.success) {
        console.warn('Failed to send password reset email:', emailResult.error);
        // Don't fail the entire operation if email fails
      }
    }

    return { success: true, newPassword };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { success: false, error: 'An error occurred while resetting password' };
  }
};

/**
 * Set initial password for user (used during user creation/provisioning)
 * @param userId - User ID
 * @param name - User's full name
 * @param batchYear - User's batch year
 * @returns Success status and optional error message
 */
export const setInitialPassword = async (
  userId: string,
  name: string,
  batchYear?: string
): Promise<{ success: boolean; password?: string; error?: string }> => {
  try {
    const password = generateInitialPassword(name, batchYear);
    const updated = await updateUser(userId, { password });
    
    if (!updated) {
      return { success: false, error: 'Failed to set initial password' };
    }

    return { success: true, password };
  } catch (error) {
    console.error('Error setting initial password:', error);
    return { success: false, error: 'An error occurred while setting password' };
  }
};

/**
 * Request password reset (user-initiated)
 * Generates a new temporary password and sends it via email
 * @param emailOrAlumniId - User's email or Alumni ID
 * @returns Success status and optional error message
 */
export const requestPasswordReset = async (
  emailOrAlumniId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Try to find user by email first
    const user = await getUserById(emailOrAlumniId);
    
    // If not found, try other lookup methods (you might need to import these)
    if (!user) {
      // This would require importing getUserByEmail or getUserByAlumniId
      // For now, just return error
      return { success: false, error: 'User not found' };
    }

    // Generate new temporary password
    const newPassword = generateInitialPassword(user.name, user.batch);

    // Update password
    const updated = await updateUser(user.id, { password: newPassword });
    if (!updated) {
      return { success: false, error: 'Failed to reset password' };
    }

    // Send password reset email
    if (!user.email || user.email === '' || user.email.includes('noreply')) {
      return { success: false, error: 'No valid email address associated with this account' };
    }

    const emailResult = await sendPasswordResetEmail(user.email, {
      user_name: user.name,
      temp_password: newPassword,
      login_url: getLoginUrl(),
    });

    if (!emailResult.success) {
      return { success: false, error: `Password was reset but email failed to send: ${emailResult.error}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return { success: false, error: 'An error occurred while processing password reset request' };
  }
};

