import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

vi.mock('./features/data-connection/DataConnectionPage', () => ({
  DataConnectionPage: () => <div>data-connection-page-stub</div>,
}));

describe('App', () => {
  it('shows a placeholder for today by default and switches to data connection via the nav', async () => {
    render(<App />);

    expect(screen.getByText('今日 DSS 尚未建置。')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '資料與連線' }));

    expect(screen.getByText('data-connection-page-stub')).toBeInTheDocument();
  });
});
