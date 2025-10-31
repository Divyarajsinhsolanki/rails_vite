import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import SprintOverview from '../SprintOverview.jsx';

const getDevelopersMock = vi.fn();
const getTasksMock = vi.fn();
const createTaskMock = vi.fn();
const createTaskLogMock = vi.fn();
const getUsersMock = vi.fn();
const fetchProjectsMock = vi.fn();
const originalFetch = global.fetch;

vi.mock('../../components/api', () => ({
  SchedulerAPI: {
    getDevelopers: getDevelopersMock,
    getTasks: getTasksMock,
    createTask: createTaskMock,
    createTaskLog: createTaskLogMock,
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    moveTask: vi.fn(),
    toggleTaskStatus: vi.fn(),
    importSprintTasks: vi.fn(),
    importBacklogTasks: vi.fn(),
    exportSprintTasks: vi.fn(),
    exportSprintLogs: vi.fn()
  },
  getUsers: getUsersMock,
  fetchProjects: fetchProjectsMock
}));

vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../components/ui/SpinnerOverlay', () => ({
  default: () => null
}));

vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }) => <div>{children}</div>,
  Droppable: ({ children }) => children({
    droppableProps: {},
    innerRef: () => {},
    placeholder: null
  }),
  Draggable: ({ children }) => children({
    draggableProps: {},
    dragHandleProps: {},
    innerRef: () => {}
  })
}));

describe('SprintOverview', () => {
  beforeEach(() => {
    getDevelopersMock.mockResolvedValue({ data: [{ id: 1, name: 'Dev One' }] });
    getUsersMock.mockResolvedValue({ data: [] });
    fetchProjectsMock.mockResolvedValue({ data: [] });
    getTasksMock.mockImplementation(params => {
      if (params?.sprint_id) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
    createTaskMock.mockResolvedValue({
      data: {
        id: 42,
        task_id: 'ABC-123',
        sprint_id: 1,
        title: 'Example Task',
        description: '',
        task_url: '',
        estimated_hours: 1,
        developer_id: 1,
        assigned_to_user: null,
        status: 'todo',
        order: null,
        start_date: '2024-05-01',
        end_date: '2024-05-02'
      }
    });
    createTaskLogMock.mockResolvedValue({ data: {} });

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve([
        { id: 1, start_date: '2024-04-29', end_date: '2024-05-10' }
      ])
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('creates a default task log after saving a new task', async () => {
    render(<SprintOverview sheetIntegrationEnabled={false} />);

    const addTaskButton = await screen.findByRole('button', { name: /add task/i });
    fireEvent.click(addTaskButton);

    const modal = await screen.findByText(/create task/i);
    const modalRoot = modal.closest('form');

    fireEvent.change(within(modalRoot).getByLabelText(/task id/i), { target: { value: 'ABC-123' } });
    fireEvent.change(within(modalRoot).getByLabelText(/task title/i), { target: { value: 'Example Task' } });
    fireEvent.change(within(modalRoot).getByLabelText(/start date/i), { target: { value: '2024-05-01' } });
    fireEvent.change(within(modalRoot).getByLabelText(/estimated hours/i), { target: { value: '' } });

    fireEvent.submit(modalRoot);

    await waitFor(() => expect(createTaskMock).toHaveBeenCalled());
    expect(createTaskMock).toHaveBeenCalledWith(expect.objectContaining({
      date: '2024-05-01',
      estimated_hours: 1,
      skip_default_log_backfill: true
    }));
    await waitFor(() => expect(createTaskLogMock).toHaveBeenCalled());

    expect(createTaskLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        task_id: 42,
        developer_id: 1,
        log_date: '2024-05-01',
        hours_logged: 1,
        type: 'Code'
      })
    );
  });
});
