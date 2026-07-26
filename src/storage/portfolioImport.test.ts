import { afterEach, describe, expect, it } from 'vitest';
import { DATABASE_NAME, openDssDatabase } from './database';
import {
  filterKnownTransactions,
  persistConfirmedHoldings,
  persistConfirmedTransactions,
} from './portfolioImport';
import type { ImportedHolding, ImportedTransaction } from '../import/types';

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

function transaction(overrides: Partial<ImportedTransaction> = {}): ImportedTransaction {
  return {
    tradeDate: '2024-03-01',
    stockId: '0050',
    stockName: '元大台灣50',
    side: 'buy',
    quantity: 1000,
    price: 100,
    fees: 80,
    tax: 0,
    settlementDate: '2024-03-05',
    brokerReference: 'X00000001',
    ...overrides,
  };
}

describe('filterKnownTransactions', () => {
  it('reports zero duplicates against an empty database', async () => {
    const result = await filterKnownTransactions([transaction()]);

    expect(result.rows).toHaveLength(1);
    expect(result.duplicateCount).toBe(0);
  });

  it('filters out a transaction already persisted with the same broker reference', async () => {
    await persistConfirmedTransactions([transaction()], '2024-03-06T00:00:00.000Z');

    const result = await filterKnownTransactions([transaction()]);

    expect(result.rows).toHaveLength(0);
    expect(result.duplicateCount).toBe(1);
  });

  it('falls back to content comparison when broker reference is missing', async () => {
    const withoutReference = transaction({ brokerReference: null });
    await persistConfirmedTransactions([withoutReference], '2024-03-06T00:00:00.000Z');

    const result = await filterKnownTransactions([withoutReference]);

    expect(result.rows).toHaveLength(0);
    expect(result.duplicateCount).toBe(1);
  });

  it('keeps a transaction that differs in quantity even with no broker reference', async () => {
    const original = transaction({ brokerReference: null, quantity: 1000 });
    await persistConfirmedTransactions([original], '2024-03-06T00:00:00.000Z');

    const result = await filterKnownTransactions([
      transaction({ brokerReference: null, quantity: 500 }),
    ]);

    expect(result.rows).toHaveLength(1);
    expect(result.duplicateCount).toBe(0);
  });
});

describe('persistConfirmedHoldings', () => {
  function holding(overrides: Partial<ImportedHolding> = {}): ImportedHolding {
    return {
      stockId: '0050',
      stockName: '元大台灣50',
      quantity: 1000,
      costPrice: 100,
      currentPrice: 105.5,
      ...overrides,
    };
  }

  it('replaces existing rows for the same snapshot date rather than appending', async () => {
    await persistConfirmedHoldings(
      [holding({ quantity: 1000 })],
      '2024-03-01',
      '2024-03-01T00:00:00.000Z',
    );
    await persistConfirmedHoldings(
      [holding({ quantity: 2000 })],
      '2024-03-01',
      '2024-03-02T00:00:00.000Z',
    );

    const db = await openDssDatabase();
    const rows = (await db.getAll('holdingsSnapshots')).filter(
      (row) => row.snapshotDate === '2024-03-01',
    );
    db.close();

    expect(rows).toHaveLength(1);
    expect(rows[0].quantity).toBe(2000);
  });
});
