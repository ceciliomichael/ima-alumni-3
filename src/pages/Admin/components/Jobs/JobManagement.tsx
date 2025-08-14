import { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit, Trash, CheckCircle, XCircle,
  Briefcase, MapPin, Calendar, DollarSign, Mail, Link, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  getAllJobs, 
  searchJobs, 
  deleteJob, 
  approveJob,
  getJobsByType,
  Job
} from '../../../../services/firebase/jobService';
import AdminLayout from '../../layout/AdminLayout';
import './Jobs.css';

const JobManagement = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | Job['jobType']>('all');
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load jobs data
    loadJobsData();
  }, []);

  const loadJobsData = async () => {
    setLoading(true);
    try {
      let filteredJobs: Job[] = [];
      
      // Apply job type filter
      if (typeFilter === 'all') {
        filteredJobs = await getAllJobs();
      } else {
        filteredJobs = await getJobsByType(typeFilter);
      }
      
      // Apply approval filter
      if (approvalFilter !== 'all') {
        const isApproved = approvalFilter === 'approved';
        filteredJobs = filteredJobs.filter(job => job.isApproved === isApproved);
      }
      
      // Apply status filter (active/expired)
      if (statusFilter !== 'all') {
        const now = new Date();
        if (statusFilter === 'active') {
          filteredJobs = filteredJobs.filter(job => {
            if (!job.deadline) return true; // No deadline means job is always active
            const deadlineDate = new Date(job.deadline);
            return deadlineDate >= now;
          });
        } else {
          filteredJobs = filteredJobs.filter(job => {
            if (!job.deadline) return false; // No deadline means job is never expired
            const deadlineDate = new Date(job.deadline);
            return deadlineDate < now;
          });
        }
      }
      
      // Sort by posted date (newest first)
      filteredJobs.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
      
      setJobs(filteredJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      loadJobsData();
    }
  }, [typeFilter, approvalFilter, statusFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    // Loading is handled by the useEffect with searchQuery dependency
  };

  useEffect(() => {
    // Apply search filter
    if (searchQuery.trim()) {
      const fetchSearchResults = async () => {
        try {
          setLoading(true);
          const results = await searchJobs(searchQuery);
          setJobs(results);
        } catch (error) {
          console.error('Error searching jobs:', error);
          setJobs([]);
        } finally {
          setLoading(false);
        }
      };
      
      fetchSearchResults();
    } else if (!loading) {
      loadJobsData();
    }
  }, [searchQuery]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      try {
        setLoading(true);
        await deleteJob(id);
        await loadJobsData();
      } catch (error) {
        console.error('Error deleting job:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleApprove = async (id: string, approve: boolean) => {
    try {
      setLoading(true);
      await approveJob(id, approve);
      await loadJobsData();
    } catch (error) {
      console.error('Error updating job approval status:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isJobActive = (job: Job) => {
    if (!job.deadline) return true;
    const deadlineDate = new Date(job.deadline);
    return deadlineDate >= new Date();
  };

  const getJobTypeBadgeClass = (jobType: Job['jobType']) => {
    switch (jobType) {
      case 'fullTime': return 'admin-job-badge-fullTime';
      case 'partTime': return 'admin-job-badge-partTime';
      case 'contract': return 'admin-job-badge-contract';
      case 'internship': return 'admin-job-badge-internship';
      default: return '';
    }
  };

  const getJobTypeLabel = (jobType: Job['jobType']) => {
    switch (jobType) {
      case 'fullTime': return 'Full-time';
      case 'partTime': return 'Part-time';
      case 'contract': return 'Contract';
      case 'internship': return 'Internship';
      default: return jobType;
    }
  };

  const getApplicationTypeLabel = (type?: Job['applicationType']) => {
    switch (type) {
      case 'email': return 'Email';
      case 'website': return 'Website';
      case 'inPerson': return 'In Person';
      default: return 'Not specified';
    }
  };

  return (
    <AdminLayout title="Job Management">
      <div className="admin-toolbar">
        <div className="admin-search">
          <Search className="admin-search-icon" size={20} />
          <input
            type="text"
            placeholder="Search jobs..."
            className="admin-search-input"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        
        <div className="admin-filters">
          <select 
            className="admin-filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | Job['jobType'])}
          >
            <option value="all">All Types</option>
            <option value="fullTime">Full-time</option>
            <option value="partTime">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
          
          <select 
            className="admin-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'expired')}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
          
          <select 
            className="admin-filter-select"
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value as 'all' | 'approved' | 'pending')}
          >
            <option value="all">All Approval</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        
        <button 
          className="admin-add-btn"
          onClick={() => navigate('/admin/jobs/add')}
        >
          <Plus size={20} />
          Add Job
        </button>
      </div>
      
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Jobs List</h2>
          <div>{jobs.length} Jobs Found</div>
        </div>
        
        {loading ? (
          <div className="admin-loading">Loading jobs...</div>
        ) : (
        <div className="admin-jobs-grid">
          {jobs.length > 0 ? (
            jobs.map(job => (
              <div key={job.id} className="admin-job-card">
                <div className="admin-job-header">
                  <h3 className="admin-job-title">{job.title}</h3>
                  <div className="admin-job-badges">
                    <span className={`admin-job-badge ${getJobTypeBadgeClass(job.jobType)}`}>
                      {getJobTypeLabel(job.jobType)}
                    </span>
                    <span className={`admin-job-badge ${isJobActive(job) ? 'admin-job-badge-active' : 'admin-job-badge-expired'}`}>
                      {isJobActive(job) ? 'Active' : 'Expired'}
                    </span>
                  </div>
                  <div className="admin-job-company">{job.company}</div>
                  <div className="admin-job-location">
                    <MapPin size={14} />
                    {job.location}
                  </div>
                </div>
                
                <div className="admin-job-content">
                  <p className="admin-job-description">{job.description}</p>
                  
                  <div className="admin-job-meta">
                    {job.salary && (
                      <div className="admin-job-meta-item">
                        <DollarSign size={14} />
                        {job.salary}
                      </div>
                    )}
                    
                    <div className="admin-job-meta-item">
                      <Mail size={14} />
                      {getApplicationTypeLabel(job.applicationType)}
                    </div>
                    
                    {job.deadline && (
                      <div className="admin-job-meta-item">
                        <Calendar size={14} />
                        {formatDate(job.deadline)}
                      </div>
                    )}
                    
                    <div className="admin-job-meta-item">
                      <Clock size={14} />
                      Posted: {formatDate(job.postedDate)}
                    </div>
                  </div>
                  
                  <div className="admin-job-actions">
                    <div className={`admin-job-status ${job.isApproved ? 'admin-job-status-approved' : 'admin-job-status-pending'}`}>
                      {job.isApproved ? (
                        <>
                          <CheckCircle size={14} />
                          Approved
                        </>
                      ) : (
                        <>
                          <Clock size={14} />
                          Pending Approval
                        </>
                      )}
                    </div>
                  
                    {!job.isApproved && (
                      <button 
                        className="admin-action-btn admin-action-approve"
                        onClick={() => handleApprove(job.id, true)}
                        title="Approve"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    {job.isApproved && (
                      <button 
                        className="admin-action-btn admin-action-reject"
                        onClick={() => handleApprove(job.id, false)}
                        title="Unapprove"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                    <button 
                      className="admin-action-btn admin-action-edit"
                      onClick={() => navigate(`/admin/jobs/edit/${job.id}`)}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="admin-action-btn admin-action-delete"
                      onClick={() => handleDelete(job.id)}
                      title="Delete"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="admin-empty-state">
              <Briefcase size={48} />
              <h3>No jobs found</h3>
              <p>There are no jobs matching your search criteria.</p>
              <button 
                className="admin-btn-primary"
                onClick={() => navigate('/admin/jobs/add')}
              >
                Add New Job
              </button>
            </div>
          )}
        </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default JobManagement;
