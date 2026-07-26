import type { HoldingSnapshotRecord } from '../domain/types';
import { readFinMindToken } from '../settings/finmindToken';
import { getLatestHoldings } from '../storage/holdings';
import { cacheDataset } from './cache';
import { fetchDailyPrices, fetchInstitutionalTrades } from './finmindClient';
import { toDailyCloseRecords, toInstitutionDailyRecords } from './normalize';
import type {
  FinMindDataset,
  FinMindInstitutionalTradeRow,
  FinMindPriceRow,
  FinMindRawRow,
} from './types';

export type StockSyncResult = {
  stockId: string;
  stockName: string;
  status: 'ready' | 'incomplete' | 'failed';
  priceDate: string | null;
  institutionalDate: string | null;
  technicalReady: boolean;
  chipReady: boolean;
  message: string;
};

export type HoldingsSyncResult = {
  kind: 'missingToken' | 'missingHoldings' | 'completed';
  snapshotDate: string | null;
  stocks: StockSyncResult[];
};

export type HoldingsSyncDependencies = {
  now: () => Date;
  readToken: () => string | null;
  getHoldings: () => Promise<HoldingSnapshotRecord[]>;
  fetchPrices: (request: {
    stockId: string;
    startDate: string;
    token: string;
  }) => Promise<FinMindPriceRow[]>;
  fetchTrades: (request: {
    stockId: string;
    startDate: string;
    token: string;
  }) => Promise<FinMindInstitutionalTradeRow[]>;
  cache: (
    dataset: FinMindDataset,
    stockId: string,
    rows: FinMindRawRow[],
    retrievedAt: string,
  ) => Promise<void>;
};

const defaults: HoldingsSyncDependencies = {
  now: () => new Date(),
  readToken: readFinMindToken,
  getHoldings: getLatestHoldings,
  fetchPrices: fetchDailyPrices,
  fetchTrades: fetchInstitutionalTrades,
  cache: cacheDataset,
};

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysBefore(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() - days);
  return result;
}

function latestDate(records: Array<{ date: string }>): string | null {
  return records.map((record) => record.date).sort().at(-1) ?? null;
}

function incompleteMessage(technicalReady: boolean, chipReady: boolean): string {
  const messages: string[] = [];

  if (!technicalReady) messages.push('技術資料不足，無法計算 60MA');
  if (!chipReady) messages.push('法人資料不足，無法計算五日狀態');

  return messages.join('；');
}

async function syncHolding(
  holding: HoldingSnapshotRecord,
  token: string,
  priceStartDate: string,
  institutionalStartDate: string,
  dependencies: HoldingsSyncDependencies,
  retrievedAt: string,
): Promise<StockSyncResult> {
  try {
    const [prices, trades] = await Promise.all([
      dependencies.fetchPrices({ stockId: holding.stockId, startDate: priceStartDate, token }),
      dependencies.fetchTrades({ stockId: holding.stockId, startDate: institutionalStartDate, token }),
    ]);

    if (prices.length > 0) {
      await dependencies.cache('TaiwanStockPriceAdj', holding.stockId, prices, retrievedAt);
    }

    if (trades.length > 0) {
      await dependencies.cache(
        'TaiwanStockInstitutionalInvestorsBuySell',
        holding.stockId,
        trades,
        retrievedAt,
      );
    }

    const technicalReady = toDailyCloseRecords(prices).length >= 60;
    const chipReady =
      toInstitutionDailyRecords(prices, trades, 'foreign').length >= 5 &&
      toInstitutionDailyRecords(prices, trades, 'trust').length >= 5;
    const status = technicalReady && chipReady ? 'ready' : 'incomplete';

    return {
      stockId: holding.stockId,
      stockName: holding.stockName,
      status,
      priceDate: latestDate(prices),
      institutionalDate: latestDate(trades),
      technicalReady,
      chipReady,
      message: status === 'ready' ? '資料完整，可進行後續 DSS 計算' : incompleteMessage(technicalReady, chipReady),
    };
  } catch (error) {
    return {
      stockId: holding.stockId,
      stockName: holding.stockName,
      status: 'failed',
      priceDate: null,
      institutionalDate: null,
      technicalReady: false,
      chipReady: false,
      message: error instanceof Error ? error.message : '同步失敗',
    };
  }
}

export async function syncLatestHoldings(
  overrides: Partial<HoldingsSyncDependencies> = {},
): Promise<HoldingsSyncResult> {
  const dependencies = { ...defaults, ...overrides };
  const holdings = await dependencies.getHoldings();
  const snapshotDate = holdings[0]?.snapshotDate ?? null;
  const token = dependencies.readToken();

  if (!token) return { kind: 'missingToken', snapshotDate, stocks: [] };
  if (holdings.length === 0) return { kind: 'missingHoldings', snapshotDate: null, stocks: [] };

  const now = dependencies.now();
  const retrievedAt = now.toISOString();
  const stocks: StockSyncResult[] = [];

  for (const holding of holdings) {
    stocks.push(
      await syncHolding(
        holding,
        token,
        formatDate(daysBefore(now, 365)),
        formatDate(daysBefore(now, 20)),
        dependencies,
        retrievedAt,
      ),
    );
  }

  return { kind: 'completed', snapshotDate, stocks };
}
