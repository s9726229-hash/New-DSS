import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchDailyPrices, fetchInstitutionalTrades } from './finmindClient';

describe('FinMind client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests adjusted daily prices with a bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 200, data: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchDailyPrices({
      stockId: '2330',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      token: 'local-token',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('dataset=TaiwanStockPriceAdj'),
      expect.objectContaining({
        headers: { Authorization: 'Bearer local-token' },
      }),
    );
    expect(fetchMock.mock.calls[0][0]).toContain('data_id=2330');
    expect(fetchMock.mock.calls[0][0]).toContain('start_date=2026-01-01');
    expect(fetchMock.mock.calls[0][0]).toContain('end_date=2026-01-31');
  });

  it('requests institutional trading and rejects a failed response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ status: 429, data: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchInstitutionalTrades({
        stockId: '2330',
        startDate: '2026-01-01',
        token: 'local-token',
      }),
    ).rejects.toThrow('FinMind request failed (429)');

    expect(fetchMock.mock.calls[0][0]).toContain(
      'dataset=TaiwanStockInstitutionalInvestorsBuySell',
    );
  });
});
