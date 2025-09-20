import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  getAllOfficers, 
  searchOfficers, 
  deleteOfficer
} from '../../../../services/firebase';
import { OfficerPosition, AlumniRecord } from '../../../../types';
import AdminLayout from '../../layout/AdminLayout';
import './AlumniOfficers.css';

const AlumniOfficers = () => {
  const [officers, setOfficers] = useState<OfficerPosition[]>([]);
  const [allAlumni, setAllAlumni] = useState<AlumniRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadOfficersData();
  }, []);

  const loadOfficersData = async () => {
    try {
      setLoading(true);
      const [officersData, alumniData] = await Promise.all([
        getAllOfficers(),
        import('../../../../services/firebase').then(module => module.getAllAlumni())
      ]);
      setOfficers(officersData);
      setAllAlumni(alumniData);
    } catch (error) {
      console.error('Error loading officers data:', error);
      setOfficers([]);
      setAllAlumni([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      try {
        const results = await searchOfficers(query);
        setOfficers(results);
      } catch (error) {
        console.error('Error searching officers:', error);
        setOfficers([]);
      }
    } else {
      loadOfficersData();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this officer position?')) {
      try {
        const success = await deleteOfficer(id);
        if (success) {
          loadOfficersData();
        } else {
          alert('Failed to delete officer position. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting officer:', error);
        alert('An error occurred while deleting the officer position.');
      }
    }
  };

  // Helper function to get alumni name by ID
  const getAlumniName = (alumniId: string): string => {
    const alumni = allAlumni.find(a => a.id === alumniId);
    return alumni ? alumni.name : 'Unknown Alumni';
  };

  // Helper function to get alumni batch by ID
  const getAlumniBatch = (alumniId: string): string => {
    const alumni = allAlumni.find(a => a.id === alumniId);
    return alumni ? alumni.batch : 'Unknown';
  };

  const formatDateRange = (startDate: string, endDate?: string): string => {
    const formattedStart = new Date(startDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short'
    });
    
    if (!endDate) {
      return `${formattedStart} - Present`;
    }
    
    const formattedEnd = new Date(endDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
    
    return `${formattedStart} - ${formattedEnd}`;
  };

  return (
    <AdminLayout title="Alumni Officers">
      <div className="admin-container">
        <div className="officers-header">
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search officers..."
              className="search-input"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          
          <button 
            className="add-officer-button"
            onClick={() => navigate('/admin/alumni-officers/add')}
          >
            <Plus size={18} />
            <span>Add Officer</span>
          </button>
        </div>
        
        {/* Unified Officers Table */}
        <div className="officers-content">
          <div className="officers-section">
            <div className="section-header">
              <h2>All Officers</h2>
              <p className="section-description">
                Manage all alumni officer positions including general officers and batch representatives
              </p>
            </div>
            
            {loading ? (
              <div className="loading-state">Loading officers...</div>
            ) : officers.length > 0 ? (
              <div className="officers-table-container">
                <table className="alumni-table officers-table">
                  <thead>
                    <tr>
                      <th>Position</th>
                      <th>Officer Name</th>
                      <th>Alumni Batch</th>
                      <th>Batch Year</th>
                      <th>Term</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {officers.map(officer => (
                      <tr key={officer.id}>
                        <td>
                          <div className="officer-title">{officer.title}</div>
                        </td>
                        <td>
                          <div className="alumni-name-cell">
                            <div className="alumni-avatar-placeholder">
                              {getAlumniName(officer.alumniId).charAt(0)}
                            </div>
                            <div className="alumni-name-info">
                              <span className="alumni-name">{getAlumniName(officer.alumniId)}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="batch-info">Batch {getAlumniBatch(officer.alumniId)}</span>
                        </td>
                        <td>
                          {officer.batchYear ? (
                            <span className="batch-badge">{officer.batchYear}</span>
                          ) : (
                            <span className="general-badge">General</span>
                          )}
                        </td>
                        <td>
                          <div className="term-dates">
                            {formatDateRange(officer.startDate, officer.endDate)}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="action-btn edit-btn"
                              onClick={() => navigate(`/admin/alumni-officers/edit/${officer.id}`)}
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              className="action-btn delete-btn"
                              onClick={() => handleDelete(officer.id)}
                              title="Delete"
                            >
                              <Trash size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-row">
                <div className="empty-state">
                  <div className="empty-icon">
                    <Award size={48} />
                  </div>
                  <h3>No Officers Found</h3>
                  <p>There are no officer positions assigned yet. Add officers to get started.</p>
                  <button 
                    className="primary-btn"
                    onClick={() => navigate('/admin/alumni-officers/add')}
                  >
                    Add First Officer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AlumniOfficers; 