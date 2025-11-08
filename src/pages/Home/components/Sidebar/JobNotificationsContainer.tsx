import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import JobNotification from './JobNotification';
import { Job } from '../../../../services/firebase/jobService';

interface JobNotificationData {
  id: string;
  title: string;
  company: string;
  timestamp: number;
}

const JobNotificationsContainer = () => {
  const [notifications, setNotifications] = useState<JobNotificationData[]>([]);
  const jobInitializedRef = useRef<boolean>(false);
  const previousJobsRef = useRef<Map<string, boolean>>(new Map());

  // Set up job notifications listener
  useEffect(() => {
    const jobsRef = collection(db, 'jobs');

    const unsubscribe = onSnapshot(jobsRef, (snapshot) => {
      // First snapshot is the current data; initialize previous state
      if (!jobInitializedRef.current) {
        snapshot.docs.forEach((doc) => {
          const job = doc.data() as Job;
          previousJobsRef.current.set(doc.id, job.isApproved || false);
        });
        jobInitializedRef.current = true;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const job = {
            id: change.doc.id,
            ...change.doc.data()
          } as Job;

          // Check if job was just approved (transition from unapproved to approved)
          const wasApproved = previousJobsRef.current.get(job.id) || false;

          if (job.isApproved && !wasApproved && !job.isTest) {
            const notification: JobNotificationData = {
              id: `job-${job.id}-${Date.now()}`,
              title: job.title,
              company: job.company,
              timestamp: Date.now()
            };

            setNotifications(prev => [notification, ...prev].slice(0, 10));
          }
          
          // Update previous state
          previousJobsRef.current.set(job.id, job.isApproved || false);
        }
      });
    }, (error) => {
      console.error('Realtime job notifications error:', error);
    });

    return () => unsubscribe();
  }, []);

  const handleCloseNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="job-notifications-container">
      {notifications.map((notification) => (
        <JobNotification
          key={notification.id}
          notification={notification}
          onClose={handleCloseNotification}
        />
      ))}
    </div>
  );
};

export default JobNotificationsContainer;

