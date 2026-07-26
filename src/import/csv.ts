import type {
  HoldingsCsvPreview,
  ImportedHolding,
  ImportedTransaction,
  TransactionCsvPreview,
} from './types';

function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  fields.push(current);
  return fields;
}

function splitLines(csv: string): string[] {
  return csv.split(/\r?\n/).filter((line) => line.trim().length > 0);
}

function parseNumber(value: string): number {
  return Number(value.replace(/,/g, ''));
}

function normalizeDate(raw: string): string {
  return raw.trim().replace(/\s*小計$/, '').replace(/\//g, '-');
}

const TRANSACTION_COLUMN_COUNT = 27;

export function parseTransactionCsv(csv: string): TransactionCsvPreview {
  const lines = splitLines(csv);
  const rows: ImportedTransaction[] = [];
  const skipped: TransactionCsvPreview['skipped'] = [];

  for (let index = 1; index < lines.length; index += 1) {
    const fields = splitCsvLine(lines[index]);

    if (fields.length < TRANSACTION_COLUMN_COUNT) {
      skipped.push({ line: index + 1, reason: 'column count mismatch' });
      continue;
    }

    if (!fields[2]) {
      continue; // daily subtotal row, not an error
    }

    rows.push({
      tradeDate: normalizeDate(fields[1]),
      stockId: fields[3],
      stockName: fields[4],
      side: fields[6] === '賣' ? 'sell' : 'buy',
      quantity: parseNumber(fields[8]),
      price: parseNumber(fields[9]),
      fees: parseNumber(fields[11]),
      tax: parseNumber(fields[12]),
      settlementDate: fields[23] ? normalizeDate(fields[23]) : null,
      brokerReference: fields[26] || null,
    });
  }

  return { rows, skipped };
}

const HOLDINGS_COLUMN_COUNT = 20;

export function parseHoldingsCsv(csv: string): HoldingsCsvPreview {
  const lines = splitLines(csv);
  const rows: ImportedHolding[] = [];
  const skipped: HoldingsCsvPreview['skipped'] = [];

  for (let index = 1; index < lines.length; index += 1) {
    const fields = splitCsvLine(lines[index]);

    if (fields.length < HOLDINGS_COLUMN_COUNT) {
      skipped.push({ line: index + 1, reason: 'column count mismatch' });
      continue;
    }

    if (!fields[2]) {
      continue; // trailing grand-total row, not an error
    }

    rows.push({
      stockId: fields[2],
      stockName: fields[3],
      quantity: parseNumber(fields[8]),
      costPrice: parseNumber(fields[11]),
      currentPrice: parseNumber(fields[12]),
    });
  }

  return { rows, skipped };
}
