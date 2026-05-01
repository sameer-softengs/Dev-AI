import { render, screen } from '@testing-library/react';
import App from './App';

test('renders authentication entry point', () => {
  window.localStorage.clear();
  render(<App />);
  expect(screen.getByText(/AI Service Workspace/i)).toBeInTheDocument();
  expect(screen.getByText(/Sign in to continue/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
});
