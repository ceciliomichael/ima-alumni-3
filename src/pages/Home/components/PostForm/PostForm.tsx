import { useState, useRef, useEffect } from 'react';
import { User, Post } from '../../../../types';
import { Image, Smile, Send, X } from 'lucide-react';
import ImagePlaceholder from '../../../../components/ImagePlaceholder/ImagePlaceholder';
import './PostForm.css';
import { addPost, editPostContent } from '../../../../services/firebase/postService';
import FeelingSelector from './FeelingSelector';
import { Feeling } from './types';

interface PostFormProps {
  user: User | null;
  onPostCreated: (post: Post) => void;
  // Edit mode props
  editMode?: boolean;
  postToEdit?: Post;
  onEditComplete?: (updatedPost: Post) => void;
  onEditCancel?: () => void;
}

const PostForm = ({ 
  user, 
  onPostCreated,
  editMode = false,
  postToEdit,
  onEditComplete,
  onEditCancel
}: PostFormProps) => {
  const [content, setContent] = useState(editMode && postToEdit ? postToEdit.content : '');
  const [isExpanded, setIsExpanded] = useState(editMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>(editMode && postToEdit?.images ? postToEdit.images : []);
  const [showFeelingSelector, setShowFeelingSelector] = useState(false);
  const [selectedFeeling, setSelectedFeeling] = useState<Feeling | null>(
    editMode && postToEdit?.feeling ? postToEdit.feeling : null
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize edit mode values
  useEffect(() => {
    if (editMode && postToEdit) {
      setContent(postToEdit.content);
      setSelectedImages(postToEdit.images || []);
      setSelectedFeeling(postToEdit.feeling || null);
      setIsExpanded(true);
    }
  }, [editMode, postToEdit]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    
    // Auto resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Convert images to base64
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setSelectedImages(prev => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Clear the input so the same file can be selected again
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleFeelingClick = () => {
    setShowFeelingSelector(true);
  };

  const handleFeelingSelect = (feeling: Feeling | null) => {
    setSelectedFeeling(feeling);
  };

  const closeFeelingSelector = () => {
    setShowFeelingSelector(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!content.trim() && selectedImages.length === 0) || !user) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (editMode && postToEdit) {
        // Edit existing post
        const updates: { content?: string; images?: string[]; feeling?: { emoji: string; text: string } | null } = {
          content: content.trim(),
          images: selectedImages,
          feeling: selectedFeeling
        };
        
        const updatedPost = await editPostContent(postToEdit.id, updates);
        
        if (updatedPost && onEditComplete) {
          onEditComplete(updatedPost);
        }
      } else {
        // Create new post
        const postData: {
          userId: string;
          userName: string;
          content: string;
          images: string[];
          updatedAt: string;
          isApproved: boolean;
          userImage?: string;
          feeling?: { emoji: string; text: string };
        } = {
          userId: user.id,
          userName: user.name,
          content: content.trim(),
          images: selectedImages,
          updatedAt: new Date().toISOString(),
          isApproved: false // Posts require moderation approval
        };

        if (user.profileImage) {
          postData.userImage = user.profileImage;
        }

        if (selectedFeeling) {
          postData.feeling = selectedFeeling;
        }
        
        // Use postService to add the post
        const newPost = await addPost(postData);
        
        // Call the callback with the new post
        onPostCreated(newPost);
        
        // Reset form
        setContent('');
        setSelectedImages([]);
        setSelectedFeeling(null);
        setIsExpanded(false);
        
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    } catch (error) {
      console.error('Error creating/editing post:', error);
      alert(editMode ? 'Failed to edit post. Please try again.' : 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (editMode && onEditCancel) {
      onEditCancel();
    } else {
      setContent('');
      setSelectedImages([]);
      setSelectedFeeling(null);
      setIsExpanded(false);
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  if (!user) return null;

  // Render compact edit mode
  if (editMode) {
    return (
      <div className="post-edit-inline">
        <textarea
          ref={textareaRef}
          className="post-edit-textarea"
          value={content}
          onChange={handleContentChange}
          rows={3}
          autoFocus
          placeholder="Edit your post..."
        />
        
        {/* Image Preview for Edit */}
        {selectedImages.length > 0 && (
          <div className="post-edit-images">
            {selectedImages.map((image, index) => (
              <div key={index} className="post-edit-image-item">
                <img src={image} alt={`Image ${index + 1}`} />
                <button 
                  type="button" 
                  className="post-edit-remove-img"
                  onClick={() => handleRemoveImage(index)}
                  title="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Feeling for Edit */}
        {selectedFeeling && (
          <div className="post-edit-feeling">
            <span>{selectedFeeling.emoji} {selectedFeeling.text}</span>
            <button type="button" onClick={() => setSelectedFeeling(null)}>
              <X size={12} />
            </button>
          </div>
        )}

        <div className="post-edit-toolbar">
          <div className="post-edit-actions">
            <button type="button" onClick={handleImageClick} title="Add photo">
              <Image size={18} />
            </button>
            <button type="button" onClick={handleFeelingClick} title="Add feeling">
              <Smile size={18} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
          </div>
          <div className="post-edit-buttons">
            <button type="button" className="post-edit-cancel" onClick={handleCancel}>
              Cancel
            </button>
            <button 
              type="button" 
              className="post-edit-save"
              onClick={handleSubmit}
              disabled={isSubmitting || (content.trim() === '' && selectedImages.length === 0)}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        
        {postToEdit?.moderationStatus === 'approved' && (
          <p className="post-edit-notice">Editing will submit for re-approval</p>
        )}

        {showFeelingSelector && (
          <FeelingSelector 
            onSelectFeeling={handleFeelingSelect}
            onClose={closeFeelingSelector}
            selectedFeeling={selectedFeeling}
          />
        )}
      </div>
    );
  }

  // Regular create post form
  return (
    <div className="post-form-card">
      <form className="post-form" onSubmit={handleSubmit}>
        <div className="post-form-header">
          <div className="user-avatar">
            {user.profileImage ? (
              <img src={user.profileImage} alt={user.name || 'User Avatar'} />
            ) : (
              <ImagePlaceholder
                isAvatar
                size="small"
                name={user.name || ''}
              />
            )}
          </div>
          
          <textarea
            ref={textareaRef}
            className="post-input"
            placeholder={selectedFeeling 
              ? `What's on your mind? You're feeling ${selectedFeeling.text}` 
              : "What's on your mind?"}
            value={content}
            onChange={handleContentChange}
            onFocus={handleFocus}
            rows={isExpanded ? 3 : 1}
          />
        </div>

        {/* Feeling Display */}
        {selectedFeeling && (
          <div className="selected-feeling-display">
            <div className="feeling-badge">
              <span className="feeling-emoji">{selectedFeeling.emoji}</span>
              <span className="feeling-text">Feeling {selectedFeeling.text}</span>
              <button 
                type="button"
                className="remove-feeling-btn"
                onClick={() => setSelectedFeeling(null)}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Image Preview */}
        {selectedImages.length > 0 && (
          <div className="image-preview-container">
            {selectedImages.map((image, index) => (
              <div key={index} className="image-preview">
                <img src={image} alt={`Selected ${index + 1}`} />
                <button 
                  type="button" 
                  className="remove-image-btn"
                  onClick={() => handleRemoveImage(index)}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {isExpanded && (
          <div className="post-form-footer">
            <div className="post-form-actions">
              <button 
                type="button" 
                className="post-action-btn"
                onClick={handleImageClick}
              >
                <Image size={20} />
                <span>Photo</span>
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                className="file-input"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              
              <button 
                type="button" 
                className={`post-action-btn ${selectedFeeling ? 'active' : ''}`}
                onClick={handleFeelingClick}
              >
                {selectedFeeling ? (
                  <span className="selected-feeling-emoji">{selectedFeeling.emoji}</span>
                ) : (
                  <Smile size={20} />
                )}
                <span>Feeling</span>
              </button>
            </div>
            
            <div className="post-form-submit">
              <button 
                type="button" 
                className="btn btn-outline post-cancel-btn" 
                onClick={handleCancel}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="btn btn-primary post-submit-btn"
                disabled={(content.trim() === '' && selectedImages.length === 0) || isSubmitting}
              >
                {isSubmitting ? 'Posting...' : (
                  <>
                    <Send size={16} />
                    <span>Post</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Feeling Selector Modal */}
      {showFeelingSelector && (
        <FeelingSelector 
          onSelectFeeling={handleFeelingSelect}
          onClose={closeFeelingSelector}
          selectedFeeling={selectedFeeling}
        />
      )}
    </div>
  );
};

export default PostForm;
