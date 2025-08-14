import { useState, useEffect } from 'react';
import { Calendar, Briefcase, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ImagePlaceholder from '../../../../components/ImagePlaceholder/ImagePlaceholder';
import DonationProgressCard from './DonationProgressCard';
import './Sidebar.css';
import { getUpcomingEvents, initializeEventData } from '../../../../pages/Admin/services/localStorage/eventService';
import { getActiveJobs, initializeJobData } from '../../../../pages/Admin/services/localStorage/jobService';
import { Event as EventType } from '../../../../pages/Admin/services/localStorage/eventService';
import { Job as JobType } from '../../../../pages/Admin/services/localStorage/jobService';

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
}

const SidebarRight = () => {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [jobOpportunities, setJobOpportunities] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data on component mount
  useEffect(() => {
    // Initialize data stores if they don't exist
    initializeEventData();
    initializeJobData();
    
    loadData();
    
    // Listen for storage events to refresh data when it changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'events' || e.key === 'jobs') {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadData = () => {
    setLoading(true);
    
    // Get upcoming events
    const events = getUpcomingEvents()
      .filter(event => event.isApproved)
      .slice(0, 3)
      .map(event => ({
        id: event.id,
        title: event.title,
        date: event.date,
        location: event.location
      }));
    
    // Get active jobs
    const jobs = getActiveJobs()
      .filter(job => job.isApproved)
      .slice(0, 3)
      .map(job => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location
      }));
    
    setUpcomingEvents(events);
    setJobOpportunities(jobs);
    setLoading(false);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

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
            <ul className="sidebar-list">
              {upcomingEvents.map((event) => (
                <li key={event.id} className="sidebar-list-item event-item">
                  <Link to="/events" className="sidebar-item-link">
                    <div className="event-date-badge">
                      <span className="event-month">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="event-day">
                        {new Date(event.date).getDate()}
                      </span>
                    </div>
                    <div className="sidebar-item-content">
                      <h4 className="sidebar-item-title">{event.title}</h4>
                      <p className="sidebar-item-subtitle">{event.location}</p>
                      <p className="sidebar-item-info">{formatDate(event.date)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          
          {upcomingEvents.length > 0 && (
            <Link to="/events" className="view-all-button">
              <span>View All Events</span>
              <ArrowRight size={16} />
            </Link>
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
            <ul className="sidebar-list">
              {jobOpportunities.map((job) => (
                <li key={job.id} className="sidebar-list-item job-item">
                  <Link to="/jobs" className="sidebar-item-link">
                    <div className="sidebar-item-content">
                      <h4 className="sidebar-item-title">{job.title}</h4>
                      <p className="sidebar-item-subtitle">{job.company}</p>
                      <p className="sidebar-item-info">{job.location}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          
          {jobOpportunities.length > 0 && (
            <Link to="/jobs" className="view-all-button">
              <span>View All Job Opportunities</span>
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarRight; 