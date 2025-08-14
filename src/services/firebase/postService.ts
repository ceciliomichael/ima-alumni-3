import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Post, Comment, Reply, CommentReaction } from '../../types';

const COLLECTION_NAME = 'posts';

// Helper to remove undefined fields before sending to Firestore
const removeUndefinedFields = <T extends Record<string, any>>(obj: T): T => {
  const cleaned: any = {};
  Object.keys(obj).forEach((key) => {
    const value = (obj as any)[key];
    if (value !== undefined) {
      cleaned[key] = value;
    }
  });
  return cleaned as T;
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

// Add a new post
export const addPost = async (post: Omit<Post, 'id' | 'createdAt' | 'likedBy' | 'comments'>): Promise<Post> => {
  try {
    const sanitized = removeUndefinedFields(post as any);
    const newPost = {
      ...sanitized,
      createdAt: new Date().toISOString(),
      likedBy: [],
      comments: []
    } as any;
    
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
