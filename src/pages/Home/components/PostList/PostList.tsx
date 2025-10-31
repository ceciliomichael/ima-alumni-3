import { Post, Comment, Reply, User } from '../../../../types';
import { MessageCircle, MoreHorizontal, Heart, Send, CornerDownRight, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ImagePlaceholder from '../../../../components/ImagePlaceholder/ImagePlaceholder';
import PostModal from '../PostModal/PostModal';
import ConfirmDialog from '../../../../components/ConfirmDialog';
import { deletePost } from '../../../../services/firebase/postService';
import './PostList.css';

interface PostListProps {
  posts: Post[];
  userId: string | null;
  currentUser: User | null;
  onLikePost: (postId: string) => void;
  onAddComment: (postId: string, comment: Comment) => void;
  onAddReply: (postId: string, commentId: string, reply: Reply) => void;
  onToggleCommentReaction: (postId: string, commentId: string) => void;
  onDeletePost?: (postId: string) => void;
  dateFormat?: 'relative' | 'full';
}

const PostList = ({ 
  posts, 
  userId, 
  currentUser,
  onLikePost, 
  onAddComment,
  onAddReply,
  onToggleCommentReaction,
  onDeletePost,
  dateFormat = 'relative'
}: PostListProps) => {
  const navigate = useNavigate();
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [replyingToComment, setReplyingToComment] = useState<string | null>(null);
  
  // State for modals and menus
  const [selectedPostForModal, setSelectedPostForModal] = useState<Post | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedPostForDeletion, setSelectedPostForDeletion] = useState<string | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format date to full format: "Oct. 31, 2025-Friday"
  const formatFullDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const month = months[dateObj.getMonth()];
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();
    const dayOfWeek = days[dateObj.getDay()];
    
    return `${month} ${day}, ${year}-${dayOfWeek}`;
  };

  // Format date to a friendly format
  const formatDate = (date: Date | string) => {
    // Use full date format if specified
    if (dateFormat === 'full') {
      return formatFullDate(date);
    }
    
    // Otherwise use relative time format
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

  const handleCommentChange = (postId: string, text: string) => {
    setCommentTexts(prev => ({ ...prev, [postId]: text }));
  };

  const handleReplyChange = (commentId: string, text: string) => {
    setReplyTexts(prev => ({ ...prev, [commentId]: text }));
  };

  const handleSubmitComment = (postId: string) => {
    if (!commentTexts[postId] || !commentTexts[postId].trim() || !userId || !currentUser) return;
    
    const newComment: Comment = {
      id: Date.now().toString(),
      postId,
      userId,
      userName: currentUser.name,
      userImage: currentUser.profileImage,
      content: commentTexts[postId].trim(),
      createdAt: new Date().toISOString(),
      replies: [],
      reactions: []
    };
    
    onAddComment(postId, newComment);
    setCommentTexts(prev => ({ ...prev, [postId]: '' }));
  };

  const handleSubmitReply = (postId: string, commentId: string) => {
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
    
    onAddReply(postId, commentId, newReply);
    setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
    setReplyingToComment(null); // Close reply form
  };

  const handleLike = (postId: string) => {
    if (!userId) return;
    onLikePost(postId);
  };

  const handleReplyToComment = (commentId: string) => {
    if (replyingToComment === commentId) {
      setReplyingToComment(null);
    } else {
      setReplyingToComment(commentId);
    }
  };

  const handleToggleCommentReaction = (postId: string, commentId: string) => {
    if (!userId) return;
    onToggleCommentReaction(postId, commentId);
  };

  // Helper to check if a user has reacted to a comment
  const hasUserReactedToComment = (reactions: any[], userId: string | null) => {
    if (!userId || !reactions) return false;
    return reactions.some(reaction => reaction.userId === userId);
  };

  // Add function to navigate to user profile
  const navigateToUserProfile = (profileUserId: string) => {
    navigate(`/profile/${profileUserId}`);
  };
  
  // Add functions to handle post modal
  const openPostModal = (post: Post, imageIndex: number = 0) => {
    setSelectedPostForModal(post);
    setSelectedImageIndex(imageIndex);
  };
  
  const closePostModal = () => {
    setSelectedPostForModal(null);
  };

  // Handle post menu toggling
  const togglePostMenu = (postId: string) => {
    setActiveMenu(activeMenu === postId ? null : postId);
  };

  // Handle post deletion
  const handleDeletePost = (postId: string) => {
    setSelectedPostForDeletion(postId);
  };

  const confirmDeletePost = async () => {
    if (selectedPostForDeletion) {
      try {
        // Delete the post using the service
        const success = await deletePost(selectedPostForDeletion);
        
        if (success && onDeletePost) {
          // Call the parent handler to update state
          onDeletePost(selectedPostForDeletion);
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post. Please try again.');
      } finally {
        // Close the menu and reset state
        setActiveMenu(null);
        setSelectedPostForDeletion(null);
      }
    }
  };

  const cancelDeletePost = () => {
    setSelectedPostForDeletion(null);
  };

  return (
    <div className="post-list">
      {posts.length === 0 ? (
        <div className="no-posts">
          <p>No posts to display yet.</p>
        </div>
      ) : (
        posts.map(post => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <div className="post-author">
                <div 
                  className="post-avatar"
                  onClick={() => navigateToUserProfile(post.userId)}
                  style={{ cursor: 'pointer' }}
                >
                  {post.userImage ? (
                    <img src={post.userImage} alt={post.userName} />
                  ) : (
                    <ImagePlaceholder 
                      isAvatar 
                      size="small" 
                      name={post.userName} 
                    />
                  )}
                </div>
                <div className="post-info">
                  <h3 
                    className="post-author-name"
                    onClick={() => navigateToUserProfile(post.userId)}
                    style={{ cursor: 'pointer' }}
                  >
                    {post.userName}
                  </h3>
                  <p className="post-time">{formatDate(post.createdAt)}</p>
                </div>
              </div>
              <div className="post-menu-container" ref={activeMenu === post.id ? menuRef : null}>
                <button 
                  className="post-menu-button"
                  onClick={() => togglePostMenu(post.id)}
                >
                  <MoreHorizontal size={20} />
                </button>
                {activeMenu === post.id && userId === post.userId && (
                  <div className="post-menu">
                    <button 
                      className="post-menu-item delete"
                      onClick={() => handleDeletePost(post.id)}
                    >
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="post-content">
              <p>{post.content}</p>
              
              {post.feeling && (
                <div className="post-feeling">
                  <span className="feeling-emoji">{post.feeling.emoji}</span>
                  <span className="feeling-text">feeling {post.feeling.text}</span>
                </div>
              )}
              
              {post.images && post.images.length > 0 ? (
                <div className="post-images">
                  {post.images.map((image, index) => (
                    <img 
                      key={index} 
                      src={image} 
                      alt={`${post.userName}'s post image ${index + 1}`} 
                      onClick={() => openPostModal(post, index)}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </div>
              ) : post.content.includes('image') && (
                <ImagePlaceholder
                  shape="rectangle"
                  height="200px"
                  color="#2ecc71"
                  recommendedSize="1200x630px"
                />
              )}
            </div>
            
            <div className="post-stats">
              <div className="post-likes">
                {post.likedBy && post.likedBy.length > 0 && (
                  <>
                    <div className="like-icon-container">
                      <Heart 
                        size={14} 
                        fill={userId && post.likedBy?.includes(userId) ? "#ec4899" : "none"} 
                        stroke={userId && post.likedBy?.includes(userId) ? "#ec4899" : "currentColor"} 
                      />
                    </div>
                    <span className="post-likes-count">{post.likedBy.length}</span>
                  </>
                )}
              </div>
              <div className="post-comments-count">
                {post.comments.length > 0 && (
                  <span>{post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}</span>
                )}
              </div>
            </div>
            
            <div className="post-actions">
              <button
                className={`post-action ${userId && post.likedBy?.includes(userId) ? 'liked' : ''}`}
                onClick={() => handleLike(post.id)}
                disabled={!userId}
              >
                <Heart
                  size={18}
                  fill={userId && post.likedBy?.includes(userId) ? "#ec4899" : "none"}
                  stroke={userId && post.likedBy?.includes(userId) ? "#ec4899" : "currentColor"}
                />
                <span>{userId && post.likedBy?.includes(userId) ? 'Liked' : 'Like'}</span>
              </button>
              <button
                className="post-action"
                onClick={() => openPostModal(post)}
              >
                <MessageCircle size={18} />
                <span>Comment</span>
              </button>
            </div>
            
            {/* Display comments section */}
            {post.comments.length > 0 && (
              <div className="post-comments">
                {/* Show only the most recent comment */}
                {[...post.comments]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 1)
                  .map(comment => (
                  <div key={comment.id} className="comment">
                    <div 
                      className="comment-avatar"
                      onClick={() => navigateToUserProfile(comment.userId)}
                      style={{ cursor: 'pointer' }}
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
                          style={{ cursor: 'pointer' }}
                        >
                          {comment.userName}
                          {comment.userId === post.userId && (
                            <span className="author-badge">Author</span>
                          )}
                        </h4>
                        <p className="comment-text">{comment.content}</p>
                      </div>
                      
                      <div className="comment-actions">
                        <button 
                          className={`comment-action ${hasUserReactedToComment(comment.reactions, userId) ? 'liked' : ''}`}
                          onClick={() => handleToggleCommentReaction(post.id, comment.id)}
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
                      
                      {/* Show the latest reply if it exists */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="comment-replies">
                          {/* Only show the most recent reply */}
                          {[...comment.replies]
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .slice(0, 1)
                            .map(reply => (
                              <div key={reply.id} className="comment-reply">
                                <div 
                                  className="reply-avatar"
                                  onClick={() => navigateToUserProfile(reply.userId)}
                                  style={{ cursor: 'pointer' }}
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
                                      {reply.userId === post.userId && (
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
                          ))}
                          
                          {comment.replies.length > 1 && (
                            <button 
                              className="view-more-replies" 
                              onClick={() => openPostModal(post)}
                            >
                              View {comment.replies.length - 1} more {comment.replies.length - 1 === 1 ? 'reply' : 'replies'}
                            </button>
                          )}
                        </div>
                      )}
                      
                      {/* Reply form */}
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
                                  handleSubmitReply(post.id, comment.id);
                                }
                              }}
                            />
                            <button
                              className="reply-submit"
                              onClick={() => handleSubmitReply(post.id, comment.id)}
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
                
                {/* View more comments button */}
                {post.comments.length > 1 && (
                  <div className="view-more-comments">
                    <button 
                      className="view-more-button"
                      onClick={() => openPostModal(post)}
                    >
                      View all {post.comments.length} comments
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Comment form */}
            <div className="post-comment-form">
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
                    value={commentTexts[post.id] || ''}
                    onChange={(e) => handleCommentChange(post.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitComment(post.id);
                      }
                    }}
                  />
                  <button
                    className="comment-submit"
                    onClick={() => handleSubmitComment(post.id)}
                    disabled={!commentTexts[post.id] || !commentTexts[post.id].trim()}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
      
      {/* Post Modal */}
      {selectedPostForModal && (
        <PostModal 
          post={selectedPostForModal}
          selectedImageIndex={selectedImageIndex}
          onClose={closePostModal}
          currentUser={currentUser}
          userId={userId}
          onLikePost={onLikePost}
          onAddComment={onAddComment}
          onAddReply={onAddReply}
          onToggleCommentReaction={onToggleCommentReaction}
          onDeletePost={onDeletePost}
          navigateToUserProfile={navigateToUserProfile}
        />
      )}
      
      {/* Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={selectedPostForDeletion !== null}
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

export default PostList;
