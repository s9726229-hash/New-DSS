import type { DailyCloseRecord, MonthlyLineState, TechnicalSnapshot } from './types';

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

function calculatePullbackWatch(records: DailyCloseRecord[], lastIndex: number): boolean {
  const previousClose = records[lastIndex - 1].close;
  const previousMa20 = movingAverage(records, lastIndex - 1, 20);
  const currentClose = records[lastIndex].close;
  const currentMa20 = movingAverage(records, lastIndex, 20);

  return previousClose > previousMa20 && currentClose <= currentMa20;
}

function calculateTrendWeakening(records: DailyCloseRecord[], lastIndex: number): boolean {
  if (lastIndex < REQUIRED_RECORDS) return false;

  const currentBelowMa60 = records[lastIndex].close < movingAverage(records, lastIndex, 60);
  const previousBelowMa60 = records[lastIndex - 1].close < movingAverage(records, lastIndex - 1, 60);

  return currentBelowMa60 && previousBelowMa60;
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
  const previousMa20 = movingAverage(records, lastIndex - 1, 20);

  return {
    asOfDate: current.date,
    close: current.close,
    ma5,
    ma20,
    ma60,
    bias20: ((current.close - ma20) / ma20) * 100,
    ma20Slope: ma20 - previousMa20,
    monthlyLineState: calculateMonthlyLineState(records),
    riskFlags: {
      pullbackWatch: calculatePullbackWatch(records, lastIndex),
      trendWeakening: calculateTrendWeakening(records, lastIndex),
    },
  };
}
