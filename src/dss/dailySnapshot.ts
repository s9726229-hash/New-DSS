import { calculateInstitutionState, deriveJointChipState } from './chip';
import { calculateTechnicalSnapshot } from './technical';
import type {
  DailyCloseRecord,
  InstitutionDailyRecord,
  InstitutionState,
  InstitutionThresholds,
  JointChipState,
  TechnicalSnapshot,
} from './types';

export type DailyDssSnapshotInput = {
  prices: DailyCloseRecord[];
  foreign: InstitutionDailyRecord[];
  trust: InstitutionDailyRecord[];
  foreignThresholds: InstitutionThresholds;
  trustThresholds: InstitutionThresholds;
};

export type DailyDssSnapshot = {
  technical: TechnicalSnapshot | null;
  chip: {
    foreign: InstitutionState;
    trust: InstitutionState;
    joint: JointChipState;
  };
  dataDates: {
    prices: string | null;
    foreign: string | null;
    trust: string | null;
  };
};

function latestDate<T extends { date: string }>(records: T[]): string | null {
  return records.at(-1)?.date ?? null;
}

export function createDailyDssSnapshot(input: DailyDssSnapshotInput): DailyDssSnapshot {
  const technical = calculateTechnicalSnapshot(input.prices);
  const foreign = calculateInstitutionState(input.foreign, input.foreignThresholds);
  const trust = calculateInstitutionState(input.trust, input.trustThresholds);

  return {
    technical,
    chip: {
      foreign,
      trust,
      joint: deriveJointChipState(foreign, trust),
    },
    dataDates: {
      prices: latestDate(input.prices),
      foreign: latestDate(input.foreign),
      trust: latestDate(input.trust),
    },
  };
}
