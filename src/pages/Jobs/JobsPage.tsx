import { useState, useEffect, useRef } from 'react';
import { Search, Briefcase, MapPin, Calendar, Clock, Mail, Link, Plus, Upload, Edit, Trash2 } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { resizeImage, validateImageFile } from '../../services/firebase/storageService';
import FeaturedCarousel from '../../components/FeaturedCarousel';
import './Jobs.css';
import { 
  addJob,
  updateJob,
  deleteJob,
  Job
} from '../../services/firebase/jobService';
import { User } from '../../types';
import { getCurrentUser } from '../../services/firebase/userService';

const JobsPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobFormData, setJobFormData] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    requirements: '',
    contactEmail: '',
    jobType: 'fullTime' as Job['jobType'],
    salary: '',
    applicationType: 'email' as 'email' | 'website' | 'inPerson',
    applicationUrl: '',
    deadline: '',
    companyLogo: ''
  });
  
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Fetch current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    setLoading(true);
    
    // Set up real-time listener for approved jobs
    const jobsRef = collection(db, 'jobs');
    const q = query(
      jobsRef,
      where('isApproved', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const approvedJobs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Job[];
        
        // Sort by posted date (newest first)
        approvedJobs.sort((a: Job, b: Job) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
        
        setJobs(approvedJobs);
      } catch (error) {
        console.error('Error processing jobs:', error);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Realtime jobs listener error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Format date helper
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Filter jobs based on search term and active filter
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    switch(activeFilter) {
      case 'recent':
        // Return only jobs posted in the last 7 days
        return matchesSearch && (new Date().getTime() - new Date(job.postedDate).getTime() < 7 * 24 * 60 * 60 * 1000);
      case 'fullTime':
        return matchesSearch && job.jobType === 'fullTime';
      case 'partTime':
        return matchesSearch && job.jobType === 'partTime';
      case 'contract':
        return matchesSearch && job.jobType === 'contract';
      case 'internship':
        return matchesSearch && job.jobType === 'internship';
      default:
        return matchesSearch;
    }
  });

  const handleCreateJob = async () => {
    const user = await getCurrentUser();
    if (!user) {
      alert('You must be logged in to post a job.');
      return;
    }
    // Reset form for new job
    setEditingJobId(null);
    setJobFormData({
      title: '',
      company: '',
      location: '',
      description: '',
      requirements: '',
      contactEmail: '',
      jobType: 'fullTime',
      salary: '',
      applicationType: 'email',
      applicationUrl: '',
      deadline: '',
      companyLogo: ''
    });
    setUploadFile(null);
    setPreviewUrl('');
    setShowCreateJobModal(true);
  };

  // Handle editing a job (alumni can edit their own jobs)
  const handleEditJob = (job: Job) => {
    setEditingJobId(job.id);
    setJobFormData({
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      requirements: job.requirements,
      contactEmail: job.contactEmail,
      jobType: job.jobType,
      salary: job.salary || '',
      applicationType: job.applicationType || 'email',
      applicationUrl: job.applicationUrl || '',
      deadline: job.deadline ? job.deadline.split('T')[0] : '',
      companyLogo: job.companyLogo || ''
    });
    setPreviewUrl(job.companyLogo || '');
    setUploadFile(null);
    setShowCreateJobModal(true);
  };

  // Handle deleting a job (alumni can delete their own jobs - no approval needed)
  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteJob(jobId);
      alert('Job posting has been deleted successfully.');
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job posting. Please try again.');
    }
  };

  const handleJobFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setJobFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate file
      const validation = validateImageFile(file, 2); // 2MB max for logos
      if (!validation.valid) {
        alert(validation.message);
        return;
      }
      
      setUploadFile(file);
      
      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = await getCurrentUser();
    if (!user) {
      alert('You must be logged in to post a job');
      return;
    }
    
    setIsSubmitting(true);
    
    // Create a deadline Date object if one was provided
    let deadlineDate = undefined;
    if (jobFormData.deadline) {
      deadlineDate = new Date(jobFormData.deadline).toISOString();
    }
    
    try {
      // Process the uploaded logo if any
      let logoData = jobFormData.companyLogo;
      if (uploadFile) {
        // Resize and convert to base64 with more aggressive compression
        logoData = await resizeImage(uploadFile, 400, 400, 0.6, true);
      }
      
      if (editingJobId) {
        // Update existing job - requires re-approval
        const updatedJob = {
          ...jobFormData,
          deadline: deadlineDate,
          isApproved: false, // Edits require admin re-approval
          moderationStatus: 'pending' as const,
          rejectionReason: undefined,
          companyLogo: logoData
        };
        
        await updateJob(editingJobId, updatedJob);
        alert('Your job posting has been updated and is pending admin approval.');
      } else {
        // Create new job
        const newJob = {
          ...jobFormData,
          deadline: deadlineDate,
          isApproved: false, // Jobs require admin approval
          postedBy: user.id,
          companyLogo: logoData
        };
        
        await addJob(newJob);
        alert('Your job posting has been submitted and is pending approval.');
      }
      
      // Close the modal and reset form
      setShowCreateJobModal(false);
      setEditingJobId(null);
      setJobFormData({
        title: '',
        company: '',
        location: '',
        description: '',
        requirements: '',
        contactEmail: '',
        jobType: 'fullTime',
        salary: '',
        applicationType: 'email',
        applicationUrl: '',
        deadline: '',
        companyLogo: ''
      });
      
      // Reset file upload state
      setUploadFile(null);
      setPreviewUrl('');
    } catch (error) {
      console.error('Error submitting job:', error);
      alert('There was an error submitting your job posting. Please try again.');
    } finally {
      setIsSubmitting(false);
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

  const isJobActive = (job: Job) => {
    if (!job.deadline) return true;
    const deadlineDate = new Date(job.deadline);
    return deadlineDate >= new Date();
  };

  return (
    <div className="jobs-page">
      <div className="jobs-layout">
        <div className="jobs-content">
          <div className="jobs-header">
            <div className="jobs-title-section">
              <div className="jobs-icon">
                <Briefcase size={24} />
              </div>
              <h1>Job Opportunities</h1>
            </div>
            <button className="create-job-button" onClick={handleCreateJob}>
              <Plus size={16} />
              <span>Post a Job</span>
            </button>
          </div>

          <div className="jobs-controls">
            <div className="jobs-search">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search for jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Swipeable filter tabs */}
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
              <button 
                className={`flex-shrink-0 snap-start flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                  ${activeFilter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                onClick={() => setActiveFilter('all')}
              >
                <Briefcase size={16} />
                All Jobs
              </button>
              <button 
                className={`flex-shrink-0 snap-start flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                  ${activeFilter === 'recent' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                onClick={() => setActiveFilter('recent')}
              >
                <Clock size={16} />
                Recent
              </button>
              <button 
                className={`flex-shrink-0 snap-start flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                  ${activeFilter === 'fullTime' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                onClick={() => setActiveFilter('fullTime')}
              >
                <Calendar size={16} />
                Full-time
              </button>
              <button 
                className={`flex-shrink-0 snap-start flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                  ${activeFilter === 'partTime' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                onClick={() => setActiveFilter('partTime')}
              >
                <Clock size={16} />
                Part-time
              </button>
              <button 
                className={`flex-shrink-0 snap-start flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                  ${activeFilter === 'contract' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                onClick={() => setActiveFilter('contract')}
              >
                <Briefcase size={16} />
                Contract
              </button>
              <button 
                className={`flex-shrink-0 snap-start flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                  ${activeFilter === 'internship' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                onClick={() => setActiveFilter('internship')}
              >
                <Clock size={16} />
                Internship
              </button>
            </div>
          </div>

          <div className="jobs-section">
            <h2>
              {activeFilter === 'recent' ? 'Recent Job Postings' : 
               activeFilter === 'fullTime' ? 'Full-time Opportunities' : 
               activeFilter === 'partTime' ? 'Part-time Opportunities' :
               activeFilter === 'contract' ? 'Contract Opportunities' :
               activeFilter === 'internship' ? 'Internship Opportunities' :
               'All Job Opportunities'}
            </h2>

            {loading ? (
              <div className="loading-jobs">
                <div className="jobs-skeleton-grid">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="job-skeleton-item"></div>
                  ))}
                </div>
              </div>
            ) : filteredJobs.length > 0 ? (
              <>
              {/* Mobile Job Cards - shown on mobile only */}
              <div className="mobile-job-cards">
                {filteredJobs.map((job) => (
                  <div 
                    key={job.id} 
                    className="mobile-job-card"
                    onClick={() => setSelectedJob(job)}
                  >
                    <div className="mobile-job-card-header">
                      {job.companyLogo ? (
                        <div className="mobile-job-logo">
                          <img src={job.companyLogo} alt={job.company} />
                        </div>
                      ) : (
                        <div className="mobile-job-logo mobile-job-logo-placeholder">
                          <Briefcase size={24} />
                        </div>
                      )}
                      <div className="mobile-job-info">
                        <h3 className="mobile-job-title">{job.title}</h3>
                        <p className="mobile-job-company">{job.company}</p>
                      </div>
                      <span className={`mobile-job-type ${job.jobType}`}>
                        {getJobTypeLabel(job.jobType)}
                      </span>
                    </div>
                    <div className="mobile-job-card-body">
                      <div className="mobile-job-details">
                        {job.location && (
                          <span className="mobile-job-detail">
                            <MapPin size={14} />
                            {job.location}
                          </span>
                        )}
                        {job.salary && (
                          <span className="mobile-job-detail">
                            <span className="peso-sign">₱</span>
                            {job.salary}
                          </span>
                        )}
                      </div>
                      {job.deadline && (
                        <div className="mobile-job-deadline">
                          <Calendar size={14} />
                          <span>Deadline: {formatDate(job.deadline)}</span>
                        </div>
                      )}
                    </div>
                    {!isJobActive(job) && (
                      <div className="mobile-job-expired-badge">Expired</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Carousel - hidden on mobile */}
              <div className="desktop-job-carousel">
              <FeaturedCarousel
                items={filteredJobs}
                getKey={(job) => job.id}
                renderFeatured={(job) => (
                  <div className="job-featured-card">
                    <div className="job-featured-header">
                      <div className="job-featured-title-area">
                        <h3 className="job-featured-title">{job.title}</h3>
                        <div className="job-featured-meta">
                          <span className="job-featured-type">{getJobTypeLabel(job.jobType)}</span>
                          {!isJobActive(job) && <span className="job-featured-expired">Expired</span>}
                        </div>
                      </div>
                      <div className="job-featured-company-section">
                        {job.companyLogo && (
                          <div className="job-featured-company-logo">
                            <img src={job.companyLogo} alt={`${job.company} logo`} />
                          </div>
                        )}
                        <div className="job-featured-company">{job.company}</div>
                      </div>
                    </div>
                    
                    <div className="job-featured-details">
                      {job.location && (
                        <div className="job-featured-detail">
                          <MapPin size={16} />
                          <span>{job.location}</span>
                        </div>
                      )}
                      {job.salary && (
                        <div className="job-featured-detail">
                          <span className="peso-sign">₱</span>
                          <span>{job.salary}</span>
                        </div>
                      )}
                      {job.deadline && (
                        <div className="job-featured-detail">
                          <Calendar size={16} />
                          <span>Deadline: {formatDate(job.deadline)}</span>
                        </div>
                      )}
                      {job.postedDate && (
                        <div className="job-featured-detail">
                          <Clock size={16} />
                          <span>Posted: {formatDate(job.postedDate)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="job-featured-content-grid">
                      <div className="job-featured-description-section">
                        <h4 className="job-section-title">Job Description</h4>
                        <p className="job-featured-description">{job.description || 'No description provided.'}</p>
                      </div>
                      <div className="job-featured-requirements-section">
                        <h4 className="job-section-title">Requirements</h4>
                        <ul className="job-requirements-list">
                          {job.requirements ? (
                            job.requirements.split('\n').filter(req => req.trim()).map((req, index) => (
                              <li key={index}>{req.trim()}</li>
                            ))
                          ) : (
                            <li>No requirements specified.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="job-featured-apply-info">
                      <strong>Apply:</strong>
                      {job.applicationType === 'email' && (
                        <span><Mail size={14} style={{ display: 'inline', marginLeft: '0.5rem' }} /> {job.contactEmail}</span>
                      )}
                      {job.applicationType === 'website' && (
                        <a href={job.applicationUrl} target="_blank" rel="noopener noreferrer" className="apply-link">
                          <Link size={14} /> Application Portal
                        </a>
                      )}
                      {job.applicationType === 'inPerson' && (
                        <span><MapPin size={14} style={{ display: 'inline', marginLeft: '0.5rem' }} /> In Person</span>
                      )}
                    </div>
                    
                    {/* Edit/Delete buttons for job owner */}
                    {currentUser && job.postedBy === currentUser.id && (
                      <div className="job-owner-actions">
                        <button 
                          className="job-action-btn edit-btn"
                          onClick={(e) => { e.stopPropagation(); handleEditJob(job); }}
                          title="Edit job posting"
                        >
                          <Edit size={14} />
                          <span>Edit</span>
                        </button>
                        <button 
                          className="job-action-btn delete-btn"
                          onClick={(e) => { e.stopPropagation(); handleDeleteJob(job.id); }}
                          title="Delete job posting"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
                renderThumb={(job) => (
                  <div className="job-thumb">
                    {job.companyLogo ? (
                      <div className="job-thumb-logo">
                        <img src={job.companyLogo} alt={job.company} />
                      </div>
                    ) : (
                      <div className="job-thumb-logo-placeholder">
                        <Briefcase size={24} />
                      </div>
                    )}
                    <div className="job-thumb-title">{job.title}</div>
                  </div>
                )}
                loop={true}
              />
              </div>
              </>
            ) : (
              <div className="empty-jobs">
                <div className="empty-state-icon">
                  <Briefcase size={64} strokeWidth={1} color="#64748b" />
                </div>
                <h3 className="empty-state-title">No jobs found</h3>
                <p className="empty-state-message">
                  {searchTerm ? 
                    "No approved jobs match your search criteria. Try a different search term." : 
                    activeFilter === 'recent' ? 
                      "There are no approved recent job postings at this time. Check back later!" :
                      activeFilter !== 'all' ?
                      `There are no approved ${activeFilter} opportunities to display.` :
                      "There are no approved job opportunities posted yet. Check back later for updates."
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Job Creation Modal */}
      {showCreateJobModal && (
        <div className="modal-overlay" onClick={() => setShowCreateJobModal(false)}>
          <div className="modal-content job-create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingJobId ? 'Edit Job Opportunity' : 'Create Job Opportunity'}</h2>
              <button 
                className="modal-close-btn" 
                onClick={() => setShowCreateJobModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <form className="job-form" onSubmit={handleJobSubmit}>
              <div className="form-group">
                <label htmlFor="jobTitle">Job Title</label>
                <input 
                  type="text" 
                  id="jobTitle"
                  name="title"
                  placeholder="e.g., Senior Developer" 
                  value={jobFormData.title}
                  onChange={handleJobFormChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="company">Company Name</label>
                <input 
                  type="text" 
                  id="company"
                  name="company"
                  placeholder="e.g., Tech Solutions Inc." 
                  value={jobFormData.company}
                  onChange={handleJobFormChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Company Logo (Optional)</label>
                <div className="upload-container">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <button 
                    type="button" 
                    className="upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={16} />
                    Select Logo
                  </button>
                  {uploadFile && (
                    <div className="selected-file">
                      <span>{uploadFile.name}</span>
                      <span className="file-size">({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  )}
                </div>
                {previewUrl && (
                  <div className="logo-preview">
                    <img src={previewUrl} alt="Company logo preview" />
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input 
                  type="text" 
                  id="location"
                  name="location"
                  placeholder="e.g., Remote, New York, NY" 
                  value={jobFormData.location}
                  onChange={handleJobFormChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="jobType">Job Type</label>
                <select 
                  id="jobType"
                  name="jobType"
                  className="form-select"
                  value={jobFormData.jobType}
                  onChange={handleJobFormChange}
                  required
                >
                  <option value="fullTime">Full-time</option>
                  <option value="partTime">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="salary">Salary (Optional)</label>
                <input 
                  type="number" 
                  id="salary"
                  name="salary"
                  placeholder="e.g., 60000" 
                  value={jobFormData.salary}
                  onChange={handleJobFormChange}
                  min="0"
                  step="1"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="deadline">Application Deadline (Optional)</label>
                <input 
                  type="date" 
                  id="deadline"
                  name="deadline"
                  value={jobFormData.deadline}
                  onChange={handleJobFormChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Job Description</label>
                <textarea 
                  id="description"
                  name="description"
                  placeholder="Describe the job role, responsibilities, etc."
                  value={jobFormData.description}
                  onChange={handleJobFormChange}
                  required
                ></textarea>
              </div>
              
              <div className="form-group">
                <label htmlFor="requirements">Requirements</label>
                <textarea 
                  id="requirements"
                  name="requirements"
                  placeholder="List qualifications, skills, experience needed"
                  value={jobFormData.requirements}
                  onChange={handleJobFormChange}
                  required
                ></textarea>
              </div>
              
              <div className="form-group">
                <label htmlFor="applicationType">Application Method</label>
                <select 
                  id="applicationType"
                  name="applicationType"
                  className="form-select"
                  value={jobFormData.applicationType}
                  onChange={handleJobFormChange}
                  required
                >
                  <option value="email">Email</option>
                  <option value="website">Website</option>
                  <option value="inPerson">In Person</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="contactEmail">Contact Email</label>
                <input 
                  type="email" 
                  id="contactEmail"
                  name="contactEmail"
                  placeholder="e.g., hiring@example.com" 
                  value={jobFormData.contactEmail}
                  onChange={handleJobFormChange}
                  required
                />
              </div>
              
              {jobFormData.applicationType === 'website' && (
                <div className="form-group">
                  <label htmlFor="applicationUrl">Application URL</label>
                  <input 
                    type="url" 
                    id="applicationUrl"
                    name="applicationUrl"
                    placeholder="e.g., https://company.com/apply" 
                    value={jobFormData.applicationUrl}
                    onChange={handleJobFormChange}
                    required={jobFormData.applicationType === 'website'}
                  />
                </div>
              )}
              
              <div className="flex flex-col-reverse sm:flex-row justify-center sm:justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  className="w-full sm:w-auto px-6 py-3 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                  onClick={() => setShowCreateJobModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : editingJobId ? 'Update Job' : 'Submit Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Job Detail Modal */}
      {selectedJob && (
        <div className="mobile-job-modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="mobile-job-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="mobile-job-modal-close"
              onClick={() => setSelectedJob(null)}
              aria-label="Close"
            >
              &times;
            </button>
            
            <div className="mobile-job-modal-header">
              {selectedJob.companyLogo ? (
                <div className="mobile-job-modal-logo">
                  <img src={selectedJob.companyLogo} alt={selectedJob.company} />
                </div>
              ) : (
                <div className="mobile-job-modal-logo mobile-job-logo-placeholder">
                  <Briefcase size={32} />
                </div>
              )}
              <div>
                <h2 className="mobile-job-modal-title">{selectedJob.title}</h2>
                <p className="mobile-job-modal-company">{selectedJob.company}</p>
              </div>
            </div>

            <div className="mobile-job-modal-badges">
              <span className={`mobile-job-type ${selectedJob.jobType}`}>
                {getJobTypeLabel(selectedJob.jobType)}
              </span>
              {!isJobActive(selectedJob) && (
                <span className="mobile-job-expired-tag">Expired</span>
              )}
            </div>

            <div className="mobile-job-modal-details">
              {selectedJob.location && (
                <div className="mobile-job-modal-detail">
                  <MapPin size={16} />
                  <span>{selectedJob.location}</span>
                </div>
              )}
              {selectedJob.salary && (
                <div className="mobile-job-modal-detail">
                  <span className="peso-sign">₱</span>
                  <span>{selectedJob.salary}</span>
                </div>
              )}
              {selectedJob.deadline && (
                <div className="mobile-job-modal-detail">
                  <Calendar size={16} />
                  <span>Deadline: {formatDate(selectedJob.deadline)}</span>
                </div>
              )}
              {selectedJob.postedDate && (
                <div className="mobile-job-modal-detail">
                  <Clock size={16} />
                  <span>Posted: {formatDate(selectedJob.postedDate)}</span>
                </div>
              )}
            </div>

            {selectedJob.description && (
              <div className="mobile-job-modal-section">
                <h3>Job Description</h3>
                <p>{selectedJob.description}</p>
              </div>
            )}

            {selectedJob.requirements && (
              <div className="mobile-job-modal-section">
                <h3>Requirements</h3>
                <ul>
                  {selectedJob.requirements.split('\n').filter(req => req.trim()).map((req, index) => (
                    <li key={index}>{req.trim()}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mobile-job-modal-apply">
              <strong>How to Apply:</strong>
              {selectedJob.applicationType === 'email' && (
                <a href={`mailto:${selectedJob.contactEmail}`} className="mobile-apply-link">
                  <Mail size={16} /> {selectedJob.contactEmail}
                </a>
              )}
              {selectedJob.applicationType === 'website' && (
                <a href={selectedJob.applicationUrl} target="_blank" rel="noopener noreferrer" className="mobile-apply-link">
                  <Link size={16} /> Visit Application Portal
                </a>
              )}
              {selectedJob.applicationType === 'inPerson' && (
                <span className="mobile-apply-text">
                  <MapPin size={16} /> Apply In Person
                </span>
              )}
            </div>

            {currentUser && selectedJob.postedBy === currentUser.id && (
              <div className="mobile-job-modal-actions">
                <button 
                  className="mobile-modal-btn edit"
                  onClick={() => { handleEditJob(selectedJob); setSelectedJob(null); }}
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button 
                  className="mobile-modal-btn delete"
                  onClick={() => { handleDeleteJob(selectedJob.id); setSelectedJob(null); }}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsPage;
