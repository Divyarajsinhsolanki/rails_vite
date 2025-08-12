import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Toaster } from 'react-hot-toast';
import { vi } from 'vitest';
import DynamicAdminTable from '../DynamicAdminTable';

vi.mock('../../api', () => ({
  getMeta: vi.fn(),
  getRecords: vi.fn(),
  createRecord: vi.fn(),
  updateRecord: vi.fn(),
  deleteRecord: vi.fn(),
}));

const columns = [
  { name: 'id', type: 'int' },
  { name: 'name', type: 'string' },
];

beforeEach(() => {
  const api = require('../../api');
  api.getMeta.mockResolvedValue({ data: columns });
  api.getRecords.mockResolvedValue({ data: [] });
});

test('shows success toast when record is created', async () => {
  const api = require('../../api');
  api.createRecord.mockResolvedValue({});

  render(
    <>
      <DynamicAdminTable table="users" />
      <Toaster />
    </>
  );

  await screen.findByText('Create');
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Alice' } });
  fireEvent.click(screen.getByText('Create'));

  await waitFor(() => {
    expect(screen.getByText('Record created successfully')).toBeInTheDocument();
  });
});

test('shows error toast when record creation fails', async () => {
  const api = require('../../api');
  api.createRecord.mockRejectedValue(new Error('fail'));

  render(
    <>
      <DynamicAdminTable table="users" />
      <Toaster />
    </>
  );

  await screen.findByText('Create');
  fireEvent.click(screen.getByText('Create'));

  await waitFor(() => {
    expect(screen.getByText('Failed to create record')).toBeInTheDocument();
  });
});
