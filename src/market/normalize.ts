import type { DailyCloseRecord, InstitutionDailyRecord } from '../dss/types';
import type { FinMindInstitutionalRow, FinMindPriceRow } from './types';

export function toDailyCloseRecords(rows: FinMindPriceRow[]): DailyCloseRecord[] {
  return rows.map((row) => ({ date: row.date, close: row.close }));
}

export function toInstitutionDailyRecords(
  priceRows: FinMindPriceRow[],
  institutionalRows: FinMindInstitutionalRow[],
  institutionName: string,
): InstitutionDailyRecord[] {
  const volumeByDate = new Map(priceRows.map((row) => [row.date, row.Trading_Volume]));

  return institutionalRows
    .filter((row) => row.name === institutionName)
    .map((row) => ({
      date: row.date,
      netShares: row.buy - row.sell,
      totalVolume: volumeByDate.get(row.date) ?? 0,
    }));
}
