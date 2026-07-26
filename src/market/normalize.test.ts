import { expect, test } from 'vitest';

import { toDailyCloseRecords, toInstitutionDailyRecords } from './normalize';
import type { FinMindInstitutionalTradeRow, FinMindPriceRow } from './types';

function price(date: string, close: number, volume: number): FinMindPriceRow {
  return {
    date,
    stock_id: '2330',
    Trading_Volume: volume,
    Trading_money: 0,
    open: close,
    max: close,
    min: close,
    close,
    spread: 0,
    Trading_turnover: 0,
  };
}

function trade(
  date: string,
  name: string,
  buy: number,
  sell: number,
): FinMindInstitutionalTradeRow {
  return { date, stock_id: '2330', name, buy, sell };
}

test('joins foreign net shares with same-date trading volume and excludes dealer rows', () => {
  const prices = [price('2026-07-24', 1_100, 1_000)];
  const trades = [
    trade('2026-07-24', 'Foreign_Investor', 400, 150),
    trade('2026-07-24', 'Dealer_self', 900, 100),
    trade('2026-07-23', 'Foreign_Investor', 300, 50),
  ];

  expect(toInstitutionDailyRecords(prices, trades, 'foreign')).toEqual([
    { date: '2026-07-24', netShares: 250, totalVolume: 1_000 },
  ]);
});

test('sorts daily closes and preserves a zero-volume investment-trust date', () => {
  const prices = [
    price('2026-07-24', 1_100, 0),
    price('2026-07-23', 1_050, 500),
  ];
  const trades = [
    trade('2026-07-24', 'Investment_Trust', 150, 50),
    trade('2026-07-23', 'Investment_Trust', 50, 100),
  ];

  expect(toDailyCloseRecords(prices)).toEqual([
    { date: '2026-07-23', close: 1_050 },
    { date: '2026-07-24', close: 1_100 },
  ]);
  expect(toInstitutionDailyRecords(prices, trades, 'trust')).toEqual([
    { date: '2026-07-23', netShares: -50, totalVolume: 500 },
    { date: '2026-07-24', netShares: 100, totalVolume: 0 },
  ]);
});
