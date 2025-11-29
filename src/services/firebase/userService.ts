import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, UpdateData, DocumentData } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { addAlumni, getAlumniByUserId, updateAlumni, getAllAlumni } from './alumniService';
import { cleanAlumniId } from '../../utils/alumniIdUtils';
import { deleteUserContent, updateUserPosts } from './postService';
import { getOfficersByAlumniId } from './officerService';
import { AlumniRecord } from '../../types';

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // In a real app, this would be hashed
  alumniId?: string; // Alumni ID for authentication
  batch: string;
  profileImage?: string;
  coverPhoto?: string;
  bio?: string;
  job?: string;
  company?: string;
  location?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  createdAt: string;
  isActive: boolean;
  following?: string[];
  followers?: string[];
  officerPosition?: {
    title: string;
    startDate: string;
    endDate?: string;
    batchYear?: string;
  };
  showOfficerInfo?: boolean; // Whether to display officer information on profile
  deletedAt?: string; // Timestamp for soft delete
}

const COLLECTION_NAME = 'users';
const CURRENT_USER_KEY = 'currentUser'; // Still using localStorage for current user session

// Utility function to filter out undefined values from an object
const filterUndefinedValues = (obj: Record<string, unknown>): Record<string, unknown> => {
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      filtered[key] = value;
    }
  }
  return filtered;
};

// Get all users
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User))
      .filter(user => !user.deletedAt); // Exclude soft-deleted users
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

// Cleanup helper to remove posts/comments for users already marked as deleted
// and for users that no longer have an active alumni record
export const cleanupDeletedUsersContent = async (): Promise<void> => {
  try {
    // Load all users (including deleted) and all active alumni records
    const [querySnapshot, alumniRecords] = await Promise.all([
      getDocs(collection(db, COLLECTION_NAME)),
      getAllAlumni()
    ]);

    const users = querySnapshot.docs
      .map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as User));

    // User IDs that still have an active alumni record
    const activeAlumniUserIds = new Set(
      alumniRecords
        .filter(alumni => alumni.userId)
        .map(alumni => alumni.userId as string)
    );

    const deletedUsers = users.filter(user => user.deletedAt);

    // Users that are not marked deleted but also no longer have an alumni record
    const orphanUsers = users.filter(user =>
      !user.deletedAt && !activeAlumniUserIds.has(user.id)
    );

    const idsToCleanup = new Set<string>();
    deletedUsers.forEach(user => idsToCleanup.add(user.id));
    orphanUsers.forEach(user => idsToCleanup.add(user.id));

    if (idsToCleanup.size === 0) {
      return;
    }

    const ops = Array.from(idsToCleanup).map(async (userId) => {
      try {
        await deleteUserContent(userId);
      } catch (error) {
        console.error('Error cleaning content for deleted/orphan user:', userId, error);
      }
    });

    await Promise.all(ops);
  } catch (error) {
    console.error('Error cleaning up deleted/orphan users content:', error);
  }
};

// Get user by ID
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
};

// Get user by email
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("email", "==", email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as User;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
};

// Get user by Alumni ID (excluding deleted)
export const getUserByAlumniId = async (alumniId: string): Promise<User | null> => {
  try {
    const cleanId = cleanAlumniId(alumniId);
    const q = query(collection(db, COLLECTION_NAME), where("alumniId", "==", cleanId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const user = {
      id: doc.id,
      ...doc.data()
    } as User;
    
    // Return null if user is deleted
    return user.deletedAt ? null : user;
  } catch (error) {
    console.error('Error getting user by Alumni ID:', error);
    return null;
  }
};

// Check if Alumni ID exists
export const checkAlumniIdExists = async (alumniId: string): Promise<boolean> => {
  try {
    const user = await getUserByAlumniId(alumniId);
    return user !== null;
  } catch (error) {
    console.error('Error checking Alumni ID existence:', error);
    return false;
  }
};

// Register new user
export const registerUser = async (userData: Omit<User, 'id' | 'createdAt' | 'isActive'>): Promise<User | null> => {
  try {
    // Check if email already exists
    const existingUser = await getUserByEmail(userData.email);
    if (existingUser) {
      return null; // Email already registered
    }

    const newUser = {
      ...userData,
      email: userData.email.toLowerCase(), // Store email in lowercase for consistency
      createdAt: new Date().toISOString(),
      isActive: false, // Users need to be approved by admin
      profileImage: userData.profileImage || undefined,
      coverPhoto: userData.coverPhoto || undefined
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), newUser);
    
    const createdUser = {
      id: docRef.id,
      ...newUser
    } as User;
    
    // Create matching alumni record
    await addAlumni({
      name: userData.name,
      email: userData.email,
      batch: userData.batch || 'Unknown',
      isActive: false,
      profileImage: userData.profileImage,
      userId: createdUser.id, // Link to user ID
      dateRegistered: new Date().toISOString()
    });
    
    return createdUser;
  } catch (error) {
    console.error('Error registering user:', error);
    return null;
  }
};

// Login user
export const loginUser = async (email: string, password: string): Promise<User | null> => {
  try {
    const user = await getUserByEmail(email);
    
    if (!user || user.password !== password) {
      return null; // Invalid credentials
    }

    // Check if user is deleted
    if (user.deletedAt) {
      return null; // User is deleted
    }

    if (!user.isActive) {
      return null; // Account not approved
    }

    // Store current user in localStorage
    setCurrentUser(user);
    return user;
  } catch (error) {
    console.error('Error logging in user:', error);
    return null;
  }
};

// Logout user
export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

// Change user password
export const changePassword = async (
  userId: string, 
  oldPassword: string, 
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'User not found' };
    }
    
    const userData = docSnap.data() as Omit<User, 'id'>;
    
    // Verify old password
    if (userData.password !== oldPassword) {
      return { success: false, error: 'Current password is incorrect' };
    }
    
    // Update password
    await updateDoc(docRef, { password: newPassword });
    
    // Update current user in localStorage if this is the logged-in user
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      setCurrentUser({ ...currentUser, password: newPassword } as User);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error changing password:', error);
    return { success: false, error: 'Failed to change password. Please try again.' };
  }
};

// Get current logged in user
export const getCurrentUser = (): User | null => {
  const currentUser = localStorage.getItem(CURRENT_USER_KEY);
  return currentUser ? JSON.parse(currentUser) : null;
};

// Set current user
export const setCurrentUser = (user: User) => {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
};

// Update user
export const updateUser = async (id: string, updatedData: Partial<User>): Promise<User | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.error('User document not found:', id);
      return null;
    }
    
    const currentData = docSnap.data() as Omit<User, 'id'>;
    
    // Filter out undefined values from the update data first
    const cleanedUpdatedData = filterUndefinedValues(updatedData);
    console.log('Cleaned update data:', cleanedUpdatedData);
    
    // Handle special case for socialLinks to prevent partial overwrite
    if (cleanedUpdatedData.socialLinks && currentData.socialLinks) {
      cleanedUpdatedData.socialLinks = {
        ...currentData.socialLinks,
        ...cleanedUpdatedData.socialLinks
      };
    }
    
    // For profileImage and coverPhoto, only include them if they have values
    const finalUpdateData: Record<string, unknown> = { ...cleanedUpdatedData };
    
    // Only include profileImage if it's being explicitly updated with a value
    if (updatedData.profileImage !== undefined) {
      finalUpdateData.profileImage = updatedData.profileImage;
    }
    
    // Only include coverPhoto if it's being explicitly updated with a value  
    if (updatedData.coverPhoto !== undefined) {
      finalUpdateData.coverPhoto = updatedData.coverPhoto;
    }
    
    console.log('Final update data to be sent to Firestore:', finalUpdateData);
    
    await updateDoc(docRef, finalUpdateData as UpdateData<DocumentData>);
    
    // Get the updated document
    const updatedDocSnap = await getDoc(docRef);
    let updatedUser = {
      id: updatedDocSnap.id,
      ...updatedDocSnap.data()
    } as User;
    
    // If profileImage or name changed, update all user's posts
    if (updatedData.profileImage !== undefined || updatedData.name !== undefined) {
      try {
        const postUpdates: { userName?: string; userImage?: string } = {};
        
        if (updatedData.name !== undefined) {
          postUpdates.userName = updatedData.name;
        }
        
        if (updatedData.profileImage !== undefined) {
          postUpdates.userImage = updatedData.profileImage;
        }
        
        // Update all posts by this user
        await updateUserPosts(id, postUpdates);
      } catch (error) {
        console.error('Error updating user posts:', error);
        // Don't fail the user update if post update fails
      }
    }
    
    // Sync changes to linked alumni record
    try {
      const alumniRecord = await getAlumniByUserId(id);
      if (alumniRecord) {
        const alumniUpdates: Partial<typeof alumniRecord> = {};
        
        // Sync relevant fields that exist in both User and AlumniRecord
        if (updatedData.name !== undefined) {
          alumniUpdates.name = updatedData.name;
        }
        if (updatedData.email !== undefined) {
          alumniUpdates.email = updatedData.email.toLowerCase();
        }
        if (updatedData.batch !== undefined) {
          alumniUpdates.batch = updatedData.batch;
        }
        if (updatedData.profileImage !== undefined) {
          alumniUpdates.profileImage = updatedData.profileImage;
        }
        
        // Only update if there are changes to sync
        if (Object.keys(alumniUpdates).length > 0) {
          await updateAlumni(alumniRecord.id, alumniUpdates);
        }
      }
    } catch (error) {
      console.error('Error syncing changes to alumni record:', error);
      // Don't fail the user update if alumni sync fails
    }
    
    // Sync officer position if user has an alumniId
    try {
      const updatedUserData = updatedDocSnap.data() as Omit<User, 'id'>;
      if (updatedUserData.alumniId) {
        const officers = await getOfficersByAlumniId(updatedUserData.alumniId);
        if (officers && officers.length > 0) {
          // Use the first active officer position (or first one if none are filtered)
          const activeOfficer = officers.find(o => !o.endDate || new Date(o.endDate) > new Date()) || officers[0];
          
          // Only update if officer position is different or missing
          const currentOfficerPosition = updatedUserData.officerPosition;
          const needsUpdate = !currentOfficerPosition || 
            currentOfficerPosition.title !== activeOfficer.title ||
            currentOfficerPosition.startDate !== activeOfficer.startDate ||
            currentOfficerPosition.endDate !== activeOfficer.endDate ||
            currentOfficerPosition.batchYear !== activeOfficer.batchYear;
          
          if (needsUpdate) {
            await updateDoc(docRef, {
              officerPosition: {
                title: activeOfficer.title,
                startDate: activeOfficer.startDate,
                endDate: activeOfficer.endDate,
                batchYear: activeOfficer.batchYear
              },
              showOfficerInfo: updatedUserData.showOfficerInfo !== undefined ? updatedUserData.showOfficerInfo : true
            });
            
            // Re-fetch the updated user to include officer position
            const refreshedDocSnap = await getDoc(docRef);
            if (refreshedDocSnap.exists()) {
              updatedUser = {
                id: refreshedDocSnap.id,
                ...refreshedDocSnap.data()
              } as User;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error syncing officer position:', error);
      // Don't fail the user update if officer sync fails
    }
    
    // If updating current user, update the current user in localStorage
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === id) {
      setCurrentUser(updatedUser);
      
      // Dispatch a storage event to notify other tabs
      try {
        window.dispatchEvent(new StorageEvent('storage', {
          key: CURRENT_USER_KEY
        }));
      } catch (e) {
        console.error('Failed to dispatch storage event:', e);
      }
    }
    
    return updatedUser;
  } catch (error) {
    console.error('Error updating user:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    return null;
  }
};

// Approve a user
export const approveUser = async (id: string): Promise<User | null> => {
  return updateUser(id, { isActive: true });
};

// Delete user (soft delete)
export const deleteUser = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      deletedAt: new Date().toISOString(),
      isActive: false
    });
    
    // Remove this user's posts, comments, and replies from the system
    try {
      await deleteUserContent(id);
    } catch (postError) {
      console.error('Error deleting user content:', postError);
    }
    
    // If deleting current user, logout
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === id) {
      logoutUser();
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
};

// Create minimal user (used for name-based login when only alumni record exists)
export const createUser = async (payload: {
  name: string;
  email?: string;
  batch?: string;
  profileImage?: string;
  coverPhoto?: string;
  isActive?: boolean;
  password?: string;
  alumniId?: string;
}): Promise<User | null> => {
  try {
    const baseUser: Partial<User> & { password?: string } = {
      name: payload.name,
      email: (payload.email || `noreply+${Date.now()}@ima.local`).toLowerCase(),
      password: payload.password || '',
      bio: '',
      job: '',
      company: '',
      location: '',
      socialLinks: { linkedin: '', twitter: '', website: '' },
      createdAt: new Date().toISOString(),
      isActive: payload.isActive ?? true,
      following: [],
      followers: []
    };

    if (payload.batch !== undefined) baseUser.batch = payload.batch;
    if (payload.profileImage !== undefined) baseUser.profileImage = payload.profileImage;
    if (payload.coverPhoto !== undefined) baseUser.coverPhoto = payload.coverPhoto;
    if (payload.alumniId !== undefined) baseUser.alumniId = payload.alumniId;

    const docRef = await addDoc(collection(db, COLLECTION_NAME), baseUser);
    
    return { id: docRef.id, ...(baseUser as Omit<User, 'id'>) } as User;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
};

// Search users
export const searchUsers = async (query: string): Promise<User[]> => {
  try {
    if (!query.trim()) return [];
    
    // Get all active alumni records to filter against
    const alumniRecords: AlumniRecord[] = await getAllAlumni();
    const validUserIds = new Set(
      alumniRecords
        .filter((alumni: AlumniRecord) => alumni.userId) // Only alumni with linked user accounts
        .map((alumni: AlumniRecord) => alumni.userId!)
    );
    
    // Firestore doesn't support direct text search like localStorage
    // We'll get all users and filter them client-side
    // In a production app, consider using a more scalable approach like Algolia
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const users = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User))
      .filter(user => 
        !user.deletedAt && // Exclude soft-deleted users
        validUserIds.has(user.id) // Only show users with valid alumni records
      );
    
    const lowerCaseQuery = query.toLowerCase().trim();
    return users.filter(user => 
      user.name.toLowerCase().includes(lowerCaseQuery) || 
      user.email.toLowerCase().includes(lowerCaseQuery) ||
      (user.batch && user.batch.toLowerCase().includes(lowerCaseQuery))
    ).slice(0, 10); // Limit to 10 results
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

// Follow a user
export const followUser = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  try {
    // Check if both users exist and are not the same user
    if (currentUserId === targetUserId) {
      return false;
    }
    
    const currentUserDoc = doc(db, COLLECTION_NAME, currentUserId);
    const targetUserDoc = doc(db, COLLECTION_NAME, targetUserId);
    
    const currentUserSnap = await getDoc(currentUserDoc);
    const targetUserSnap = await getDoc(targetUserDoc);
    
    if (!currentUserSnap.exists() || !targetUserSnap.exists()) {
      return false;
    }
    
    const currentUserData = currentUserSnap.data() as User;
    const targetUserData = targetUserSnap.data() as User;
    
    // Initialize following array if it doesn't exist
    const following = currentUserData.following || [];
    
    // Initialize followers array if it doesn't exist
    const followers = targetUserData.followers || [];
    
    // Check if already following
    if (following.includes(targetUserId)) {
      return false; // Already following
    }
    
    // Add to following list
    following.push(targetUserId);
    
    // Add to followers list
    followers.push(currentUserId);
    
    // Update both documents
    await updateDoc(currentUserDoc, { following });
    await updateDoc(targetUserDoc, { followers });
    
    // Update current user in session if needed
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === currentUserId) {
      const updatedUser = {
        ...currentUser,
        following
      };
      setCurrentUser(updatedUser);
    }
    
    return true;
  } catch (error) {
    console.error('Error following user:', error);
    return false;
  }
};

// Unfollow a user
export const unfollowUser = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  try {
    const currentUserDoc = doc(db, COLLECTION_NAME, currentUserId);
    const targetUserDoc = doc(db, COLLECTION_NAME, targetUserId);
    
    const currentUserSnap = await getDoc(currentUserDoc);
    const targetUserSnap = await getDoc(targetUserDoc);
    
    if (!currentUserSnap.exists() || !targetUserSnap.exists()) {
      return false;
    }
    
    const currentUserData = currentUserSnap.data() as User;
    const targetUserData = targetUserSnap.data() as User;
    
    // Check if following array exists
    if (!currentUserData.following) {
      return false;
    }
    
    // Check if followers array exists
    if (!targetUserData.followers) {
      return false;
    }
    
    // Check if currently following
    if (!currentUserData.following.includes(targetUserId)) {
      return false; // Not following
    }
    
    // Remove from following list
    const following = currentUserData.following.filter(id => id !== targetUserId);
    
    // Remove from followers list
    const followers = targetUserData.followers.filter(id => id !== currentUserId);
    
    // Update both documents
    await updateDoc(currentUserDoc, { following });
    await updateDoc(targetUserDoc, { followers });
    
    // Update current user in session if needed
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === currentUserId) {
      const updatedUser = {
        ...currentUser,
        following
      };
      setCurrentUser(updatedUser);
    }
    
    return true;
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return false;
  }
};

// Check if a user is following another user
export const isFollowing = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  try {
    const currentUser = await getUserById(currentUserId);
    
    if (!currentUser || !currentUser.following) {
      return false;
    }
    
    return currentUser.following.includes(targetUserId);
  } catch (error) {
    console.error('Error checking if following:', error);
    return false;
  }
};

// Get users that a specified user is following
export const getFollowing = async (userId: string): Promise<User[]> => {
  try {
    const user = await getUserById(userId);
    
    if (!user || !user.following || user.following.length === 0) {
      return [];
    }
    
    // Get all users that the specified user is following
    const followingUsers: User[] = [];
    
    for (const followingId of user.following) {
      const followingUser = await getUserById(followingId);
      if (followingUser) {
        followingUsers.push(followingUser);
      }
    }
    
    return followingUsers;
  } catch (error) {
    console.error('Error getting following users:', error);
    return [];
  }
};

// Get followers of a specified user
export const getFollowers = async (userId: string): Promise<User[]> => {
  try {
    const user = await getUserById(userId);
    
    if (!user || !user.followers || user.followers.length === 0) {
      return [];
    }
    
    // Get all users that follow the specified user
    const followerUsers: User[] = [];
    
    for (const followerId of user.followers) {
      const followerUser = await getUserById(followerId);
      if (followerUser) {
        followerUsers.push(followerUser);
      }
    }
    
    return followerUsers;
  } catch (error) {
    console.error('Error getting follower users:', error);
    return [];
  }
};
