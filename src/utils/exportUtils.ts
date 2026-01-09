import { Donation, DonationReport, ReportSignatory, ReportSections } from '../types';

// Export donations to CSV
export const exportDonationsToCSV = (donations: Donation[], filename: string = 'donations-report.csv'): void => {
  if (donations.length === 0) {
    alert('No donations to export');
    return;
  }

  // Define CSV headers
  const headers = [
    'Date',
    'Donor Name',
    'Email',
    'Amount',
    'Currency',
    'Category',
    'Purpose',
    'Description',
    'Public',
    'Anonymous'
  ];

  // Convert donations to CSV rows
  const rows = donations.map(donation => [
    new Date(donation.donationDate).toLocaleDateString(),
    donation.donorName,
    donation.donorEmail || 'N/A',
    donation.amount.toString(),
    donation.currency,
    donation.category,
    donation.purpose,
    donation.description || 'N/A',
    donation.isPublic ? 'Yes' : 'No',
    donation.isAnonymous ? 'Yes' : 'No'
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => {
        // Escape cells containing commas or quotes
        const cellStr = cell.toString().replace(/"/g, '""');
        return cellStr.includes(',') || cellStr.includes('"') ? `"${cellStr}"` : cellStr;
      }).join(',')
    )
  ].join('\n');

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export report summary to CSV
export const exportReportSummaryToCSV = (
  report: DonationReport, 
  filename: string = 'donation-summary.csv',
  sections?: ReportSections
): void => {
  // Default to all sections enabled if not provided
  const enabledSections = sections || {
    categoryBreakdown: true,
    monthlyBreakdown: true,
    yearlyBreakdown: true,
    detailedDonations: true,
  };

  // Build summary rows conditionally based on enabled sections
  const summaryRows: string[][] = [
    ['Metric', 'Value'],
    ['Total Donations', report.count.toString()],
    ['Total Amount', report.totalAmount.toFixed(2)],
    ['Average Amount', report.avgAmount.toFixed(2)],
  ];

  // Add Category Breakdown if enabled
  if (enabledSections.categoryBreakdown && Object.keys(report.byCategory).length > 0) {
    summaryRows.push(
      [''],
      ['Category Breakdown', ''],
      ['Category', 'Amount', 'Count'],
      ...Object.entries(report.byCategory).map(([category, data]) => {
        const breakdown = data as { amount: number; count: number };
        return [
          category,
          breakdown.amount.toFixed(2),
          breakdown.count.toString()
        ];
      })
    );
  }

  // Add Monthly Breakdown if enabled
  if (enabledSections.monthlyBreakdown && Object.keys(report.byMonth).length > 0) {
    summaryRows.push(
      [''],
      ['Monthly Breakdown', ''],
      ['Month', 'Amount', 'Count'],
      ...Object.entries(report.byMonth)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, data]) => {
          const breakdown = data as { amount: number; count: number };
          return [
            month,
            breakdown.amount.toFixed(2),
            breakdown.count.toString()
          ];
        })
    );
  }

  // Add Yearly Breakdown if enabled
  if (enabledSections.yearlyBreakdown && Object.keys(report.byYear).length > 1) {
    summaryRows.push(
      [''],
      ['Yearly Breakdown', ''],
      ['Year', 'Amount', 'Count'],
      ...Object.entries(report.byYear)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([year, data]) => {
          const breakdown = data as { amount: number; count: number };
          return [
            year,
            breakdown.amount.toFixed(2),
            breakdown.count.toString()
          ];
        })
    );
  }

  const csvContent = summaryRows
    .map(row => row.map(cell => {
      const cellStr = cell.toString().replace(/"/g, '""');
      return cellStr.includes(',') || cellStr.includes('"') ? `"${cellStr}"` : cellStr;
    }).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export report to PDF (using browser print)
export const exportReportToPDF = (
  report: DonationReport, 
  signatory?: ReportSignatory,
  sections?: ReportSections
): void => {
  // Default to all sections enabled if not provided
  const enabledSections = sections || {
    categoryBreakdown: true,
    monthlyBreakdown: true,
    yearlyBreakdown: true,
    detailedDonations: true,
  };

  // Create a new window with formatted report content
  const printWindow = window.open('', '', 'width=800,height=600');
  
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }

  const assetBaseUrl = window.location.origin;

  const defaultSignatory = {
    name: 'HON. MARIANO L. MAGLAHUS JR.',
    title: 'Alumni President',
    organization: 'Immaculate Mary Academy',
    address: 'Poblacion Weste, Catigbian, Bohol'
  };

  const finalSignatory = signatory || defaultSignatory;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Donation Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 15px 20px;
          color: #333;
          font-size: 12px;
        }
        .report-header {
          width: 100%;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .header-banner {
          max-width: 350px;
          height: auto;
          display: block;
          margin: 0 auto;
        }
        h1 {
          color: #1e40af;
          border-bottom: 2px solid #fbbf24;
          padding-bottom: 6px;
          margin: 8px 0;
          font-size: 18px;
        }
        .report-meta {
          font-size: 11px;
          color: #666;
          margin-bottom: 10px;
        }
        h2 {
          color: #1e40af;
          margin-top: 15px;
          margin-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 4px;
          font-size: 14px;
        }
        .summary {
          background-color: #f3f4f6;
          padding: 10px 12px;
          border-radius: 6px;
          margin: 10px 0;
        }
        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px solid #d1d5db;
        }
        .summary-item:last-child {
          border-bottom: none;
        }
        .summary-label {
          font-weight: bold;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 8px 0;
          font-size: 11px;
        }
        th {
          background-color: #1e40af;
          color: white;
          padding: 8px 10px;
          text-align: left;
        }
        td {
          padding: 6px 10px;
          border-bottom: 1px solid #e5e7eb;
        }
        tr:hover {
          background-color: #f9fafb;
        }
        .amount {
          text-align: right;
          font-weight: bold;
          color: #059669;
        }
        .signature-section {
          margin-top: 30px;
          page-break-inside: avoid;
        }
        .signature-row {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
        }
        .signature-block {
          text-align: center;
          width: 45%;
        }
        .signature-line {
          border-top: 1px solid #333;
          margin-top: 40px;
          padding-top: 5px;
        }
        .signature-name {
          font-weight: bold;
          font-size: 12px;
        }
        .signature-title {
          font-size: 11px;
          color: #555;
        }
        .salutation {
          margin-top: 20px;
          font-size: 11px;
        }
        @media print {
          body {
            padding: 10px;
          }
          button {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <img class="header-banner" src="${assetBaseUrl}/header.png" alt="Immaculate Mary Academy Header" />
      </div>
      <h1>Donation Report</h1>
      <p>Generated on: ${new Date().toLocaleString()}</p>
      
      <div class="summary">
        <div class="summary-item">
          <span class="summary-label">Total Donations:</span>
          <span>${report.count}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Total Amount:</span>
          <span class="amount">₱${report.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Average Amount:</span>
          <span class="amount">₱${report.avgAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      ${enabledSections.categoryBreakdown && Object.keys(report.byCategory).length > 0 ? `
        <h2>Breakdown by Category</h2>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th style="text-align: right;">Amount</th>
              <th style="text-align: center;">Count</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(report.byCategory)
              .sort((a, b) => (b[1] as { amount: number; count: number }).amount - (a[1] as { amount: number; count: number }).amount)
              .map(([category, data]) => {
                const breakdown = data as { amount: number; count: number };
                return `
                <tr>
                  <td>${category}</td>
                  <td class="amount">₱${breakdown.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td style="text-align: center;">${breakdown.count}</td>
                </tr>
              `;
              }).join('')}
          </tbody>
        </table>
      ` : ''}

      ${enabledSections.monthlyBreakdown && Object.keys(report.byMonth).length > 0 ? `
        <h2>Monthly Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th style="text-align: right;">Amount</th>
              <th style="text-align: center;">Count</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(report.byMonth)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([month, data]) => {
                const breakdown = data as { amount: number; count: number };
                return `
                <tr>
                  <td>${month}</td>
                  <td class="amount">₱${breakdown.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td style="text-align: center;">${breakdown.count}</td>
                </tr>
              `;
              }).join('')}
          </tbody>
        </table>
      ` : ''}

      ${enabledSections.yearlyBreakdown && Object.keys(report.byYear).length > 0 ? `
        <h2>Yearly Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th style="text-align: right;">Amount</th>
              <th style="text-align: center;">Count</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(report.byYear)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([year, data]) => {
                const breakdown = data as { amount: number; count: number };
                return `
                <tr>
                  <td>${year}</td>
                  <td class="amount">₱${breakdown.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td style="text-align: center;">${breakdown.count}</td>
                </tr>
              `;
              }).join('')}
          </tbody>
        </table>
      ` : ''}

      ${enabledSections.detailedDonations && report.donations.length > 0 ? `
        <h2>Detailed Donations</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Donor</th>
              <th>Category</th>
              <th>Purpose</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${report.donations.map((donation: Donation) => `
              <tr>
                <td>${new Date(donation.donationDate).toLocaleDateString()}</td>
                <td>${donation.donorName}${donation.isAnonymous ? ' (Anonymous)' : ''}</td>
                <td>${donation.category}</td>
                <td>${donation.purpose}</td>
                <td class="amount">₱${donation.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      <div class="signature-section">
        <p class="salutation">Sir/Ma'am:</p>
        <p style="margin: 10px 0; font-size: 11px;">
          This report is a summary of the donations received for the period indicated above.
        </p>
        
        <div class="signature-row" style="justify-content: flex-end;">
          <div class="signature-block">
            <div class="signature-line">
              <div class="signature-name">${finalSignatory.name}</div>
              <div class="signature-title">${finalSignatory.title}</div>
              <div class="signature-title">${finalSignatory.organization}</div>
              <div class="signature-title">${finalSignatory.address}</div>
            </div>
          </div>
        </div>
      </div>

      <script>
        window.onload = () => {
          window.print();
          setTimeout(() => window.close(), 100);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

