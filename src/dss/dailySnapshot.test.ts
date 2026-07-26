import { describe, expect, it } from 'vitest';
import { createDailyDssSnapshot } from './dailySnapshot';
import type { DailyCloseRecord, InstitutionDailyRecord, InstitutionThresholds } from './types';

const thresholds: InstitutionThresholds = { accumulating: 0.1, selling: -0.1 };

function buildPrices(count: number): DailyCloseRecord[] {
  const startDate = new Date('2024-01-01T00:00:00Z');
  return new Array(count).fill(0).map((_, index) => {
    const date = new Date(startDate);
    date.setUTCDate(date.getUTCDate() + index);
    return { date: date.toISOString().slice(0, 10), close: 100 };
  });
}

function buildInstitutionRecords(count: number): InstitutionDailyRecord[] {
  const startDate = new Date('2024-01-01T00:00:00Z');
  return new Array(count).fill(0).map((_, index) => {
    const date = new Date(startDate);
    date.setUTCDate(date.getUTCDate() + index);
    return { date: date.toISOString().slice(0, 10), netShares: 0, totalVolume: 1000 };
  });
}

describe('createDailyDssSnapshot', () => {
  it('leaves technical null when fewer than 60 price records exist, but still evaluates chip', () => {
    const snapshot = createDailyDssSnapshot({
      prices: buildPrices(10),
      foreign: buildInstitutionRecords(5),
      trust: buildInstitutionRecords(5),
      foreignThresholds: thresholds,
      trustThresholds: thresholds,
    });

    expect(snapshot.technical).toBeNull();
    expect(snapshot.chip.foreign.status).toBe('ready');
    expect(snapshot.chip.trust.status).toBe('ready');
    expect(snapshot.chip.joint).toBe('noConsensus');
  });

  it('leaves chip notReady when institution data is thin, but still evaluates technical', () => {
    const snapshot = createDailyDssSnapshot({
      prices: buildPrices(60),
      foreign: buildInstitutionRecords(2),
      trust: buildInstitutionRecords(2),
      foreignThresholds: thresholds,
      trustThresholds: thresholds,
    });

    expect(snapshot.technical).not.toBeNull();
    expect(snapshot.chip.foreign.status).toBe('notReady');
    expect(snapshot.chip.trust.status).toBe('notReady');
    expect(snapshot.chip.joint).toBe('notReady');
  });

  it('reports the latest date for each data source independently', () => {
    const snapshot = createDailyDssSnapshot({
      prices: buildPrices(60),
      foreign: buildInstitutionRecords(5),
      trust: [],
      foreignThresholds: thresholds,
      trustThresholds: thresholds,
    });

    expect(snapshot.dataDates.prices).toBe('2024-02-29');
    expect(snapshot.dataDates.foreign).toBe('2024-01-05');
    expect(snapshot.dataDates.trust).toBeNull();
  });
});
