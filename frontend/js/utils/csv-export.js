/**
 * CSV Export Utility
 * Generates and triggers browser download of tabular inventory data.
 */

export function exportToCSV(filename, headers, rows) {
  if (!rows || !rows.length) {
    throw new Error('No data available to export.');
  }

  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '""';
    const stringVal = String(value);
    if (stringVal.includes('"') || stringVal.includes(',') || stringVal.includes('\n')) {
      return `"${stringVal.replace(/"/g, '""')}"`;
    }
    return `"${stringVal}"`;
  };

  const headerRow = headers.map(h => escapeCSV(h.label || h)).join(',');
  const dataRows = rows.map(row => {
    return headers.map(h => {
      const key = typeof h === 'object' ? h.key : h;
      return escapeCSV(row[key]);
    }).join(',');
  });

  const csvContent = [headerRow, ...dataRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
