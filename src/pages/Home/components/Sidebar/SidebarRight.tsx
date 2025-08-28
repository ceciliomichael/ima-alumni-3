import { useState, useEffect } from 'react';
import { Calendar, Briefcase, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import ImagePlaceholder from '../../../../components/ImagePlaceholder/ImagePlaceholder';
import DonationProgressCard from './DonationProgressCard';
import './Sidebar.css';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  isApproved: boolean;
  createdBy: string;
  coverImage?: string;
  createdAt?: any;
}

interface Job {
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
  deadline?: string;
  jobType: 'fullTime' | 'partTime' | 'contract' | 'internship';
}

const SidebarRight = () => {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [jobOpportunities, setJobOpportunities] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);

  // Load events data with real-time Firebase listener
  useEffect(() => {
    setLoading(true);
    
    // Set up real-time listener for approved upcoming events
    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('isApproved', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const events = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Event[];
        
        // Filter for upcoming events and sort by date
        const now = new Date();
        const upcomingEvents = events
          .filter(event => new Date(event.date) >= now)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setUpcomingEvents(upcomingEvents);
        // Reset carousel index if needed
        if (upcomingEvents.length > 0 && currentEventIndex >= upcomingEvents.length) {
          setCurrentEventIndex(0);
        }
      } catch (error) {
        console.error('Error processing events:', error);
        setUpcomingEvents([]);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Realtime events listener error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load jobs data with real-time Firebase listener
  useEffect(() => {
    // Set up real-time listener for approved jobs
    const jobsRef = collection(db, 'jobs');
    const q = query(
      jobsRef,
      where('isApproved', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const jobs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Job[];
        
        // Filter for active jobs (no deadline or deadline in future) and sort by posted date
        const now = new Date();
        const activeJobs = jobs
          .filter(job => {
            if (!job.deadline) return true; // No deadline means job is always active
            const deadlineDate = new Date(job.deadline);
            return deadlineDate >= now;
          })
          .sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
        
        setJobOpportunities(activeJobs);
        // Reset carousel index if needed
        if (activeJobs.length > 0 && currentJobIndex >= activeJobs.length) {
          setCurrentJobIndex(0);
        }
      } catch (error) {
        console.error('Error processing jobs:', error);
        setJobOpportunities([]);
      }
    }, (error) => {
      console.error('Realtime jobs listener error:', error);
    });

    return () => unsubscribe();
  }, []);

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };



  // Auto-loop for events carousel
  useEffect(() => {
    if (upcomingEvents.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentEventIndex((prev) => 
        prev === upcomingEvents.length - 1 ? 0 : prev + 1
      );
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [upcomingEvents.length]);

  // Auto-loop for jobs carousel
  useEffect(() => {
    if (jobOpportunities.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentJobIndex((prev) => 
        prev === jobOpportunities.length - 1 ? 0 : prev + 1
      );
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [jobOpportunities.length]);

  return (
    <div className="sidebar-container">
      {/* Add Donation Progress Card at the top */}
      <DonationProgressCard />
      
      <div className="sidebar-card">
        <div className="sidebar-card-header">
          <h3 className="sidebar-title">
            <Calendar size={18} />
            <span>Upcoming Events</span>
          </h3>
          <Link to="/events" className="see-all-link">
            See All
          </Link>
        </div>
        
        <div className="sidebar-card-content">
          {loading ? (
            <div className="sidebar-loading">
              <div className="sidebar-skeleton"></div>
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="empty-content">
              <div className="empty-content-image">
                <Calendar size={32} color="#adb5bd" />
              </div>
              <p className="no-items-message">No upcoming events</p>
            </div>
          ) : (
            <div className="carousel-container">
              <div className="carousel-content">
                <div className="carousel-item event-carousel-item">
                  <Link to="/events" className="sidebar-item-link">
                    <div className="event-date-badge">
                      <span className="event-month">
                        {new Date(upcomingEvents[currentEventIndex].date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="event-day">
                        {new Date(upcomingEvents[currentEventIndex].date).getDate()}
                      </span>
                    </div>
                    <div className="sidebar-item-content">
                      <h4 className="sidebar-item-title">{upcomingEvents[currentEventIndex].title}</h4>
                      <p className="sidebar-item-subtitle">{upcomingEvents[currentEventIndex].location}</p>
                      <p className="sidebar-item-info">{formatDate(upcomingEvents[currentEventIndex].date)}</p>
                    </div>
                  </Link>
                </div>
              </div>
              
              {upcomingEvents.length > 1 && (
                <div className="carousel-indicators">
                  {upcomingEvents.map((_, index) => (
                    <button
                      key={index}
                      className={`carousel-indicator ${index === currentEventIndex ? 'active' : ''}`}
                      onClick={() => setCurrentEventIndex(index)}
                    />
                  ))}
                </div>
              )}
              
              <Link to="/events" className="view-all-button">
                <span>View All Events</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>
      
      <div className="sidebar-card">
        <div className="sidebar-card-header">
          <h3 className="sidebar-title">
            <Briefcase size={18} />
            <span>Job Opportunities</span>
          </h3>
          <Link to="/jobs" className="see-all-link">
            See All
          </Link>
        </div>
        
        <div className="sidebar-card-content">
          {loading ? (
            <div className="sidebar-loading">
              <div className="sidebar-skeleton"></div>
            </div>
          ) : jobOpportunities.length === 0 ? (
            <div className="empty-content">
              <div className="empty-content-image">
                <Briefcase size={32} color="#adb5bd" />
              </div>
              <p className="no-items-message">No job opportunities</p>
            </div>
          ) : (
            <div className="carousel-container">
              <div className="carousel-content">
                <div className="carousel-item job-carousel-item">
                  <Link to="/jobs" className="sidebar-item-link">
                    <div className="job-card-content">
                      <div className="job-type-badge">
                        {jobOpportunities[currentJobIndex].jobType === 'fullTime' && 'Full-time'}
                        {jobOpportunities[currentJobIndex].jobType === 'partTime' && 'Part-time'}
                        {jobOpportunities[currentJobIndex].jobType === 'contract' && 'Contract'}
                        {jobOpportunities[currentJobIndex].jobType === 'internship' && 'Internship'}
                      </div>
                      <h4 className="sidebar-item-title">{jobOpportunities[currentJobIndex].title}</h4>
                      <p className="sidebar-item-subtitle">{jobOpportunities[currentJobIndex].company}</p>
                      <p className="sidebar-item-info">{jobOpportunities[currentJobIndex].location}</p>
                    </div>
                  </Link>
                </div>
              </div>
              
              {jobOpportunities.length > 1 && (
                <div className="carousel-indicators">
                  {jobOpportunities.map((_, index) => (
                    <button
                      key={index}
                      className={`carousel-indicator ${index === currentJobIndex ? 'active' : ''}`}
                      onClick={() => setCurrentJobIndex(index)}
                    />
                  ))}
                </div>
              )}
              
              <Link to="/jobs" className="view-all-button">
                <span>View All Job Opportunities</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarRight; 