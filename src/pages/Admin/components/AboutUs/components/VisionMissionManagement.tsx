import { useState, useEffect } from 'react';
import { Edit, Save } from 'lucide-react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import {
  VisionMissionContent,
  updateVisionMission,
} from '../../../../../services/firebase/aboutService';

interface VisionMissionManagementProps {
  visionMission: VisionMissionContent | null;
  onRefresh: () => void;
}

const VisionMissionManagement = ({ visionMission, onRefresh }: VisionMissionManagementProps) => {
  const { adminUser } = useAdminAuth();
  const [editingVisionMission, setEditingVisionMission] = useState(false);
  const [visionMissionForm, setVisionMissionForm] = useState({
    vision: '',
    mission: '',
    goals: ['', '', '', '']
  });

  // Initialize form when visionMission data is available
  useEffect(() => {
    if (visionMission) {
      setVisionMissionForm({
        vision: visionMission.vision,
        mission: visionMission.mission,
        goals: visionMission.goals.length >= 4 
          ? visionMission.goals 
          : [...visionMission.goals, '', '', '', ''].slice(0, 4)
      });
    }
  }, [visionMission]);

  const handleSaveVisionMission = async () => {
    if (!adminUser) return;
    
    try {
      await updateVisionMission({
        vision: visionMissionForm.vision,
        mission: visionMissionForm.mission,
        goals: visionMissionForm.goals.filter(goal => goal.trim() !== '')
      }, adminUser.name);
      
      await onRefresh();
      setEditingVisionMission(false);
    } catch (error) {
      console.error('Error saving vision & mission:', error);
    }
  };

  return (
    <div className="vision-management">
      <div className="section-header">
        <h3>Vision & Mission</h3>
        <button 
          className="edit-btn"
          onClick={() => setEditingVisionMission(true)}
        >
          <Edit size={16} />
          Edit Content
        </button>
      </div>

      {editingVisionMission ? (
        <div className="vision-form">
          <div className="form-group">
            <label>Vision</label>
            <textarea
              value={visionMissionForm.vision}
              onChange={(e) => setVisionMissionForm(prev => ({
                ...prev,
                vision: e.target.value
              }))}
              rows={4}
            />
          </div>
          <div className="form-group">
            <label>Mission</label>
            <textarea
              value={visionMissionForm.mission}
              onChange={(e) => setVisionMissionForm(prev => ({
                ...prev,
                mission: e.target.value
              }))}
              rows={4}
            />
          </div>
          <div className="form-group">
            <label>Goals</label>
            {visionMissionForm.goals.map((goal, index) => (
              <textarea
                key={index}
                placeholder={`Goal ${index + 1}`}
                value={goal}
                onChange={(e) => {
                  const newGoals = [...visionMissionForm.goals];
                  newGoals[index] = e.target.value;
                  setVisionMissionForm(prev => ({
                    ...prev,
                    goals: newGoals
                  }));
                }}
                rows={3}
              />
            ))}
          </div>
          <div className="form-actions">
            <button 
              className="btn-secondary"
              onClick={() => setEditingVisionMission(false)}
            >
              Cancel
            </button>
            <button 
              className="btn-primary"
              onClick={handleSaveVisionMission}
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="vision-display">
          <div className="vision-card">
            <h4>Vision</h4>
            <p>{visionMission?.vision}</p>
          </div>
          <div className="mission-card">
            <h4>Mission</h4>
            <p>{visionMission?.mission}</p>
          </div>
          <div className="goals-card">
            <h4>Goals</h4>
            <ol>
              {visionMission?.goals.map((goal, index) => (
                <li key={index}>{goal}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisionMissionManagement;