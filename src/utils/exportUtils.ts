import { Donation, DonationReport } from '../types';

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
export const exportReportSummaryToCSV = (report: DonationReport, filename: string = 'donation-summary.csv'): void => {
  const summaryRows = [
    ['Metric', 'Value'],
    ['Total Donations', report.count.toString()],
    ['Total Amount', report.totalAmount.toFixed(2)],
    ['Average Amount', report.avgAmount.toFixed(2)],
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
    }),
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
  ];

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
export const exportReportToPDF = (report: DonationReport): void => {
  // Create a new window with formatted report content
  const printWindow = window.open('', '', 'width=800,height=600');
  
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }

  const assetBaseUrl = window.location.origin;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Donation Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #333;
        }
        .report-header {
          width: 100%;
          border-bottom: 3px solid #0f172a;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .header-banner {
          width: 100%;
          height: auto;
          display: block;
        }
        h1 {
          color: #1e40af;
          border-bottom: 3px solid #fbbf24;
          padding-bottom: 10px;
        }
        h2 {
          color: #1e40af;
          margin-top: 30px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 5px;
        }
        .summary {
          background-color: #f3f4f6;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
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
          margin: 20px 0;
        }
        th {
          background-color: #1e40af;
          color: white;
          padding: 12px;
          text-align: left;
        }
        td {
          padding: 10px 12px;
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
        @media print {
          body {
            padding: 0;
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

