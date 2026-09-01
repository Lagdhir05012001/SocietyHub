import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const logoUrl = '/logo.png';

function loadImageAsset(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const context = canvas.getContext('2d');
      context.drawImage(img, 0, 0);
      resolve({
        dataUrl: canvas.toDataURL('image/png'),
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = reject;
    img.src = url;
  });
}

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

export async function downloadPdf(filename, title, headers, rows, summaryRows = [], options = {}) {
  const { statusColumnIndex = null, tables = [] } = options;
  const doc = new jsPDF();
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();

  const serialHeaders = ['Sr No', ...headers];
  const serialRows = rows.map((row, index) => [String(index + 1), ...row]);

  let logoImage = null;
  try {
    logoImage = await loadImageAsset(logoUrl);
  } catch (error) {
    console.warn('Unable to load PDF logo:', error);
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, 20);

  if (logoImage) {
    const maxWidth = Math.min(34, pageWidth * 0.22);
    const maxHeight = 20;
    const imageRatio = Math.min(maxWidth / logoImage.width, maxHeight / logoImage.height);
    const logoWidth = logoImage.width * imageRatio;
    const logoHeight = logoImage.height * imageRatio;
    const logoX = pageWidth - margin - logoWidth;
    const logoY = 6;
    doc.addImage(logoImage.dataUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
  }

  let startY = 28;
  if (summaryRows.length > 0) {
    doc.setFontSize(10);
    summaryRows.forEach(([label, value]) => {
      const labelText = `${label}: `;
      const valueText = String(value ?? '');
      const gap = 2;
      doc.setFont('helvetica', 'bold');
      doc.text(labelText, margin, startY);
      doc.text(valueText, margin + doc.getTextWidth(labelText) + gap, startY);
      startY += 6;
    });
    startY += 6;
  }

  autoTable(doc, {
    startY,
    head: [serialHeaders],
    body: serialRows,
    theme: 'grid',
    styles: { fontSize: 10, fontStyle: 'normal', textColor: [0, 0, 0] },
    headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold', textColor: [255, 255, 255] },
    columnStyles: { 0: { halign: 'center', cellWidth: 18 } },
    didParseCell: (data) => {
      if (data.row.section === 'body' && statusColumnIndex !== null) {
        const statusValue = data.row.raw[statusColumnIndex + 1];
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
    const serialSummaryHeaders = ['Sr No', ...table.headers];
    const serialSummaryRows = table.rows.map((row, index) => [String(index + 1), ...row]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(table.title || 'Summary', margin, nextStartY);
    nextStartY += 6;
    autoTable(doc, {
      startY: nextStartY,
      head: [serialSummaryHeaders],
      body: serialSummaryRows,
      theme: 'grid',
      styles: { fontSize: 10, fontStyle: 'normal', textColor: [0, 0, 0] },
      headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold', textColor: [255, 255, 255] },
      columnStyles: { 0: { halign: 'center', cellWidth: 18 } },
    });
    nextStartY = doc.lastAutoTable.finalY + 10;
  });

  doc.save(filename);
}

export function downloadBlob(blob, filename) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
