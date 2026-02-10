import { render, screen } from '@testing-library/react';
import App from './App';

test('renders bouncing game title and restart button', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /공 튀기기 게임/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /다시 시작/i })).toBeInTheDocument();
});
