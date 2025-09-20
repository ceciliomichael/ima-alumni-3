import { getUserByAlumniId, setCurrentUser, getUserById, approveUser, createUser } from '../firebase/userService';
import { getAlumniByAlumniId, updateAlumni } from '../firebase/alumniService';
import { User } from '../firebase/userService';
import { validateAndFormatAlumniId, cleanAlumniId } from '../../utils/alumniIdUtils';

export interface AlumniIdLoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Find active user by Alumni ID
 */
export const findActiveUserByAlumniId = async (alumniId: string): Promise<User | null> => {
  try {
    const user = await getUserByAlumniId(alumniId);
    return user && user.isActive ? user : null;
  } catch (error) {
    console.error('Error finding user by Alumni ID:', error);
    return null;
  }
};

/**
 * Ensure there is an active user linked to the alumni record.
 * If the alumni has no user, auto-provision a minimal active user and link it.
 * If the user exists but inactive while alumni is active, auto-approve the user.
 */
const ensureUserFromAlumniRecord = async (alumniRecord: any): Promise<User | null> => {
  try {
    if (alumniRecord.userId) {
      const linkedUser = await getUserById(alumniRecord.userId);
      if (linkedUser) {
        if (!linkedUser.isActive && alumniRecord.isActive) {
          const approved = await approveUser(linkedUser.id);
          return approved;
        }
        return linkedUser;
      }
      // Linked userId not found, fall through to create a new one
    }

    // Create a minimal active user using alumni data
    const created = await createUser({
      name: alumniRecord.name,
      email: alumniRecord.email,
      batch: alumniRecord.batch,
      profileImage: alumniRecord.profileImage,
      isActive: true
    });

    if (created) {
      // Link back to alumni record
      await updateAlumni(alumniRecord.id, { userId: created.id });
      return created;
    }

    return null;
  } catch (error) {
    console.error('Error ensuring user from alumni record:', error);
    return null;
  }
};

/**
 * Handle Alumni ID-based login
 */
export const loginByAlumniId = async (alumniId: string): Promise<AlumniIdLoginResult> => {
  try {
    if (!alumniId.trim()) {
      return {
        success: false,
        error: 'Please enter your Alumni ID'
      };
    }

    // Validate Alumni ID format
    const validation = validateAndFormatAlumniId(alumniId);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error || 'Invalid Alumni ID format'
      };
    }

    const cleanId = cleanAlumniId(alumniId);

    // 1) Try direct user match first
    const user = await findActiveUserByAlumniId(cleanId);
    
    if (user) {
      setCurrentUser(user);
      return { success: true, user };
    }

    // 2) Check if Alumni ID exists in alumni records
    const alumniRecord = await getAlumniByAlumniId(cleanId);
    
    if (!alumniRecord) {
      return {
        success: false,
        error: 'Alumni ID does not exist. Please contact the administrator if you believe this is an error.'
      };
    }

    if (!alumniRecord.isActive) {
      return {
        success: false,
        error: 'Your account is not active. Please contact the administrator for assistance.'
      };
    }

    // 3) Alumni record exists but no user - auto-provision
    const ensuredUser = await ensureUserFromAlumniRecord(alumniRecord);
    
    if (ensuredUser && ensuredUser.isActive) {
      setCurrentUser(ensuredUser);
      return { success: true, user: ensuredUser };
    }

    return {
      success: false,
      error: 'Unable to access your account. Please contact the administrator for assistance.'
    };
  } catch (error) {
    console.error('Error during Alumni ID login:', error);
    return {
      success: false,
      error: 'An error occurred during login. Please try again.'
    };
  }
};

/**
 * Validate Alumni ID format for input
 */
export const validateAlumniIdInput = (alumniId: string): { isValid: boolean; error?: string } => {
  return validateAndFormatAlumniId(alumniId);
};
