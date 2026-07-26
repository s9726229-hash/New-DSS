export type ImportedTransaction = {
  tradeDate: string;
  stockId: string;
  stockName: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  fees: number;
  tax: number;
  settlementDate: string | null;
  brokerReference: string | null;
};

export type ImportedHolding = {
  stockId: string;
  stockName: string;
  quantity: number;
  costPrice: number;
  currentPrice: number;
};

export type SkippedRow = {
  line: number;
  reason: string;
};

export type TransactionCsvPreview = {
  rows: ImportedTransaction[];
  skipped: SkippedRow[];
};

export type HoldingsCsvPreview = {
  rows: ImportedHolding[];
  skipped: SkippedRow[];
};
