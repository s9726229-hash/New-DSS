import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('renders all five navigation items', () => {
    render(
      <AppShell activePage="today" onPageChange={() => {}}>
        content
      </AppShell>,
    );

    expect(screen.getByRole('button', { name: '今日 DSS' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '歷史交易研究' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '資料與連線' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '設定' })).toBeInTheDocument();
  });

  it('marks the active page with aria-current and leaves others unmarked', () => {
    render(
      <AppShell activePage="settings" onPageChange={() => {}}>
        content
      </AppShell>,
    );

    expect(screen.getByRole('button', { name: '設定' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: '今日 DSS' })).not.toHaveAttribute('aria-current');
  });

  it('calls onPageChange with the clicked page id', async () => {
    const onPageChange = vi.fn();
    render(
      <AppShell activePage="today" onPageChange={onPageChange}>
        content
      </AppShell>,
    );

    await userEvent.click(screen.getByRole('button', { name: '資料與連線' }));

    expect(onPageChange).toHaveBeenCalledWith('dataConnection');
  });

  it('renders the page content passed as children', () => {
    render(
      <AppShell activePage="today" onPageChange={() => {}}>
        <p>今日內容</p>
      </AppShell>,
    );

    expect(screen.getByText('今日內容')).toBeInTheDocument();
  });
});
