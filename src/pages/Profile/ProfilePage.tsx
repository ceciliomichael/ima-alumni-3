import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User } from '../../types';
import ProfileHeader from './components/ProfileHeader';
import ProfileAbout from './components/ProfileAbout';
import ProfileActivity from './components/ProfileActivity';
import ProfileForm from './components/ProfileForm';
import ProfilePosts from './components/ProfilePosts';
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
  const [posts, setPosts] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

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
        } else {
          // Viewing own profile
          userToDisplay = currentUser;
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
          setFollowersCount(followersList.length);
          setFollowingCount(followingList.length);
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
    // Save user data to Firestore
    if (profileUser) {
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
          socialLinks: {
            linkedin: formData.linkedin,
            twitter: formData.twitter,
            website: formData.website
          }
        });

        if (updatedUser) {
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
        }
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    }
    setIsEditing(false);
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
        }
      } catch (error) {
        console.error('Error updating image:', error);
      }
    }
  };
  
  // Handle follow action
  const handleFollow = async () => {
    if (!currentUser || !profileUser) return;
    
    try {
      const success = await followUser(currentUser.id, profileUser.id);
      if (success) {
        setIsFollowingUser(true);
        // Refresh followers list
        const updatedFollowers = await getFollowers(profileUser.id);
        setFollowers(updatedFollowers as unknown as User[]);
        setFollowersCount(updatedFollowers.length);
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };
  
  // Handle unfollow action
  const handleUnfollow = async () => {
    if (!currentUser || !profileUser) return;
    
    try {
      const success = await unfollowUser(currentUser.id, profileUser.id);
      if (success) {
        setIsFollowingUser(false);
        // Refresh followers list
        const updatedFollowers = await getFollowers(profileUser.id);
        setFollowers(updatedFollowers as unknown as User[]);
        setFollowersCount(updatedFollowers.length);
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
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
          setFollowingCount(updatedFollowing.length);
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
          setFollowingCount(updatedFollowing.length);
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
  
  // Open followers modal
  const openFollowersModal = () => {
    setShowFollowersModal(true);
  };
  
  // Open following modal
  const openFollowingModal = () => {
    setShowFollowingModal(true);
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
  const currentUserFollowing = currentUser?.following || [];

  return (
    <div className="profile-container">
      {isEditing ? (
        <ProfileForm 
          user={profileUser} 
          onSave={handleSaveProfile} 
          onCancel={() => setIsEditing(false)} 
        />
      ) : (
        <>
          <ProfileHeader 
            user={profileUser}
            followersCount={followersCount}
            followingCount={followingCount}
            onFollowersClick={openFollowersModal}
            onFollowingClick={openFollowingModal}
            showEditButton={canEdit}
            onEditClick={() => setIsEditing(true)}
            onImageChange={handleImageChange}
            isFollowing={isFollowingUser}
            onFollowClick={handleFollow}
            onUnfollowClick={handleUnfollow}
            currentUserId={currentUser?.id}
          />
          
          <div className="profile-body">
            <div className="profile-sidebar">
              <ProfileAbout 
                bio={profileUser.bio || ''}
                job={profileUser.job || ''}
                company={profileUser.company || ''}
                location={profileUser.location || ''}
                socialLinks={profileUser.socialLinks || {}}
              />
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
