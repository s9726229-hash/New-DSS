import { afterEach, describe, expect, it } from 'vitest';
import { DATABASE_NAME, openDssDatabase } from './database';
import { getLatestHoldings } from './holdings';
import type { HoldingSnapshotRecord } from './types';

async function deleteDatabase(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
}

afterEach(async () => {
  await deleteDatabase();
});

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

describe('getLatestHoldings', () => {
  it('returns an empty array when there are no holdings', async () => {
    expect(await getLatestHoldings()).toEqual([]);
  });

  it('returns only the rows for the most recent snapshot date', async () => {
    const db = await openDssDatabase();
    await db.put('holdingsSnapshots', holding({ id: 'a', snapshotDate: '2024-02-01', stockId: '0056' }));
    await db.put('holdingsSnapshots', holding({ id: 'b', snapshotDate: '2024-03-01', stockId: '0050' }));
    await db.put('holdingsSnapshots', holding({ id: 'c', snapshotDate: '2024-03-01', stockId: '0056' }));
    db.close();

    const latest = await getLatestHoldings();

    expect(latest).toHaveLength(2);
    expect(latest.every((row) => row.snapshotDate === '2024-03-01')).toBe(true);
  });
});
