import { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, Briefcase, CheckCircle, XCircle, 
  Search, Filter, AlertCircle, Clock, Trash
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminLayout from '../../layout/AdminLayout';
import { 
  getAllPosts, 
  moderatePost,
  deletePost,
  type Post 
} from '../../../../services/firebase/postService';
import { 
  getAllJobs, 
  approveJob,
  deleteJob,
  Job 
} from '../../../../services/firebase/jobService';
import './ContentModeration.css';

type ContentTab = 'posts' | 'jobs';
type ModerationFilter = 'all' | 'pending' | 'approved' | 'rejected';

const ContentModeration = () => {
  const { adminUser } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<ContentTab>('posts');
  const [filter, setFilter] = useState<ModerationFilter>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // State for different content types
  const [posts, setPosts] = useState<Post[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  // Moderation modal state
  const [selectedItem, setSelectedItem] = useState<Post | Job | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const filterByStatus = useCallback(<T extends { isApproved?: boolean; moderationStatus?: string }>(items: T[]): T[] => {
    if (filter === 'all') return items;
    if (filter === 'pending') return items.filter(item => !item.isApproved && item.moderationStatus !== 'rejected');
    if (filter === 'approved') return items.filter(item => item.isApproved === true);
    if (filter === 'rejected') return items.filter(item => item.moderationStatus === 'rejected');
    return items;
  }, [filter]);

  const loadPosts = useCallback(async () => {
    const allPosts = await getAllPosts();
    const filtered = filterByStatus(allPosts);
    setPosts(filtered);
  }, [filterByStatus]);

  const loadJobs = useCallback(async () => {
    const allJobs = await getAllJobs();
    const filtered = filterByStatus(allJobs);
    setJobs(filtered);
  }, [filterByStatus]);

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'posts':
          await loadPosts();
          break;
        case 'jobs':
          await loadJobs();
          break;
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, loadPosts, loadJobs]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleApprove = async (id: string, type: ContentTab) => {
    if (!adminUser) return;

    try {
      setLoading(true);
      switch (type) {
        case 'posts':
          await moderatePost(id, true, adminUser.name);
          break;
        case 'jobs':
          await approveJob(id, true, adminUser.name);
          break;
      }
      await loadContent();
    } catch (error) {
      console.error('Error approving content:', error);
      alert('Failed to approve content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = (item: Post | Job) => {
    setSelectedItem(item);
    setShowRejectModal(true);
  };

const confirmReject = async () => {
  if (!selectedItem || !adminUser) return;

  try {
    setLoading(true);
    switch (activeTab) {
      case 'posts':
        await moderatePost(selectedItem.id, false, adminUser.name, rejectionReason);
        break;
      case 'jobs':
        await approveJob(selectedItem.id, false, adminUser.name, rejectionReason);
        break;
    }
    setShowRejectModal(false);
    setRejectionReason('');
    setSelectedItem(null);
    await loadContent();
  } catch (error) {
    console.error('Error rejecting content:', error);
    alert('Failed to reject content. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const handleDelete = async (id: string, type: ContentTab) => {
    if (!window.confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      switch (type) {
        case 'posts':
          await deletePost(id);
          break;
        case 'jobs':
          await deleteJob(id);
          break;
      }
      await loadContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function is currently not used but kept for future features
  // const getPendingCount = (type: ContentTab) => {
  //   switch (type) {
  //     case 'posts':
  //       return posts.filter(p => !p.isApproved).length;
  //     case 'events':
  //       return events.filter(e => !e.isApproved).length;
  //     case 'jobs':
  //       return jobs.filter(j => !j.isApproved).length;
  //     default:
  //       return 0;
  //   }
  // };

  const renderPostCard = (post: Post) => (
    <div key={post.id} className="moderation-card">
      <div className="moderation-card-header">
        <div className="moderation-user-info">
          <div className="moderation-user-avatar">
            {post.userImage ? (
              <img src={post.userImage} alt={post.userName} />
            ) : (
              <span>{post.userName.charAt(0)}</span>
            )}
          </div>
          <div>
            <h4>{post.userName}</h4>
            <p className="moderation-date">{formatDate(post.createdAt)}</p>
          </div>
        </div>
        <div className={`moderation-status ${post.isApproved ? 'approved' : post.moderationStatus === 'rejected' ? 'rejected' : 'pending'}`}>
          {post.isApproved ? (
            <><CheckCircle size={16} /> Approved</>
          ) : post.moderationStatus === 'rejected' ? (
            <><XCircle size={16} /> Rejected</>
          ) : (
            <><Clock size={16} /> Pending</>
          )}
        </div>
      </div>

      <div className="moderation-content">
        <p>{post.content}</p>
        {post.images && post.images.length > 0 && (
          <div className="moderation-images">
            {post.images.slice(0, 3).map((img: string, idx: number) => (
              <img key={idx} src={img} alt="" />
            ))}
            {post.images.length > 3 && (
              <div className="moderation-more-images">+{post.images.length - 3} more</div>
            )}
          </div>
        )}
        {post.feeling && (
          <div className="moderation-feeling">
            <span>{post.feeling.emoji}</span> feeling {post.feeling.text}
          </div>
        )}
      </div>

      {post.moderationStatus === 'rejected' && post.rejectionReason && (
        <div className="moderation-rejection-reason">
          <AlertCircle size={16} />
          <span>Rejection reason: {post.rejectionReason}</span>
        </div>
      )}

      <div className="moderation-actions">
        {!post.isApproved && post.moderationStatus !== 'rejected' && (
          <>
            <button 
              className="moderation-btn approve"
              onClick={() => handleApprove(post.id, 'posts')}
            >
              <CheckCircle size={16} /> Approve
            </button>
            <button 
              className="moderation-btn reject"
              onClick={() => handleReject(post)}
            >
              <XCircle size={16} /> Reject
            </button>
          </>
        )}
        {post.isApproved && (
          <button 
            className="moderation-btn reject"
            onClick={() => handleReject(post)}
          >
            <XCircle size={16} /> Unapprove
          </button>
        )}
        <button 
          className="moderation-btn delete"
          onClick={() => handleDelete(post.id, 'posts')}
        >
          <Trash size={16} /> Delete
        </button>
      </div>
    </div>
  );

  const renderJobCard = (job: Job) => (
    <div key={job.id} className="moderation-card">
      <div className="moderation-card-header">
        <div className="moderation-job-info">
          {job.companyLogo && (
            <img src={job.companyLogo} alt={job.company} className="moderation-company-logo" />
          )}
          <div>
            <h4>{job.title}</h4>
            <p className="moderation-company">{job.company}</p>
            <p className="moderation-location">{job.location}</p>
          </div>
        </div>
        <div className={`moderation-status ${job.isApproved ? 'approved' : job.moderationStatus === 'rejected' ? 'rejected' : 'pending'}`}>
          {job.isApproved ? (
            <><CheckCircle size={16} /> Approved</>
          ) : job.moderationStatus === 'rejected' ? (
            <><XCircle size={16} /> Rejected</>
          ) : (
            <><Clock size={16} /> Pending</>
          )}
        </div>
      </div>

      <div className="moderation-content">
        <p>{job.description.substring(0, 200)}...</p>
      </div>

      {job.moderationStatus === 'rejected' && job.rejectionReason && (
        <div className="moderation-rejection-reason">
          <AlertCircle size={16} />
          <span>Rejection reason: {job.rejectionReason}</span>
        </div>
      )}

      <div className="moderation-actions">
        {!job.isApproved && job.moderationStatus !== 'rejected' && (
          <>
            <button 
              className="moderation-btn approve"
              onClick={() => handleApprove(job.id, 'jobs')}
            >
              <CheckCircle size={16} /> Approve
            </button>
            <button 
              className="moderation-btn reject"
              onClick={() => handleReject(job)}
            >
              <XCircle size={16} /> Reject
            </button>
          </>
        )}
        {job.isApproved && (
          <button 
            className="moderation-btn reject"
            onClick={() => handleReject(job)}
          >
            <XCircle size={16} /> Unapprove
          </button>
        )}
        <button 
          className="moderation-btn delete"
          onClick={() => handleDelete(job.id, 'jobs')}
        >
          <Trash size={16} /> Delete
        </button>
      </div>
    </div>
  );

  return (
    <AdminLayout title="Content Moderation">
      <div className="moderation-container">
        <div className="moderation-tabs">
          <button
            className={`moderation-tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <MessageSquare size={20} />
            Posts
            {filter === 'pending' && posts.filter(p => !p.isApproved && p.moderationStatus !== 'rejected').length > 0 && (
              <span className="moderation-badge">{posts.filter(p => !p.isApproved && p.moderationStatus !== 'rejected').length}</span>
            )}
          </button>
          <button
            className={`moderation-tab ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            <Briefcase size={20} />
            Jobs
            {filter === 'pending' && jobs.filter(j => !j.isApproved && j.moderationStatus !== 'rejected').length > 0 && (
              <span className="moderation-badge">{jobs.filter(j => !j.isApproved && j.moderationStatus !== 'rejected').length}</span>
            )}
          </button>
        </div>

        <div className="moderation-toolbar">
          <div className="moderation-search">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="moderation-filters">
            <Filter size={20} />
            <select value={filter} onChange={(e) => setFilter(e.target.value as ModerationFilter)}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="moderation-content-area">
          {loading ? (
            <div className="moderation-loading">
              <div className="spinner"></div>
              <p>Loading content...</p>
            </div>
          ) : (
            <>
              {activeTab === 'posts' && (
                <div className="moderation-grid">
                  {posts.length > 0 ? (
                    posts.map(post => renderPostCard(post))
                  ) : (
                    <div className="moderation-empty">
                      <MessageSquare size={48} />
                      <h3>No posts found</h3>
                      <p>There are no posts matching your filter criteria.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'jobs' && (
                <div className="moderation-grid">
                  {jobs.length > 0 ? (
                    jobs.map(job => renderJobCard(job))
                  ) : (
                    <div className="moderation-empty">
                      <Briefcase size={48} />
                      <h3>No jobs found</h3>
                      <p>There are no jobs matching your filter criteria.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="moderation-modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="moderation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="moderation-modal-header">
              <h3>Reject Content</h3>
              <button onClick={() => setShowRejectModal(false)}>×</button>
            </div>
            <div className="moderation-modal-body">
              <p>Please provide a reason for rejecting this content:</p>
              <textarea
                placeholder="Enter rejection reason (optional)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="moderation-modal-actions">
              <button className="moderation-btn-cancel" onClick={() => setShowRejectModal(false)}>
                Cancel
              </button>
              <button className="moderation-btn-confirm" onClick={confirmReject}>
                Reject Content
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ContentModeration;


