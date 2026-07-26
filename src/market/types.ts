export type FinMindDateRangeRequest = {
  stockId: string;
  startDate: string;
  endDate?: string;
  token: string;
};

export type FinMindPriceRow = {
  date: string;
  stock_id: string;
  Trading_Volume: number;
  Trading_money: number;
  open: number;
  max: number;
  min: number;
  close: number;
  spread: number;
  Trading_turnover: number;
};

export type FinMindInstitutionalTradeRow = {
  date: string;
  stock_id: string;
  buy: number;
  sell: number;
  name: string;
};

export type FinMindDataset =
  | 'TaiwanStockPriceAdj'
  | 'TaiwanStockInstitutionalInvestorsBuySell';

export type FinMindRawRow = FinMindPriceRow | FinMindInstitutionalTradeRow;

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
  monthlyLineState: MonthlyLineState;
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

export type InstitutionStateName = 'accumulating' | 'selling' | 'neutral';

export type InstitutionState = {
  state: InstitutionStateName;
  fiveDayNet: number;
  averageVolume: number;
  strength: number;
  continuity: {
    sameDirectionDays: number;
    todayMaintainsDirection: boolean;
  };
};

export type JointChipState =
  | 'jointAccumulation'
  | 'jointSelling'
  | 'divergence'
  | 'noConsensus';

export type FinMindDataResponse<T> = {
  status: number;
  msg?: string;
  data: T[];
};
