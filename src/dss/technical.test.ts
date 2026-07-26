import { describe, expect, it } from 'vitest';
import { calculateTechnicalSnapshot } from './technical';
import type { DailyCloseRecord } from './types';

function buildRecords(closes: number[]): DailyCloseRecord[] {
  const startDate = new Date('2024-01-01T00:00:00Z');

  return closes.map((close, index) => {
    const date = new Date(startDate);
    date.setUTCDate(date.getUTCDate() + index);
    return { date: date.toISOString().slice(0, 10), close };
  });
}

describe('calculateTechnicalSnapshot', () => {
  it('returns null with fewer than 60 records', () => {
    const records = buildRecords(new Array(59).fill(100));
    expect(calculateTechnicalSnapshot(records)).toBeNull();
  });

  it('calculates MA5/20/60, bias20, and a flat 20MA slope for constant prices', () => {
    const records = buildRecords(new Array(60).fill(100));
    const snapshot = calculateTechnicalSnapshot(records);

    expect(snapshot).not.toBeNull();
    expect(snapshot?.ma5).toBe(100);
    expect(snapshot?.ma20).toBe(100);
    expect(snapshot?.ma60).toBe(100);
    expect(snapshot?.bias20).toBe(0);
    expect(snapshot?.ma20Slope).toBe(0);
    expect(snapshot?.asOfDate).toBe('2024-02-29');
    expect(snapshot?.close).toBe(100);
  });

  it('has no risk flags for flat, unbroken prices', () => {
    const records = buildRecords(new Array(60).fill(100));
    const snapshot = calculateTechnicalSnapshot(records);

    expect(snapshot?.riskFlags).toEqual({
      pullbackWatch: false,
      trendWeakening: false,
    });
  });

  it('computes a positive ma20Slope when the latest close pulls MA20 up', () => {
    const closes = new Array(60).fill(100);
    closes.push(120);
    const snapshot = calculateTechnicalSnapshot(buildRecords(closes));

    expect(snapshot?.ma20Slope).toBeCloseTo(1, 5);
  });

  it('flags pullbackWatch when close falls back to or below MA20 after being above it', () => {
    const closes = new Array(59).fill(100);
    closes.push(110); // previous day: clearly above its own MA20
    closes.push(90); // today: back at/below its own MA20
    const snapshot = calculateTechnicalSnapshot(buildRecords(closes));

    expect(snapshot?.riskFlags.pullbackWatch).toBe(true);
  });

  it('flags trendWeakening only after two consecutive closes below MA60', () => {
    const closes = new Array(59).fill(100);
    closes.push(80); // day 60 (index 59): below its own MA60
    closes.push(80); // day 61 (index 60): also below its own MA60
    const snapshot = calculateTechnicalSnapshot(buildRecords(closes));

    expect(snapshot?.riskFlags.trendWeakening).toBe(true);
  });

  it('does not flag trendWeakening when there is no prior day to compare against MA60', () => {
    const closes = new Array(59).fill(100);
    closes.push(80); // exactly 60 records total; only one day below MA60 is knowable
    const snapshot = calculateTechnicalSnapshot(buildRecords(closes));

    expect(snapshot?.riskFlags.trendWeakening).toBe(false);
  });

  it('marks monthlyLineState as recovery then confirmed after reclaiming MA20 for two days', () => {
    const closes = new Array(58).fill(100);
    closes.push(90); // dips below MA20
    closes.push(105); // recovers above MA20 -> 'recovery'
    closes.push(106); // still above MA20 next day -> 'confirmed'
    const snapshot = calculateTechnicalSnapshot(buildRecords(closes));

    expect(snapshot?.monthlyLineState).toBe('confirmed');
  });
});
