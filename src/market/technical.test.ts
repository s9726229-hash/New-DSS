import { expect, test } from 'vitest';

import { calculateTechnicalSnapshot } from './technical';
import type { DailyCloseRecord } from './types';

function recordsWithTail(tail: number[]): DailyCloseRecord[] {
  return [...Array(58).fill(100), ...tail].map((close, index) => ({
    date: `day-${index + 1}`,
    close,
  }));
}

test('marks a close above 20MA after a prior close at or below it as recovery', () => {
  const snapshot = calculateTechnicalSnapshot(recordsWithTail([90, 101]));

  expect(snapshot?.monthlyLineState).toBe('recovery');
  expect(snapshot?.ma5).toBeCloseTo(98.2);
  expect(snapshot?.ma20).toBeCloseTo(99.55);
  expect(snapshot?.ma60).toBeCloseTo(99.85);
  expect(snapshot?.bias20).toBeCloseTo(1.4565, 3);
});

test('requires 60 daily closes before producing a technical snapshot', () => {
  expect(calculateTechnicalSnapshot(recordsWithTail([90]))).toBeNull();
});

test('confirms on the second above-20MA close and records a later loss', () => {
  expect(calculateTechnicalSnapshot(recordsWithTail([90, 101, 102]))?.monthlyLineState).toBe(
    'confirmed',
  );
  expect(calculateTechnicalSnapshot(recordsWithTail([90, 101, 102, 90]))?.monthlyLineState).toBe(
    'lost',
  );
});
