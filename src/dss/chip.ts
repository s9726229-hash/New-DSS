import type {
  InstitutionDailyRecord,
  InstitutionState,
  InstitutionThresholds,
  JointChipState,
} from './types';

const REQUIRED_WINDOW_SIZE = 5;

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function directionMatches(
  state: 'accumulating' | 'selling' | 'neutral',
  netShares: number,
): boolean {
  return (state === 'accumulating' && netShares > 0) || (state === 'selling' && netShares < 0);
}

export function calculateInstitutionState(
  records: InstitutionDailyRecord[],
  thresholds: InstitutionThresholds,
): InstitutionState {
  if (records.length < REQUIRED_WINDOW_SIZE) {
    return { status: 'notReady', lastAvailableDate: records.at(-1)?.date ?? null };
  }

  const latestFive = records.slice(-REQUIRED_WINDOW_SIZE);
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
    status: 'ready',
    state,
    fiveDayNet,
    averageVolume,
    strength,
    continuity: {
      sameDirectionDays: latestFive.filter((record) => directionMatches(state, record.netShares))
        .length,
      todayMaintainsDirection: directionMatches(state, latestFive.at(-1)!.netShares),
    },
  };
}

export function deriveJointChipState(
  foreign: InstitutionState,
  trust: InstitutionState,
): JointChipState {
  if (foreign.status === 'notReady' || trust.status === 'notReady') {
    return 'notReady';
  }

  if (foreign.state === 'accumulating' && trust.state === 'accumulating') {
    return 'supportive';
  }

  if (foreign.state === 'selling' && trust.state === 'selling') {
    return 'opposing';
  }

  return 'noConsensus';
}
