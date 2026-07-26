import { useState, type ChangeEvent } from 'react';
import { parseHoldingsCsv, parseTransactionCsv } from '../../import/csv';
import { readBrokerCsvFile } from '../../import/file';
import type { HoldingsCsvPreview, TransactionCsvPreview } from '../../import/types';
import {
  createCompleteBackup,
  createLightweightExport,
  restoreBackup,
} from '../../storage/backup';
import {
  filterKnownTransactions,
  persistConfirmedHoldings,
  persistConfirmedTransactions,
} from '../../storage/portfolioImport';
import type { BackupPayload } from '../../storage/types';
import { MarketSyncPanel } from './MarketSyncPanel';

type TransactionImportPreview = TransactionCsvPreview & {
  duplicateCount: number;
};

function downloadJson(payload: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function DataConnectionPage() {
  const [message, setMessage] = useState('');
  const [transactionPreview, setTransactionPreview] = useState<TransactionImportPreview | null>(null);
  const [holdingsPreview, setHoldingsPreview] = useState<HoldingsCsvPreview | null>(null);
  const [snapshotDate, setSnapshotDate] = useState('');
  const [transactionsConfirmed, setTransactionsConfirmed] = useState(false);
  const [holdingsConfirmed, setHoldingsConfirmed] = useState(false);

  async function handleCompleteBackup() {
    try {
      downloadJson(await createCompleteBackup(), 'new-dss-complete-backup.json');
      setMessage('完整本機備份已建立。');
    } catch {
      setMessage('無法建立備份。請確認本機資料不含憑證欄位。');
    }
  }

  async function handleLightweightExport() {
    try {
      downloadJson(await createLightweightExport(), 'new-dss-lightweight-export.json');
      setMessage('輕量匯出檔已建立。');
    } catch {
      setMessage('無法建立匯出檔。請確認本機資料不含憑證欄位。');
    }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    try {
      const payload = JSON.parse(await file.text()) as BackupPayload;
      await restoreBackup(payload);
      setMessage('完整本機備份已匯入。');
    } catch {
      setMessage('無法匯入備份。請確認檔案格式與內容。');
    }
  }

  async function handleTransactionCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    try {
      const parsedPreview = parseTransactionCsv(await readBrokerCsvFile(file));
      const filtered = await filterKnownTransactions(parsedPreview.rows);
      setTransactionPreview({
        ...parsedPreview,
        rows: filtered.rows,
        duplicateCount: filtered.duplicateCount,
      });
      setTransactionsConfirmed(false);
      setMessage(`已預覽新增 ${filtered.rows.length} 筆交易；重複略過 ${filtered.duplicateCount} 筆。`);
    } catch {
      setMessage('無法處理交易 CSV；本機資料尚未變更。');
    }
  }

  async function handleHoldingsCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    try {
      const preview = parseHoldingsCsv(await readBrokerCsvFile(file));
      const date = new Date(file.lastModified);
      const suggestedDate = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
      ].join('-');

      setHoldingsPreview(preview);
      setSnapshotDate(suggestedDate);
      setHoldingsConfirmed(false);
      setMessage(`已預覽 ${preview.rows.length} 筆庫存資料。`);
    } catch {
      setMessage('無法處理庫存 CSV；本機資料尚未變更。');
    }
  }

  async function confirmTransactions() {
    if (!transactionPreview?.rows.length) return;

    try {
      await persistConfirmedTransactions(transactionPreview.rows, new Date().toISOString());
      setTransactionsConfirmed(true);
      setMessage(`已寫入 ${transactionPreview.rows.length} 筆交易資料。`);
    } catch {
      setMessage('無法寫入交易資料；本機資料尚未變更。');
    }
  }

  async function confirmHoldings() {
    if (!holdingsPreview?.rows.length || !snapshotDate) return;

    try {
      await persistConfirmedHoldings(holdingsPreview.rows, snapshotDate, new Date().toISOString());
      setHoldingsConfirmed(true);
      setMessage(`已寫入 ${holdingsPreview.rows.length} 筆庫存快照。`);
    } catch {
      setMessage('無法寫入庫存資料；本機資料尚未變更。');
    }
  }

  return (
    <div className="data-connection-page">
      <p className="data-connection-note">
        所有備份與匯出檔均不包含 API Key；市場資料經由 Cloudflare Worker 安全取得，此裝置不儲存憑證。
      </p>

      <div className="data-connection-grid">
        <section aria-labelledby="complete-backup-title" className="data-connection-card">
          <p>本機還原用</p>
          <h2 id="complete-backup-title">完整本機備份</h2>
          <span>包含市場快取與研究快照。</span>
          <button onClick={handleCompleteBackup} type="button">
            建立完整備份
          </button>
        </section>

        <section aria-labelledby="lightweight-export-title" className="data-connection-card">
          <p>快速保存用</p>
          <h2 id="lightweight-export-title">輕量匯出</h2>
          <span>不包含市場快取，適合快速保存研究與設定。</span>
          <button onClick={handleLightweightExport} type="button">
            建立輕量匯出
          </button>
        </section>

        <section aria-labelledby="import-title" className="data-connection-card">
          <p>回復本機資料</p>
          <h2 id="import-title">匯入完整備份</h2>
          <span>匯入前會先檢查格式與憑證欄位，再改寫本機資料。</span>
          <label>
            選擇完整備份檔
            <input accept="application/json" onChange={handleImport} type="file" />
          </label>
        </section>

        <section aria-labelledby="transaction-import-title" className="data-connection-card">
          <p>券商明細</p>
          <h2 id="transaction-import-title">匯入交易數據</h2>
          <span>自動略過重複交易與小計列；確認後只寫入新增資料。</span>
          <label>
            選擇交易明細 CSV
            <input
              accept=".csv,text/csv"
              aria-label="交易明細 CSV"
              onChange={handleTransactionCsv}
              type="file"
            />
          </label>
          {transactionPreview ? (
            <div>
              <strong>新增 {transactionPreview.rows.length} 筆</strong>
              <span>重複略過 {transactionPreview.duplicateCount} 筆</span>
              <span>格式略過 {transactionPreview.skipped.length} 列</span>
            </div>
          ) : null}
          <button
            disabled={!transactionPreview?.rows.length || transactionsConfirmed}
            onClick={confirmTransactions}
            type="button"
          >
            確認寫入交易資料
          </button>
        </section>

        <section aria-labelledby="holdings-import-title" className="data-connection-card">
          <p>帳務庫存</p>
          <h2 id="holdings-import-title">匯入庫存</h2>
          <span>先確認庫存數與快照日期；同日舊庫存將由此檔完整取代。</span>
          <label>
            選擇庫存 CSV
            <input accept=".csv,text/csv" aria-label="庫存 CSV" onChange={handleHoldingsCsv} type="file" />
          </label>
          {holdingsPreview ? (
            <div>
              <strong>有效庫存 {holdingsPreview.rows.length} 筆</strong>
              <label>
                庫存快照日期
                <input
                  onChange={(event) => {
                    setSnapshotDate(event.target.value);
                    setHoldingsConfirmed(false);
                  }}
                  type="date"
                  value={snapshotDate}
                />
              </label>
            </div>
          ) : null}
          <button
            disabled={!holdingsPreview?.rows.length || !snapshotDate || holdingsConfirmed}
            onClick={confirmHoldings}
            type="button"
          >
            確認寫入庫存資料
          </button>
        </section>
      </div>

      <MarketSyncPanel />

      {message ? (
        <p className="data-connection-message" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
