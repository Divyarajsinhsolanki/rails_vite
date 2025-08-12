import { render, screen, waitFor } from '@testing-library/react';
import { Toaster } from 'react-hot-toast';
import { vi } from 'vitest';
import Admin from '../Admin';

vi.mock('../../api', () => ({
  getTables: vi.fn(),
}));

test('shows error toast when table fetch fails', async () => {
  const api = require('../../api');
  api.getTables.mockRejectedValue(new Error('fail'));

  render(
    <>
      <Admin />
      <Toaster />
    </>
  );

  await waitFor(() => {
    expect(screen.getByText('Failed to fetch tables')).toBeInTheDocument();
  });
});
