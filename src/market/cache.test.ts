import { afterEach, expect, test } from 'vitest';
import { deleteDB } from 'idb';

import { cacheDataset, getLatestCacheDate } from './cache';
import type { FinMindPriceRow } from './types';

const priceRows: FinMindPriceRow[] = [
  {
    date: '2026-07-23',
    stock_id: '2330',
    Trading_Volume: 1_000,
    Trading_money: 1_000_000,
    open: 1_000,
    max: 1_010,
    min: 990,
    close: 1_005,
    spread: 5,
    Trading_turnover: 100,
  },
  {
    date: '2026-07-24',
    stock_id: '2330',
    Trading_Volume: 1_100,
    Trading_money: 1_110_000,
    open: 1_005,
    max: 1_015,
    min: 1_000,
    close: 1_010,
    spread: 5,
    Trading_turnover: 110,
  },
];

afterEach(async () => {
  await deleteDB('new-dss');
});

test('returns the latest cached trade date for a stock dataset', async () => {
  await cacheDataset(
    'TaiwanStockPriceAdj',
    '2330',
    priceRows,
    '2026-07-26T06:00:00.000Z',
  );

  await expect(
    getLatestCacheDate('TaiwanStockPriceAdj', '2330'),
  ).resolves.toBe('2026-07-24');
});
