import { useState, useEffect, useRef } from 'react';
import { Search, Briefcase, MapPin, Calendar, Clock, Mail, Link, Plus, Upload } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { resizeImage, validateImageFile } from '../../services/firebase/storageService';
import FeaturedCarousel from '../../components/FeaturedCarousel';
import './Jobs.css';
import { 
  addJob,
  Job
} from '../../services/firebase/jobService';
import { getCurrentUser } from '../../services/firebase/userService';

const JobsPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
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
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      alert('You must be logged in to post a job.');
      return;
    }
    setShowCreateJobModal(true);
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
    
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      alert('You must be logged in to post a job');
      return;
    }
    
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
      
      // Create the job object
      const newJob = {
        ...jobFormData,
        deadline: deadlineDate,
        isApproved: false, // Jobs require admin approval
        postedBy: currentUser.id,
        companyLogo: logoData
      };
      
      // Add the job
      await addJob(newJob);
      
      // Close the modal and reset form
      setShowCreateJobModal(false);
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
      
      // Show confirmation
      alert('Your job posting has been submitted and is pending approval.');
    } catch (error) {
      console.error('Error submitting job:', error);
      alert('There was an error submitting your job posting. Please try again.');
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

            <div className="jobs-tabs">
              <button 
                className={`jobs-tab ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                <Briefcase size={16} />
                All Jobs
              </button>
              <button 
                className={`jobs-tab ${activeFilter === 'recent' ? 'active' : ''}`}
                onClick={() => setActiveFilter('recent')}
              >
                <Clock size={16} />
                Recent
              </button>
              <button 
                className={`jobs-tab ${activeFilter === 'fullTime' ? 'active' : ''}`}
                onClick={() => setActiveFilter('fullTime')}
              >
                <Calendar size={16} />
                Full-time
              </button>
              <button 
                className={`jobs-tab ${activeFilter === 'partTime' ? 'active' : ''}`}
                onClick={() => setActiveFilter('partTime')}
              >
                <Clock size={16} />
                Part-time
              </button>
              <button 
                className={`jobs-tab ${activeFilter === 'contract' ? 'active' : ''}`}
                onClick={() => setActiveFilter('contract')}
              >
                <Briefcase size={16} />
                Contract
              </button>
              <button 
                className={`jobs-tab ${activeFilter === 'internship' ? 'active' : ''}`}
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
                    </div>
                    
                    {job.description && (
                      <div className="job-featured-description-section">
                        <p className="job-featured-description">{job.description}</p>
                      </div>
                    )}
                    
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
              <h2>Create Job Opportunity</h2>
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
                  type="text" 
                  id="salary"
                  name="salary"
                  placeholder="e.g., $60,000 - $80,000" 
                  value={jobFormData.salary}
                  onChange={handleJobFormChange}
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
              
              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={() => setShowCreateJobModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  Submit Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsPage;
