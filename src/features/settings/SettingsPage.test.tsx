import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPage } from './SettingsPage';

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('SettingsPage', () => {
  it('defaults to the warm theme when nothing has been chosen', () => {
    render(<SettingsPage />);
    expect(screen.getByLabelText('暖色')).toBeChecked();
    expect(screen.getByLabelText('暗色')).not.toBeChecked();
  });

  it('switches to the dark theme, persists it, and applies the data-theme attribute', async () => {
    render(<SettingsPage />);

    await userEvent.click(screen.getByLabelText('暗色'));

    expect(screen.getByLabelText('暗色')).toBeChecked();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('new-dss:theme')).toBe('dark');
  });

  it('shows the no-API-key assurance', () => {
    render(<SettingsPage />);
    expect(screen.getByText(/不儲存任何 API Key/)).toBeInTheDocument();
  });
});
