import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Post } from '../../types';
import ProfileHeader from './components/ProfileHeader';
import ProfileGallery from './components/ProfileGallery';
import ProfileActivity from './components/ProfileActivity';
import ProfileForm from './components/ProfileForm';
import ProfilePosts from './components/ProfilePosts';
import PasswordChange from './components/PasswordChange';
import FollowersModal from './components/FollowersModal/FollowersModal';
import { ProfileFormData } from './components/ProfileForm';
import { 
  getUserById, 
  followUser, 
  unfollowUser, 
  isFollowing,
  getFollowers,
  getFollowing,
  updateUser,
  getCurrentUser
} from '../../services/firebase/userService';
import { getPostsByUserId } from '../../services/firebase/postService';
import { getAlumniByUserId, updateAlumni } from '../../services/firebase/alumniService';
import './styles.css';

interface ProfilePageProps {
  user?: User | null;
  isEditing?: boolean;
  isViewingOtherUser?: boolean;
}

const ProfilePage = ({ 
  user: currentUser, 
  isEditing: initialEditMode = false, 
  isViewingOtherUser = false 
}: ProfilePageProps) => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editTab, setEditTab] = useState<'profile' | 'password'>('profile');

  // Load the profile data based on the userId param or the current user
  useEffect(() => {
    setIsLoading(true);
    
    const loadUserProfile = async () => {
      try {
        let userToDisplay = null;
        
        if (isViewingOtherUser && userId) {
          // Viewing another user's profile
          userToDisplay = await getUserById(userId);
          
          // Check if current user is following this profile
          if (currentUser && userToDisplay) {
            const following = await isFollowing(currentUser.id, userToDisplay.id);
            setIsFollowingUser(following);
          }
        } else if (currentUser) {
          // Viewing own profile - fetch fresh data from Firestore
          userToDisplay = await getUserById(currentUser.id);
        }
        
        if (userToDisplay) {
          setProfileUser(userToDisplay as unknown as User);
          
          // Load the user's posts and sort by newest first
          const userPosts = await getPostsByUserId(userToDisplay.id);
          const sortedPosts = [...userPosts].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setPosts(sortedPosts);
          
          // Get follower and following data
          const followersList = await getFollowers(userToDisplay.id);
          const followingList = await getFollowing(userToDisplay.id);
          
          setFollowers(followersList as unknown as User[]);
          setFollowing(followingList as unknown as User[]);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserProfile();
  }, [userId, currentUser, isViewingOtherUser]);

  // Listen for localStorage changes to refresh posts
  useEffect(() => {
    const handleStorageChange = async () => {
      if (profileUser) {
        try {
          // Refresh posts when storage changes
          const refreshedPosts = await getPostsByUserId(profileUser.id);
          // Sort by newest first
          const sortedPosts = [...refreshedPosts].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setPosts(sortedPosts);
        } catch (error) {
          console.error('Error refreshing posts:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [profileUser]);

  const handleSaveProfile = async (formData: ProfileFormData) => {
    if (profileUser && !isSaving) {
      setIsSaving(true);
      try {
        const updatedUser = await updateUser(profileUser.id, {
          name: formData.name,
          email: formData.email,
          batch: formData.batch,
          profileImage: formData.profileImage,
          coverPhoto: formData.coverPhoto,
          bio: formData.bio,
          job: formData.job,
          company: formData.company, 
          location: formData.location,
          showOfficerInfo: formData.showOfficerInfo
        });

        if (updatedUser) {
          console.log('Profile updated successfully');
          
          // Sync profile image to alumni record for officer carousel display
          if (formData.profileImage) {
            const alumniRecord = await getAlumniByUserId(profileUser.id);
            if (alumniRecord) {
              await updateAlumni(alumniRecord.id, { profileImage: formData.profileImage });
            }
          }
          
          // Trigger localStorage event to update user data across tabs
          window.dispatchEvent(new Event('storage'));
          
          // Update local state
          setProfileUser(updatedUser as unknown as User);
          
          // If this update is for the current user, refresh the page to show changes everywhere
          const currentUser = getCurrentUser();
          if (currentUser && currentUser.id === updatedUser.id) {
            // Force a refresh of the app state
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'currentUser'
            }));
          }
          
          // Navigate back to profile page after successful save
          setIsEditing(false);
          navigate('/profile');
        } else {
          console.error('Failed to update profile: updateUser returned null');
          alert('Failed to save profile. Please try again.');
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        alert(`Failed to save profile: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
      } finally {
        setIsSaving(false);
      }
    }
  };
  
  // Handle direct image change from profile header
  const handleImageChange = async (type: 'profile' | 'cover', imageData: string) => {
    if (profileUser && currentUser && profileUser.id === currentUser.id) {
      try {
        const updatedUser = await updateUser(profileUser.id, {
          [type === 'profile' ? 'profileImage' : 'coverPhoto']: imageData
        });
        
        if (updatedUser) {
          setProfileUser(updatedUser as unknown as User);
          
          // Sync profile image to alumni record for officer carousel display
          if (type === 'profile') {
            const alumniRecord = await getAlumniByUserId(profileUser.id);
            if (alumniRecord) {
              await updateAlumni(alumniRecord.id, { profileImage: imageData });
            }
          }
        }
      } catch (error) {
        console.error('Error updating image:', error);
      }
    }
  };
  
  // Handle user follow actions from the modals
  const handleFollowUser = async (targetUserId: string) => {
    if (!currentUser) return;
    
    try {
      const success = await followUser(currentUser.id, targetUserId);
      if (success && profileUser) {
        // Refresh following list if on current user's profile
        if (profileUser.id === currentUser.id) {
          const updatedFollowing = await getFollowing(currentUser.id);
          setFollowing(updatedFollowing as unknown as User[]);
        }
      }
    } catch (error) {
      console.error('Error following user from modal:', error);
    }
  };
  
  // Handle user unfollow actions from the modals
  const handleUnfollowUser = async (targetUserId: string) => {
    if (!currentUser) return;
    
    try {
      const success = await unfollowUser(currentUser.id, targetUserId);
      if (success && profileUser) {
        // Refresh following list if on current user's profile
        if (profileUser.id === currentUser.id) {
          const updatedFollowing = await getFollowing(currentUser.id);
          setFollowing(updatedFollowing as unknown as User[]);
        }
      }
    } catch (error) {
      console.error('Error unfollowing user from modal:', error);
    }
  };
  
  // Handle navigation to a user profile
  const navigateToUserProfile = (userId: string) => {
    setShowFollowersModal(false);
    setShowFollowingModal(false);
    navigate(`/profile/${userId}`);
  };

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="loading-state">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="profile-container">
        <div className="empty-state">
          <p>User profile not found.</p>
        </div>
      </div>
    );
  }

  const activityStats = {
    posts: posts.length,
    comments: 0,
    events: 0
  };

  // Show edit button only if viewing own profile
  const canEdit = !isViewingOtherUser && currentUser?.id === profileUser.id;
  
  // Get list of current user's following for the modal
  
  return (
    <div className="profile-container">
      {isEditing ? (
        <div className="profile-edit-container">
          <div className="profile-edit-tabs">
            <button 
              className={`profile-tab ${editTab === 'profile' ? 'active' : ''}`}
              onClick={() => setEditTab('profile')}
            >
              Edit Profile
            </button>
            <button 
              className={`profile-tab ${editTab === 'password' ? 'active' : ''}`}
              onClick={() => setEditTab('password')}
            >
              Change Password
            </button>
          </div>
          
          <div className="profile-edit-content">
            {editTab === 'profile' ? (
              <ProfileForm 
                user={profileUser} 
                onSave={handleSaveProfile} 
                onCancel={() => setIsEditing(false)}
                isLoading={isSaving}
              />
            ) : (
              <PasswordChange 
                userId={profileUser.id}
                onSuccess={() => {
                  alert('Password changed successfully!');
                  setIsEditing(false);
                }}
                onCancel={() => setIsEditing(false)}
              />
            )}
          </div>
        </div>
      ) : (
        <>
          <ProfileHeader 
            user={profileUser}
            onEditClick={() => {
              setEditTab('profile');
              setIsEditing(true);
            }}
            showEditButton={canEdit}
            onImageChange={handleImageChange}
            currentUserId={currentUser?.id}
            isFollowing={isFollowingUser}
          />
          
          <div className="profile-body">
            <div className="profile-sidebar">
              <ProfileGallery posts={posts} />
              <ProfileActivity stats={activityStats} />
            </div>
            
            <div className="profile-main">
              <ProfilePosts 
                posts={posts} 
                profileUser={profileUser}
                currentUser={currentUser || null}
              />
            </div>
          </div>
        </>
      )}
      
      {showFollowersModal && (
        <FollowersModal
          isOpen={showFollowersModal}
          title="Followers"
          users={followers}
          onClose={() => setShowFollowersModal(false)}
          onViewProfile={navigateToUserProfile}
          currentUserId={currentUser?.id || null}
          followingIds={following.map(user => user.id)}
          onFollowUser={handleFollowUser}
          onUnfollowUser={handleUnfollowUser}
        />
      )}
      
      {showFollowingModal && (
        <FollowersModal
          isOpen={showFollowingModal}
          title="Following"
          users={following}
          onClose={() => setShowFollowingModal(false)}
          onViewProfile={navigateToUserProfile}
          currentUserId={currentUser?.id || null}
          followingIds={following.map(user => user.id)}
          onFollowUser={handleFollowUser}
          onUnfollowUser={handleUnfollowUser}
        />
      )}
    </div>
  );
};

export default ProfilePage;
