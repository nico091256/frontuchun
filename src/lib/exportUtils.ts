/**
 * BPM Export Utilities
 * Excel (CSV with UTF-8 BOM) and PDF/Print Export Helper Functions
 */

export interface ExportColumn<T = any> {
  header: string;
  key: keyof T | ((item: T) => string | number | null | undefined);
}

/**
 * Export array of objects to Excel-compatible CSV with UTF-8 BOM
 */
export function exportToExcel<T extends Record<string, any>>(
  filename: string,
  columns: ExportColumn<T>[],
  data: T[]
): void {
  if (!data || data.length === 0) {
    alert("Yuklab olish uchun ma'lumot mavjud emas");
    return;
  }

  // Header row
  const headers = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`).join(',');

  // Data rows
  const rows = data.map((item) => {
    return columns
      .map((col) => {
        let val: any = '';
        if (typeof col.key === 'function') {
          val = col.key(item);
        } else {
          val = item[col.key];
        }
        if (val === null || val === undefined) val = '';
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(',');
  });

  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Open printable PDF view for structured tables
 */
export function exportToPDF<T extends Record<string, any>>(
  title: string,
  columns: ExportColumn<T>[],
  data: T[]
): void {
  if (!data || data.length === 0) {
    alert("Chop etish uchun ma'lumot mavjud emas");
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Brauzeringizda yangi oyna ochish cheklangan (Pop-up blocked)");
    return;
  }

  const dateStr = new Date().toLocaleString('uz-UZ');

  const tableHeaders = columns.map((c) => `<th style="border: 1px solid #cbd5e1; padding: 8px; background: #f8fafc; text-align: left; font-size: 12px; font-weight: 600;">${c.header}</th>`).join('');

  const tableRows = data
    .map((item, idx) => {
      const cells = columns
        .map((col) => {
          let val: any = '';
          if (typeof col.key === 'function') {
            val = col.key(item);
          } else {
            val = item[col.key];
          }
          if (val === null || val === undefined) val = '';
          return `<td style="border: 1px solid #e2e8f0; padding: 8px; font-size: 11px;">${val}</td>`;
        })
        .join('');
      return `<tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${cells}</tr>`;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #8b5cf6; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; color: #0f172a; margin: 0; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .footer { margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: right; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">${title}</h1>
            <p class="subtitle">Discover BPM System — Rasmiy Hisobot</p>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 11px; margin: 0; font-weight: 600;">Hujjat shakllantirilgan sana:</p>
            <p style="font-size: 11px; margin: 2px 0 0 0; color: #64748b;">${dateStr}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>${tableHeaders}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div class="footer">
          Chop etilgan: ${dateStr} · Discover BPM Platform
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 300);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
