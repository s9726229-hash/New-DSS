import type {
  DailyCloseRecord,
  FinMindInstitutionalTradeRow,
  FinMindPriceRow,
  InstitutionDailyRecord,
} from './types';

export type InstitutionKind = 'foreign' | 'trust';

const institutionName: Record<InstitutionKind, string> = {
  foreign: 'Foreign_Investor',
  trust: 'Investment_Trust',
};

export function toDailyCloseRecords(prices: FinMindPriceRow[]): DailyCloseRecord[] {
  return prices
    .map((price) => ({ date: price.date, close: price.close }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function toInstitutionDailyRecords(
  prices: FinMindPriceRow[],
  trades: FinMindInstitutionalTradeRow[],
  institution: InstitutionKind,
): InstitutionDailyRecord[] {
  const volumeByDate = new Map(prices.map((price) => [price.date, price.Trading_Volume]));
  const netSharesByDate = new Map<string, number>();

  for (const trade of trades) {
    if (trade.name !== institutionName[institution] || !volumeByDate.has(trade.date)) continue;

    netSharesByDate.set(
      trade.date,
      (netSharesByDate.get(trade.date) ?? 0) + trade.buy - trade.sell,
    );
  }

  return [...netSharesByDate.entries()]
    .map(([date, netShares]) => ({
      date,
      netShares,
      totalVolume: volumeByDate.get(date) ?? 0,
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
}
