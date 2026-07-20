const FORMULA_PREFIX = /^[=+\-@]/;

export const escapeCsvCell = (value: unknown) => {
  let text = String(value ?? '');

  // Prevent spreadsheet applications from evaluating user-controlled cells.
  if (FORMULA_PREFIX.test(text)) text = `'${text}`;

  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const buildCsv = (headers: string[], rows: unknown[][]) => {
  const content = [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\r\n');

  // The UTF-8 BOM keeps names with non-ASCII characters readable in Excel.
  return `\uFEFF${content}`;
};

export const downloadCsv = (filename: string, headers: string[], rows: unknown[][]) => {
  const blob = new Blob([buildCsv(headers, rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
