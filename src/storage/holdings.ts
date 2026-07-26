import type { HoldingSnapshotRecord } from '../domain/types';
import { openDssDatabase } from './database';

export async function getLatestHoldings(): Promise<HoldingSnapshotRecord[]> {
  const db = await openDssDatabase();

  try {
    const records = await db.getAll('holdingsSnapshots');
    const latestDate = records.map((record) => record.snapshotDate).sort().at(-1);

    if (!latestDate) return [];

    return [...new Map(
      records
        .filter((record) => record.snapshotDate === latestDate)
        .map((record) => [record.stockId, record]),
    ).values()].sort((left, right) => left.stockId.localeCompare(right.stockId));
  } finally {
    db.close();
  }
}
