import { calculateInstitutionState, deriveJointChipState } from '../market/chip';
import { calculateTechnicalSnapshot } from '../market/technical';
import type {
  DailyCloseRecord,
  InstitutionDailyRecord,
  InstitutionState,
  InstitutionThresholds,
  JointChipState,
  TechnicalSnapshot,
} from '../market/types';

const requiredInstitutionRecords = 5;

export type DailyDssSnapshotInput = {
  prices: DailyCloseRecord[];
  foreign: InstitutionDailyRecord[];
  trust: InstitutionDailyRecord[];
  foreignThresholds: InstitutionThresholds;
  trustThresholds: InstitutionThresholds;
};

export type DailyDssSnapshot = {
  isReady: boolean;
  technical: TechnicalSnapshot | null;
  chip: {
    foreign: InstitutionState;
    trust: InstitutionState;
    joint: JointChipState;
  } | null;
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
  const dataDates = {
    prices: latestDate(input.prices),
    foreign: latestDate(input.foreign),
    trust: latestDate(input.trust),
  };
  const technical = calculateTechnicalSnapshot(input.prices);

  if (
    !technical ||
    input.foreign.length < requiredInstitutionRecords ||
    input.trust.length < requiredInstitutionRecords
  ) {
    return {
      isReady: false,
      technical: null,
      chip: null,
      dataDates,
    };
  }

  const foreign = calculateInstitutionState(input.foreign, input.foreignThresholds);
  const trust = calculateInstitutionState(input.trust, input.trustThresholds);

  return {
    isReady: true,
    technical,
    chip: {
      foreign,
      trust,
      joint: deriveJointChipState(foreign, trust),
    },
    dataDates,
  };
}
