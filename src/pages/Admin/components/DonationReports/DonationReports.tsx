import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  PhilippinePeso, 
  Hash,
  Calendar,
  ChevronDown,
  Database,
  Settings
} from 'lucide-react';
import AdminLayout from '../../layout/AdminLayout';
import { generateDonationReport, migrateExistingDonations } from '../../../../services/firebase/donationService';
import { DonationReport, ReportSignatory, ReportSections } from '../../../../types';
import { 
  exportDonationsToCSV, 
  exportReportSummaryToCSV, 
  exportReportToPDF 
} from '../../../../utils/exportUtils';
import SignatorySettingsModal from './SignatorySettingsModal';
import './DonationReports.css';

// Donation categories
const DONATION_CATEGORIES = [
  'All Categories',
  'Scholarship Fund',
  'Building Fund',
  'Equipment Fund',
  'Library Fund',
  'General Operations',
  'Special Projects',
  'Other'
];

const DonationReports = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DonationReport | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showMigrateBanner, setShowMigrateBanner] = useState(false);

  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [donorFilter, setDonorFilter] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [signatory, setSignatory] = useState<ReportSignatory>({
    name: 'HON. MARIANO L. MAGLAHUS JR.',
    title: 'Alumni President',
    organization: 'Immaculate Mary Academy',
    address: 'Poblacion Weste, Catigbian, Bohol'
  });
  
  // Section selection state (all enabled by default)
  const [sections, setSections] = useState<ReportSections>({
    categoryBreakdown: true,
    monthlyBreakdown: true,
    yearlyBreakdown: true,
    detailedDonations: true,
  });
  const [showSectionSelector, setShowSectionSelector] = useState(false);

  useEffect(() => {
    // Load saved signatory settings
    const savedSignatory = localStorage.getItem('donationReportSignatory');
    if (savedSignatory) {
      try {
        setSignatory(JSON.parse(savedSignatory));
      } catch (e) {
        console.error('Failed to parse saved signatory settings');
      }
    }

    // Set default date range to current year
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    setStartDate(yearStart.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);

    // Check if migration might be needed
    checkMigrationStatus();
  }, []);

  const checkMigrationStatus = async () => {
    try {
      const testReport = await generateDonationReport();
      // If we have donations but no monthly breakdown, suggest migration
      if (testReport.count > 0 && Object.keys(testReport.byMonth).length === 0) {
        setShowMigrateBanner(true);
      }
    } catch (error) {
      console.error('Error checking migration status:', error);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const reportData = await generateDonationReport(
        startDate || undefined,
        endDate || undefined,
        category !== 'All Categories' ? category : undefined,
        donorFilter || undefined
      );
      setReport(reportData);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMigrate = async () => {
    if (!confirm('This will update all existing donations with archive metadata. Continue?')) {
      return;
    }

    setLoading(true);
    try {
      await migrateExistingDonations();
      setShowMigrateBanner(false);
      alert('Migration completed successfully! You can now generate reports.');
      handleGenerateReport();
    } catch (error) {
      console.error('Error migrating donations:', error);
      alert('Migration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = (newSignatory: ReportSignatory) => {
    setSignatory(newSignatory);
    localStorage.setItem('donationReportSignatory', JSON.stringify(newSignatory));
  };

  // Section selection helpers
  const handleToggleSection = (sectionKey: keyof ReportSections) => {
    setSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handleSelectAllSections = () => {
    setSections({
      categoryBreakdown: true,
      monthlyBreakdown: true,
      yearlyBreakdown: true,
      detailedDonations: true,
    });
  };

  const handleDeselectAllSections = () => {
    setSections({
      categoryBreakdown: false,
      monthlyBreakdown: false,
      yearlyBreakdown: false,
      detailedDonations: false,
    });
  };

  const isAllSelected = Object.values(sections).every(val => val);
  const isNoneSelected = Object.values(sections).every(val => !val);

  const handleExportCSVDetails = () => {
    if (!report) return;
    exportDonationsToCSV(
      report.donations,
      `donations-${startDate || 'all'}-to-${endDate || 'all'}.csv`
    );
    setShowExportMenu(false);
  };

  const handleExportCSVSummary = () => {
    if (!report) return;
    exportReportSummaryToCSV(
      report,
      `donation-summary-${startDate || 'all'}-to-${endDate || 'all'}.csv`,
      sections
    );
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    if (!report) return;
    exportReportToPDF(report, signatory, sections);
    setShowExportMenu(false);
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMonthYear = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  return (
    <AdminLayout title="Donation Reports">
      <div className="donation-reports">
        {/* Migration Banner */}
        {showMigrateBanner && (
          <div className="migrate-banner">
            <div className="migrate-banner-content">
              <div className="migrate-banner-title">Archive Migration Required</div>
              <div className="migrate-banner-text">
                Your existing donations need to be updated with archive metadata for proper reporting.
              </div>
            </div>
            <button className="btn-migrate" onClick={handleMigrate}>
              <Database size={16} />
              Migrate Now
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="report-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">Start Date</label>
              <input
                type="date"
                className="filter-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">End Date</label>
              <input
                type="date"
                className="filter-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Donor Name</label>
              <input
                type="text"
                className="filter-input"
                value={donorFilter}
                onChange={(e) => setDonorFilter(e.target.value)}
                placeholder="Search donor..."
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Category</label>
              <select
                className="filter-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {DONATION_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="filter-actions">
              <button 
                className="btn-generate"
                onClick={handleGenerateReport}
                disabled={loading}
              >
                <FileText size={18} />
                Generate Report
              </button>

              <button 
                className="btn-settings"
                onClick={() => setShowSettings(true)}
                title="Report Settings"
              >
                <Settings size={18} />
              </button>

              <div className="export-dropdown">
                <button 
                  className="btn-export"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={!report || loading}
                >
                  <Download size={18} />
                  Export
                  <ChevronDown size={16} />
                </button>

                {showExportMenu && report && (
                  <div className="export-menu">
                    <button 
                      className="export-menu-item"
                      onClick={handleExportCSVDetails}
                    >
                      <FileText size={16} />
                      CSV - Detailed List
                    </button>
                    <button 
                      className="export-menu-item"
                      onClick={handleExportCSVSummary}
                    >
                      <FileText size={16} />
                      CSV - Summary
                    </button>
                    <button 
                      className="export-menu-item"
                      onClick={handleExportPDF}
                    >
                      <FileText size={16} />
                      PDF Report
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section Selector */}
        {report && (
          <div className="section-selector-container">
            <button
              className="section-selector-toggle"
              onClick={() => setShowSectionSelector(!showSectionSelector)}
            >
              <FileText size={16} />
              Select Report Sections
              <ChevronDown 
                size={16} 
                style={{ 
                  transform: showSectionSelector ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }} 
              />
            </button>

            {showSectionSelector && (
              <div className="section-selector-panel">
                <div className="section-selector-header">
                  <span className="section-selector-title">Choose sections to display and export:</span>
                  <div className="section-selector-actions">
                    <button
                      className="section-selector-action-btn"
                      onClick={handleSelectAllSections}
                      disabled={isAllSelected}
                    >
                      Select All
                    </button>
                    <button
                      className="section-selector-action-btn"
                      onClick={handleDeselectAllSections}
                      disabled={isNoneSelected}
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="section-checkboxes">
                  <label className="section-checkbox-item">
                    <input
                      type="checkbox"
                      checked={sections.categoryBreakdown}
                      onChange={() => handleToggleSection('categoryBreakdown')}
                    />
                    <span>Breakdown by Category</span>
                  </label>

                  <label className="section-checkbox-item">
                    <input
                      type="checkbox"
                      checked={sections.monthlyBreakdown}
                      onChange={() => handleToggleSection('monthlyBreakdown')}
                    />
                    <span>Monthly Breakdown</span>
                  </label>

                  <label className="section-checkbox-item">
                    <input
                      type="checkbox"
                      checked={sections.yearlyBreakdown}
                      onChange={() => handleToggleSection('yearlyBreakdown')}
                    />
                    <span>Yearly Breakdown</span>
                  </label>

                  <label className="section-checkbox-item">
                    <input
                      type="checkbox"
                      checked={sections.detailedDonations}
                      onChange={() => handleToggleSection('detailedDonations')}
                    />
                    <span>Detailed Donations Table</span>
                  </label>
                </div>

                <div className="section-selector-info">
                  <small>
                    Note: Selected sections will be included in the report display and all exports (CSV, PDF).
                  </small>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div>Generating report...</div>
          </div>
        )}

        {/* Report Content */}
        {!loading && report && (
          <>
            {/* Summary Cards */}
            <div className="report-summary">
              <div className="summary-card">
                <div className="summary-icon blue">
                  <Hash size={24} />
                </div>
                <div className="summary-label">Total Donations</div>
                <div className="summary-value">{report.count}</div>
              </div>

              <div className="summary-card">
                <div className="summary-icon green">
                  <PhilippinePeso size={24} />
                </div>
                <div className="summary-label">Total Amount</div>
                <div className="summary-value">{formatCurrency(report.totalAmount)}</div>
              </div>

              <div className="summary-card">
                <div className="summary-icon yellow">
                  <TrendingUp size={24} />
                </div>
                <div className="summary-label">Average Amount</div>
                <div className="summary-value">{formatCurrency(report.avgAmount)}</div>
              </div>
            </div>

            {/* Category Breakdown */}
            {sections.categoryBreakdown && Object.keys(report.byCategory).length > 0 && (
              <div className="report-section">
                <h2 className="section-title">Breakdown by Category</h2>
                <div className="breakdown-grid">
                  {Object.entries(report.byCategory)
                    .sort((a, b) => (b[1] as { amount: number; count: number }).amount - (a[1] as { amount: number; count: number }).amount)
                    .map(([cat, data]) => {
                      const breakdown = data as { amount: number; count: number };
                      return (
                        <div key={cat} className="breakdown-item">
                          <div className="breakdown-category">{cat}</div>
                          <div className="breakdown-amount">{formatCurrency(breakdown.amount)}</div>
                          <div className="breakdown-count">{breakdown.count} donation{breakdown.count !== 1 ? 's' : ''}</div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Monthly and Yearly Breakdown */}
            <div className="breakdown-row">
              {/* Monthly Breakdown */}
              {sections.monthlyBreakdown && Object.keys(report.byMonth).length > 0 && (
                <div className="report-section breakdown-section">
                  <h2 className="section-title">Monthly Breakdown</h2>
                  <div className="breakdown-grid breakdown-grid-compact">
                    {Object.entries(report.byMonth)
                      .sort((a, b) => a[0].localeCompare(b[0]))
                      .map(([month, data]) => {
                        const breakdown = data as { amount: number; count: number };
                        return (
                          <div key={month} className="breakdown-item">
                            <div className="breakdown-category">
                              <Calendar size={14} style={{ display: 'inline', marginRight: '6px' }} />
                              {formatMonthYear(month)}
                            </div>
                            <div className="breakdown-amount">{formatCurrency(breakdown.amount)}</div>
                            <div className="breakdown-count">{breakdown.count} donation{breakdown.count !== 1 ? 's' : ''}</div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Yearly Breakdown */}
              {sections.yearlyBreakdown && Object.keys(report.byYear).length > 0 && (
                <div className="report-section breakdown-section">
                  <h2 className="section-title">Yearly Breakdown</h2>
                  <div className="breakdown-grid breakdown-grid-compact">
                    {Object.entries(report.byYear)
                      .sort((a, b) => a[0].localeCompare(b[0]))
                      .map(([year, data]) => {
                        const breakdown = data as { amount: number; count: number };
                        return (
                          <div key={year} className="breakdown-item breakdown-item-year">
                            <div className="breakdown-category">
                              <Calendar size={14} style={{ display: 'inline', marginRight: '6px' }} />
                              {year}
                            </div>
                            <div className="breakdown-amount">{formatCurrency(breakdown.amount)}</div>
                            <div className="breakdown-count">{breakdown.count} donation{breakdown.count !== 1 ? 's' : ''}</div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Donations Table */}
            {sections.detailedDonations && report.donations.length > 0 && (
              <div className="report-section">
                <h2 className="section-title">Detailed Donations ({report.donations.length})</h2>
                <div className="donations-table-wrapper">
                  <table className="donations-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Donor</th>
                        <th>Category</th>
                        <th>Purpose</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.donations.map((donation) => (
                        <tr key={donation.id}>
                          <td className="date-cell">{formatDate(donation.donationDate)}</td>
                          <td>
                            {donation.donorName}
                            {donation.isAnonymous && (
                              <span className="anonymous-badge">Anonymous</span>
                            )}
                          </td>
                          <td>{donation.category}</td>
                          <td>{donation.purpose}</td>
                          <td className="amount-cell">{formatCurrency(donation.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && !report && (
          <div className="report-empty">
            <FileText size={64} className="report-empty-icon" style={{ color: '#d1d5db' }} />
            <h3>No Report Generated</h3>
            <p>Select your filters and click "Generate Report" to view donation statistics.</p>
          </div>
        )}

        {/* No Data State */}
        {!loading && report && report.count === 0 && (
          <div className="report-empty">
            <FileText size={64} className="report-empty-icon" style={{ color: '#d1d5db' }} />
            <h3>No Donations Found</h3>
            <p>No donations match the selected criteria. Try adjusting your filters.</p>
          </div>
        )}
      </div>

      <SignatorySettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSaveSettings}
        initialData={signatory}
      />
    </AdminLayout>
  );
};

export default DonationReports;

