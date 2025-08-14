import { v4 as uuidv4 } from 'uuid';

// Define the Job interface (consider moving this to types/index.ts later)
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string;
  contactEmail: string;
  postedDate: string;
  isApproved: boolean;
  postedBy: string;
  salary?: string;
  applicationType?: 'email' | 'website' | 'inPerson';
  applicationUrl?: string;
  deadline?: string;
  jobType: 'fullTime' | 'partTime' | 'contract' | 'internship';
}

const STORAGE_KEY = 'jobs';

// Get all jobs
export const getAllJobs = (): Job[] => {
  const jobs = localStorage.getItem(STORAGE_KEY);
  return jobs ? JSON.parse(jobs) : [];
};

// Get job by ID
export const getJobById = (id: string): Job | null => {
  const jobs = getAllJobs();
  return jobs.find(job => job.id === id) || null;
};

// Add new job
export const addJob = (job: Omit<Job, 'id' | 'postedDate'>): Job => {
  const jobs = getAllJobs();
  const newJob: Job = {
    ...job,
    id: uuidv4(),
    postedDate: new Date().toISOString()
  };
  
  jobs.push(newJob);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  
  return newJob;
};

// Update job
export const updateJob = (id: string, updatedData: Partial<Job>): Job | null => {
  const jobs = getAllJobs();
  const index = jobs.findIndex(job => job.id === id);
  
  if (index === -1) return null;
  
  const updatedJob = {
    ...jobs[index],
    ...updatedData
  };
  
  jobs[index] = updatedJob;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  
  return updatedJob;
};

// Delete job
export const deleteJob = (id: string): boolean => {
  const jobs = getAllJobs();
  const filteredJobs = jobs.filter(job => job.id !== id);
  
  if (filteredJobs.length === jobs.length) {
    return false; // No job was deleted
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredJobs));
  return true; // Job was deleted
};

// Search jobs
export const searchJobs = (query: string): Job[] => {
  const jobs = getAllJobs();
  const lowerCaseQuery = query.toLowerCase();
  
  return jobs.filter(job => 
    job.title.toLowerCase().includes(lowerCaseQuery) ||
    job.company.toLowerCase().includes(lowerCaseQuery) ||
    job.location.toLowerCase().includes(lowerCaseQuery) ||
    job.description.toLowerCase().includes(lowerCaseQuery)
  );
};

// Get active jobs (jobs that haven't passed their deadline)
export const getActiveJobs = (): Job[] => {
  const jobs = getAllJobs();
  const now = new Date();
  
  return jobs.filter(job => {
    if (!job.deadline) return true; // No deadline means job is always active
    const deadlineDate = new Date(job.deadline);
    return deadlineDate >= now;
  }).sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
};

// Get jobs by type
export const getJobsByType = (jobType: Job['jobType']): Job[] => {
  const jobs = getAllJobs();
  return jobs.filter(job => job.jobType === jobType);
};

// Approve or reject a job
export const approveJob = (id: string, approve: boolean): Job | null => {
  return updateJob(id, { isApproved: approve });
};

// Get job statistics
export const getJobStatistics = () => {
  const jobs = getAllJobs();
  
  // Get total count
  const totalJobs = jobs.length;
  
  // Get count by type
  const fullTimeJobs = jobs.filter(job => job.jobType === 'fullTime').length;
  const partTimeJobs = jobs.filter(job => job.jobType === 'partTime').length;
  const contractJobs = jobs.filter(job => job.jobType === 'contract').length;
  const internshipJobs = jobs.filter(job => job.jobType === 'internship').length;
  
  // Get approved vs pending
  const approvedJobs = jobs.filter(job => job.isApproved).length;
  const pendingJobs = totalJobs - approvedJobs;
  
  // Get active vs expired jobs
  const now = new Date();
  const activeJobs = jobs.filter(job => {
    if (!job.deadline) return true;
    const deadlineDate = new Date(job.deadline);
    return deadlineDate >= now;
  }).length;
  const expiredJobs = totalJobs - activeJobs;
  
  return {
    totalJobs,
    fullTimeJobs,
    partTimeJobs,
    contractJobs,
    internshipJobs,
    approvedJobs,
    pendingJobs,
    activeJobs,
    expiredJobs
  };
};

// Initialize with empty array if no data exists
export const initializeJobData = () => {
  const existingData = localStorage.getItem(STORAGE_KEY);
  
  if (!existingData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
}; 