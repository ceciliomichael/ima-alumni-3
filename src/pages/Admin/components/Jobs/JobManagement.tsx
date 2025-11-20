import { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit, Trash,
  Briefcase, MapPin, Calendar, DollarSign, Mail, Clock, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  getAllJobs, 
  searchJobs, 
  deleteJob,
  getJobsByType,
  addJob,
  Job
} from '../../../../services/firebase/jobService';
import AdminLayout from '../../layout/AdminLayout';
import './Jobs.css';

const JobManagement = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | Job['jobType']>('all');
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
      
      // Only show approved jobs (approval happens in Content Moderation)
      filteredJobs = filteredJobs.filter(job => job.isApproved === true);
      
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
  }, [typeFilter, statusFilter]);

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

  // Test job function
  const handleTestJob = async () => {
    try {
      setLoading(true);
      
      // Generate random test data
      const testTitles = [
        'Software Engineer', 'Marketing Manager', 'Data Analyst', 
        'Sales Representative', 'Graphic Designer', 'Project Manager',
        'Customer Service Specialist', 'Content Writer', 'Business Analyst', 'HR Coordinator'
      ];
      const testCompanies = [
        'TechCorp Inc.', 'Global Solutions Ltd.', 'Innovation Labs', 
        'Digital Dynamics', 'Future Systems', 'Creative Studio Co.',
        'Business Partners LLC', 'Smart Solutions Inc.', 'NextGen Corp', 'Premier Services'
      ];
      const testLocations = [
        'Manila, Philippines', 'Quezon City, Philippines', 'Makati, Philippines', 
        'Cebu City, Philippines', 'Davao City, Philippines', 'Remote',
        'Taguig, Philippines', 'Pasig, Philippines', 'Iloilo City, Philippines', 'Baguio, Philippines'
      ];
      const testDescriptions = [
        'We are looking for a talented professional to join our dynamic team.',
        'Exciting opportunity for career growth in a fast-paced environment.',
        'Join our innovative company and make a real impact in the industry.',
        'Great benefits and competitive salary package available.',
        'Work with cutting-edge technology and experienced professionals.',
        'Opportunity to lead projects and develop your leadership skills.',
        'Collaborative work environment with flexible schedule options.',
        'Join a growing company with excellent career advancement opportunities.',
        'Work on exciting projects with a talented and diverse team.',
        'Make a difference while building your career with us.'
      ];
      const jobTypes: Job['jobType'][] = ['fullTime', 'partTime', 'contract', 'internship'];
      const salaries = ['₱30,000 - ₱50,000', '₱50,000 - ₱80,000', '₱25,000 - ₱40,000', '₱80,000 - ₱120,000', 'Negotiable'];

      const randomTitle = testTitles[Math.floor(Math.random() * testTitles.length)];
      const randomCompany = testCompanies[Math.floor(Math.random() * testCompanies.length)];
      const randomLocation = testLocations[Math.floor(Math.random() * testLocations.length)];
      const randomDescription = testDescriptions[Math.floor(Math.random() * testDescriptions.length)];
      const randomJobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];
      const randomSalary = salaries[Math.floor(Math.random() * salaries.length)];
      
      // Generate a random deadline (7-30 days from now)
      const randomDays = Math.floor(Math.random() * 24) + 7;
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + randomDays);

      const testJob = {
        title: randomTitle,
        company: randomCompany,
        location: randomLocation,
        description: randomDescription,
        requirements: 'Bachelor\'s degree required. Experience in relevant field preferred. Strong communication skills essential.',
        contactEmail: `hr@${randomCompany.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        isApproved: true, // Automatically approve test jobs
        postedBy: 'admin-test',
        jobType: randomJobType,
        salary: randomSalary,
        deadline: deadlineDate.toISOString(),
        isTest: true, // Mark as test item to skip notifications
        applicationType: 'email' as Job['applicationType']
      };

      await addJob(testJob);
      await loadJobsData();
      
      alert(`Test job created successfully!\nTitle: ${testJob.title}\nCompany: ${testJob.company}\nType: ${getJobTypeLabel(testJob.jobType)}\nLocation: ${testJob.location}`);
    } catch (error) {
      console.error('Error adding test job:', error);
      alert('Failed to add test job. Please try again.');
    } finally {
      setLoading(false);
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
          
        </div>
        
        <button 
          className="admin-add-btn admin-test-btn"
          onClick={handleTestJob}
          title="Add a random test job for testing real-time updates"
        >
          <Zap size={20} />
          Test Job
        </button>
        
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
