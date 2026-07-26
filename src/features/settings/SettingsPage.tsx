import { useState } from 'react';
import {
  clearFinMindToken,
  readFinMindToken,
  saveFinMindToken,
} from '../../settings/finmindToken';

export function SettingsPage() {
  const [token, setToken] = useState('');
  const [hasToken, setHasToken] = useState(() => Boolean(readFinMindToken()));

  function saveToken() {
    saveFinMindToken(token);
    setToken('');
    setHasToken(Boolean(readFinMindToken()));
  }

  function clearToken() {
    clearFinMindToken();
    setToken('');
    setHasToken(false);
  }

  return (
    <section className="data-center-page" aria-labelledby="finmind-settings-title">
      <p className="data-center-note">API Key 僅儲存在此瀏覽器，不會包含在備份或匯出檔。</p>
      <div className="data-center-card">
        <p>FINMIND</p>
        <h2 id="finmind-settings-title">FinMind API Key</h2>
        <span>目前狀態：{hasToken ? '已儲存' : '未設定'}</span>
        <label className="snapshot-date">
          FinMind API Key
          <input
            aria-label="FinMind API Key"
            autoComplete="off"
            onChange={(event) => setToken(event.target.value)}
            type="password"
            value={token}
          />
        </label>
        <div className="settings-actions">
          <button disabled={!token.trim()} onClick={saveToken} type="button">
            儲存 API Key
          </button>
          <button onClick={clearToken} type="button">
            清除 API Key
          </button>
        </div>
      </div>
    </section>
  );
}
