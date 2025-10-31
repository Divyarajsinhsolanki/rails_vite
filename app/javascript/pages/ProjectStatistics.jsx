import React, { useEffect, useMemo, useState } from 'react';
import { ChartBarIcon, ClockIcon, UserGroupIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { SchedulerAPI } from '../components/api';

const STATUS_LABELS = {
  todo: 'To Do',
  inprogress: 'In Progress',
  completed: 'Completed',
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (error) {
    return dateString;
  }
};

const calculateDaysBetween = (start, end) => {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const durationMs = endDate.getTime() - startDate.getTime();
  if (!Number.isFinite(durationMs)) return null;
  const diff = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
  return Number.isFinite(diff) ? diff : null;
};

const ProjectStatistics = ({ projectId }) => {
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId) {
      setTasks([]);
      setSprints([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      SchedulerAPI.getTasks({ project_id: projectId }).then((res) => res.data || []),
      SchedulerAPI.getSprints(projectId).then((res) => res.data || []),
    ])
      .then(([taskData, sprintData]) => {
        if (cancelled) return;
        setTasks(Array.isArray(taskData) ? taskData : []);
        setSprints(Array.isArray(sprintData) ? sprintData : []);
      })
      .catch(() => {
        if (cancelled) return;
        setError('We could not load the latest project statistics. Please try again later.');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const summary = useMemo(() => {
    const now = new Date();
    if (!tasks.length) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        todo: 0,
        overdue: 0,
        completionRate: 0,
      };
    }

    const counts = tasks.reduce((acc, task) => {
      const status = task.status || 'todo';
      acc[status] = (acc[status] || 0) + 1;
      if (status !== 'completed' && task.end_date) {
        const endDate = new Date(task.end_date);
        if (Number.isFinite(endDate.getTime()) && endDate < now) {
          acc.overdue += 1;
        }
      }
      return acc;
    }, { todo: 0, inprogress: 0, completed: 0, overdue: 0 });

    const total = tasks.length;
    const completionRate = total ? Math.round((counts.completed / total) * 100) : 0;

    return {
      total,
      completed: counts.completed,
      inProgress: counts.inprogress,
      todo: counts.todo,
      overdue: counts.overdue,
      completionRate,
    };
  }, [tasks]);

  const sprintBreakdown = useMemo(() => {
    if (!sprints.length) return [];

    const taskGroups = tasks.reduce((acc, task) => {
      const key = task.sprint_id || 'unscheduled';
      if (!acc[key]) {
        acc[key] = { total: 0, completed: 0, inProgress: 0, todo: 0 };
      }
      const status = task.status || 'todo';
      acc[key].total += 1;
      if (status === 'completed') acc[key].completed += 1;
      else if (status === 'inprogress') acc[key].inProgress += 1;
      else acc[key].todo += 1;
      return acc;
    }, {});

    return [
      ...sprints.map((sprint) => {
        const metrics = taskGroups[sprint.id] || { total: 0, completed: 0, inProgress: 0, todo: 0 };
        const completionRate = metrics.total ? Math.round((metrics.completed / metrics.total) * 100) : 0;
        return {
          id: sprint.id,
          name: sprint.name,
          dateRange: `${formatDate(sprint.start_date)} – ${formatDate(sprint.end_date)}`,
          metrics,
          completionRate,
        };
      }),
      taskGroups.unscheduled && {
        id: 'unscheduled',
        name: 'Backlog & Unscheduled',
        dateRange: '—',
        metrics: taskGroups.unscheduled,
        completionRate: taskGroups.unscheduled.total
          ? Math.round((taskGroups.unscheduled.completed / taskGroups.unscheduled.total) * 100)
          : 0,
      },
    ].filter(Boolean);
  }, [sprints, tasks]);

  const userBreakdown = useMemo(() => {
    if (!tasks.length) return [];

    const groups = tasks.reduce((acc, task) => {
      const user = task.assigned_user;
      const key = user?.id || 'unassigned';
      if (!acc[key]) {
        acc[key] = {
          id: user?.id || 'unassigned',
          name: user ? `${user.first_name || user.email}` : 'Unassigned',
          email: user?.email,
          total: 0,
          completed: 0,
          inProgress: 0,
          todo: 0,
        };
      }
      const status = task.status || 'todo';
      acc[key].total += 1;
      if (status === 'completed') acc[key].completed += 1;
      else if (status === 'inprogress') acc[key].inProgress += 1;
      else acc[key].todo += 1;
      return acc;
    }, {});

    return Object.values(groups).map((entry) => ({
      ...entry,
      completionRate: entry.total ? Math.round((entry.completed / entry.total) * 100) : 0,
    }));
  }, [tasks]);

  const upcomingMilestones = useMemo(() => {
    const now = new Date();
    if (!tasks.length) return [];
    const upcoming = tasks
      .filter((task) => task.end_date && new Date(task.end_date) >= now)
      .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
      .slice(0, 5);

    return upcoming.map((task) => ({
      id: task.id,
      title: task.title || task.task_id,
      status: STATUS_LABELS[task.status] || 'To Do',
      dueDate: formatDate(task.end_date),
      sprintId: task.sprint_id,
    }));
  }, [tasks]);

  const averageCycleTime = useMemo(() => {
    const durations = tasks
      .filter((task) => task.status === 'completed' && task.start_date && task.end_date)
      .map((task) => calculateDaysBetween(task.start_date, task.end_date))
      .filter((value) => typeof value === 'number' && value >= 0);

    if (!durations.length) return null;
    const sum = durations.reduce((total, value) => total + value, 0);
    return Math.round(sum / durations.length);
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--theme-color)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl">
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="bg-white border border-dashed border-gray-300 p-10 text-center rounded-xl text-gray-500">
        <p className="text-lg font-medium">No tasks found for this project yet.</p>
        <p className="text-sm">Start planning work to unlock project analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Tasks</p>
              <p className="text-2xl font-semibold text-gray-800">{summary.total}</p>
            </div>
            <ChartBarIcon className="w-10 h-10 text-[var(--theme-color)]" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completion Rate</p>
              <p className="text-2xl font-semibold text-gray-800">{summary.completionRate}%</p>
            </div>
            <ClockIcon className="w-10 h-10 text-[var(--theme-color)]" />
          </div>
          <p className="mt-2 text-sm text-gray-500">{summary.completed} completed • {summary.inProgress} in progress</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Overdue Tasks</p>
              <p className="text-2xl font-semibold text-gray-800">{summary.overdue}</p>
            </div>
            <ExclamationTriangleIcon className="w-10 h-10 text-amber-500" />
          </div>
          <p className="mt-2 text-sm text-gray-500">Tasks needing attention</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Average Cycle Time</p>
              <p className="text-2xl font-semibold text-gray-800">
                {averageCycleTime !== null ? `${averageCycleTime} days` : 'Not enough data'}
              </p>
            </div>
            <ClockIcon className="w-10 h-10 text-[var(--theme-color)]" />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Sprint Progress</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Sprint</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">In Progress</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">To Do</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sprintBreakdown.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{entry.name}</td>
                  <td className="px-4 py-3 text-gray-500">{entry.dateRange}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-800">{entry.metrics.total}</td>
                  <td className="px-4 py-3 text-center text-emerald-600">{entry.metrics.completed}</td>
                  <td className="px-4 py-3 text-center text-amber-600">{entry.metrics.inProgress}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{entry.metrics.todo}</td>
                  <td className="px-4 py-3 text-center font-medium text-gray-800">{entry.completionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Team Load & Performance</h2>
          <UserGroupIcon className="w-7 h-7 text-[var(--theme-color)]" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Team Member</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">Total Tasks</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">In Progress</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">To Do</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {userBreakdown.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{user.name}</td>
                  <td className="px-4 py-3 text-gray-500">{user.email || '—'}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-800">{user.total}</td>
                  <td className="px-4 py-3 text-center text-emerald-600">{user.completed}</td>
                  <td className="px-4 py-3 text-center text-amber-600">{user.inProgress}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{user.todo}</td>
                  <td className="px-4 py-3 text-center font-medium text-gray-800">{user.completionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {upcomingMilestones.length > 0 && (
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Milestones</h2>
          <ul className="divide-y divide-gray-200">
            {upcomingMilestones.map((item) => (
              <li key={item.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">Due {item.dueDate}</p>
                  {item.sprintId && (
                    <p className="text-xs text-gray-400">Sprint #{item.sprintId}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default ProjectStatistics;
