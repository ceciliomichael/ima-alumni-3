import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Plus, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllAlumni, initializeAlumniData } from '../../../../services/firebase/alumniService';
import { AlumniRecord } from '../../../../types';
import AdminLayout from '../../layout/AdminLayout';
import './AlumniRecords.css';

interface BatchGroup {
  batch: string;
  alumni: AlumniRecord[];
}

const AlumniListByBatch = () => {
  const [batchGroups, setBatchGroups] = useState<BatchGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize sample data if empty
        await initializeAlumniData();
        
        // Load and group alumni data
        await loadAlumniByBatch();
      } catch (error) {
        console.error('Error initializing alumni data:', error);
      }
    };
    
    init();
  }, []);

  const loadAlumniByBatch = async () => {
    try {
      const alumni = await getAllAlumni();
      
      // Group alumni by batch
      const groupedByBatch: Record<string, AlumniRecord[]> = {};
      
      alumni.forEach(alum => {
        if (!groupedByBatch[alum.batch]) {
          groupedByBatch[alum.batch] = [];
        }
        groupedByBatch[alum.batch].push(alum);
      });
      
      // Convert to array and sort by batch year (descending)
      const batches = Object.keys(groupedByBatch)
        .sort((a, b) => parseInt(b) - parseInt(a))
        .map(batch => ({
          batch,
          alumni: groupedByBatch[batch]
        }));
      
      setBatchGroups(batches);
    } catch (error) {
      console.error('Error loading alumni by batch:', error);
      setBatchGroups([]);
    }
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    try {
      if (!query.trim()) {
        await loadAlumniByBatch();
        return;
      }
      
      // Search within groups
      const alumni = await getAllAlumni();
      const lowerCaseQuery = query.toLowerCase();
      
      const filteredAlumni = alumni.filter(
        alum => 
          alum.name.toLowerCase().includes(lowerCaseQuery) ||
          alum.email.toLowerCase().includes(lowerCaseQuery)
      );
      
      // Re-group filtered alumni
      const filteredGroupedByBatch: Record<string, AlumniRecord[]> = {};
      
      filteredAlumni.forEach(alum => {
        if (!filteredGroupedByBatch[alum.batch]) {
          filteredGroupedByBatch[alum.batch] = [];
        }
        filteredGroupedByBatch[alum.batch].push(alum);
      });
      
      const filteredBatches = Object.keys(filteredGroupedByBatch)
        .sort((a, b) => parseInt(b) - parseInt(a))
        .map(batch => ({
          batch,
          alumni: filteredGroupedByBatch[batch]
        }));
      
      setBatchGroups(filteredBatches);
    } catch (error) {
      console.error('Error searching alumni:', error);
    }
  };

  return (
    <AdminLayout title="Alumni Records by Batch">
      <div className="admin-toolbar">
        <Link to="/admin/alumni-records" className="admin-back-btn">
          <ArrowLeft size={20} />
          Back to All Records
        </Link>
        
        <div className="admin-search">
          <Search className="admin-search-icon" size={20} />
          <input
            type="text"
            placeholder="Search alumni..."
            className="admin-search-input"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        
        <button 
          className="admin-add-btn"
          onClick={() => navigate('/admin/alumni-records/add')}
        >
          <Plus size={20} />
          Add Alumni
        </button>
      </div>
      
      {batchGroups.length > 0 ? (
        batchGroups.map(group => (
          <div className="admin-card" key={group.batch}>
            <div className="admin-card-header">
              <h2 className="admin-card-title">Batch {group.batch}</h2>
              <div>{group.alumni.length} Alumni</div>
            </div>
            
            <div className="admin-batch-alumni">
              {group.alumni.map(alum => (
                <div 
                  className="admin-alumni-card" 
                  key={alum.id}
                  onClick={() => navigate(`/admin/alumni-records/view/${alum.id}`)}
                >
                  <div className="admin-alumni-avatar">
                    {alum.profileImage ? (
                      <img 
                        src={alum.profileImage} 
                        alt={alum.name} 
                        className="admin-alumni-img" 
                      />
                    ) : (
                      <div className="admin-alumni-placeholder">
                        <User size={24} />
                      </div>
                    )}
                  </div>
                  <div className="admin-alumni-info">
                    <div className="admin-alumni-name">
                      {alum.name}
                      {alum.position && (
                        <span className="admin-alumni-badge">{alum.position}</span>
                      )}
                    </div>
                    <div className="admin-alumni-email">{alum.email}</div>
                    <div className="admin-alumni-status">
                      <span className={`admin-badge ${alum.isActive ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                        {alum.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="admin-card admin-empty-state">
          <div className="admin-empty-icon">
            <User size={48} />
          </div>
          <h3>No Alumni Records Found</h3>
          <p>There are no alumni records that match your search criteria.</p>
          {searchQuery && (
            <button 
              className="admin-primary-btn"
              onClick={async () => {
                setSearchQuery('');
                await loadAlumniByBatch();
              }}
            >
              Clear Search
            </button>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default AlumniListByBatch;
