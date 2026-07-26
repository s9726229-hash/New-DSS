import { afterEach, expect, test } from 'vitest';
import { deleteDB } from 'idb';

import {
  filterKnownTransactions,
  persistConfirmedHoldings,
  persistConfirmedTransactions,
} from './portfolioImport';
import { createCompleteBackup } from './backup';
import { openDssDatabase } from './database';

afterEach(async () => {
  await deleteDB('new-dss');
});

const transaction = {
  sourceLine: 2,
  tradeDate: '2026-07-02',
  settlementDate: '2026-07-06',
  stockId: '1101',
  stockName: '測試公司',
  side: 'buy' as const,
  quantity: 1000,
  price: 42.5,
  fees: 20,
  tax: 0,
};

const holding = {
  sourceLine: 2,
  stockId: '1101',
  stockName: '測試公司',
  quantity: 1000,
  costPrice: 40.5,
  currentPrice: 42.5,
};

const priorHolding = {
  ...holding,
  stockId: '1102',
  stockName: '另一間測試公司',
};

test('persists confirmed transactions and holdings independently without duplicates', async () => {
  await persistConfirmedTransactions([transaction], '2026-07-26T06:00:00.000Z');
  await persistConfirmedTransactions([transaction], '2026-07-26T06:00:00.000Z');
  await persistConfirmedHoldings(
    [priorHolding],
    '2026-07-18',
    '2026-07-26T06:00:00.000Z',
  );
  await persistConfirmedHoldings(
    [holding],
    '2026-07-18',
    '2026-07-26T06:00:00.000Z',
  );

  const db = await openDssDatabase();
  const transactionId = 'broker:2026-07-02:1101:buy:1000:42.5:2026-07-06:20:0';

  try {
    await expect(db.get('transactions', transactionId)).resolves.toMatchObject({
      stockId: '1101',
      importedAt: '2026-07-26T06:00:00.000Z',
    });
    await expect(db.getAll('transactions')).resolves.toHaveLength(1);
    await expect(db.get('holdingsSnapshots', 'holdings:2026-07-18:1101')).resolves.toMatchObject({
      quantity: 1000,
      currentPrice: 42.5,
    });
    await expect(db.get('holdingsSnapshots', 'holdings:2026-07-18:1102')).resolves.toBeUndefined();
    await expect(db.getAll('holdingsSnapshots')).resolves.toHaveLength(1);

    const backup = await createCompleteBackup();
    expect(backup.holdingsSnapshots ?? []).toHaveLength(1);
  } finally {
    db.close();
  }
});

test('removes transactions already identified by the broker reference before confirmation', async () => {
  const identifiedTransaction = { ...transaction, brokerReference: 'J01tj0000' };
  const repeatedExportRow = {
    ...identifiedTransaction,
    sourceLine: 18,
  };

  await persistConfirmedTransactions([identifiedTransaction], '2026-07-26T06:00:00.000Z');

  await expect(filterKnownTransactions([repeatedExportRow])).resolves.toEqual({
    rows: [],
    duplicateCount: 1,
  });
});

test('recognizes a prior legacy transaction by its transaction content', async () => {
  await persistConfirmedTransactions([transaction], '2026-07-26T06:00:00.000Z');

  await expect(
    filterKnownTransactions([{ ...transaction, sourceLine: 18, brokerReference: 'J01tj0000' }]),
  ).resolves.toEqual({
    rows: [],
    duplicateCount: 1,
  });
});
