import { render, screen } from '@testing-library/react';
import { DataCenterPage } from './DataCenterPage';

test('explains the difference between complete and lightweight export', () => {
  render(<DataCenterPage />);

  expect(screen.getByText('完整本機備份')).toBeInTheDocument();
  expect(screen.getByText('包含市場快取、研究快照與設定。')).toBeInTheDocument();
  expect(screen.getByText('輕量匯出')).toBeInTheDocument();
  expect(screen.getByText('不包含市場快取，適合快速保存研究與設定。')).toBeInTheDocument();
  expect(screen.getAllByText(/不包含 API Key/)).not.toHaveLength(0);
});

test('provides independent transaction and holdings import confirmations', () => {
  render(<DataCenterPage />);

  expect(screen.getByText('匯入交易數據')).toBeInTheDocument();
  expect(screen.getByText('匯入庫存')).toBeInTheDocument();
  expect(screen.getByLabelText('交易明細 CSV')).toHaveAttribute('accept', '.csv,text/csv');
  expect(screen.getByLabelText('庫存 CSV')).toHaveAttribute('accept', '.csv,text/csv');
  expect(screen.getByRole('button', { name: '確認寫入交易資料' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '確認寫入庫存資料' })).toBeDisabled();
  expect(screen.getByText('同日舊庫存將由此檔完整取代。', { exact: false })).toBeInTheDocument();
});
