import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataConnectionPage } from './DataConnectionPage';

vi.mock('../../import/file', () => ({
  readBrokerCsvFile: vi.fn(async () => 'mock-csv-text'),
}));

vi.mock('../../import/csv', () => ({
  parseTransactionCsv: vi.fn(() => ({
    rows: [
      {
        tradeDate: '2024-03-01',
        stockId: '0050',
        stockName: '元大台灣50',
        side: 'buy',
        quantity: 1000,
        price: 100,
        fees: 80,
        tax: 0,
        settlementDate: '2024-03-05',
        brokerReference: 'X1',
      },
    ],
    skipped: [],
  })),
  parseHoldingsCsv: vi.fn(() => ({ rows: [], skipped: [] })),
}));

vi.mock('../../storage/portfolioImport', () => ({
  filterKnownTransactions: vi.fn(async (rows: unknown[]) => ({ rows, duplicateCount: 0 })),
  persistConfirmedTransactions: vi.fn(async () => {}),
  persistConfirmedHoldings: vi.fn(async () => {}),
}));

vi.mock('../../storage/backup', () => ({
  createCompleteBackup: vi.fn(async () => ({})),
  createLightweightExport: vi.fn(async () => ({})),
  restoreBackup: vi.fn(async () => {}),
}));

vi.mock('./MarketSyncPanel', () => ({
  MarketSyncPanel: () => <div>market-sync-panel-stub</div>,
}));

function makeCsvFile(name: string): File {
  return new File(['irrelevant'], name, { type: 'text/csv' });
}

describe('DataConnectionPage', () => {
  it('shows the credential-free note', () => {
    render(<DataConnectionPage />);
    expect(screen.getByText(/不包含 API Key/)).toBeInTheDocument();
  });

  it('previews a transaction CSV and reports the duplicate count', async () => {
    render(<DataConnectionPage />);

    await userEvent.upload(screen.getByLabelText('交易明細 CSV'), makeCsvFile('trades.csv'));

    expect(await screen.findByText('新增 1 筆')).toBeInTheDocument();
    expect(screen.getByText('重複略過 0 筆')).toBeInTheDocument();
  });

  it('enables the confirm button only after a transaction preview exists', async () => {
    render(<DataConnectionPage />);

    expect(screen.getByRole('button', { name: '確認寫入交易資料' })).toBeDisabled();

    await userEvent.upload(screen.getByLabelText('交易明細 CSV'), makeCsvFile('trades.csv'));

    expect(await screen.findByRole('button', { name: '確認寫入交易資料' })).toBeEnabled();
  });

  it('renders the embedded market sync panel', () => {
    render(<DataConnectionPage />);
    expect(screen.getByText('market-sync-panel-stub')).toBeInTheDocument();
  });
});
