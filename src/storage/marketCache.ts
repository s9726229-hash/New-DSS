import { openDssDatabase } from './database';

export async function cacheDataset(
  dataset: string,
  stockId: string,
  rows: unknown[],
  retrievedAt: string,
): Promise<void> {
  const db = await openDssDatabase();

  try {
    await db.put('marketCache', {
      id: `${dataset}:${stockId}`,
      dataset,
      stockId,
      tradeDate: rows.length > 0 ? String((rows.at(-1) as { date?: string }).date ?? '') : '',
      retrievedAt,
      payload: rows,
    });
  } finally {
    db.close();
  }
}

export async function getCachedDataset<T>(dataset: string, stockId: string): Promise<T[]> {
  const db = await openDssDatabase();

  try {
    const record = await db.get('marketCache', `${dataset}:${stockId}`);
    return (record?.payload as T[] | undefined) ?? [];
  } finally {
    db.close();
  }
}
