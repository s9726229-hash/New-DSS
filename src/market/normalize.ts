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
  const volumeByDateAndStock = new Map(
    priceRows.map((row) => [`${row.date}|${row.stock_id}`, row.Trading_Volume]),
  );

  return institutionalRows
    .filter((row) => row.name === institutionName)
    .map((row) => ({
      date: row.date,
      netShares: row.buy - row.sell,
      totalVolume: volumeByDateAndStock.get(`${row.date}|${row.stock_id}`) ?? 0,
    }));
}
