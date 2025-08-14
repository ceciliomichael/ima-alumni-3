import { v4 as uuidv4 } from 'uuid';
import { Post } from '../../../../types';

const STORAGE_KEY = 'posts';

// Get all posts
export const getAllPosts = (): Post[] => {
  const posts = localStorage.getItem(STORAGE_KEY);
  return posts ? JSON.parse(posts) : [];
};

// Add a new post
export const addPost = (post: Omit<Post, 'id' | 'createdAt'>): Post => {
  const posts = getAllPosts();
  const newPost: Post = {
    ...post,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    likedBy: [],
    comments: []
  };
  
  posts.push(newPost);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  
  return newPost;
};

// Get posts by user ID
export const getPostsByUserId = (userId: string): Post[] => {
  const posts = getAllPosts();
  return posts.filter(post => post.userId === userId);
};

// Like/Unlike a post
export const likePost = (postId: string, userId: string): Post | null => {
  const posts = getAllPosts();
  const index = posts.findIndex(post => post.id === postId);
  
  if (index === -1) return null;
  
  const post = posts[index];
  let updatedLikedBy: string[];

  // Ensure likedBy array exists
  const currentLikedBy = post.likedBy || [];

  if (currentLikedBy.includes(userId)) {
    // User already liked, so unlike
    updatedLikedBy = currentLikedBy.filter(id => id !== userId);
  } else {
    // User hasn't liked, so like
    updatedLikedBy = [...currentLikedBy, userId];
  }
  
  const updatedPost = {
    ...post,
    likedBy: updatedLikedBy,
  };
  
  posts[index] = updatedPost;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  
  return updatedPost;
};

// Add a comment to a post
export const addComment = (postId: string, comment: any): Post | null => {
  const posts = getAllPosts();
  const index = posts.findIndex(post => post.id === postId);
  
  if (index === -1) return null;
  
  const updatedPost = {
    ...posts[index],
    comments: [...posts[index].comments, comment]
  };
  
  posts[index] = updatedPost;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  
  return updatedPost;
};

// Delete a post
export const deletePost = (postId: string): boolean => {
  const posts = getAllPosts();
  const filteredPosts = posts.filter(post => post.id !== postId);
  
  if (filteredPosts.length === posts.length) {
    return false; // No post was deleted
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredPosts));
  return true; // Post was deleted
};

// Initialize with empty array if no data exists
export const initializePostData = () => {
  const existingData = localStorage.getItem(STORAGE_KEY);
  
  if (!existingData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
};

// Add a reply to a comment
export const addReplyToComment = (postId: string, commentId: string, reply: any): Post | null => {
  const posts = getAllPosts();
  const postIndex = posts.findIndex(post => post.id === postId);
  
  if (postIndex === -1) return null;
  
  const post = posts[postIndex];
  const commentIndex = post.comments.findIndex(comment => comment.id === commentId);
  
  if (commentIndex === -1) return null;
  
  // Ensure replies array exists
  if (!post.comments[commentIndex].replies) {
    post.comments[commentIndex].replies = [];
  }
  
  // Add the reply
  post.comments[commentIndex].replies.push(reply);
  
  // Update the post
  posts[postIndex] = post;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  
  return post;
};

// Toggle a reaction on a comment
export const toggleCommentReaction = (postId: string, commentId: string, userId: string, userName: string): Post | null => {
  const posts = getAllPosts();
  const postIndex = posts.findIndex(post => post.id === postId);
  
  if (postIndex === -1) return null;
  
  const post = posts[postIndex];
  const commentIndex = post.comments.findIndex(comment => comment.id === commentId);
  
  if (commentIndex === -1) return null;
  
  // Ensure reactions array exists
  if (!post.comments[commentIndex].reactions) {
    post.comments[commentIndex].reactions = [];
  }
  
  const reactions = post.comments[commentIndex].reactions;
  const existingReactionIndex = reactions.findIndex(reaction => reaction.userId === userId);
  
  if (existingReactionIndex !== -1) {
    // Remove the reaction if it exists
    reactions.splice(existingReactionIndex, 1);
  } else {
    // Add the reaction if it doesn't exist
    reactions.push({
      userId,
      userName,
      type: 'like'
    });
  }
  
  // Update the post
  posts[postIndex] = post;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  
  return post;
};

// Get post by ID
export const getPostById = (postId: string): Post | null => {
  const posts = getAllPosts();
  const post = posts.find(post => post.id === postId);
  return post || null;
}; 