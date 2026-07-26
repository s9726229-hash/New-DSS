import { describe, expect, it } from 'vitest';
import { toDailyCloseRecords, toInstitutionDailyRecords } from './normalize';
import type { FinMindInstitutionalRow, FinMindPriceRow } from './types';

function priceRow(overrides: Partial<FinMindPriceRow> = {}): FinMindPriceRow {
  return {
    date: '2024-03-01',
    stock_id: '0050',
    Trading_Volume: 1000,
    Trading_money: 100000,
    open: 100,
    max: 101,
    min: 99,
    close: 100,
    spread: 0,
    Trading_turnover: 500,
    ...overrides,
  };
}

function institutionalRow(overrides: Partial<FinMindInstitutionalRow> = {}): FinMindInstitutionalRow {
  return {
    date: '2024-03-01',
    stock_id: '0050',
    name: 'Foreign_Investor',
    buy: 600,
    sell: 400,
    ...overrides,
  };
}

describe('toDailyCloseRecords', () => {
  it('maps date and close from each price row', () => {
    const rows = [priceRow({ date: '2024-03-01', close: 100 }), priceRow({ date: '2024-03-02', close: 105 })];

    expect(toDailyCloseRecords(rows)).toEqual([
      { date: '2024-03-01', close: 100 },
      { date: '2024-03-02', close: 105 },
    ]);
  });
});

describe('toInstitutionDailyRecords', () => {
  it('computes net shares from buy minus sell, joined to that stock\'s own trading volume', () => {
    const prices = [priceRow({ date: '2024-03-01', Trading_Volume: 1000 })];
    const institutional = [institutionalRow({ date: '2024-03-01', buy: 600, sell: 400 })];

    const result = toInstitutionDailyRecords(prices, institutional, 'Foreign_Investor');

    expect(result).toEqual([{ date: '2024-03-01', netShares: 200, totalVolume: 1000 }]);
  });

  it('filters out rows belonging to a different institution name', () => {
    const prices = [priceRow({ date: '2024-03-01', Trading_Volume: 1000 })];
    const institutional = [
      institutionalRow({ date: '2024-03-01', name: 'Foreign_Investor', buy: 600, sell: 400 }),
      institutionalRow({ date: '2024-03-01', name: 'Investment_Trust', buy: 100, sell: 900 }),
    ];

    const result = toInstitutionDailyRecords(prices, institutional, 'Investment_Trust');

    expect(result).toEqual([{ date: '2024-03-01', netShares: -800, totalVolume: 1000 }]);
  });

  it('falls back to zero volume when no matching price row exists for that date', () => {
    const institutional = [institutionalRow({ date: '2024-03-05', buy: 100, sell: 50 })];

    const result = toInstitutionDailyRecords([], institutional, 'Foreign_Investor');

    expect(result).toEqual([{ date: '2024-03-05', netShares: 50, totalVolume: 0 }]);
  });
});
