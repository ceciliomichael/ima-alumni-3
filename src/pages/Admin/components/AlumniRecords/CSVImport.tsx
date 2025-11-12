import { useState } from 'react';
import { useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { importAlumniFromCSV } from '../../../../services/firebase/alumniService';
import AdminLayout from '../../layout/AdminLayout';
import './AlumniRecords.css';

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

const CSVImport = () => {
  const navigate = useNavigate();
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [batchYear, setBatchYear] = useState('');
  const [csvPreview, setCsvPreview] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrors({ file: 'Please select a CSV file' });
      return;
    }

    setSelectedFile(file);
    setErrors({});
    
    // Read file for preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').slice(0, 6); // Show first 6 lines for preview
      setCsvPreview(lines);
      setShowPreview(true);
    };
    reader.readAsText(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setCsvPreview([]);
    setShowPreview(false);
    setImportResult(null);
    setErrors({});
    
    // Clear file input
    const fileInput = document.getElementById('csvFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!selectedFile) {
      newErrors.file = 'Please select a CSV file';
    }
    
    if (!batchYear.trim()) {
      newErrors.batchYear = 'Batch year is required';
    } else if (isNaN(Number(batchYear))) {
      newErrors.batchYear = 'Batch year must be a number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImport = async () => {
    if (!validateForm() || !selectedFile) return;

    setIsImporting(true);
    setImportResult(null);
    setIsRedirecting(false);

    try {
      const text = await selectedFile.text();
      const result = await importAlumniFromCSV(text, batchYear);
      setImportResult(result);
      
      // Auto-redirect to alumni records after successful import
      if (result.success && result.imported > 0) {
        setIsRedirecting(true);
        setRedirectCountdown(3);
        
        countdownRef.current = setInterval(() => {
          setRedirectCountdown((prev) => {
            if (prev <= 1) {
              if (countdownRef.current) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
              }
              navigate('/admin/alumni-records');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      setImportResult({
        success: false,
        imported: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AdminLayout title="Import Alumni from CSV">
      <div className="admin-container">
        <div className="alumni-records-header">
          <button 
            className="back-button"
            onClick={() => navigate('/admin/alumni-records')}
          >
            <ArrowLeft size={20} />
            <span>Back to Alumni Records</span>
          </button>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">CSV Batch Import</h2>
            <p className="admin-card-description">
              Import multiple alumni records from a CSV file. The system will automatically process both male and female columns.
            </p>
          </div>

          <div className="csv-import-content">
            {/* File Upload Section */}
            <div className="csv-upload-section">
              <div className="form-section">
                <label htmlFor="batchYear" className="admin-form-label">Batch Year *</label>
                <input
                  type="text"
                  id="batchYear"
                  name="batchYear"
                  className={`admin-form-input ${errors.batchYear ? 'admin-input-error' : ''}`}
                  value={batchYear}
                  onChange={(e) => setBatchYear(e.target.value)}
                  placeholder="Enter batch year (e.g., 2002)"
                  disabled={isImporting}
                />
                {errors.batchYear && <div className="admin-form-error">{errors.batchYear}</div>}
              </div>

              <div className="form-section">
                <label className="admin-form-label">CSV File *</label>
                
                {!selectedFile ? (
                  <div className="csv-upload-area">
                    <input
                      type="file"
                      id="csvFile"
                      accept=".csv"
                      onChange={handleFileSelect}
                      disabled={isImporting}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="csvFile" className="csv-upload-label">
                      <Upload size={32} />
                      <span className="csv-upload-text">Choose CSV File</span>
                      <span className="csv-upload-hint">or drag and drop here</span>
                    </label>
                  </div>
                ) : (
                  <div className="csv-file-selected">
                    <div className="csv-file-info">
                      <FileText size={24} />
                      <div>
                        <div className="csv-file-name">{selectedFile.name}</div>
                        <div className="csv-file-size">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="csv-remove-btn"
                      onClick={handleRemoveFile}
                      disabled={isImporting}
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
                
                {errors.file && <div className="admin-form-error">{errors.file}</div>}
              </div>
            </div>

            {/* CSV Format Information */}
            <div className="csv-format-info">
              <h3>Expected CSV Format</h3>
              <div className="csv-format-example">
                <div className="csv-format-header">
                  <code>Male,,Alumni ID,Female,,Alumni ID</code>
                </div>
                <div className="csv-format-row">
                  <code>Añinon,Micheal,123456-A,Amandoron,Reweljay,654321-B</code>
                </div>
                <div className="csv-format-notes">
                  <ul>
                    <li>First column: Male alumni names</li>
                    <li>Third column: Male alumni IDs</li>
                    <li>Fourth column: Female alumni names</li>
                    <li>Sixth column: Female alumni IDs</li>
                    <li>Empty rows will be skipped</li>
                    <li>Duplicate Alumni IDs will be skipped</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CSV Preview */}
            {showPreview && csvPreview.length > 0 && (
              <div className="csv-preview-section">
                <h3>File Preview</h3>
                <div className="csv-preview-table">
                  <table>
                    <tbody>
                      {csvPreview.map((line, index) => (
                        <tr key={index} className={index === 0 ? 'csv-header-row' : ''}>
                          {line.split(',').map((cell, cellIndex) => (
                            <td key={cellIndex}>{cell.trim()}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="csv-preview-note">
                  Showing first 6 lines of the file
                </div>
              </div>
            )}

            {/* Import Results */}
            {importResult && (
              <div className="csv-import-results">
                <div className={`import-status ${importResult.success ? 'success' : 'error'}`}>
                  {importResult.success ? (
                    <CheckCircle size={24} />
                  ) : (
                    <AlertCircle size={24} />
                  )}
                  <div>
                    <div className="import-status-title">
                      {importResult.success ? 'Import Completed' : 'Import Failed'}
                    </div>
                    <div className="import-status-details">
                      {importResult.imported} imported, {importResult.skipped} skipped
                    </div>
                    {isRedirecting && (
                      <div className="redirect-notice">
                        Redirecting to Alumni Records in {redirectCountdown} seconds...
                      </div>
                    )}
                  </div>
                </div>
                
                {importResult.errors.length > 0 && (
                  <div className="import-errors">
                    <h4>Issues Encountered:</h4>
                    <ul>
                      {importResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="csv-import-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => navigate('/admin/alumni-records')}
                disabled={isImporting}
              >
                {importResult ? 'Back to Alumni Records' : 'Cancel'}
              </button>
              
              {!importResult ? (
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={handleImport}
                  disabled={!selectedFile || !batchYear || isImporting}
                >
                  <Upload size={18} />
                  {isImporting ? 'Importing...' : 'Import Alumni'}
                </button>
              ) : isRedirecting ? (
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => {
                    if (countdownRef.current) {
                      clearInterval(countdownRef.current);
                      countdownRef.current = null;
                    }
                    setIsRedirecting(false);
                    setRedirectCountdown(3);
                  }}
                >
                  Stay on Page
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CSVImport;
