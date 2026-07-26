import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchDailyPrices, fetchInstitutionalTrades } from './finmindClient';

describe('fetchDailyPrices', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requests TaiwanStockPriceAdj from the Worker with no Authorization header', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ status: 200, data: [{ date: '2024-03-01', close: 100 }] }), {
        status: 200,
      }),
    );

    const rows = await fetchDailyPrices({ stockId: '0050', startDate: '2024-01-01', endDate: '2024-03-01' });

    expect(rows).toEqual([{ date: '2024-03-01', close: 100 }]);

    const [calledUrl, calledInit] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(calledUrl)).toContain('/api/finmind/data?');
    expect(String(calledUrl)).toContain('dataset=TaiwanStockPriceAdj');
    expect(String(calledUrl)).toContain('data_id=0050');
    expect(String(calledUrl)).toContain('start_date=2024-01-01');
    expect(String(calledUrl)).toContain('end_date=2024-03-01');
    expect(String(calledUrl)).not.toContain('token');
    expect(calledInit?.headers).toBeUndefined();
  });

  it('throws a safe error when the Worker responds with a non-200 HTTP status', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ error: 'FinMind upstream error', status: 502 }), { status: 502 }),
    );

    await expect(
      fetchDailyPrices({ stockId: '0050', startDate: '2024-01-01', endDate: '2024-03-01' }),
    ).rejects.toThrow(/502/);
  });
});

describe('fetchInstitutionalTrades', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requests TaiwanStockInstitutionalInvestorsBuySell from the Worker', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 200,
          data: [{ date: '2024-03-01', stock_id: '0050', name: 'Foreign_Investor', buy: 600, sell: 400 }],
        }),
        { status: 200 },
      ),
    );

    const rows = await fetchInstitutionalTrades({
      stockId: '0050',
      startDate: '2024-02-15',
      endDate: '2024-03-01',
    });

    expect(rows).toHaveLength(1);
    const [calledUrl] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(calledUrl)).toContain('dataset=TaiwanStockInstitutionalInvestorsBuySell');
  });
});
