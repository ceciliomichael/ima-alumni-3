import { BarChart2 } from 'lucide-react';
import './styles.css';

interface ProfileActivityProps {
  stats: {
    posts: number;
    comments: number;
    events: number;
  };
}

const ProfileActivity = ({ stats }: ProfileActivityProps) => {
  return (
    <div className="profile-activity">
      <div className="section-header">
        <BarChart2 size={20} />
        <h3>My Activity</h3>
      </div>
      
      <div className="activity-content">
        <div className="activity-stats">
          <div className="activity-stat">
            <div className="stat-number">{stats.posts}</div>
            <div className="stat-label">Posts</div>
            <div className="stat-bar">
              <div 
                className="stat-bar-fill posts" 
                style={{ width: `${Math.min(stats.posts * 10, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="activity-stat">
            <div className="stat-number">{stats.comments}</div>
            <div className="stat-label">Comments</div>
            <div className="stat-bar">
              <div 
                className="stat-bar-fill comments" 
                style={{ width: `${Math.min(stats.comments * 10, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="activity-stat">
            <div className="stat-number">{stats.events}</div>
            <div className="stat-label">Events</div>
            <div className="stat-bar">
              <div 
                className="stat-bar-fill events" 
                style={{ width: `${Math.min(stats.events * 10, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileActivity; 