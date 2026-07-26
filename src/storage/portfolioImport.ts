import type { HoldingSnapshotRecord, StoredRecord } from '../domain/types';
import type { ImportedHolding, ImportedTransaction } from '../import/types';
import { openDssDatabase } from './database';

function transactionId(row: ImportedTransaction): string {
  if (row.brokerReference) {
    return `broker-ref:${row.brokerReference}`;
  }

  return [
    'broker',
    row.tradeDate,
    row.stockId,
    row.side,
    row.quantity,
    row.price,
    row.settlementDate ?? 'none',
    row.fees,
    row.tax,
  ].join(':');
}

export type TransactionImportFilterResult = {
  rows: ImportedTransaction[];
  duplicateCount: number;
};

function matchesTransactionContent(
  existing: Partial<ImportedTransaction>,
  candidate: ImportedTransaction,
): boolean {
  if (existing.brokerReference && candidate.brokerReference) {
    return existing.brokerReference === candidate.brokerReference;
  }

  return (
    existing.tradeDate === candidate.tradeDate &&
    existing.stockId === candidate.stockId &&
    existing.side === candidate.side &&
    existing.quantity === candidate.quantity &&
    existing.price === candidate.price &&
    existing.settlementDate === candidate.settlementDate &&
    existing.fees === candidate.fees &&
    existing.tax === candidate.tax
  );
}

export async function filterKnownTransactions(
  rows: ImportedTransaction[],
): Promise<TransactionImportFilterResult> {
  const db = await openDssDatabase();

  try {
    const existingRecords = await db.getAll('transactions');
    const knownIds = new Set(existingRecords.map((record) => record.id));
    const knownRows = existingRecords as Array<Partial<ImportedTransaction>>;
    const newRows: ImportedTransaction[] = [];
    let duplicateCount = 0;

    for (const row of rows) {
      const id = transactionId(row);

      if (knownIds.has(id) || knownRows.some((knownRow) => matchesTransactionContent(knownRow, row))) {
        duplicateCount += 1;
        continue;
      }

      knownIds.add(id);
      knownRows.push(row);
      newRows.push(row);
    }

    return { rows: newRows, duplicateCount };
  } finally {
    db.close();
  }
}

export async function persistConfirmedTransactions(
  rows: ImportedTransaction[],
  importedAt: string,
): Promise<void> {
  const db = await openDssDatabase();

  try {
    const transaction = db.transaction('transactions', 'readwrite');

    await Promise.all(
      rows.map((row) =>
        transaction.store.put({
          id: transactionId(row),
          ...row,
          importedAt,
        } satisfies StoredRecord),
      ),
    );
    await transaction.done;
  } finally {
    db.close();
  }
}

export async function persistConfirmedHoldings(
  rows: ImportedHolding[],
  snapshotDate: string,
  importedAt: string,
): Promise<void> {
  const db = await openDssDatabase();

  try {
    const transaction = db.transaction('holdingsSnapshots', 'readwrite');
    const existingRows = await transaction.store.getAll();

    await Promise.all(
      [
        ...existingRows
          .filter((row) => row.snapshotDate === snapshotDate)
          .map((row) => transaction.store.delete(row.id)),
        ...rows.map((row) =>
        transaction.store.put({
          id: `holdings:${snapshotDate}:${row.stockId}`,
          snapshotDate,
          stockId: row.stockId,
          stockName: row.stockName,
          quantity: row.quantity,
          costPrice: row.costPrice,
          currentPrice: row.currentPrice,
          importedAt,
        } satisfies HoldingSnapshotRecord),
        ),
      ],
    );
    await transaction.done;
  } finally {
    db.close();
  }
}
