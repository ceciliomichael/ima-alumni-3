import { v4 as uuidv4 } from 'uuid';
import { addAlumni } from './alumniService';

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // In a real app, this would be hashed
  batch?: string;
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
}

const USER_STORAGE_KEY = 'users';
const CURRENT_USER_KEY = 'currentUser';

// Get all users
export const getAllUsers = (): User[] => {
  const users = localStorage.getItem(USER_STORAGE_KEY);
  return users ? JSON.parse(users) : [];
};

// Get user by ID
export const getUserById = (userId: string): User | null => {
  const users = getAllUsers();
  const user = users.find(user => user.id === userId);
  return user || null;
};

// Get user by email
export const getUserByEmail = (email: string): User | null => {
  const users = getAllUsers();
  return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
};

// Register new user
export const registerUser = (userData: Omit<User, 'id' | 'createdAt' | 'isActive'>): User | null => {
  // Check if email already exists
  if (getUserByEmail(userData.email)) {
    return null; // Email already registered
  }

  const users = getAllUsers();
  const newUser: User = {
    ...userData,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    isActive: false, // Users need to be approved by admin
    profileImage: userData.profileImage || undefined,
    coverPhoto: userData.coverPhoto || undefined
  };

  users.push(newUser);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
  
  // Create matching alumni record
  addAlumni({
    name: userData.name,
    email: userData.email,
    batch: userData.batch || 'Unknown',
    isActive: false,
    profileImage: userData.profileImage,
    userId: newUser.id // Link to user ID
  });
  
  return newUser;
};

// Login user
export const loginUser = (email: string, password: string): User | null => {
  const user = getUserByEmail(email);
  
  if (!user || user.password !== password) {
    return null; // Invalid credentials
  }

  if (!user.isActive) {
    return null; // Account not approved
  }

  // Store current user in localStorage
  setCurrentUser(user);
  return user;
};

// Logout user
export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
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
export const updateUser = (id: string, updatedData: Partial<User>): User | null => {
  const users = getAllUsers();
  const index = users.findIndex(user => user.id === id);
  
  if (index === -1) return null;
  
  // Handle special case for socialLinks to prevent partial overwrite
  if (updatedData.socialLinks && users[index].socialLinks) {
    updatedData.socialLinks = {
      ...users[index].socialLinks,
      ...updatedData.socialLinks
    };
  }
  
  // Create the updated user object
  const updatedUser = {
    ...users[index],
    ...updatedData,
    // Ensure these fields are explicitly set to maintain them
    profileImage: updatedData.profileImage !== undefined ? updatedData.profileImage : users[index].profileImage,
    coverPhoto: updatedData.coverPhoto !== undefined ? updatedData.coverPhoto : users[index].coverPhoto
  };
  
  users[index] = updatedUser;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
  
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
};

// Approve a user
export const approveUser = (id: string): User | null => {
  return updateUser(id, { isActive: true });
};

// Delete user
export const deleteUser = (id: string): boolean => {
  const users = getAllUsers();
  const filteredUsers = users.filter(user => user.id !== id);
  
  if (filteredUsers.length === users.length) {
    return false; // No user was deleted
  }
  
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(filteredUsers));
  
  // If deleting current user, logout
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === id) {
    logoutUser();
  }
  
  return true;
};

// Add this function to the userService.ts file
export const searchUsers = (query: string) => {
  const users = getAllUsers();
  if (!query.trim()) return [];
  
  const lowercaseQuery = query.toLowerCase().trim();
  
  return users.filter(user => 
    user.name.toLowerCase().includes(lowercaseQuery) || 
    user.email.toLowerCase().includes(lowercaseQuery) ||
    user.batch.toLowerCase().includes(lowercaseQuery)
  ).slice(0, 10); // Limit to 10 results
};

// Follow a user
export const followUser = (currentUserId: string, targetUserId: string): boolean => {
  const users = getAllUsers();
  
  // Find both users
  const currentUserIndex = users.findIndex(user => user.id === currentUserId);
  const targetUserIndex = users.findIndex(user => user.id === targetUserId);
  
  // Check if both users exist and are not the same user
  if (currentUserIndex === -1 || targetUserIndex === -1 || currentUserId === targetUserId) {
    return false;
  }
  
  // Initialize following array if it doesn't exist
  if (!users[currentUserIndex].following) {
    users[currentUserIndex].following = [];
  }
  
  // Initialize followers array if it doesn't exist
  if (!users[targetUserIndex].followers) {
    users[targetUserIndex].followers = [];
  }
  
  // Check if already following
  if (users[currentUserIndex].following.includes(targetUserId)) {
    return false; // Already following
  }
  
  // Add to following list
  users[currentUserIndex].following.push(targetUserId);
  
  // Add to followers list
  users[targetUserIndex].followers.push(currentUserId);
  
  // Save changes
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
  
  // Update current user in session if needed
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === currentUserId) {
    setCurrentUser(users[currentUserIndex]);
  }
  
  return true;
};

// Unfollow a user
export const unfollowUser = (currentUserId: string, targetUserId: string): boolean => {
  const users = getAllUsers();
  
  // Find both users
  const currentUserIndex = users.findIndex(user => user.id === currentUserId);
  const targetUserIndex = users.findIndex(user => user.id === targetUserId);
  
  // Check if both users exist and current user is following target
  if (currentUserIndex === -1 || targetUserIndex === -1) {
    return false;
  }
  
  // Check if following array exists
  if (!users[currentUserIndex].following) {
    return false;
  }
  
  // Check if followers array exists
  if (!users[targetUserIndex].followers) {
    return false;
  }
  
  // Check if currently following
  if (!users[currentUserIndex].following.includes(targetUserId)) {
    return false; // Not following
  }
  
  // Remove from following list
  users[currentUserIndex].following = users[currentUserIndex].following.filter(id => id !== targetUserId);
  
  // Remove from followers list
  users[targetUserIndex].followers = users[targetUserIndex].followers.filter(id => id !== currentUserId);
  
  // Save changes
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
  
  // Update current user in session if needed
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === currentUserId) {
    setCurrentUser(users[currentUserIndex]);
  }
  
  return true;
};

// Check if a user is following another user
export const isFollowing = (currentUserId: string, targetUserId: string): boolean => {
  const currentUser = getUserById(currentUserId);
  
  if (!currentUser || !currentUser.following) {
    return false;
  }
  
  return currentUser.following.includes(targetUserId);
};

// Get users that a specified user is following
export const getFollowing = (userId: string): User[] => {
  const user = getUserById(userId);
  
  if (!user || !user.following || user.following.length === 0) {
    return [];
  }
  
  const users = getAllUsers();
  return users.filter(u => user.following.includes(u.id));
};

// Get followers of a specified user
export const getFollowers = (userId: string): User[] => {
  const user = getUserById(userId);
  
  if (!user || !user.followers || user.followers.length === 0) {
    return [];
  }
  
  const users = getAllUsers();
  return users.filter(u => user.followers.includes(u.id));
}; 