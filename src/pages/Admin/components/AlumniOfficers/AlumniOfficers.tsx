import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash, User, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  getAllOfficers, 
  searchOfficers, 
  deleteOfficer,
  initializeOfficerData 
} from '../../services/localStorage/officerService';
import { getAlumniById } from '../../services/localStorage/alumniService';
import { OfficerPosition } from '../../../../types';
import AdminLayout from '../../layout/AdminLayout';
import './AlumniOfficers.css';

const AlumniOfficers = () => {
  const [officers, setOfficers] = useState<OfficerPosition[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize sample data if empty
    initializeOfficerData();
    
    // Load officers data
    loadOfficersData();
  }, []);

  const loadOfficersData = () => {
    setLoading(true);
    const allOfficers = getAllOfficers();
    setOfficers(allOfficers);
    setLoading(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      const results = searchOfficers(query);
      setOfficers(results);
    } else {
      loadOfficersData();
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this officer position?')) {
      // In a real app, this would call an API endpoint
      const officers = getAllOfficers();
      const updatedOfficers = officers.filter(officer => officer.id !== id);
      localStorage.setItem('alumni_officers', JSON.stringify(updatedOfficers));
      loadOfficersData();
    }
  };

  // Helper function to get alumni name by ID
  const getAlumniName = (alumniId: string): string => {
    const alumni = getAlumniById(alumniId);
    return alumni ? alumni.name : 'Unknown Alumni';
  };

  // Group officers by position
  const getMainOfficers = () => {
    return officers.filter(officer => !officer.batchYear);
  };

  const getBatchOfficers = () => {
    return officers.filter(officer => officer.batchYear);
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
        
        {/* Main Officers Section */}
        <div className="officers-content">
          <div className="officers-section">
            <div className="section-header">
              <h2>Main Officers</h2>
            </div>
            
            {loading ? (
              <div className="loading-state">Loading officers...</div>
            ) : getMainOfficers().length > 0 ? (
              <div className="officers-table-container">
                <table className="alumni-table officers-table">
                  <thead>
                    <tr>
                      <th>Position</th>
                      <th>Officer Name</th>
                      <th>Term</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getMainOfficers().map(officer => (
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
                  <h3>No Main Officers Found</h3>
                  <p>There are no main officers assigned yet.</p>
                  <button 
                    className="primary-btn"
                    onClick={() => navigate('/admin/alumni-officers/add')}
                  >
                    Add Officer
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Batch Officers Section */}
          <div className="officers-section">
            <div className="section-header">
              <h2>Batch Officers</h2>
            </div>
            
            {loading ? (
              <div className="loading-state">Loading batch officers...</div>
            ) : getBatchOfficers().length > 0 ? (
              <div className="officers-table-container">
                <table className="alumni-table officers-table">
                  <thead>
                    <tr>
                      <th>Position</th>
                      <th>Batch</th>
                      <th>Officer Name</th>
                      <th>Term</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getBatchOfficers().map(officer => (
                      <tr key={officer.id}>
                        <td>
                          <div className="officer-title">{officer.title}</div>
                        </td>
                        <td>
                          <span className="batch-badge">Batch {officer.batchYear}</span>
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
                    <User size={48} />
                  </div>
                  <h3>No Batch Officers Found</h3>
                  <p>There are no batch officers assigned yet.</p>
                  <button 
                    className="primary-btn"
                    onClick={() => navigate('/admin/alumni-officers/add')}
                  >
                    Add Batch Officer
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