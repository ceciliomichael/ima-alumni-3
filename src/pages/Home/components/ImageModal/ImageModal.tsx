import React from 'react';
import { X, Heart, CornerDownRight, Send } from 'lucide-react';
import { Post, Comment, Reply, User } from '../../../../types';
import ImagePlaceholder from '../../../../components/ImagePlaceholder';
import './ImageModal.css';

interface ImageModalProps {
  post: Post;
  selectedImageIndex: number;
  onClose: () => void;
  currentUser: User | null;
  userId: string | null;
  onLikePost: (postId: string) => void;
  onAddComment: (postId: string, comment: Comment) => void;
  onAddReply: (postId: string, commentId: string, reply: Reply) => void;
  onToggleCommentReaction: (postId: string, commentId: string) => void;
  navigateToUserProfile: (userId: string) => void;
}

const ImageModal: React.FC<ImageModalProps> = ({
  post,
  selectedImageIndex,
  onClose,
  currentUser,
  userId,
  onLikePost,
  onAddComment,
  onAddReply,
  onToggleCommentReaction,
  navigateToUserProfile
}) => {
  const [commentText, setCommentText] = React.useState('');
  const [replyTexts, setReplyTexts] = React.useState<Record<string, string>>({});
  const [replyingToComment, setReplyingToComment] = React.useState<string | null>(null);
  
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
      postId: post.id,
      userId,
      userName: currentUser.name,
      userImage: currentUser.profileImage,
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
      replies: [],
      reactions: []
    };
    
    onAddComment(post.id, newComment);
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
    
    onAddReply(post.id, commentId, newReply);
    setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
    setReplyingToComment(null); // Close reply form
  };

  const handleLike = () => {
    if (!userId) return;
    onLikePost(post.id);
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
    onToggleCommentReaction(post.id, commentId);
  };

  // Helper to check if a user has reacted to a comment
  const hasUserReactedToComment = (reactions: any[], userId: string | null) => {
    if (!userId || !reactions) return false;
    return reactions.some(reaction => reaction.userId === userId);
  };

  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div className="image-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="image-modal-close" onClick={onClose}>
          <X size={24} />
        </button>
        
        <div className="image-modal-content">
          <div className="image-modal-image-container">
            {post.images && post.images.length > 0 ? (
              <img 
                src={post.images[selectedImageIndex]} 
                alt={`${post.userName}'s post`} 
                className="image-modal-image"
              />
            ) : (
              <ImagePlaceholder
                shape="rectangle"
                height="400px"
                color="#2ecc71"
                recommendedSize="1200x630px"
              />
            )}
          </div>
          
          <div className="image-modal-sidebar">
            <div className="image-modal-header">
              <div 
                className="post-author"
                onClick={() => navigateToUserProfile(post.userId)}
              >
                <div className="post-avatar">
                  {post.userImage ? (
                    <img src={post.userImage} alt={post.userName} />
                  ) : (
                    <ImagePlaceholder
                      shape="circle"
                      width="45px"
                      height="45px"
                      color="#6c5ce7"
                      text={post.userName.charAt(0)}
                      recommendedSize="100x100px"
                    />
                  )}
                </div>
                <div className="post-info">
                  <h3 className="post-author-name">{post.userName}</h3>
                  <p className="post-time">{formatDate(post.createdAt)}</p>
                </div>
              </div>
            </div>
            
            <div className="image-modal-post-content">
              <p>{post.content}</p>
            </div>
            
            <div className="image-modal-stats">
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
            
            <div className="image-modal-action">
              <button
                className={`post-action ${userId && post.likedBy?.includes(userId) ? 'liked' : ''}`}
                onClick={handleLike}
                disabled={!userId}
              >
                <Heart
                  size={18}
                  fill={userId && post.likedBy?.includes(userId) ? "#ec4899" : "none"}
                  stroke={userId && post.likedBy?.includes(userId) ? "#ec4899" : "currentColor"}
                />
                <span>{userId && post.likedBy?.includes(userId) ? 'Liked' : 'Like'}</span>
              </button>
            </div>
            
            <div className="image-modal-comments-container">
              <div className="image-modal-comments">
                {post.comments.map(comment => (
                  <div key={comment.id} className="comment">
                    <div 
                      className="comment-avatar"
                      onClick={() => navigateToUserProfile(comment.userId)}
                    >
                      {comment.userImage ? (
                        <img src={comment.userImage} alt={comment.userName} />
                      ) : (
                        <ImagePlaceholder
                          shape="circle"
                          width="36px"
                          height="36px"
                          color="#6c5ce7"
                          text={comment.userName.charAt(0)}
                          recommendedSize="100x100px"
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
                          {comment.userId === post.userId && (
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
                          {comment.replies.map(reply => (
                            <div key={reply.id} className="comment-reply">
                              <div 
                                className="reply-avatar"
                                onClick={() => navigateToUserProfile(reply.userId)}
                              >
                                {reply.userImage ? (
                                  <img src={reply.userImage} alt={reply.userName} />
                                ) : (
                                  <ImagePlaceholder
                                    shape="circle"
                                    width="28px"
                                    height="28px"
                                    color="#6c5ce7"
                                    text={reply.userName.charAt(0)}
                                    recommendedSize="100x100px"
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
              <div className="image-modal-comment-form">
                <div className="comment-form">
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
      </div>
    </div>
  );
};

export default ImageModal; 