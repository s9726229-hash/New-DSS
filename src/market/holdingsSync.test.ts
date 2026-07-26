import { describe, expect, it, vi } from 'vitest';
import { syncLatestHoldings } from './holdingsSync';
import type { HoldingSnapshotRecord } from '../storage/types';
import type { FinMindInstitutionalRow, FinMindPriceRow } from './types';

function holding(overrides: Partial<HoldingSnapshotRecord> = {}): HoldingSnapshotRecord {
  return {
    id: 'holdings:2024-03-01:0050',
    snapshotDate: '2024-03-01',
    stockId: '0050',
    stockName: '元大台灣50',
    quantity: 1000,
    costPrice: 100,
    currentPrice: 105,
    importedAt: '2024-03-01T00:00:00.000Z',
    ...overrides,
  };
}

function flatPriceRows(count: number): FinMindPriceRow[] {
  const startDate = new Date('2024-01-01T00:00:00Z');
  return new Array(count).fill(0).map((_, index) => {
    const date = new Date(startDate);
    date.setUTCDate(date.getUTCDate() + index);
    return {
      date: date.toISOString().slice(0, 10),
      stock_id: '0050',
      Trading_Volume: 1000,
      Trading_money: 100000,
      open: 100,
      max: 101,
      min: 99,
      close: 100,
      spread: 0,
      Trading_turnover: 500,
    };
  });
}

function flatInstitutionalRows(count: number, name: string): FinMindInstitutionalRow[] {
  const startDate = new Date('2024-01-01T00:00:00Z');
  return new Array(count).fill(0).map((_, index) => {
    const date = new Date(startDate);
    date.setUTCDate(date.getUTCDate() + index);
    return { date: date.toISOString().slice(0, 10), stock_id: '0050', name, buy: 0, sell: 0 };
  });
}

describe('syncLatestHoldings', () => {
  it('does not call the network when there are no holdings', async () => {
    const fetchPrices = vi.fn();
    const fetchTrades = vi.fn();

    const result = await syncLatestHoldings({
      getHoldings: async () => [],
      fetchPrices,
      fetchTrades,
    });

    expect(result.kind).toBe('missingHoldings');
    expect(fetchPrices).not.toHaveBeenCalled();
    expect(fetchTrades).not.toHaveBeenCalled();
  });

  it('marks a stock ready when both technical and chip data are sufficient', async () => {
    const cache = vi.fn(async () => {});

    const result = await syncLatestHoldings({
      getHoldings: async () => [holding()],
      fetchPrices: async () => flatPriceRows(60),
      fetchTrades: async () =>
        [
          ...flatInstitutionalRows(5, 'Foreign_Investor'),
          ...flatInstitutionalRows(5, 'Investment_Trust'),
        ],
      cache,
    });

    expect(result.kind).toBe('completed');
    expect(result.stocks).toHaveLength(1);
    expect(result.stocks[0].status).toBe('ready');
    expect(result.stocks[0].stockId).toBe('0050');
    expect(cache).toHaveBeenCalled();
  });

  it('marks a stock incomplete when there is not enough price history', async () => {
    const result = await syncLatestHoldings({
      getHoldings: async () => [holding()],
      fetchPrices: async () => flatPriceRows(10),
      fetchTrades: async () =>
        [
          ...flatInstitutionalRows(5, 'Foreign_Investor'),
          ...flatInstitutionalRows(5, 'Investment_Trust'),
        ],
    });

    expect(result.stocks[0].status).toBe('incomplete');
    expect(result.stocks[0].message).toContain('技術資料不足');
  });

  it('marks a stock failed when the network call throws, without stopping other stocks', async () => {
    const result = await syncLatestHoldings({
      getHoldings: async () => [holding({ id: 'a', stockId: '0050' }), holding({ id: 'b', stockId: '0056' })],
      fetchPrices: async (request) => {
        if (request.stockId === '0050') throw new Error('network down');
        return flatPriceRows(60);
      },
      fetchTrades: async () =>
        [
          ...flatInstitutionalRows(5, 'Foreign_Investor'),
          ...flatInstitutionalRows(5, 'Investment_Trust'),
        ],
    });

    expect(result.stocks).toHaveLength(2);
    expect(result.stocks.find((stock) => stock.stockId === '0050')?.status).toBe('failed');
    expect(result.stocks.find((stock) => stock.stockId === '0056')?.status).toBe('ready');
  });
});
