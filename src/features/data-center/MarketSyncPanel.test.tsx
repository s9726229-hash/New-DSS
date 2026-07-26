import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MarketSyncPanel } from './MarketSyncPanel';

test('shows the API Key guidance without showing a result table when sync is blocked', async () => {
  const user = userEvent.setup();
  render(
    <MarketSyncPanel
      syncLatestHoldings={async () => ({
        kind: 'missingToken',
        snapshotDate: '2026-07-25',
        stocks: [],
      })}
    />,
  );

  await user.click(screen.getByRole('button', { name: '同步目前庫存' }));

  expect(screen.getByText('請先到設定頁輸入 API Key')).toBeInTheDocument();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});

test('shows per-stock data availability and failure details after a completed sync', async () => {
  const user = userEvent.setup();
  render(
    <MarketSyncPanel
      syncLatestHoldings={async () => ({
        kind: 'completed',
        snapshotDate: '2026-07-25',
        stocks: [
          {
            stockId: '2330',
            stockName: '台積電',
            status: 'ready',
            priceDate: '2026-07-24',
            institutionalDate: '2026-07-24',
            technicalReady: true,
            chipReady: true,
            message: '資料完整，可進行後續 DSS 計算',
          },
          {
            stockId: '1101',
            stockName: '台泥',
            status: 'incomplete',
            priceDate: '2026-07-24',
            institutionalDate: null,
            technicalReady: false,
            chipReady: false,
            message: '技術資料不足，無法計算 60MA',
          },
        ],
      })}
    />,
  );

  await user.click(screen.getByRole('button', { name: '同步目前庫存' }));

  expect(screen.getByRole('cell', { name: '2330' })).toBeInTheDocument();
  expect(screen.getAllByRole('cell', { name: '2026-07-24' })).toHaveLength(3);
  expect(screen.getAllByText('可計算')).toHaveLength(2);
  expect(screen.getByText('技術資料不足，無法計算 60MA')).toBeInTheDocument();
});
