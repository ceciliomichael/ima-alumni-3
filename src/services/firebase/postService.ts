import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, arrayUnion, arrayRemove, UpdateData, DocumentData } from 'firebase/firestore';
import { db } from '../../firebase/config';
import type { Post, Comment, Reply, CommentReaction } from '../../types';
import { createModerationNotification } from './notificationService';

export type { Post, Comment, Reply, CommentReaction };

const COLLECTION_NAME = 'posts';

// Helper to remove undefined fields before sending to Firestore
const removeUndefinedFields = <T extends Record<string, unknown>>(obj: T): UpdateData<DocumentData> => {
  const cleaned: Record<string, unknown> = {};
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (value !== undefined) {
      cleaned[key] = value;
    }
  });
  return cleaned as UpdateData<DocumentData>;
};

// Get all posts
export const getAllPosts = async (): Promise<Post[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Post));
  } catch (error) {
    console.error('Error getting posts:', error);
    return [];
  }
};

// Get all approved posts (for regular users)
export const getApprovedPosts = async (): Promise<Post[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const allPosts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Post));
    
    // Filter only approved posts
    return allPosts.filter(post => post.isApproved === true);
  } catch (error) {
    console.error('Error getting approved posts:', error);
    return [];
  }
};

// Get pending posts (for admin moderation)
export const getPendingPosts = async (): Promise<Post[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const allPosts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Post));
    
    // Filter only pending posts
    return allPosts.filter(post => post.isApproved === false || post.moderationStatus === 'pending');
  } catch (error) {
    console.error('Error getting pending posts:', error);
    return [];
  }
};

// Add a new post
export const addPost = async (post: Omit<Post, 'id' | 'createdAt' | 'likedBy' | 'comments'>): Promise<Post> => {
  try {
    const sanitized = removeUndefinedFields(post as Record<string, unknown>);
    const newPost = {
      ...sanitized,
      createdAt: new Date().toISOString(),
      likedBy: [] as string[],
      comments: [] as Comment[],
      isApproved: false, // Posts require approval by default
      moderationStatus: 'pending' as const
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), newPost);
    
    return {
      id: docRef.id,
      ...newPost
    } as Post;
  } catch (error) {
    console.error('Error adding post:', error);
    throw error;
  }
};

// Get posts by user ID
export const getPostsByUserId = async (userId: string): Promise<Post[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Post));
  } catch (error) {
    console.error('Error getting posts by user ID:', error);
    return [];
  }
};

// Like/Unlike a post
export const likePost = async (postId: string, userId: string): Promise<Post | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, postId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const post = {
      id: docSnap.id,
      ...docSnap.data()
    } as Post;
    
    // Check if user already liked the post
    const isLiked = post.likedBy && post.likedBy.includes(userId);
    
    if (isLiked) {
      // Unlike the post
      await updateDoc(docRef, {
        likedBy: arrayRemove(userId)
      });
    } else {
      // Like the post
      await updateDoc(docRef, {
        likedBy: arrayUnion(userId)
      });
    }
    
    // Get the updated document
    const updatedDocSnap = await getDoc(docRef);
    return {
      id: updatedDocSnap.id,
      ...updatedDocSnap.data()
    } as Post;
  } catch (error) {
    console.error('Error liking/unliking post:', error);
    return null;
  }
};

// Add a comment to a post
export const addComment = async (postId: string, comment: Omit<Comment, 'id' | 'createdAt' | 'replies' | 'reactions'>): Promise<Post | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, postId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const post = docSnap.data() as Omit<Post, 'id'>;
    const comments = post.comments || [];
    
    const newComment: Comment = {
      ...comment,
      id: Date.now().toString(), // Generate a unique ID
      postId,
      createdAt: new Date().toISOString(),
      replies: [],
      reactions: []
    };
    
    // Add the comment to the post
    await updateDoc(docRef, {
      comments: [...comments, newComment]
    });
    
    // Get the updated document
    const updatedDocSnap = await getDoc(docRef);
    return {
      id: updatedDocSnap.id,
      ...updatedDocSnap.data()
    } as Post;
  } catch (error) {
    console.error('Error adding comment:', error);
    return null;
  }
};

// Delete a post
export const deletePost = async (postId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, postId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting post:', error);
    return false;
  }
};

// Initialize with empty array if no data exists
export const initializePostData = async () => {
  // No need to initialize in Firestore as collections are created automatically
  // This function is kept for API compatibility
};

// Add a reply to a comment
export const addReplyToComment = async (postId: string, commentId: string, reply: Omit<Reply, 'id' | 'createdAt'>): Promise<Post | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, postId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const post = {
      id: docSnap.id,
      ...docSnap.data()
    } as Post;
    
    const commentIndex = post.comments.findIndex(comment => comment.id === commentId);
    
    if (commentIndex === -1) {
      return null;
    }
    
    const newReply: Reply = {
      ...reply,
      id: Date.now().toString(), // Generate a unique ID
      commentId,
      createdAt: new Date().toISOString()
    };
    
    // Create a new comments array with the updated comment
    const updatedComments = [...post.comments];
    updatedComments[commentIndex] = {
      ...updatedComments[commentIndex],
      replies: [...(updatedComments[commentIndex].replies || []), newReply]
    };
    
    // Update the post with the new comments array
    await updateDoc(docRef, {
      comments: updatedComments
    });
    
    // Get the updated document
    const updatedDocSnap = await getDoc(docRef);
    return {
      id: updatedDocSnap.id,
      ...updatedDocSnap.data()
    } as Post;
  } catch (error) {
    console.error('Error adding reply to comment:', error);
    return null;
  }
};

// Toggle a reaction on a comment
export const toggleCommentReaction = async (postId: string, commentId: string, userId: string, userName: string): Promise<Post | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, postId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const post = {
      id: docSnap.id,
      ...docSnap.data()
    } as Post;
    
    const commentIndex = post.comments.findIndex(comment => comment.id === commentId);
    
    if (commentIndex === -1) {
      return null;
    }
    
    const comment = post.comments[commentIndex];
    const reactions = comment.reactions || [];
    
    // Check if the user already reacted
    const existingReactionIndex = reactions.findIndex(reaction => reaction.userId === userId);
    
    // Create a new comments array with the updated comment
    const updatedComments = [...post.comments];
    
    if (existingReactionIndex !== -1) {
      // Remove the reaction
      updatedComments[commentIndex] = {
        ...comment,
        reactions: reactions.filter(reaction => reaction.userId !== userId)
      };
    } else {
      // Add the reaction
      const newReaction: CommentReaction = {
        userId,
        userName,
        type: 'like'
      };
      
      updatedComments[commentIndex] = {
        ...comment,
        reactions: [...reactions, newReaction]
      };
    }
    
    // Update the post with the new comments array
    await updateDoc(docRef, {
      comments: updatedComments
    });
    
    // Get the updated document
    const updatedDocSnap = await getDoc(docRef);
    return {
      id: updatedDocSnap.id,
      ...updatedDocSnap.data()
    } as Post;
  } catch (error) {
    console.error('Error toggling comment reaction:', error);
    return null;
  }
};

// Get post by ID
export const getPostById = async (postId: string): Promise<Post | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, postId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Post;
    }
    return null;
  } catch (error) {
    console.error('Error getting post by ID:', error);
    return null;
  }
};

// Approve or reject a post
export const moderatePost = async (
  postId: string, 
  approve: boolean, 
  moderatorName: string,
  rejectionReason?: string
): Promise<Post | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, postId);
    
    // Get the post first to access userId for notification
    const postSnap = await getDoc(docRef);
    if (!postSnap.exists()) {
      return null;
    }
    const postData = postSnap.data() as Post;
    
    const updateData: Partial<Post> = {
      isApproved: approve,
      moderationStatus: approve ? 'approved' : 'rejected',
      moderatedBy: moderatorName,
      moderatedAt: new Date().toISOString()
    };
    
    if (!approve && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    
    await updateDoc(docRef, updateData);
    
    // Send notification to the post author
    if (postData.userId) {
      createModerationNotification(
        'post',
        approve,
        postData.userId,
        postData.content.substring(0, 50) + (postData.content.length > 50 ? '...' : ''),
        rejectionReason,
        postId
      ).catch((error) => {
        console.error('Failed to create post moderation notification:', error);
      });
    }
    
    // Get the updated document
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as Post;
    }
    return null;
  } catch (error) {
    console.error('Error moderating post:', error);
    return null;
  }
};

// Update post
export const updatePost = async (postId: string, updatedData: Partial<Post>): Promise<Post | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, postId);
    const sanitized = removeUndefinedFields(updatedData as Record<string, unknown>);
    await updateDoc(docRef, sanitized);
    
    // Get the updated document
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as Post;
    }
    return null;
  } catch (error) {
    console.error('Error updating post:', error);
    return null;
  }
};

// Update all posts by a user when their profile changes
export const updateUserPosts = async (userId: string, updates: { userName?: string; userImage?: string }): Promise<boolean> => {
  try {
    // Get all posts by this user
    const userPosts = await getPostsByUserId(userId);
    
    if (userPosts.length === 0) {
      return true; // No posts to update
    }
    
    // Update each post
    const updatePromises = userPosts.map(async (post) => {
      const updateData: Partial<Post> = {};
      let commentsUpdated = false;
      
      // Update post-level fields
      if (updates.userName !== undefined) {
        updateData.userName = updates.userName;
      }
      
      if (updates.userImage !== undefined) {
        updateData.userImage = updates.userImage;
      }
      
      // Update comments and replies by this user
      if (post.comments && post.comments.length > 0) {
        const updatedComments = post.comments.map(comment => {
          // Check if this comment is by the user
          if (comment.userId === userId) {
            commentsUpdated = true;
            const updatedComment = { ...comment };
            
            if (updates.userName !== undefined) {
              updatedComment.userName = updates.userName;
            }
            
            if (updates.userImage !== undefined) {
              updatedComment.userImage = updates.userImage;
            }
            
            // Update replies by this user
            if (comment.replies && comment.replies.length > 0) {
              updatedComment.replies = comment.replies.map(reply => {
                if (reply.userId === userId) {
                  const updatedReply = { ...reply };
                  
                  if (updates.userName !== undefined) {
                    updatedReply.userName = updates.userName;
                  }
                  
                  if (updates.userImage !== undefined) {
                    updatedReply.userImage = updates.userImage;
                  }
                  
                  return updatedReply;
                }
                return reply;
              });
            }
            
            return updatedComment;
          }
          return comment;
        });
        
        if (commentsUpdated) {
          updateData.comments = updatedComments;
        }
      }
      
      // Only update if there are changes
      if (Object.keys(updateData).length > 0) {
        return updatePost(post.id, updateData);
      }
      
      return post;
    });
    
    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error('Error updating user posts:', error);
    return false;
  }
};
