/** Parse just the header row of a CSV (first non-empty line), respecting quoted fields. */
export function parseCsvHeaders(text: string): string[] {
  const clean = text.replace(/^﻿/, '');
  const firstLine = clean.split(/\r?\n/).find((l) => l.trim().length > 0);
  if (!firstLine) return [];

  const fields: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < firstLine.length; i++) {
    const ch = firstLine[i];
    if (inQuotes) {
      if (ch === '"') {
        if (firstLine[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur.trim());
  return fields;
}

/** Best-guess column mapping for an inventory CSV; the operator can override it in the dialog. */
export function guessInventoryColumns(headers: string[]): {
  sku: string;
  title: string;
  qty: string;
} {
  // `exact` is matched case-insensitively against the whole header; `contains` args are
  // substring fallbacks.
  const pick = (exact: string, ...contains: string[]) => {
    const byExact = headers.find((h) => h.toLowerCase() === exact);
    if (byExact) return byExact;
    return headers.find((h) => contains.some((c) => h.toLowerCase().includes(c))) ?? '';
  };
  return {
    sku: pick('sku', 'sku', 'upc'),
    title: pick('product_title', 'title', 'product', 'name', 'description'),
    qty: pick(
      'on_hand',
      'on hand',
      'onhand',
      'on-hand',
      'qty',
      'quantity',
      'available',
      'stock',
      'inventory',
    ),
  };
}

const escapeCell = (value: string | number): string => {
  const s = String(value ?? '');
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Build a CSV string with a UTF-8 BOM (Excel-friendly) and CRLF line endings. */
export function toCsv<T>(rows: T[], columns: { key: keyof T; header: string }[]): string {
  const lines = [columns.map((c) => escapeCell(c.header)).join(',')];
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCell(row[c.key] as string | number)).join(','));
  }
  return '﻿' + lines.join('\r\n') + '\r\n';
}

/** Trigger a browser download of a text file. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
