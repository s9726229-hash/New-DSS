import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarketSyncPanel } from './MarketSyncPanel';
import type { HoldingsSyncResult } from '../../market/holdingsSync';

describe('MarketSyncPanel', () => {
  it('shows a clear message and no table when holdings are missing', async () => {
    const syncLatestHoldings = vi.fn(
      async (): Promise<HoldingsSyncResult> => ({ kind: 'missingHoldings', snapshotDate: null, stocks: [] }),
    );
    render(<MarketSyncPanel syncLatestHoldings={syncLatestHoldings} />);

    await userEvent.click(screen.getByRole('button', { name: '同步目前庫存' }));

    expect(await screen.findByText('請先匯入庫存資料')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders per-stock results when the sync completes', async () => {
    const syncLatestHoldings = vi.fn(
      async (): Promise<HoldingsSyncResult> => ({
        kind: 'completed',
        snapshotDate: '2024-03-01',
        stocks: [
          {
            stockId: '0050',
            stockName: '元大台灣50',
            status: 'ready',
            priceDate: '2024-03-01',
            institutionalDate: '2024-03-01',
            message: '資料完整，可進行後續 DSS 計算',
          },
        ],
      }),
    );
    render(<MarketSyncPanel syncLatestHoldings={syncLatestHoldings} />);

    await userEvent.click(screen.getByRole('button', { name: '同步目前庫存' }));

    expect(await screen.findByText('0050')).toBeInTheDocument();
    expect(screen.getByText('資料完整，可進行後續 DSS 計算')).toBeInTheDocument();
  });

  it('shows a safe error message when the sync call throws', async () => {
    const syncLatestHoldings = vi.fn(async () => {
      throw new Error('FinMind service is not configured');
    });
    render(<MarketSyncPanel syncLatestHoldings={syncLatestHoldings} />);

    await userEvent.click(screen.getByRole('button', { name: '同步目前庫存' }));

    expect(await screen.findByText('FinMind service is not configured')).toBeInTheDocument();
  });
});
