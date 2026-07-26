export type FinMindDataset = 'TaiwanStockPriceAdj' | 'TaiwanStockInstitutionalInvestorsBuySell';

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

export type FinMindInstitutionName = 'Foreign_Investor' | 'Investment_Trust';

export type FinMindInstitutionalRow = {
  date: string;
  stock_id: string;
  name: string;
  buy: number;
  sell: number;
};
