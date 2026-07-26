import type { FinMindDataset, FinMindRawRow } from './types';
import { openDssDatabase } from '../storage/database';

export async function cacheDataset(
  dataset: FinMindDataset,
  stockId: string,
  rows: FinMindRawRow[],
  retrievedAt: string,
): Promise<void> {
  const db = await openDssDatabase();

  try {
    const transaction = db.transaction('marketCache', 'readwrite');

    await Promise.all(
      rows.map((row) =>
        transaction.store.put({
          id: `${dataset}:${stockId}:${row.date}`,
          dataset,
          tradeDate: row.date,
          retrievedAt,
          payload: row,
        }),
      ),
    );
    await transaction.done;
  } finally {
    db.close();
  }
}

export async function getLatestCacheDate(
  dataset: FinMindDataset,
  stockId: string,
): Promise<string | null> {
  const db = await openDssDatabase();

  try {
    return (await db.getAll('marketCache'))
      .filter(
        (record) =>
          record.dataset === dataset && record.id.startsWith(`${dataset}:${stockId}:`),
      )
      .map((record) => record.tradeDate)
      .sort()
      .at(-1) ?? null;
  } finally {
    db.close();
  }
}
