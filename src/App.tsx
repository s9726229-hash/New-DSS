import { useState } from 'react';
import { DataCenterPage } from './features/data-center/DataCenterPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { AppShell, type DataStatus, type PageId } from './features/shell/AppShell';

const initialDataStatus: DataStatus = {
  priceDate: null,
  institutionalDate: null,
  intradayState: 'unavailable',
  syncedAt: null,
};

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('today');

  return (
    <AppShell
      activePage={activePage}
      dataStatus={initialDataStatus}
      onPageChange={setActivePage}
    >
      {activePage === 'dataCenter' ? <DataCenterPage /> : null}
      {activePage === 'settings' ? <SettingsPage /> : null}
    </AppShell>
  );
}
