import type { DBSchema } from 'idb';

export type StoredSetting = {
  key: string;
  value: unknown;
};

export type MarketCacheRecord = {
  id: string;
  dataset: string;
  tradeDate: string;
  retrievedAt: string;
  payload: unknown;
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

export type AppSettings = {
  watchCategories: Array<{
    id: string;
    name: string;
    order: number;
  }>;
  profile: Record<string, unknown>;
};

export type StoredRecord = {
  id: string;
  [key: string]: unknown;
};

export type BackupPayload = {
  version: 1;
  createdAt: string;
  settings: StoredSetting[];
  transactions: StoredRecord[];
  marketCache: MarketCacheRecord[];
  researchSnapshots: StoredRecord[];
  holdingsSnapshots?: HoldingSnapshotRecord[];
};

export type LightweightExportPayload = Omit<BackupPayload, 'marketCache'>;

export interface DssDatabase extends DBSchema {
  settings: {
    key: string;
    value: StoredSetting;
  };
  transactions: {
    key: string;
    value: StoredRecord;
  };
  marketCache: {
    key: string;
    value: MarketCacheRecord;
  };
  researchSnapshots: {
    key: string;
    value: StoredRecord;
  };
  holdingsSnapshots: {
    key: string;
    value: HoldingSnapshotRecord;
  };
}
