import { useEffect, useState } from 'react';
import { 
  Users, Award, Calendar, Briefcase, 
  Image, ArrowUp, ArrowDown, UserPlus
} from 'lucide-react';
import AdminLayout from '../../layout/AdminLayout';
// Import Firebase services for data retrieval
import { getEventsStatistics } from '../../../../services/firebase/eventService';
import { getJobStatistics } from '../../../../services/firebase/jobService';
import { getGalleryStatistics } from '../../../../services/firebase/galleryService';
import { getAlumniStatistics } from '../../../../services/firebase/alumniService';
import { getAllOfficers as getAllFirebaseOfficers } from '../../../../services/firebase/officerService';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalAlumni: 0,
    activeAlumni: 0,
    inactiveAlumni: 0,
    alumniByBatch: {} as Record<string, number>,
    totalOfficers: 0,
    totalEvents: 0,
    upcomingEvents: 0,
    totalJobs: 0,
    activeJobs: 0,
    totalGalleryItems: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Load statistics from Firebase
      const [
        alumniStats,
        officers,
        eventStats,
        jobStats,
        galleryStats
      ] = await Promise.all([
        getAlumniStatistics(),
        getAllFirebaseOfficers(),
        getEventsStatistics(),
        getJobStatistics(),
        getGalleryStatistics()
      ]);
      
      setStats({
        ...alumniStats,
        totalOfficers: officers.length,
        totalEvents: eventStats.totalEvents,
        upcomingEvents: eventStats.upcomingEvents,
        totalJobs: jobStats.approvedJobs,
        activeJobs: jobStats.activeJobs,
        totalGalleryItems: galleryStats.totalItems
      });
    } catch (error) {
      console.error('Error loading dashboard statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get top batches by alumni count
  const topBatches = Object.entries(stats.alumniByBatch)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="dashboard-loading">
          <div className="dashboard-loading-spinner"></div>
          <p>Loading dashboard statistics...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      {/* Statistics Cards */}
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-header">
            <div className="dashboard-stat-icon" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary-color)' }}>
              <Users size={24} />
            </div>
          </div>
          <div className="dashboard-stat-value">{stats.totalAlumni}</div>
          <div className="dashboard-stat-label">Total Alumni</div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-header">
            <div className="dashboard-stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Award size={24} />
            </div>
          </div>
          <div className="dashboard-stat-value">{stats.totalOfficers}</div>
          <div className="dashboard-stat-label">Officers</div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-header">
            <div className="dashboard-stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Calendar size={24} />
            </div>
          </div>
          <div className="dashboard-stat-value">{stats.totalEvents}</div>
          <div className="dashboard-stat-label">Events</div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-header">
            <div className="dashboard-stat-icon" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
              <Briefcase size={24} />
            </div>
          </div>
          <div className="dashboard-stat-value">{stats.totalJobs}</div>
          <div className="dashboard-stat-label">Jobs</div>
        </div>
        
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-header">
            <div className="dashboard-stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Image size={24} />
            </div>
          </div>
          <div className="dashboard-stat-value">{stats.totalGalleryItems}</div>
          <div className="dashboard-stat-label">Gallery Items</div>
        </div>
      </div>

      {/* Alumni Status Card */}
      <div className="dashboard-overview-card">
        <div className="dashboard-card-header">
          <h2 className="dashboard-card-title">
            <div className="dashboard-card-title-icon">
              <Users size={16} />
            </div>
            Alumni Status
          </h2>
        </div>
        
        <div className="dashboard-card-content">
          {stats.totalAlumni > 0 ? (
            <div className="dashboard-alumni-status">
              <div className="dashboard-status-item">
                <div className="dashboard-status-label">
                  Active Alumni
                </div>
                <div className="dashboard-status-value-row">
                  <div className="dashboard-status-value">
                    {stats.activeAlumni}
                  </div>
                  <div className="dashboard-percentage-badge dashboard-badge-positive">
                    <ArrowUp size={14} />
                    {stats.totalAlumni > 0 ? Math.round((stats.activeAlumni / stats.totalAlumni) * 100) : 0}%
                  </div>
                </div>
                
                <div className="dashboard-status-label" style={{ marginTop: '1rem' }}>
                  Inactive Alumni
                </div>
                <div className="dashboard-status-value-row">
                  <div className="dashboard-status-value">
                    {stats.inactiveAlumni}
                  </div>
                  <div className="dashboard-percentage-badge dashboard-badge-negative">
                    <ArrowDown size={14} />
                    {stats.totalAlumni > 0 ? Math.round((stats.inactiveAlumni / stats.totalAlumni) * 100) : 0}%
                  </div>
                </div>
              </div>
              
              <div className="dashboard-status-item">
                <div className="dashboard-status-label">
                  Top Batches
                </div>
                
                {topBatches.length > 0 ? (
                  <div>
                    {topBatches.map(([batch, count]) => (
                      <div key={batch} className="dashboard-batch-item">
                        <div className="dashboard-batch-name">Batch {batch}</div>
                        <div className="dashboard-batch-count">{count} alumni</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                    No batch data available
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="dashboard-empty-state">
              <div className="dashboard-empty-icon">
                <UserPlus size={32} />
              </div>
              <h3 className="dashboard-empty-title">No Alumni Data</h3>
              <p className="dashboard-empty-description">
                There are no alumni records in the system yet. Alumni data will appear here once users register and are approved.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard; 