import { getAllUsers, setCurrentUser, getUserById, approveUser, createUser } from '../firebase/userService';
import { getAllAlumni, updateAlumni } from '../firebase/alumniService';
import { User } from '../firebase/userService';

export interface NameLoginResult {
  success: boolean;
  user?: User;
  multipleMatches?: User[];
  error?: string;
}

/**
 * Normalize a full name by collapsing whitespace and lowercasing
 */
const normalizeFullName = (value: string): string => {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
};

/**
 * Find active users by exact name match (case-insensitive)
 */
export const findActiveUsersByExactName = async (name: string): Promise<User[]> => {
  try {
    const allUsers = await getAllUsers();
    const normalizedInput = normalizeFullName(name);
    
    return allUsers.filter(user => 
      user.isActive && 
      normalizeFullName(user.name) === normalizedInput
    );
  } catch (error) {
    console.error('Error finding users by name:', error);
    return [];
  }
};

/**
 * Find active alumni records by exact name match (case-insensitive)
 */
const findActiveAlumniByExactName = async (name: string) => {
  try {
    const allAlumni = await getAllAlumni();
    const normalizedInput = normalizeFullName(name);
    return allAlumni.filter(alumni => alumni.isActive && normalizeFullName(alumni.name) === normalizedInput);
  } catch (error) {
    console.error('Error finding alumni by name:', error);
    return [] as any[];
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
 * Handle name-based login with duplicate name handling
 */
export const loginByName = async (name: string): Promise<NameLoginResult> => {
  try {
    if (!name.trim()) {
      return {
        success: false,
        error: 'Please enter your full name'
      };
    }

    // 1) Try direct user match first
    const matchingUsers = await findActiveUsersByExactName(name);

    if (matchingUsers.length === 1) {
      const user = matchingUsers[0];
      setCurrentUser(user);
      return { success: true, user };
    }

    if (matchingUsers.length > 1) {
      return {
        success: false,
        multipleMatches: matchingUsers,
        error: 'Multiple accounts found with this name. Please select your profile below.'
      };
    }

    // 2) No user match: try alumni records and auto-provision
    const alumniMatches = await findActiveAlumniByExactName(name);

    if (alumniMatches.length === 0) {
      return {
        success: false,
        error: 'No active alumni account found with this name. Please contact the administrator if you believe this is an error.'
      };
    }

    // Map alumni matches to users (creating if necessary)
    const usersFromAlumni: User[] = [];
    for (const alumni of alumniMatches) {
      const ensured = await ensureUserFromAlumniRecord(alumni);
      if (ensured && ensured.isActive) {
        usersFromAlumni.push(ensured);
      }
    }

    if (usersFromAlumni.length === 0) {
      return {
        success: false,
        error: 'No active alumni-linked user found for this name. Please contact the administrator.'
      };
    }

    if (usersFromAlumni.length === 1) {
      const user = usersFromAlumni[0];
      setCurrentUser(user);
      return { success: true, user };
    }

    // Multiple alumni with the same name → let user select
    return {
      success: false,
      multipleMatches: usersFromAlumni,
      error: 'Multiple alumni records found with this name. Please select your profile below.'
    };
  } catch (error) {
    console.error('Error during name login:', error);
    return {
      success: false,
      error: 'An error occurred during login. Please try again.'
    };
  }
};

/**
 * Login with a specific user from multiple matches
 */
export const loginWithSelectedUser = async (user: User): Promise<NameLoginResult> => {
  try {
    setCurrentUser(user);
    return {
      success: true,
      user
    };
  } catch (error) {
    console.error('Error logging in selected user:', error);
    return {
      success: false,
      error: 'An error occurred during login. Please try again.'
    };
  }
};
