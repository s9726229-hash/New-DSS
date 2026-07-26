import type {
  CsvPreview,
  HoldingsCsvPreview,
  ImportedHolding,
  ImportedTransaction,
  TransactionCsvPreview,
} from './types';

type CsvRow = string[];

function tokenizeCsv(text: string): CsvRow[] {
  const rows: CsvRow[] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function createColumnMap(headers: CsvRow): Map<string, number> {
  return new Map(
    headers.map((header, index) => [header.replace(/^\uFEFF/, '').trim(), index]),
  );
}

function getCell(row: CsvRow, columns: Map<string, number>, name: string): string {
  const index = columns.get(name);
  return index === undefined ? '' : (row[index] ?? '').trim();
}

function parseNumber(value: string): number | null {
  const normalized = value.replaceAll(',', '').trim();
  if (!normalized) return null;

  const result = Number(normalized);
  return Number.isFinite(result) ? result : null;
}

function parseDate(value: string): string | null {
  const match = value.trim().match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (!match) return null;

  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;

  return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
}

function findBrokerReference(row: CsvRow): string | undefined {
  const candidate = [...row]
    .reverse()
    .map((value) => value.trim())
    .find((value) => Boolean(value));

  return candidate && /^[A-Za-z0-9]{6,}$/.test(candidate) ? candidate : undefined;
}

function parseRows<T>(
  text: string,
  parseRow: (row: CsvRow, columns: Map<string, number>, line: number) =>
    | { value: T }
    | { reason: string }
    | null,
): CsvPreview<T> {
  const [headerRow, ...dataRows] = tokenizeCsv(text);
  const columns = createColumnMap(headerRow ?? []);
  const rows: T[] = [];
  const skipped: CsvPreview<T>['skipped'] = [];

  dataRows.forEach((row, index) => {
    const line = index + 2;
    const result = parseRow(row, columns, line);

    if (!result) return;
    if ('reason' in result) {
      skipped.push({ line, reason: result.reason });
      return;
    }

    rows.push(result.value);
  });

  return { rows, skipped };
}

export function parseTransactionCsv(text: string): TransactionCsvPreview {
  return parseRows<ImportedTransaction>(text, (row, columns, sourceLine) => {
    const tradeDateValue = getCell(row, columns, '成交日期');

    if (!tradeDateValue && row.every((cell) => !cell.trim())) return null;
    if (tradeDateValue.includes('小計')) return { reason: '小計列' };

    const tradeDate = parseDate(tradeDateValue);
    const stockId = getCell(row, columns, '股票代號');
    const sideValue = getCell(row, columns, '買賣別');
    const quantity = parseNumber(getCell(row, columns, '成交數量'));
    const price = parseNumber(getCell(row, columns, '成交價'));

    if (!tradeDate) return { reason: '成交日期格式無效' };
    if (!stockId) return { reason: '缺少股票代號' };
    if (sideValue !== '買' && sideValue !== '賣') return { reason: '買賣別無效' };
    if (quantity === null || quantity <= 0) return { reason: '成交數量無效' };
    if (price === null || price < 0) return { reason: '成交價無效' };

    const settlementDateValue = getCell(row, columns, '交割日');
    const fees = parseNumber(getCell(row, columns, '手續費')) ?? 0;
    const tax = parseNumber(getCell(row, columns, '交易稅')) ?? 0;

    const brokerReference = findBrokerReference(row);

    return {
      value: {
        sourceLine,
        tradeDate,
        settlementDate: settlementDateValue ? parseDate(settlementDateValue) : null,
        stockId,
        stockName: getCell(row, columns, '股票名稱'),
        side: sideValue === '買' ? 'buy' : 'sell',
        quantity,
        price,
        fees,
        tax,
        ...(brokerReference ? { brokerReference } : {}),
      },
    };
  });
}

export function parseHoldingsCsv(text: string): HoldingsCsvPreview {
  return parseRows<ImportedHolding>(text, (row, columns, sourceLine) => {
    if (row.every((cell) => !cell.trim())) return null;

    const stockId = getCell(row, columns, '股票代號');
    if (!stockId) return { reason: '缺少股票代號' };

    const quantity = parseNumber(getCell(row, columns, '合計庫存數量'));
    const costPrice = parseNumber(getCell(row, columns, '成本均價'));
    const currentPrice = parseNumber(getCell(row, columns, '現價'));

    if (quantity === null || quantity < 0) return { reason: '庫存數量無效' };
    if (costPrice === null || costPrice < 0) return { reason: '成本均價無效' };
    if (currentPrice === null || currentPrice < 0) return { reason: '現價無效' };

    return {
      value: {
        sourceLine,
        stockId,
        stockName: getCell(row, columns, '股票名稱'),
        quantity,
        costPrice,
        currentPrice,
      },
    };
  });
}
