import { createDailyDssSnapshot } from '../dss/dailySnapshot';
import type { InstitutionThresholds } from '../dss/types';
import { getLatestHoldings } from '../storage/holdings';
import { cacheDataset } from '../storage/marketCache';
import type { HoldingSnapshotRecord } from '../storage/types';
import { fetchDailyPrices, fetchInstitutionalTrades } from './finmindClient';
import { toDailyCloseRecords, toInstitutionDailyRecords } from './normalize';
import type { FinMindInstitutionalRow, FinMindPriceRow } from './types';

const DEFAULT_INSTITUTION_THRESHOLDS: InstitutionThresholds = { accumulating: 0, selling: 0 };

export type StockSyncResult = {
  stockId: string;
  stockName: string;
  status: 'ready' | 'incomplete' | 'failed';
  priceDate: string | null;
  institutionalDate: string | null;
  message: string;
};

export type HoldingsSyncResult = {
  kind: 'missingHoldings' | 'completed';
  snapshotDate: string | null;
  stocks: StockSyncResult[];
};

export type HoldingsSyncDependencies = {
  now: () => Date;
  getHoldings: () => Promise<HoldingSnapshotRecord[]>;
  fetchPrices: (request: { stockId: string; startDate: string; endDate: string }) => Promise<FinMindPriceRow[]>;
  fetchTrades: (request: { stockId: string; startDate: string; endDate: string }) => Promise<FinMindInstitutionalRow[]>;
  cache: (dataset: string, stockId: string, rows: unknown[], retrievedAt: string) => Promise<void>;
};

const defaults: HoldingsSyncDependencies = {
  now: () => new Date(),
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

async function syncHolding(
  holding: HoldingSnapshotRecord,
  priceStartDate: string,
  institutionalStartDate: string,
  endDate: string,
  dependencies: HoldingsSyncDependencies,
  retrievedAt: string,
): Promise<StockSyncResult> {
  try {
    const [priceRows, institutionalRows] = await Promise.all([
      dependencies.fetchPrices({ stockId: holding.stockId, startDate: priceStartDate, endDate }),
      dependencies.fetchTrades({ stockId: holding.stockId, startDate: institutionalStartDate, endDate }),
    ]);

    if (priceRows.length > 0) {
      await dependencies.cache('TaiwanStockPriceAdj', holding.stockId, priceRows, retrievedAt);
    }
    if (institutionalRows.length > 0) {
      await dependencies.cache(
        'TaiwanStockInstitutionalInvestorsBuySell',
        holding.stockId,
        institutionalRows,
        retrievedAt,
      );
    }

    const prices = toDailyCloseRecords(priceRows);
    const foreign = toInstitutionDailyRecords(priceRows, institutionalRows, 'Foreign_Investor');
    const trust = toInstitutionDailyRecords(priceRows, institutionalRows, 'Investment_Trust');

    const snapshot = createDailyDssSnapshot({
      prices,
      foreign,
      trust,
      foreignThresholds: DEFAULT_INSTITUTION_THRESHOLDS,
      trustThresholds: DEFAULT_INSTITUTION_THRESHOLDS,
    });

    const technicalReady = snapshot.technical !== null;
    const chipReady = snapshot.chip.foreign.status === 'ready' && snapshot.chip.trust.status === 'ready';
    const messages: string[] = [];

    if (!technicalReady) messages.push('技術資料不足，無法計算 60MA');
    if (!chipReady) messages.push('法人資料不足，無法計算五日狀態');

    return {
      stockId: holding.stockId,
      stockName: holding.stockName,
      status: technicalReady && chipReady ? 'ready' : 'incomplete',
      priceDate: snapshot.dataDates.prices,
      institutionalDate: snapshot.dataDates.foreign,
      message: messages.length > 0 ? messages.join('；') : '資料完整，可進行後續 DSS 計算',
    };
  } catch (error) {
    return {
      stockId: holding.stockId,
      stockName: holding.stockName,
      status: 'failed',
      priceDate: null,
      institutionalDate: null,
      message: error instanceof Error ? error.message : '同步失敗',
    };
  }
}

export async function syncLatestHoldings(
  overrides: Partial<HoldingsSyncDependencies> = {},
): Promise<HoldingsSyncResult> {
  const dependencies = { ...defaults, ...overrides };
  const holdings = await dependencies.getHoldings();

  if (holdings.length === 0) {
    return { kind: 'missingHoldings', snapshotDate: null, stocks: [] };
  }

  const now = dependencies.now();
  const endDate = formatDate(now);
  const priceStartDate = formatDate(daysBefore(now, 365));
  const institutionalStartDate = formatDate(daysBefore(now, 20));
  const retrievedAt = now.toISOString();
  const stocks: StockSyncResult[] = [];

  for (const holding of holdings) {
    stocks.push(
      await syncHolding(holding, priceStartDate, institutionalStartDate, endDate, dependencies, retrievedAt),
    );
  }

  return { kind: 'completed', snapshotDate: holdings[0].snapshotDate, stocks };
}
