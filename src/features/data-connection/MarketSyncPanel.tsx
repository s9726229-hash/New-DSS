import { useState } from 'react';
import {
  syncLatestHoldings as runLatestHoldingsSync,
  type HoldingsSyncResult,
} from '../../market/holdingsSync';

type MarketSyncPanelProps = {
  syncLatestHoldings?: () => Promise<HoldingsSyncResult>;
};

function resultMessage(result: HoldingsSyncResult): string | null {
  if (result.kind === 'missingHoldings') return '請先匯入庫存資料';
  return null;
}

export function MarketSyncPanel({
  syncLatestHoldings = runLatestHoldingsSync,
}: MarketSyncPanelProps) {
  const [result, setResult] = useState<HoldingsSyncResult | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setIsSyncing(true);
    setError(null);

    try {
      setResult(await syncLatestHoldings());
    } catch (caughtError) {
      setResult(null);
      setError(caughtError instanceof Error ? caughtError.message : '同步失敗');
    } finally {
      setIsSyncing(false);
    }
  }

  const message = result ? resultMessage(result) : error;
  const stocks = result?.kind === 'completed' ? result.stocks : [];

  return (
    <section aria-labelledby="market-sync-title" className="market-sync-panel">
      <div className="market-sync-panel__heading">
        <div>
          <p>FINMIND</p>
          <h2 id="market-sync-title">同步目前庫存</h2>
          <span>透過 Cloudflare Worker 取得近一年調整後收盤資料與近十個交易日法人資料。</span>
        </div>
        <button disabled={isSyncing} onClick={handleSync} type="button">
          {isSyncing ? '同步中…' : '同步目前庫存'}
        </button>
      </div>

      {message ? (
        <p className="data-connection-message" role="status">
          {message}
        </p>
      ) : null}

      {result?.kind === 'completed' ? (
        <div className="market-sync-results">
          <p>
            庫存快照：{result.snapshotDate ?? '—'}　共 {stocks.length} 檔
          </p>
          <table>
            <thead>
              <tr>
                <th scope="col">股票</th>
                <th scope="col">價格資料</th>
                <th scope="col">法人資料</th>
                <th scope="col">結果</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock) => (
                <tr key={stock.stockId}>
                  <td>{stock.stockId}</td>
                  <td>{stock.priceDate ?? '—'}</td>
                  <td>{stock.institutionalDate ?? '—'}</td>
                  <td>{stock.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
