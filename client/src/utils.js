import jsPDF from 'jspdf';

export function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

export function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export function downloadCsv(filename, headers, rows) {
  const escapeValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.map(escapeValue).join(',')];
  rows.forEach((row) => {
    lines.push(row.map(escapeValue).join(','));
  });
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export function downloadPdf(filename, title, headers, rows) {
  const doc = new jsPDF();
  const margin = 14;
  doc.setFontSize(14);
  doc.text(title, margin, 20);
  doc.setFontSize(10);
  let y = 28;
  const lineHeight = 8;
  const headerLine = headers.join(' | ');
  doc.text(headerLine, margin, y);
  y += lineHeight;

  rows.forEach((row, index) => {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    const line = row.join(' | ');
    doc.text(line, margin, y);
    y += lineHeight;
  });

  doc.save(filename);
}
