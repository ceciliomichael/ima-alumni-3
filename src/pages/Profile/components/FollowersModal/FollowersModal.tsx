import React from 'react';
import { X, UserPlus, UserMinus } from 'lucide-react';
import { User } from '../../../../types';
import ImagePlaceholder from '../../../../components/ImagePlaceholder';
import './styles.css';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: User[];
  currentUserId: string | null;
  onFollowUser?: (userId: string) => void;
  onUnfollowUser?: (userId: string) => void;
  followingIds?: string[];
  onViewProfile: (userId: string) => void;
}

const FollowersModal: React.FC<FollowersModalProps> = ({
  isOpen,
  onClose,
  title,
  users,
  currentUserId,
  onFollowUser,
  onUnfollowUser,
  followingIds = [],
  onViewProfile
}) => {
  if (!isOpen) return null;

  return (
    <div className="followers-modal-overlay">
      <div className="followers-modal">
        <div className="followers-modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        <div className="followers-list">
          {users.length === 0 ? (
            <div className="followers-empty-state">
              <p>No users to display</p>
            </div>
          ) : (
            users.map(user => (
              <div key={user.id} className="follower-item">
                <div 
                  className="follower-avatar" 
                  onClick={() => onViewProfile(user.id)}
                >
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.name} />
                  ) : (
                    <ImagePlaceholder
                      shape="circle"
                      width="40px"
                      height="40px"
                      color="#6c5ce7"
                      text={user.name.charAt(0)}
                      recommendedSize="100x100px"
                    />
                  )}
                </div>
                
                <div className="follower-info" onClick={() => onViewProfile(user.id)}>
                  <h4>{user.name}</h4>
                  <p>Batch {user.batch}</p>
                </div>
                
                {currentUserId && currentUserId !== user.id && (
                  followingIds.includes(user.id) ? (
                    <button 
                      className="unfollow-btn small" 
                      onClick={() => onUnfollowUser && onUnfollowUser(user.id)}
                    >
                      <UserMinus size={14} />
                      <span>Following</span>
                    </button>
                  ) : (
                    <button 
                      className="follow-btn small" 
                      onClick={() => onFollowUser && onFollowUser(user.id)}
                    >
                      <UserPlus size={14} />
                      <span>Follow</span>
                    </button>
                  )
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowersModal; 