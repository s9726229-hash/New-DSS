import { describe, expect, it } from 'vitest';
import { calculateInstitutionState, deriveJointChipState } from './chip';
import type { InstitutionDailyRecord, InstitutionState, InstitutionThresholds } from './types';

const thresholds: InstitutionThresholds = { accumulating: 0.1, selling: -0.1 };

function record(date: string, netShares: number, totalVolume: number): InstitutionDailyRecord {
  return { date, netShares, totalVolume };
}

describe('calculateInstitutionState', () => {
  it('returns notReady with the last available date when fewer than 5 records exist', () => {
    const records = [record('2024-01-01', 100, 1000), record('2024-01-02', 100, 1000)];
    const state = calculateInstitutionState(records, thresholds);

    expect(state).toEqual({ status: 'notReady', lastAvailableDate: '2024-01-02' });
  });

  it('returns notReady with a null date when there are zero records', () => {
    const state = calculateInstitutionState([], thresholds);
    expect(state).toEqual({ status: 'notReady', lastAvailableDate: null });
  });

  it('reports accumulating when normalized 5-day strength meets the threshold', () => {
    const records = [
      record('2024-01-01', 200, 1000),
      record('2024-01-02', 200, 1000),
      record('2024-01-03', 200, 1000),
      record('2024-01-04', 200, 1000),
      record('2024-01-05', 200, 1000),
    ];
    const state = calculateInstitutionState(records, thresholds) as Extract<
      InstitutionState,
      { status: 'ready' }
    >;

    expect(state.status).toBe('ready');
    expect(state.state).toBe('accumulating');
    expect(state.fiveDayNet).toBe(1000);
    expect(state.averageVolume).toBe(1000);
    expect(state.strength).toBeCloseTo(1, 5);
  });

  it('reports selling when normalized 5-day strength meets the negative threshold', () => {
    const records = [
      record('2024-01-01', -200, 1000),
      record('2024-01-02', -200, 1000),
      record('2024-01-03', -200, 1000),
      record('2024-01-04', -200, 1000),
      record('2024-01-05', -200, 1000),
    ];
    const state = calculateInstitutionState(records, thresholds) as Extract<
      InstitutionState,
      { status: 'ready' }
    >;

    expect(state.state).toBe('selling');
  });

  it('reports neutral when strength sits between the thresholds', () => {
    const records = [
      record('2024-01-01', 0, 1000),
      record('2024-01-02', 0, 1000),
      record('2024-01-03', 0, 1000),
      record('2024-01-04', 0, 1000),
      record('2024-01-05', 0, 1000),
    ];
    const state = calculateInstitutionState(records, thresholds) as Extract<
      InstitutionState,
      { status: 'ready' }
    >;

    expect(state.state).toBe('neutral');
  });

  it('counts continuity days matching the resolved direction', () => {
    const records = [
      record('2024-01-01', 200, 1000),
      record('2024-01-02', -50, 1000),
      record('2024-01-03', 200, 1000),
      record('2024-01-04', 200, 1000),
      record('2024-01-05', 200, 1000),
    ];
    const state = calculateInstitutionState(records, thresholds) as Extract<
      InstitutionState,
      { status: 'ready' }
    >;

    expect(state.state).toBe('accumulating');
    expect(state.continuity.sameDirectionDays).toBe(4);
    expect(state.continuity.todayMaintainsDirection).toBe(true);
  });
});

describe('deriveJointChipState', () => {
  const ready = (
    state: 'accumulating' | 'selling' | 'neutral',
  ): Extract<InstitutionState, { status: 'ready' }> => ({
    status: 'ready',
    state,
    fiveDayNet: 0,
    averageVolume: 1,
    strength: 0,
    continuity: { sameDirectionDays: 0, todayMaintainsDirection: false },
  });
  const notReady: InstitutionState = { status: 'notReady', lastAvailableDate: null };

  it('is supportive when both institutions accumulate', () => {
    expect(deriveJointChipState(ready('accumulating'), ready('accumulating'))).toBe('supportive');
  });

  it('is opposing when both institutions sell', () => {
    expect(deriveJointChipState(ready('selling'), ready('selling'))).toBe('opposing');
  });

  it('is noConsensus when directions differ', () => {
    expect(deriveJointChipState(ready('accumulating'), ready('selling'))).toBe('noConsensus');
  });

  it('is noConsensus when one side is neutral', () => {
    expect(deriveJointChipState(ready('accumulating'), ready('neutral'))).toBe('noConsensus');
  });

  it('is notReady when either institution lacks enough data', () => {
    expect(deriveJointChipState(notReady, ready('accumulating'))).toBe('notReady');
    expect(deriveJointChipState(ready('accumulating'), notReady)).toBe('notReady');
  });
});
