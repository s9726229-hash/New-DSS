import type {
  InstitutionDailyRecord,
  InstitutionState,
  InstitutionThresholds,
  JointChipState,
} from './types';

const requiredWindowSize = 5;

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function directionMatches(state: InstitutionState['state'], netShares: number): boolean {
  return (state === 'accumulating' && netShares > 0) || (state === 'selling' && netShares < 0);
}

export function calculateInstitutionState(
  records: InstitutionDailyRecord[],
  thresholds: InstitutionThresholds,
): InstitutionState {
  const latestFive = records.slice(-requiredWindowSize);

  if (latestFive.length !== requiredWindowSize) {
    throw new Error('Institution state requires five dated records.');
  }

  const fiveDayNet = latestFive.reduce((sum, record) => sum + record.netShares, 0);
  const averageVolume = average(latestFive.map((record) => record.totalVolume));
  const strength = averageVolume === 0 ? 0 : fiveDayNet / averageVolume;
  const state =
    strength >= thresholds.accumulating
      ? 'accumulating'
      : strength <= thresholds.selling
        ? 'selling'
        : 'neutral';

  return {
    state,
    fiveDayNet,
    averageVolume,
    strength,
    continuity: {
      sameDirectionDays: latestFive.filter((record) => directionMatches(state, record.netShares)).length,
      todayMaintainsDirection: directionMatches(state, latestFive.at(-1)?.netShares ?? 0),
    },
  };
}

export function deriveJointChipState(
  foreign: InstitutionState,
  trust: InstitutionState,
): JointChipState {
  if (foreign.state === 'accumulating' && trust.state === 'accumulating') {
    return 'jointAccumulation';
  }

  if (foreign.state === 'selling' && trust.state === 'selling') {
    return 'jointSelling';
  }

  if (foreign.state !== trust.state && foreign.state !== 'neutral' && trust.state !== 'neutral') {
    return 'divergence';
  }

  return 'noConsensus';
}
