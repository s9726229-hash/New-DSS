import type { ReactNode } from 'react';

export type PageId = 'today' | 'research' | 'profile' | 'dataCenter' | 'settings';

export type DataStatus = {
  priceDate: string | null;
  institutionalDate: string | null;
  intradayState: 'unavailable' | 'previousClose';
  syncedAt: string | null;
};

type AppShellProps = {
  activePage: PageId;
  children?: ReactNode;
  dataStatus: DataStatus;
  onPageChange: (page: PageId) => void;
};

const pages: Array<{ id: PageId; label: string; description: string }> = [
  { id: 'today', label: '今日 DSS', description: '集中檢視持股與觀察清單。' },
  { id: 'research', label: '歷史交易研究', description: '從歷史交易建立可驗證的參數候選。' },
  { id: 'profile', label: 'Profile', description: '檢視並管理技術面與籌碼面的判定條件。' },
  { id: 'dataCenter', label: '資料中心', description: '管理本機資料、備份與匯入。' },
  { id: 'settings', label: '設定', description: '管理本機使用偏好與資料來源設定。' },
];

function displayDate(value: string | null): string {
  return value ?? '尚未同步';
}

export function AppShell({ activePage, children, dataStatus, onPageChange }: AppShellProps) {
  const activePageDetail = pages.find((page) => page.id === activePage) ?? pages[0];

  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="主要導覽">
        <div className="app-brand">
          <span className="app-brand-mark">D</span>
          <div>
            <strong>New DSS</strong>
            <span>Decision Support</span>
          </div>
        </div>

        <nav className="app-navigation" aria-label="主選單">
          {pages.map((page) => (
            <button
              aria-current={activePage === page.id ? 'page' : undefined}
              className={activePage === page.id ? 'nav-item is-active' : 'nav-item'}
              key={page.id}
              onClick={() => onPageChange(page.id)}
              type="button"
            >
              {page.label}
            </button>
          ))}
        </nav>

        <p className="sidebar-note">本機決策輔助工具，不自動執行交易。</p>
      </aside>

      <main className="app-main">
        <header className="data-status" aria-label="資料狀態">
          <dl>
            <div>
              <dt>價格資料</dt>
              <dd>{displayDate(dataStatus.priceDate)}</dd>
            </div>
            <div>
              <dt>法人資料</dt>
              <dd>{displayDate(dataStatus.institutionalDate)}</dd>
            </div>
            <div>
              <dt>盤中價格</dt>
              <dd>{dataStatus.intradayState === 'unavailable' ? '尚未啟用' : '以前一日均線計算'}</dd>
            </div>
            <div>
              <dt>最近同步</dt>
              <dd>{displayDate(dataStatus.syncedAt)}</dd>
            </div>
          </dl>
          <button disabled type="button">
            同步市場資料（下一階段）
          </button>
        </header>

        <section className="page-intro" aria-labelledby="page-title">
          <p>New DSS / {activePageDetail.label}</p>
          <h1 id="page-title">{activePageDetail.label}</h1>
          <span>{activePageDetail.description}</span>
        </section>
        {children}
      </main>
    </div>
  );
}
