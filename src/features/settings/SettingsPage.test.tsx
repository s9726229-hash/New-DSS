import { beforeEach, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SettingsPage } from './SettingsPage';
import { readFinMindToken } from '../../settings/finmindToken';

beforeEach(() => {
  localStorage.clear();
});

test('does not reveal a stored token and saves a newly entered token', async () => {
  const user = userEvent.setup();
  localStorage.setItem('new-dss:finmind-token', 'existing-secret');
  render(<SettingsPage />);

  expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'password');
  expect(screen.getByText('目前狀態：已儲存')).toBeInTheDocument();

  await user.type(screen.getByDisplayValue(''), 'new-secret');
  await user.click(screen.getByRole('button', { name: '儲存 API Key' }));

  expect(readFinMindToken()).toBe('new-secret');
  expect(screen.getByDisplayValue('')).toHaveValue('');
});

test('clears the locally stored token', async () => {
  const user = userEvent.setup();
  localStorage.setItem('new-dss:finmind-token', 'existing-secret');
  render(<SettingsPage />);

  await user.click(screen.getByRole('button', { name: '清除 API Key' }));

  expect(readFinMindToken()).toBeNull();
  expect(screen.getByText('目前狀態：未設定')).toBeInTheDocument();
});
