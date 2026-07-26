import type { FinMindDataset, FinMindInstitutionalRow, FinMindPriceRow } from './types';

const WORKER_BASE_URL = import.meta.env.VITE_FINMIND_WORKER_URL ?? 'https://gentle-voice-bcca.s9726229.workers.dev';

type FinMindDataRequest = {
  stockId: string;
  startDate: string;
  endDate: string;
};

type FinMindDataResponse<T> = {
  status: number;
  data: T[];
};

async function requestDataset<T>(dataset: FinMindDataset, request: FinMindDataRequest): Promise<T[]> {
  const url = new URL('/api/finmind/data', WORKER_BASE_URL);
  url.search = new URLSearchParams({
    dataset,
    data_id: request.stockId,
    start_date: request.startDate,
    end_date: request.endDate,
  }).toString();

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`FinMind Worker request failed (${response.status})`);
  }

  const payload = (await response.json()) as FinMindDataResponse<T>;

  if (payload.status !== 200 || !Array.isArray(payload.data)) {
    throw new Error(`FinMind data response failed (${payload.status})`);
  }

  return payload.data;
}

export function fetchDailyPrices(request: FinMindDataRequest): Promise<FinMindPriceRow[]> {
  return requestDataset<FinMindPriceRow>('TaiwanStockPriceAdj', request);
}

export function fetchInstitutionalTrades(request: FinMindDataRequest): Promise<FinMindInstitutionalRow[]> {
  return requestDataset<FinMindInstitutionalRow>('TaiwanStockInstitutionalInvestorsBuySell', request);
}
