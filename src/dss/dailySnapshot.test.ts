import { expect, test } from 'vitest';

import { createDailyDssSnapshot } from './dailySnapshot';

const thresholds = {
  accumulating: 0.4,
  selling: -0.4,
};

const prices = [...Array(58).fill(100), 90, 101, 102].map((close, index) => ({
  date: `2026-05-${String(index + 1).padStart(2, '0')}`,
  close,
}));

const foreign = [
  { date: '2026-07-20', netShares: 200, totalVolume: 1_000 },
  { date: '2026-07-21', netShares: 200, totalVolume: 1_000 },
  { date: '2026-07-22', netShares: -50, totalVolume: 1_000 },
  { date: '2026-07-23', netShares: -50, totalVolume: 1_000 },
  { date: '2026-07-24', netShares: 200, totalVolume: 1_000 },
];

const trust = foreign.map((record) => ({ ...record }));

test('keeps ready technical and chip results in separate snapshot sections', () => {
  const snapshot = createDailyDssSnapshot({
    prices,
    foreign,
    trust,
    foreignThresholds: thresholds,
    trustThresholds: thresholds,
  });

  expect(snapshot.isReady).toBe(true);
  expect(snapshot.technical?.monthlyLineState).toBe('confirmed');
  expect(snapshot.chip?.foreign.state).toBe('accumulating');
  expect(snapshot.chip?.joint).toBe('jointAccumulation');
});

test('returns a not-ready snapshot when price data cannot produce 60MA', () => {
  const snapshot = createDailyDssSnapshot({
    prices: prices.slice(0, 59),
    foreign,
    trust,
    foreignThresholds: thresholds,
    trustThresholds: thresholds,
  });

  expect(snapshot.isReady).toBe(false);
  expect(snapshot.technical).toBeNull();
  expect(snapshot.chip).toBeNull();
});

test('returns a not-ready snapshot when either institution lacks five days', () => {
  const snapshot = createDailyDssSnapshot({
    prices,
    foreign: foreign.slice(0, 4),
    trust,
    foreignThresholds: thresholds,
    trustThresholds: thresholds,
  });

  expect(snapshot.isReady).toBe(false);
  expect(snapshot.chip).toBeNull();
});
