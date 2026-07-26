import type { DBSchema } from 'idb';

export type TransactionSide = 'buy' | 'sell';

export type StoredTransaction = {
  id: string;
  tradeDate: string;
  stockId: string;
  stockName: string;
  side: TransactionSide;
  quantity: number;
  price: number;
  fees: number;
  tax: number;
  settlementDate: string | null;
  brokerReference: string | null;
  importedAt: string;
};

export type HoldingSnapshotRecord = {
  id: string;
  snapshotDate: string;
  stockId: string;
  stockName: string;
  quantity: number;
  costPrice: number;
  currentPrice: number;
  importedAt: string;
};

export type StoredSetting = {
  key: string;
  value: unknown;
};

export type MarketCacheRecord = {
  id: string;
  dataset: string;
  stockId: string;
  tradeDate: string;
  retrievedAt: string;
  payload: unknown;
};

export type BackupPayload = {
  version: 1;
  createdAt: string;
  settings: StoredSetting[];
  transactions: StoredTransaction[];
  holdingsSnapshots: HoldingSnapshotRecord[];
  marketCache: MarketCacheRecord[];
};

export type LightweightExportPayload = Omit<BackupPayload, 'marketCache'>;

export interface DssDatabase extends DBSchema {
  settings: {
    key: string;
    value: StoredSetting;
  };
  transactions: {
    key: string;
    value: StoredTransaction;
  };
  holdingsSnapshots: {
    key: string;
    value: HoldingSnapshotRecord;
  };
  marketCache: {
    key: string;
    value: MarketCacheRecord;
  };
}
