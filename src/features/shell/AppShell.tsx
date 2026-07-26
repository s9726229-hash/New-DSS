import type { ReactNode } from 'react';

export type PageId = 'today' | 'history' | 'profile' | 'dataConnection' | 'settings';

const NAV_ITEMS: Array<{ id: PageId; label: string }> = [
  { id: 'today', label: '今日 DSS' },
  { id: 'history', label: '歷史交易研究' },
  { id: 'profile', label: 'Profile' },
  { id: 'dataConnection', label: '資料與連線' },
  { id: 'settings', label: '設定' },
];

export type AppShellProps = {
  activePage: PageId;
  onPageChange: (page: PageId) => void;
  children: ReactNode;
};

export function AppShell({ activePage, onPageChange, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <nav aria-label="主導覽" className="app-shell__nav">
        <p className="app-shell__brand">New DSS</p>
        {NAV_ITEMS.map((item) => (
          <button
            aria-current={activePage === item.id ? 'page' : undefined}
            className="app-shell__nav-item"
            key={item.id}
            onClick={() => onPageChange(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>
      <main className="app-shell__content">{children}</main>
    </div>
  );
}
