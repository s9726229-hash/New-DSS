import { afterEach, expect, test } from 'vitest';
import { deleteDB } from 'idb';

import { persistConfirmedHoldings } from './portfolioImport';
import { getLatestHoldings } from './holdings';

const importedAt = '2026-07-26T06:00:00.000Z';

const holding1101 = {
  sourceLine: 2,
  stockId: '1101',
  stockName: '台泥',
  quantity: 1_000,
  costPrice: 40,
  currentPrice: 42,
};

const holding1102 = {
  ...holding1101,
  stockId: '1102',
  stockName: '亞泥',
};

const holding2330 = {
  ...holding1101,
  stockId: '2330',
  stockName: '台積電',
};

afterEach(async () => {
  await deleteDB('new-dss');
});

test('returns only the newest snapshot holdings sorted by stock id', async () => {
  await persistConfirmedHoldings([holding1102], '2026-07-18', importedAt);
  await persistConfirmedHoldings([holding2330, holding1101], '2026-07-25', importedAt);

  await expect(getLatestHoldings()).resolves.toEqual([
    expect.objectContaining({ stockId: '1101', snapshotDate: '2026-07-25' }),
    expect.objectContaining({ stockId: '2330', snapshotDate: '2026-07-25' }),
  ]);
});

test('returns an empty array when no holdings snapshot has been imported', async () => {
  await expect(getLatestHoldings()).resolves.toEqual([]);
});
