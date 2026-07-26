import { useState } from 'react';
import { applyTheme, getStoredTheme, setStoredTheme, type ThemeName } from '../../settings/theme';

export function SettingsPage() {
  const [theme, setTheme] = useState<ThemeName>(() => getStoredTheme());

  function selectTheme(next: ThemeName) {
    setStoredTheme(next);
    applyTheme(next);
    setTheme(next);
  }

  return (
    <section aria-labelledby="settings-title">
      <h2 id="settings-title">設定</h2>
      <p>所有資料保存在本機瀏覽器；市場資料經由 Cloudflare Worker 安全取得，此裝置不儲存任何 API Key。</p>

      <fieldset>
        <legend>顯示主題</legend>
        <label>
          <input
            checked={theme === 'light'}
            name="theme"
            onChange={() => selectTheme('light')}
            type="radio"
            value="light"
          />
          暖色
        </label>
        <label>
          <input
            checked={theme === 'dark'}
            name="theme"
            onChange={() => selectTheme('dark')}
            type="radio"
            value="dark"
          />
          暗色
        </label>
      </fieldset>
    </section>
  );
}
