import React, { useEffect } from 'react';
import { X, Heart, CornerDownRight, Send, MessageCircle, Share2, MoreHorizontal, Trash2 } from 'lucide-react';
import { Post, Comment, Reply, User } from '../../../../types';
import ImagePlaceholder from '../../../../components/ImagePlaceholder/ImagePlaceholder';
import ConfirmDialog from '../../../../components/ConfirmDialog';
import { deletePost, getPostById } from '../../../Admin/services/localStorage/postService';
import './PostModal.css';

interface PostModalProps {
  post: Post;
  selectedImageIndex: number;
  onClose: () => void;
  currentUser: User | null;
  userId: string | null;
  onLikePost: (postId: string) => void;
  onAddComment: (postId: string, comment: Comment) => void;
  onAddReply: (postId: string, commentId: string, reply: Reply) => void;
  onToggleCommentReaction: (postId: string, commentId: string) => void;
  onDeletePost?: (postId: string) => void;
  navigateToUserProfile: (userId: string) => void;
}

const PostModal: React.FC<PostModalProps> = ({
  post,
  selectedImageIndex: initialImageIndex,
  onClose,
  currentUser,
  userId,
  onLikePost,
  onAddComment,
  onAddReply,
  onToggleCommentReaction,
  onDeletePost,
  navigateToUserProfile
}) => {
  const [commentText, setCommentText] = React.useState('');
  const [replyTexts, setReplyTexts] = React.useState<Record<string, string>>({});
  const [replyingToComment, setReplyingToComment] = React.useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(initialImageIndex);
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  
  // State to track which comments have expanded replies
  const [expandedReplies, setExpandedReplies] = React.useState<Record<string, boolean>>({});
  
  // State to store the latest version of the post (including comments)
  const [currentPost, setCurrentPost] = React.useState<Post>(post);
  
  // Update currentPost when the post prop changes
  useEffect(() => {
    setCurrentPost(post);
  }, [post]);

  // Listen for localStorage changes to refresh post data
  useEffect(() => {
    const handleStorageChange = () => {
      // Get the latest version of this post from localStorage
      const updatedPost = getPostById(post.id);
      if (updatedPost) {
        setCurrentPost(updatedPost);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [post.id]);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Format date to a friendly format
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const handleReplyChange = (commentId: string, text: string) => {
    setReplyTexts(prev => ({ ...prev, [commentId]: text }));
  };

  const handleSubmitComment = () => {
    if (!commentText || !commentText.trim() || !userId || !currentUser) return;
    
    const newComment: Comment = {
      id: Date.now().toString(),
      postId: currentPost.id,
      userId,
      userName: currentUser.name,
      userImage: currentUser.profileImage,
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
      replies: [],
      reactions: []
    };
    
    // Update local state immediately for real-time feedback
    setCurrentPost(prev => ({
      ...prev,
      comments: [newComment, ...prev.comments]
    }));
    
    // Call the parent handler to update global state
    onAddComment(currentPost.id, newComment);
    setCommentText('');
  };

  const handleSubmitReply = (commentId: string) => {
    if (!replyTexts[commentId] || !replyTexts[commentId].trim() || !userId || !currentUser) return;
    
    const newReply: Reply = {
      id: Date.now().toString(),
      commentId,
      userId,
      userName: currentUser.name,
      userImage: currentUser.profileImage,
      content: replyTexts[commentId].trim(),
      createdAt: new Date().toISOString()
    };
    
    // Update local state immediately for real-time feedback
    setCurrentPost(prev => ({
      ...prev,
      comments: prev.comments.map(comment => 
        comment.id === commentId 
          ? { ...comment, replies: [...comment.replies, newReply] } 
          : comment
      )
    }));
    
    // Call the parent handler to update global state
    onAddReply(currentPost.id, commentId, newReply);
    setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
    setReplyingToComment(null); // Close reply form
    
    // Automatically expand replies for this comment after adding a new reply
    setExpandedReplies(prev => ({ ...prev, [commentId]: true }));
  };

  const handleLike = () => {
    if (!userId) return;
    
    // Call the parent handler to update global state
    onLikePost(currentPost.id);
    
    // Update local state for immediate feedback
    const isLiked = currentPost.likedBy?.includes(userId) || false;
    const updatedLikedBy = isLiked
      ? (currentPost.likedBy || []).filter(id => id !== userId)
      : [...(currentPost.likedBy || []), userId];
    
    setCurrentPost(prev => ({
      ...prev,
      likedBy: updatedLikedBy
    }));
    
    // Trigger storage event to update across tabs
    window.dispatchEvent(new Event('storage'));
  };

  const handleReplyToComment = (commentId: string) => {
    if (replyingToComment === commentId) {
      setReplyingToComment(null);
    } else {
      setReplyingToComment(commentId);
    }
  };

  const handleToggleCommentReaction = (commentId: string) => {
    if (!userId) return;
    
    // Call the parent handler to update global state
    onToggleCommentReaction(currentPost.id, commentId);
    
    // Update local state for immediate feedback
    setCurrentPost(prev => ({
      ...prev,
      comments: prev.comments.map(comment => {
        if (comment.id === commentId) {
          const hasReacted = comment.reactions?.some(reaction => reaction.userId === userId);
          
          if (hasReacted) {
            // Remove the reaction
            return {
              ...comment,
              reactions: (comment.reactions || []).filter(reaction => reaction.userId !== userId)
            };
          } else {
            // Add the reaction
            return {
              ...comment,
              reactions: [
                ...(comment.reactions || []),
                { userId, userName: currentUser?.name || '', type: 'like' }
              ]
            };
          }
        }
        return comment;
      })
    }));
    
    // Trigger storage event to update across tabs
    window.dispatchEvent(new Event('storage'));
  };

  // Helper to check if a user has reacted to a comment
  const hasUserReactedToComment = (reactions: any[], userId: string | null) => {
    if (!userId || !reactions) return false;
    return reactions.some(reaction => reaction.userId === userId);
  };

  // Add handler for thumbnail clicks
  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  // Toggle post menu
  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  // Toggle expanded replies for a comment
  const toggleExpandedReplies = (commentId: string) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // Handle post deletion
  const handleDeletePost = () => {
    setShowDeleteConfirm(true);
    setShowMenu(false);
  };

  const confirmDeletePost = () => {
    // Delete the post using the service
    const success = deletePost(currentPost.id);
    
    if (success && onDeletePost) {
      // Call the parent handler to update state
      onDeletePost(currentPost.id);
    }
    
    // Close the modal and dialog
    setShowDeleteConfirm(false);
    onClose();
  };

  const cancelDeletePost = () => {
    setShowDeleteConfirm(false);
  };

  // Determine if this post has images to determine layout
  const hasImages = currentPost.images && currentPost.images.length > 0;
  
  // Check if current user is the post owner
  const isPostOwner = userId === currentPost.userId;

  return (
    <div className="post-modal-overlay" onClick={onClose}>
      <div className={`post-modal-container ${hasImages ? 'with-image' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="post-modal-close" onClick={onClose}>
          <X size={24} />
        </button>
        
        <div className="post-modal-content">
          {/* Header Section */}
          <div className="post-modal-header">
            <div 
              className="post-author"
              onClick={() => navigateToUserProfile(currentPost.userId)}
            >
              <div className="post-avatar">
                {currentPost.userImage ? (
                  <img src={currentPost.userImage} alt={currentPost.userName} />
                ) : (
                  <ImagePlaceholder 
                    isAvatar 
                    size="small" 
                    name={currentPost.userName} 
                  />
                )}
              </div>
              <div className="post-info">
                <h3 className="post-author-name">{currentPost.userName}</h3>
                <p className="post-time">{formatDate(currentPost.createdAt)}</p>
              </div>
            </div>
            
            {isPostOwner && (
              <div className="post-menu-container" ref={menuRef}>
                <button 
                  className="post-menu-button"
                  onClick={toggleMenu}
                >
                  <MoreHorizontal size={20} />
                </button>
                {showMenu && (
                  <div className="post-menu">
                    <button 
                      className="post-menu-item delete"
                      onClick={handleDeletePost}
                    >
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Body Section */}
          <div className="post-modal-body">
            {/* Post Content */}
            <div className="post-content-section">
              <p className="post-modal-text">{currentPost.content}</p>
              
              {currentPost.feeling && (
                <div className="post-feeling">
                  <span className="feeling-emoji">{currentPost.feeling.emoji}</span>
                  <span className="feeling-text">feeling {currentPost.feeling.text}</span>
                </div>
              )}
            </div>
            
            {/* Post Images */}
            {hasImages && (
              <div className="post-modal-images">
                <div className="post-modal-image-container">
                  <img 
                    src={currentPost.images[currentImageIndex]} 
                    alt={`${currentPost.userName}'s post image`} 
                    className="post-modal-image"
                  />
                </div>
                
                {currentPost.images.length > 1 && (
                  <div className="post-modal-thumbnails">
                    {currentPost.images.map((image, index) => (
                      <div
                        key={index}
                        className={`post-modal-thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                        onClick={() => handleThumbnailClick(index)}
                      >
                        <img 
                          src={image} 
                          alt={`Thumbnail ${index + 1}`} 
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Engagement Section */}
          <div className="post-modal-engagement">
            {/* Stats Section */}
            <div className="post-modal-stats">
              <div className="post-likes">
                {currentPost.likedBy && currentPost.likedBy.length > 0 && (
                  <>
                    <div className="like-icon-container">
                      <Heart 
                        size={14} 
                        fill={userId && currentPost.likedBy?.includes(userId) ? "#ec4899" : "none"} 
                        stroke={userId && currentPost.likedBy?.includes(userId) ? "#ec4899" : "currentColor"} 
                      />
                    </div>
                    <span className="post-likes-count">{currentPost.likedBy.length}</span>
                  </>
                )}
              </div>
              <div className="post-comments-count">
                {currentPost.comments.length > 0 && (
                  <span>{currentPost.comments.length} {currentPost.comments.length === 1 ? 'comment' : 'comments'}</span>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="post-modal-actions">
              <button
                className={`post-action ${userId && currentPost.likedBy?.includes(userId) ? 'liked' : ''}`}
                onClick={handleLike}
                disabled={!userId}
              >
                <Heart
                  size={18}
                  fill={userId && currentPost.likedBy?.includes(userId) ? "#ec4899" : "none"}
                  stroke={userId && currentPost.likedBy?.includes(userId) ? "#ec4899" : "currentColor"}
                />
                <span>{userId && currentPost.likedBy?.includes(userId) ? 'Liked' : 'Like'}</span>
              </button>
              <button className="post-action">
                <MessageCircle size={18} />
                <span>Comment</span>
              </button>
              <button className="post-action">
                <Share2 size={18} />
                <span>Share</span>
              </button>
            </div>
          </div>
          
          {/* Comments Section */}
          <div className="post-modal-comments-section">
            <div className="post-modal-comments">
              {currentPost.comments.map(comment => (
                <div key={comment.id} className="comment">
                  <div 
                    className="comment-avatar"
                    onClick={() => navigateToUserProfile(comment.userId)}
                  >
                    {comment.userImage ? (
                      <img src={comment.userImage} alt={comment.userName} />
                    ) : (
                      <ImagePlaceholder 
                        isAvatar 
                        size="small" 
                        name={comment.userName} 
                      />
                    )}
                  </div>
                  <div className="comment-content">
                    <div className="comment-bubble">
                      <h4 
                        className="comment-author"
                        onClick={() => navigateToUserProfile(comment.userId)}
                      >
                        {comment.userName}
                        {comment.userId === currentPost.userId && (
                          <span className="author-badge">Author</span>
                        )}
                      </h4>
                      <p className="comment-text">{comment.content}</p>
                    </div>
                    
                    <div className="comment-actions">
                      <button 
                        className={`comment-action ${hasUserReactedToComment(comment.reactions, userId) ? 'liked' : ''}`}
                        onClick={() => handleToggleCommentReaction(comment.id)}
                      >
                        Like
                        {comment.reactions && comment.reactions.length > 0 && (
                          <span className="reaction-count">{comment.reactions.length}</span>
                        )}
                      </button>
                      <button 
                        className="comment-action"
                        onClick={() => handleReplyToComment(comment.id)}
                      >
                        Reply
                      </button>
                      <span className="comment-time">{formatDate(comment.createdAt)}</span>
                    </div>
                    
                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="comment-replies">
                        {/* Show all replies if expanded, otherwise show only 2 most recent */}
                        {[...comment.replies]
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .slice(0, expandedReplies[comment.id] ? comment.replies.length : 2)
                          .map(reply => (
                            <div key={reply.id} className="comment-reply">
                              <div 
                                className="reply-avatar"
                                onClick={() => navigateToUserProfile(reply.userId)}
                              >
                                {reply.userImage ? (
                                  <img src={reply.userImage} alt={reply.userName} />
                                ) : (
                                  <ImagePlaceholder 
                                    isAvatar 
                                    size="small" 
                                    name={reply.userName} 
                                  />
                                )}
                              </div>
                              <div className="reply-content">
                                <div className="reply-bubble">
                                  <h4 
                                    className="reply-author"
                                    onClick={() => navigateToUserProfile(reply.userId)}
                                  >
                                    {reply.userName}
                                    {reply.userId === currentPost.userId && (
                                      <span className="author-badge">Author</span>
                                    )}
                                  </h4>
                                  <p className="reply-text">{reply.content}</p>
                                </div>
                                <div className="reply-actions">
                                  <span className="reply-time">{formatDate(reply.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                          ))
                        }
                        
                        {/* Add toggle button if there are more than 2 replies */}
                        {comment.replies.length > 2 && (
                          <button 
                            className="view-all-replies"
                            onClick={() => toggleExpandedReplies(comment.id)}
                          >
                            {expandedReplies[comment.id] 
                              ? "Show fewer replies" 
                              : `View all ${comment.replies.length} replies`}
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Reply Form */}
                    {replyingToComment === comment.id && (
                      <div className="reply-form">
                        <div className="reply-input-container">
                          <CornerDownRight size={16} />
                          <input
                            type="text"
                            className="reply-input"
                            placeholder="Write a reply..."
                            value={replyTexts[comment.id] || ''}
                            onChange={(e) => handleReplyChange(comment.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmitReply(comment.id);
                              }
                            }}
                          />
                          <button
                            className="reply-submit"
                            onClick={() => handleSubmitReply(comment.id)}
                            disabled={!replyTexts[comment.id] || !replyTexts[comment.id].trim()}
                          >
                            <Send size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Comment Form */}
            <div className="post-modal-comment-form">
              <div className="comment-form">
                <div className="comment-avatar">
                  {currentUser && currentUser.profileImage ? (
                    <img src={currentUser.profileImage} alt={currentUser.name} />
                  ) : (
                    <ImagePlaceholder
                      isAvatar
                      size="small"
                      name={currentUser ? currentUser.name : ""}
                    />
                  )}
                </div>
                <div className="comment-input-container">
                  <input
                    type="text"
                    className="comment-input"
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitComment();
                      }
                    }}
                  />
                  <button
                    className="comment-submit"
                    onClick={handleSubmitComment}
                    disabled={!commentText || !commentText.trim()}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={showDeleteConfirm}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeletePost}
        onCancel={cancelDeletePost}
        variant="danger"
      />
    </div>
  );
};

export default PostModal; 