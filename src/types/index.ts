export interface User {
  id: string;
  name: string;
  email: string;
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
  following?: string[]; // IDs of users this user follows
  followers?: string[]; // IDs of users following this user
  officerPosition?: {
    title: string;
    startDate: string;
    endDate?: string;
    batchYear?: string;
  };
  showOfficerInfo?: boolean; // Whether to display officer information on profile
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  content: string;
  images?: string[];
  feeling?: {
    emoji: string;
    text: string;
  };
  createdAt: string;
  likedBy: string[];
  comments: Comment[];
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userImage?: string;
  content: string;
  createdAt: string;
  replies: Reply[];
  reactions: CommentReaction[];
}

export interface Reply {
  id: string;
  commentId: string;
  userId: string;
  userName: string;
  userImage?: string;
  content: string;
  createdAt: string;
}

export interface CommentReaction {
  userId: string;
  userName: string;
  type: 'like';
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  image?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  contactEmail: string;
  postedBy: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'event' | 'job' | 'mention' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// Admin types
export interface AdminUser {
  id: string;
  username: string;
  password: string; // hashed in real implementation
  name: string;
  role: 'admin' | 'super_admin';
}

export interface AlumniRecord {
  id: string;
  name: string;
  email: string;
  batch: string;
  isActive: boolean;
  dateRegistered: string;
  position?: string;
  profileImage?: string;
  userId?: string;
  // other alumni details
}

export interface OfficerPosition {
  id: string;
  title: string;
  alumniId: string;
  batchYear?: string;
  startDate: string;
  endDate?: string;
}

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string;
  contactEmail: string;
  postedDate: string;
  isApproved: boolean;
  postedBy: string;
}

export interface GalleryPost {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  albumCategory?: string;
  event?: string;
  postedDate: string;
  isApproved: boolean;
  postedBy: string;
  likedBy?: string[];    // Array of user IDs who liked this post
  bookmarkedBy?: string[]; // Array of user IDs who bookmarked this post
}

// Add the Donation interface
export interface Donation {
  id: string;
  donorName: string;
  donorEmail?: string;
  amount: number;
  currency: string;
  purpose: string;
  category: string;
  description?: string;
  isPublic: boolean;
  donationDate: string;
  createdAt?: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
} 