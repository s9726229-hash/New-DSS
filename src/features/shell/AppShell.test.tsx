import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

test('switches the main heading when the data center navigation item is selected', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: '資料中心' }));

  expect(screen.getByRole('heading', { name: '資料中心' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '建立完整備份' })).toBeInTheDocument();
});
