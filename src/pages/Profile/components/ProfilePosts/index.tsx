import { useState, useEffect } from 'react';
import { Post, User, Comment, Reply } from '../../../../types';
import { FilePenLine } from 'lucide-react';
import PostList from '../../../Home/components/PostList/PostList';
import { 
  likePost, 
  addComment, 
  addReplyToComment, 
  toggleCommentReaction,
  deletePost,
  getAllPosts
} from '../../../../services/firebase/postService';
import './styles.css';

interface ProfilePostsProps {
  posts: Post[];
  profileUser: User;
  currentUser: User | null;
}

const ProfilePosts = ({ posts, profileUser, currentUser }: ProfilePostsProps) => {
  const [updatedPosts, setUpdatedPosts] = useState<Post[]>(posts);
  
  // Sync with posts prop when it changes
  useEffect(() => {
    setUpdatedPosts(posts);
  }, [posts]);
  
  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = async () => {
      try {
        const allPosts = await getAllPosts();
        const userPosts = allPosts.filter(post => post.userId === profileUser.id);
        setUpdatedPosts(userPosts);
      } catch (error) {
        console.error('Error refreshing posts:', error);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [profileUser.id]);

  const handleLikePost = async (postId: string) => {
    if (!currentUser) return;
    
    try {
      const result = await likePost(postId, currentUser.id);
      if (result) {
        // Update local state
        setUpdatedPosts(prev => prev.map(post => post.id === postId ? result : post));
        
        // Trigger storage event to update across tabs
        window.dispatchEvent(new Event('storage'));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleAddComment = async (postId: string, comment: Comment) => {
    try {
      const result = await addComment(postId, comment);
      if (result) {
        // Update local state
        setUpdatedPosts(prev => prev.map(post => post.id === postId ? result : post));
        
        // Trigger storage event to update across tabs
        window.dispatchEvent(new Event('storage'));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleAddReply = async (postId: string, commentId: string, reply: Reply) => {
    try {
      const result = await addReplyToComment(postId, commentId, reply);
      if (result) {
        // Update local state
        setUpdatedPosts(prev => prev.map(post => post.id === postId ? result : post));
        
        // Trigger storage event to update across tabs
        window.dispatchEvent(new Event('storage'));
      }
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const handleToggleCommentReaction = async (postId: string, commentId: string) => {
    if (!currentUser) return;
    
    try {
      const result = await toggleCommentReaction(postId, commentId, currentUser.id, currentUser.name);
      if (result) {
        // Update local state
        setUpdatedPosts(prev => prev.map(post => post.id === postId ? result : post));
        
        // Trigger storage event to update across tabs
        window.dispatchEvent(new Event('storage'));
      }
    } catch (error) {
      console.error('Error toggling comment reaction:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const success = await deletePost(postId);
      if (success) {
        // Update local state
        setUpdatedPosts(prev => prev.filter(post => post.id !== postId));
        
        // Trigger storage event to update across tabs
        window.dispatchEvent(new Event('storage'));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  return (
    <div className="profile-posts">
      <div className="posts-header">
        <h2>{profileUser.id === currentUser?.id ? 'My Posts' : `${profileUser.name}'s Posts`}</h2>
      </div>
      
      <div className="posts-content">
        {updatedPosts.length > 0 ? (
          <PostList 
            posts={updatedPosts}
            userId={currentUser?.id || null}
            currentUser={currentUser}
            onLikePost={handleLikePost}
            onAddComment={handleAddComment}
            onAddReply={handleAddReply}
            onToggleCommentReaction={handleToggleCommentReaction}
            onDeletePost={handleDeletePost}
          />
        ) : (
          <div className="empty-posts">
            <div className="empty-icon">
              <FilePenLine size={48} strokeWidth={1.5}/>
            </div>
            <h3>No posts yet</h3>
            <p>{profileUser.id === currentUser?.id 
              ? "You haven't created any posts yet. Start sharing with your alumni community!" 
              : `${profileUser.name} hasn't created any posts yet.`}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePosts;
