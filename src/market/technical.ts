import type {
  DailyCloseRecord,
  MonthlyLineState,
  TechnicalSnapshot,
} from './types';

const REQUIRED_RECORDS = 60;

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function movingAverage(records: DailyCloseRecord[], endingAt: number, period: number): number {
  return average(records.slice(endingAt - period + 1, endingAt + 1).map((record) => record.close));
}

function calculateMonthlyLineState(records: DailyCloseRecord[]): MonthlyLineState {
  let state: MonthlyLineState = 'neutral';

  for (let index = 20; index < records.length; index += 1) {
    const previousClose = records[index - 1].close;
    const previousMa20 = movingAverage(records, index - 1, 20);
    const currentClose = records[index].close;
    const currentMa20 = movingAverage(records, index, 20);

    if (currentClose > currentMa20 && previousClose <= previousMa20) {
      state = 'recovery';
    } else if (currentClose > currentMa20 && state === 'recovery') {
      state = 'confirmed';
    } else if (currentClose <= currentMa20 && (state === 'recovery' || state === 'confirmed')) {
      state = 'lost';
    }
  }

  return state;
}

export function calculateTechnicalSnapshot(
  records: DailyCloseRecord[],
): TechnicalSnapshot | null {
  if (records.length < REQUIRED_RECORDS) return null;

  const lastIndex = records.length - 1;
  const current = records[lastIndex];
  const ma5 = movingAverage(records, lastIndex, 5);
  const ma20 = movingAverage(records, lastIndex, 20);
  const ma60 = movingAverage(records, lastIndex, 60);

  return {
    asOfDate: current.date,
    close: current.close,
    ma5,
    ma20,
    ma60,
    bias20: ((current.close - ma20) / ma20) * 100,
    monthlyLineState: calculateMonthlyLineState(records),
  };
}
