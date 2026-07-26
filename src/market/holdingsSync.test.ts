import { expect, test, vi } from 'vitest';

import { syncLatestHoldings, type HoldingsSyncDependencies } from './holdingsSync';
import type {
  FinMindInstitutionalTradeRow,
  FinMindPriceRow,
} from './types';

const holding = {
  id: 'holdings:2026-07-25:2330',
  snapshotDate: '2026-07-25',
  stockId: '2330',
  stockName: '台積電',
  quantity: 1_000,
  costPrice: 1_000,
  currentPrice: 1_100,
  importedAt: '2026-07-26T06:00:00.000Z',
};

function prices(count = 60): FinMindPriceRow[] {
  return Array.from({ length: count }, (_, index) => ({
    date: `2026-05-${String(index + 1).padStart(2, '0')}`,
    stock_id: '2330',
    Trading_Volume: 1_000,
    Trading_money: 0,
    open: 1_000,
    max: 1_000,
    min: 1_000,
    close: 1_000,
    spread: 0,
    Trading_turnover: 0,
  }));
}

function trades(): FinMindInstitutionalTradeRow[] {
  return Array.from({ length: 5 }, (_, index) => {
    const date = `2026-05-${String(index + 1).padStart(2, '0')}`;
    return [
      { date, stock_id: '2330', name: 'Foreign_Investor', buy: 100, sell: 50 },
      { date, stock_id: '2330', name: 'Investment_Trust', buy: 80, sell: 50 },
    ];
  }).flat();
}

function dependencies(overrides: Partial<HoldingsSyncDependencies> = {}): HoldingsSyncDependencies {
  return {
    now: () => new Date('2026-07-26T00:00:00.000Z'),
    readToken: () => 'local-token',
    getHoldings: async () => [holding],
    fetchPrices: async () => prices(),
    fetchTrades: async () => trades(),
    cache: async () => undefined,
    ...overrides,
  };
}

test('blocks before any request when no FinMind token is available', async () => {
  const fetchPrices = vi.fn();
  const fetchTrades = vi.fn();

  const result = await syncLatestHoldings(
    dependencies({ readToken: () => null, fetchPrices, fetchTrades }),
  );

  expect(result).toEqual({ kind: 'missingToken', snapshotDate: '2026-07-25', stocks: [] });
  expect(fetchPrices).not.toHaveBeenCalled();
  expect(fetchTrades).not.toHaveBeenCalled();
});

test('blocks when no current holdings snapshot is available', async () => {
  const fetchPrices = vi.fn();

  const result = await syncLatestHoldings(dependencies({ getHoldings: async () => [], fetchPrices }));

  expect(result).toEqual({ kind: 'missingHoldings', snapshotDate: null, stocks: [] });
  expect(fetchPrices).not.toHaveBeenCalled();
});

test('continues with later holdings after one stock API request fails', async () => {
  const secondHolding = { ...holding, stockId: '2330', stockName: '台積電' };
  const cache = vi.fn(async () => undefined);

  const result = await syncLatestHoldings(
    dependencies({
      getHoldings: async () => [{ ...holding, stockId: '1101', stockName: '台泥' }, secondHolding],
      fetchPrices: async (request) => {
        if (request.stockId === '1101') throw new Error('FinMind request failed (401)');
        return prices();
      },
      cache,
    }),
  );

  expect(result.stocks).toEqual([
    expect.objectContaining({ stockId: '1101', status: 'failed', message: 'FinMind request failed (401)' }),
    expect.objectContaining({ stockId: '2330', status: 'ready', technicalReady: true, chipReady: true }),
  ]);
  expect(cache).toHaveBeenCalledWith(
    'TaiwanStockPriceAdj',
    '2330',
    expect.arrayContaining([expect.objectContaining({ stock_id: '2330' })]),
    expect.any(String),
  );
});

test('reports technical data as incomplete when fewer than 60 price rows are returned', async () => {
  const result = await syncLatestHoldings(dependencies({ fetchPrices: async () => prices(59) }));

  expect(result.stocks[0]).toMatchObject({
    stockId: '2330',
    status: 'incomplete',
    technicalReady: false,
    chipReady: true,
    message: '技術資料不足，無法計算 60MA',
  });
});

test('does not cache an empty institutional response and reports incomplete chip data', async () => {
  const cache = vi.fn(async () => undefined);

  const result = await syncLatestHoldings(dependencies({ fetchTrades: async () => [], cache }));

  expect(result.stocks[0]).toMatchObject({
    status: 'incomplete',
    technicalReady: true,
    chipReady: false,
    message: '法人資料不足，無法計算五日狀態',
  });
  expect(cache).not.toHaveBeenCalledWith(
    'TaiwanStockInstitutionalInvestorsBuySell',
    '2330',
    [],
    expect.any(String),
  );
});
