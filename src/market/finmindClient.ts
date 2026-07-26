import type {
  FinMindDataResponse,
  FinMindDateRangeRequest,
  FinMindInstitutionalTradeRow,
  FinMindPriceRow,
} from './types';

const FINMIND_DATA_ENDPOINT = 'https://api.finmindtrade.com/api/v4/data';

async function requestDataset<T>(
  dataset: string,
  request: FinMindDateRangeRequest,
): Promise<T[]> {
  const params = new URLSearchParams({
    dataset,
    data_id: request.stockId,
    start_date: request.startDate,
  });

  if (request.endDate) {
    params.set('end_date', request.endDate);
  }

  const response = await fetch(`${FINMIND_DATA_ENDPOINT}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${request.token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`FinMind request failed (${response.status})`);
  }

  const payload = (await response.json()) as FinMindDataResponse<T>;

  if (payload.status !== 200 || !Array.isArray(payload.data)) {
    throw new Error(`FinMind data response failed (${payload.status})`);
  }

  return payload.data;
}

export function fetchDailyPrices(
  request: FinMindDateRangeRequest,
): Promise<FinMindPriceRow[]> {
  return requestDataset<FinMindPriceRow>('TaiwanStockPriceAdj', request);
}

export function fetchInstitutionalTrades(
  request: FinMindDateRangeRequest,
): Promise<FinMindInstitutionalTradeRow[]> {
  return requestDataset<FinMindInstitutionalTradeRow>(
    'TaiwanStockInstitutionalInvestorsBuySell',
    request,
  );
}
