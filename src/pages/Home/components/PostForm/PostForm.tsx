import { useState, useRef } from 'react';
import { User, Post } from '../../../../types';
import { Image, Smile, Send, X } from 'lucide-react';
import ImagePlaceholder from '../../../../components/ImagePlaceholder/ImagePlaceholder';
import './PostForm.css';
import { addPost } from '../../../../services/firebase/postService';
import FeelingSelector from './FeelingSelector';
import { Feeling } from './types';

interface PostFormProps {
  user: User | null;
  onPostCreated: (post: Post) => void;
}

const PostForm = ({ user, onPostCreated }: PostFormProps) => {
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showFeelingSelector, setShowFeelingSelector] = useState(false);
  const [selectedFeeling, setSelectedFeeling] = useState<Feeling | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Prepare post data
      const postData: any = {
        userId: user.id,
        userName: user.name,
        content: content.trim(),
        images: selectedImages,
        updatedAt: new Date().toISOString()
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
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    setSelectedImages([]);
    setSelectedFeeling(null);
    setIsExpanded(false);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  if (!user) return null;

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
                {isSubmitting ? (
                  'Posting...'
                ) : (
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
