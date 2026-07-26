export type DailyCloseRecord = {
  date: string;
  close: number;
};

export type MonthlyLineState = 'neutral' | 'recovery' | 'confirmed' | 'lost';

export type TechnicalSnapshot = {
  asOfDate: string;
  close: number;
  ma5: number;
  ma20: number;
  ma60: number;
  bias20: number;
  ma20Slope: number;
  monthlyLineState: MonthlyLineState;
  riskFlags: {
    pullbackWatch: boolean;
    trendWeakening: boolean;
  };
};

export type InstitutionDailyRecord = {
  date: string;
  netShares: number;
  totalVolume: number;
};

export type InstitutionThresholds = {
  accumulating: number;
  selling: number;
};

export type InstitutionState =
  | {
      status: 'notReady';
      lastAvailableDate: string | null;
    }
  | {
      status: 'ready';
      state: 'accumulating' | 'selling' | 'neutral';
      fiveDayNet: number;
      averageVolume: number;
      strength: number;
      continuity: {
        sameDirectionDays: number;
        todayMaintainsDirection: boolean;
      };
    };

export type JointChipState = 'supportive' | 'opposing' | 'noConsensus' | 'notReady';
