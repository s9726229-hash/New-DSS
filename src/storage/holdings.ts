import { openDssDatabase } from './database';
import type { HoldingSnapshotRecord } from './types';

export async function getLatestHoldings(): Promise<HoldingSnapshotRecord[]> {
  const db = await openDssDatabase();

  try {
    const all = await db.getAll('holdingsSnapshots');
    const latestDate = all.map((row) => row.snapshotDate).sort().at(-1);

    if (!latestDate) return [];

    return all.filter((row) => row.snapshotDate === latestDate);
  } finally {
    db.close();
  }
}
