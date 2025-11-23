import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { createJobNotification, deleteNotificationsBySourceId } from './notificationService';

// Define the Job interface
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
  companyLogo?: string; // Base64 encoded image or URL
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  moderatedBy?: string;
  moderatedAt?: string;
}

const COLLECTION_NAME = 'jobs';

// Get all jobs
export const getAllJobs = async (): Promise<Job[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Job));
  } catch (error) {
    console.error('Error getting jobs:', error);
    return [];
  }
};

// Get job by ID
export const getJobById = async (id: string): Promise<Job | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Job;
    }
    return null;
  } catch (error) {
    console.error('Error getting job by ID:', error);
    return null;
  }
};

// Add new job
export const addJob = async (job: Omit<Job, 'id' | 'postedDate'>): Promise<Job> => {
  try {
    const newJob = {
      ...job,
      postedDate: new Date().toISOString()
    };
    
    // Remove undefined fields to prevent Firebase errors
    const cleanedJob = Object.fromEntries(
      Object.entries(newJob).filter(([_, value]) => value !== undefined)
    );
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanedJob);
    
    const createdJob = {
      id: docRef.id,
      ...newJob
    };
    
    // If job is created as approved, create notification
    if (createdJob.isApproved) {
      createJobNotification(createdJob.title, createdJob.company, createdJob.id).catch((error) => {
        console.error('Failed to create job notification:', error);
      });
    }
    
    return createdJob;
  } catch (error) {
    console.error('Error adding job:', error);
    throw error;
  }
};

// Update job
export const updateJob = async (id: string, updatedData: Partial<Job>): Promise<Job | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    
    // Remove undefined fields to prevent Firebase errors
    const cleanedData = Object.fromEntries(
      Object.entries(updatedData).filter(([_, value]) => value !== undefined)
    );
    
    await updateDoc(docRef, cleanedData);
    
    // Get the updated document
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as Job;
    }
    return null;
  } catch (error) {
    console.error('Error updating job:', error);
    return null;
  }
};

// Delete job
export const deleteJob = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    
    // Delete associated notifications
    try {
      await deleteNotificationsBySourceId(id);
    } catch (notificationError) {
      console.error('Failed to delete job notifications:', notificationError);
      // Don't throw - job was deleted successfully
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting job:', error);
    return false;
  }
};

// Search jobs
export const searchJobs = async (query: string): Promise<Job[]> => {
  try {
    // Firestore doesn't support direct text search like localStorage
    // We'll get all jobs and filter them client-side
    // In a production app, consider using a more scalable approach like Algolia
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const jobs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Job));
    
    const lowerCaseQuery = query.toLowerCase();
    return jobs.filter(job => 
      job.title.toLowerCase().includes(lowerCaseQuery) ||
      job.company.toLowerCase().includes(lowerCaseQuery) ||
      job.location.toLowerCase().includes(lowerCaseQuery) ||
      job.description.toLowerCase().includes(lowerCaseQuery)
    );
  } catch (error) {
    console.error('Error searching jobs:', error);
    return [];
  }
};

// Get active jobs (jobs that haven't passed their deadline)
export const getActiveJobs = async (): Promise<Job[]> => {
  try {
    const jobs = await getAllJobs();
    const now = new Date();
    
    return jobs.filter(job => {
      if (!job.deadline) return true; // No deadline means job is always active
      const deadlineDate = new Date(job.deadline);
      return deadlineDate >= now;
    }).sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
  } catch (error) {
    console.error('Error getting active jobs:', error);
    return [];
  }
};

// Get jobs by type
export const getJobsByType = async (jobType: Job['jobType']): Promise<Job[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("jobType", "==", jobType));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Job));
  } catch (error) {
    console.error('Error getting jobs by type:', error);
    return [];
  }
};

// Approve or reject a job
export const approveJob = async (id: string, approve: boolean, moderatorName?: string, rejectionReason?: string): Promise<Job | null> => {
  // Get current job state before updating
  const currentJob = await getJobById(id);
  const wasApproved = currentJob?.isApproved || false;
  
  // Prepare update data based on approval status
  const updateData: Partial<Job> = {
    isApproved: approve,
    moderationStatus: approve ? 'approved' : 'rejected',
    moderatedAt: new Date().toISOString()
  };
  
  // Add moderator name if provided
  if (moderatorName) {
    updateData.moderatedBy = moderatorName;
  }
  
  // Add rejection reason if rejecting
  if (!approve && rejectionReason) {
    updateData.rejectionReason = rejectionReason;
  }
  
  // Clear rejection reason if approving
  if (approve) {
    updateData.rejectionReason = undefined;
  }
  
  const updatedJob = await updateJob(id, updateData);
  
  // Only create notification if job is being approved for the FIRST time
  // (transitioning from unapproved to approved)
  if (approve && updatedJob && !wasApproved) {
    // Fire and forget - don't wait for notification creation (including for test items)
    createJobNotification(updatedJob.title, updatedJob.company, updatedJob.id).catch((error) => {
      console.error('Failed to create job notification:', error);
    });
  }
  
  return updatedJob;
};

// Get job statistics
export const getJobStatistics = async () => {
  try {
    const jobs = await getAllJobs();
    
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
  } catch (error) {
    console.error('Error getting job statistics:', error);
    return {
      totalJobs: 0,
      fullTimeJobs: 0,
      partTimeJobs: 0,
      contractJobs: 0,
      internshipJobs: 0,
      approvedJobs: 0,
      pendingJobs: 0,
      activeJobs: 0,
      expiredJobs: 0
    };
  }
};

// Initialize with empty array if no data exists
export const initializeJobData = async () => {
  // No need to initialize in Firestore as collections are created automatically
  // This function is kept for API compatibility
};
