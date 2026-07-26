import { useEffect, useState } from 'react';
import { DataConnectionPage } from './features/data-connection/DataConnectionPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { AppShell, type PageId } from './features/shell/AppShell';
import { applyTheme, getStoredTheme } from './settings/theme';

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('today');

  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  return (
    <AppShell activePage={activePage} onPageChange={setActivePage}>
      {activePage === 'today' ? <p>今日 DSS 尚未建置。</p> : null}
      {activePage === 'history' ? <p>歷史交易研究尚未建置。</p> : null}
      {activePage === 'profile' ? <p>Profile 尚未建置。</p> : null}
      {activePage === 'dataConnection' ? <DataConnectionPage /> : null}
      {activePage === 'settings' ? <SettingsPage /> : null}
    </AppShell>
  );
}
