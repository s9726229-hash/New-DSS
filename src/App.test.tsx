import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the default today DSS page', () => {
  render(<App />);

  expect(screen.getByText('New DSS')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '今日 DSS' })).toBeInTheDocument();
});
