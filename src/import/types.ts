export type CsvSkippedRow = {
  line: number;
  reason: string;
};

export type CsvPreview<T> = {
  rows: T[];
  skipped: CsvSkippedRow[];
};

export type ImportedTransaction = {
  sourceLine: number;
  tradeDate: string;
  settlementDate: string | null;
  stockId: string;
  stockName: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  fees: number;
  tax: number;
  brokerReference?: string;
};

export type ImportedHolding = {
  sourceLine: number;
  stockId: string;
  stockName: string;
  quantity: number;
  costPrice: number;
  currentPrice: number;
};

export type TransactionCsvPreview = CsvPreview<ImportedTransaction>;
export type HoldingsCsvPreview = CsvPreview<ImportedHolding>;
