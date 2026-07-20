import { describe, expect, it } from 'vitest';
import { buildCsv, escapeCsvCell } from '@/lib/csv';

describe('CSV utilities', () => {
  it('escapes commas, quotes, and line breaks', () => {
    expect(escapeCsvCell('Khan, Ali')).toBe('"Khan, Ali"');
    expect(escapeCsvCell('He said "hello"')).toBe('"He said ""hello"""');
    expect(escapeCsvCell('first\nsecond')).toBe('"first\nsecond"');
  });

  it('prevents spreadsheet formula injection', () => {
    expect(escapeCsvCell('=1+1')).toBe("'=1+1");
    expect(escapeCsvCell('@SUM(A1:A2)')).toBe("'@SUM(A1:A2)");
  });

  it('builds an Excel-compatible UTF-8 CSV', () => {
    expect(buildCsv(['Employee ID', 'Name'], [['EMP-01', 'Zoë']])).toBe(
      '\uFEFFEmployee ID,Name\r\nEMP-01,Zoë',
    );
  });
});
