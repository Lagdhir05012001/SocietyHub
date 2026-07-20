import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export function downloadCsv(filename, headers, rows, summaryRows = []) {
  const escapeValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = [];

  if (summaryRows.length > 0) {
    lines.push(['Summary', ''].map(escapeValue).join(','));
    summaryRows.forEach((row) => {
      lines.push(row.map(escapeValue).join(','));
    });
    lines.push('');
  }

  lines.push(headers.map(escapeValue).join(','));
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

export function downloadPdf(filename, title, headers, rows, summaryRows = [], options = {}) {
  const { statusColumnIndex = null, tables = [] } = options;
  const doc = new jsPDF();
  const margin = 14;
  doc.setFontSize(14);
  doc.text(title, margin, 20);

  let startY = 28;
  if (summaryRows.length > 0) {
    doc.setFontSize(10);
    summaryRows.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, margin, startY);
      startY += 6;
    });
    startY += 6;
  }

  autoTable(doc, {
    startY,
    head: [headers],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] },
    didParseCell: (data) => {
      if (data.row.section === 'body' && statusColumnIndex !== null) {
        console.log( data.row.raw[statusColumnIndex])
        const statusValue = data.row.raw[statusColumnIndex];
        if (statusValue === 'Present') {
          data.cell.styles.fillColor = [220, 255, 220];
          data.cell.styles.textColor = [0, 100, 0];
        } else if (statusValue === 'Absent') {
          data.cell.styles.fillColor = [255, 220, 220];
          data.cell.styles.textColor = [155, 0, 0];
        }
      }
    },
  });

  let nextStartY = doc.lastAutoTable.finalY + 10;
  tables.forEach((table) => {
    if (!table || !table.headers || !table.rows) return;
    doc.setFontSize(12);
    doc.text(table.title || 'Summary', margin, nextStartY);
    nextStartY += 6;
    autoTable(doc, {
      startY: nextStartY,
      head: [table.headers],
      body: table.rows,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    nextStartY = doc.lastAutoTable.finalY + 10;
  });

  doc.save(filename);
}
