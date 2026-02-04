import { describe, expect, it, vi, afterEach } from 'vitest';
import { getCompletionData, getDueColor, getStatusClasses } from './taskUtils';

describe('taskUtils', () => {
  it('builds completion data with percentages', () => {
    const columns = {
      todo: { name: 'Todo', items: [{ id: 1 }, { id: 2 }] },
      done: { name: 'Done', items: [{ id: 3 }] },
    };

    const result = getCompletionData(columns);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ name: 'Todo', value: 2, percent: 67 });
    expect(result[1]).toMatchObject({ name: 'Done', value: 1, percent: 33 });
  });

  it('returns due colors based on today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));

    expect(getDueColor('2024-01-14')).toBe('text-red-600');
    expect(getDueColor('2024-01-15')).toBe('text-green-600');
    expect(getDueColor('2024-01-16')).toBe('text-gray-500');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('maps status to css classes', () => {
    expect(getStatusClasses('completed')).toBe('bg-green-100 text-green-800');
    expect(getStatusClasses('in progress')).toBe('bg-yellow-100 text-yellow-800');
    expect(getStatusClasses('other')).toBe('bg-blue-100 text-blue-800');
  });
});
