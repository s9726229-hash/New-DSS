import { expect, test } from 'vitest';

import { calculateInstitutionState, deriveJointChipState } from './chip';

const thresholds = {
  accumulating: 0.4,
  selling: -0.4,
};

const accumulationFixture = [
  { date: '2026-07-20', netShares: 200, totalVolume: 1_000 },
  { date: '2026-07-21', netShares: 200, totalVolume: 1_000 },
  { date: '2026-07-22', netShares: -50, totalVolume: 1_000 },
  { date: '2026-07-23', netShares: -50, totalVolume: 1_000 },
  { date: '2026-07-24', netShares: 200, totalVolume: 1_000 },
];

test('uses the Profile strength threshold while keeping continuity separate', () => {
  const result = calculateInstitutionState(accumulationFixture, thresholds);

  expect(result.state).toBe('accumulating');
  expect(result.strength).toBe(0.5);
  expect(result.continuity.sameDirectionDays).toBe(3);
  expect(result.continuity.todayMaintainsDirection).toBe(true);
});

test('does not let interrupted continuity cancel a strong Profile state', () => {
  const result = calculateInstitutionState(
    [
      { date: '2026-07-20', netShares: 1_000, totalVolume: 1_000 },
      { date: '2026-07-21', netShares: -100, totalVolume: 1_000 },
      { date: '2026-07-22', netShares: -100, totalVolume: 1_000 },
      { date: '2026-07-23', netShares: -100, totalVolume: 1_000 },
      { date: '2026-07-24', netShares: 1_000, totalVolume: 1_000 },
    ],
    thresholds,
  );

  expect(result.state).toBe('accumulating');
  expect(result.continuity.sameDirectionDays).toBe(2);
});

test('marks opposing non-neutral institutions as divergence without combining their strength', () => {
  const foreign = calculateInstitutionState(accumulationFixture, thresholds);
  const trust = calculateInstitutionState(
    accumulationFixture.map((record) => ({ ...record, netShares: -record.netShares })),
    thresholds,
  );

  expect(deriveJointChipState(foreign, trust)).toBe('divergence');
});
