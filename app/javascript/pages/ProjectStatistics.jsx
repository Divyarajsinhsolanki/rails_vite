import React, { useEffect, useMemo, useState } from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  FlagIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleSolidIcon,
  ClockIcon as ClockSolidIcon
} from '@heroicons/react/24/solid';
import { SchedulerAPI } from '../components/api';

const STATUS_LABELS = {
  todo: 'To Do',
  inprogress: 'In Progress',
  completed: 'Completed',
};

const STATUS_COLORS = {
  todo: 'bg-gray-100 text-gray-700',
  inprogress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
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

const ProgressBar = ({ value, color = 'bg-blue-500', height = 'h-2' }) => (
  <div className={`w-full bg-gray-200 rounded-full ${height}`}>
    <div
      className={`${color} ${height} rounded-full transition-all duration-500 ease-out`}
      style={{ width: `${value}%` }}
    />
  </div>
);

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend, className = '' }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    purple: 'text-purple-600 bg-purple-50',
    gray: 'text-gray-600 bg-gray-50'
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline gap-2 mb-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span className={`text-sm font-medium ${trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

const ProjectStatistics = ({ projectId }) => {
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('overview');

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

    const scheduledSprints = sprints
      .map((sprint) => {
        const metrics = taskGroups[sprint.id] || { total: 0, completed: 0, inProgress: 0, todo: 0 };
        const completionRate = metrics.total ? Math.round((metrics.completed / metrics.total) * 100) : 0;
        const daysLeft = calculateDaysBetween(new Date().toISOString(), sprint.end_date);

        return {
          id: sprint.id,
          name: sprint.name,
          startDate: sprint.start_date,
          endDate: sprint.end_date,
          dateRange: `${formatDate(sprint.start_date)} – ${formatDate(sprint.end_date)}`,
          metrics,
          completionRate,
          daysLeft,
          isActive: new Date(sprint.start_date) <= new Date() && new Date(sprint.end_date) >= new Date(),
        };
      })
      .sort((a, b) => {
        const startA = new Date(a.startDate).getTime();
        const startB = new Date(b.startDate).getTime();
        const hasValidStartA = Number.isFinite(startA);
        const hasValidStartB = Number.isFinite(startB);

        if (hasValidStartA && hasValidStartB && startB !== startA) {
          return startB - startA;
        }

        if (hasValidStartB && !hasValidStartA) return 1;
        if (!hasValidStartB && hasValidStartA) return -1;

        const endA = new Date(a.endDate).getTime();
        const endB = new Date(b.endDate).getTime();
        if (Number.isFinite(endA) && Number.isFinite(endB) && endB !== endA) {
          return endB - endA;
        }

        return 0;
      });

    const unscheduledSprint =
      taskGroups.unscheduled && {
        id: 'unscheduled',
        name: 'Backlog & Unscheduled',
        dateRange: '—',
        metrics: taskGroups.unscheduled,
        completionRate: taskGroups.unscheduled.total
          ? Math.round((taskGroups.unscheduled.completed / taskGroups.unscheduled.total) * 100)
          : 0,
        daysLeft: null,
        isActive: false,
      };

    return unscheduledSprint ? [...scheduledSprints, unscheduledSprint] : scheduledSprints;
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
          avatar: user?.avatar,
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

    return Object.values(groups)
      .map((entry) => ({
        ...entry,
        completionRate: entry.total ? Math.round((entry.completed / entry.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
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
      status: task.status || 'todo',
      statusLabel: STATUS_LABELS[task.status] || 'To Do',
      dueDate: formatDate(task.end_date),
      sprintId: task.sprint_id,
      daysUntil: calculateDaysBetween(new Date().toISOString(), task.end_date),
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

  const statusDistribution = useMemo(() => [
    { status: 'completed', count: summary.completed, color: 'bg-emerald-500', label: 'Completed' },
    { status: 'inprogress', count: summary.inProgress, color: 'bg-blue-500', label: 'In Progress' },
    { status: 'todo', count: summary.todo, color: 'bg-gray-300', label: 'To Do' },
  ], [summary]);

  const sprintSummary = useMemo(() => {
    if (!sprintBreakdown.length) {
      return {
        total: 0,
        active: 0,
        completed: 0,
        avgCompletion: 0,
      };
    }

    const active = sprintBreakdown.filter((sprint) => sprint.isActive).length;
    const completed = sprintBreakdown.filter((sprint) => sprint.metrics.total > 0 && sprint.metrics.total === sprint.metrics.completed).length;
    const avgCompletion = Math.round(
      sprintBreakdown.reduce((total, sprint) => total + sprint.completionRate, 0) / sprintBreakdown.length
    );

    return {
      total: sprintBreakdown.length,
      active,
      completed,
      avgCompletion,
    };
  }, [sprintBreakdown]);

  const teamSummary = useMemo(() => {
    if (!userBreakdown.length) {
      return {
        members: 0,
        active: 0,
        avgCompletion: 0,
        topContributor: null,
      };
    }

    const activeMembers = userBreakdown.filter((user) => user.completed > 0 || user.inProgress > 0).length;
    const avgCompletion = Math.round(
      userBreakdown.reduce((total, user) => total + user.completionRate, 0) / userBreakdown.length
    );
    const topContributor = userBreakdown.reduce((top, current) => {
      if (!top) return current;
      if (current.completed > top.completed) return current;
      if (current.completed === top.completed && current.inProgress > top.inProgress) return current;
      return top;
    }, null);

    return {
      members: userBreakdown.length,
      active: activeMembers,
      avgCompletion,
      topContributor,
    };
  }, [userBreakdown]);

  const atRiskTasks = useMemo(() => {
    const now = new Date();

    return tasks
      .map((task) => {
        if (!task.end_date) return null;
        if (task.status === 'completed') return null;
        const dueDate = new Date(task.end_date);
        if (!Number.isFinite(dueDate.getTime())) return null;
        const daysUntil = calculateDaysBetween(new Date().toISOString(), task.end_date);
        const isOverdue = dueDate < now;
        const isDueSoon = !isOverdue && typeof daysUntil === 'number' && daysUntil <= 3;

        if (!isOverdue && !isDueSoon) return null;

        return {
          id: task.id,
          title: task.title || task.task_id,
          status: task.status || 'todo',
          statusLabel: STATUS_LABELS[task.status] || 'To Do',
          dueDate: formatDate(task.end_date),
          sprintId: task.sprint_id,
          daysUntil,
          isOverdue,
          isDueSoon,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        if (typeof a.daysUntil === 'number' && typeof b.daysUntil === 'number') {
          return a.daysUntil - b.daysUntil;
        }
        return 0;
      });
  }, [tasks]);

  const recentlyCompletedMilestones = useMemo(() =>
    tasks
      .filter((task) => task.status === 'completed' && task.end_date)
      .sort((a, b) => new Date(b.end_date) - new Date(a.end_date))
      .slice(0, 5)
      .map((task) => ({
        id: task.id,
        title: task.title || task.task_id,
        completedOn: formatDate(task.end_date),
        sprintId: task.sprint_id,
      })),
  [tasks]);

  const milestoneSummary = useMemo(() => ({
    upcoming: upcomingMilestones.length,
    dueSoon: atRiskTasks.filter((task) => task.isDueSoon).length,
    overdue: atRiskTasks.filter((task) => task.isOverdue).length,
    completed: recentlyCompletedMilestones.length,
  }), [atRiskTasks, upcomingMilestones, recentlyCompletedMilestones]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-gray-50 to-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4" />
        <p className="text-gray-600 font-medium">Loading project analytics...</p>
        <p className="text-sm text-gray-500 mt-2">Crunching the numbers</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to load statistics</h3>
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-white border border-dashed border-gray-300 rounded-3xl p-12 text-center">
        <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks yet</h3>
        <p className="text-gray-600 max-w-md mx-auto mb-6">
          Start planning your project work to unlock detailed analytics and insights.
        </p>
        <div className="flex justify-center gap-3">
          <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors">
            Create First Task
          </button>
          <button className="px-6 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl font-medium transition-colors">
            Learn More
          </button>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Tasks"
          value={summary.total}
          subtitle={`${summary.completed} completed`}
          icon={ChartBarIcon}
          color="blue"
        />
        <StatCard
          title="Completion Rate"
          value={`${summary.completionRate}%`}
          subtitle={`${summary.inProgress} in progress`}
          icon={CheckCircleIcon}
          color="emerald"
          trend={5}
        />
        <StatCard
          title="Overdue Tasks"
          value={summary.overdue}
          subtitle="Need attention"
          icon={ExclamationTriangleIcon}
          color="amber"
        />
        <StatCard
          title="Avg. Cycle Time"
          value={averageCycleTime !== null ? `${averageCycleTime}d` : '—'}
          subtitle="Time to complete tasks"
          icon={ClockIcon}
          color="purple"
        />
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Progress Overview</h2>
            <p className="text-gray-600 text-sm mt-1">Overall project completion status</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
              <span className="text-sm text-gray-600">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-sm text-gray-600">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full" />
              <span className="text-sm text-gray-600">To Do</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <ProgressBar value={summary.completionRate} color="bg-gradient-to-r from-blue-500 to-emerald-500" height="h-4" />
          <div className="grid grid-cols-3 gap-4 text-center">
            {statusDistribution.map((item) => (
              <div key={item.status} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{item.count}</div>
                <div className="text-sm text-gray-600">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Sprint Progress</h2>
              <p className="text-gray-600 text-sm mt-1">Current iteration performance</p>
            </div>
            <FlagIcon className="w-6 h-6 text-gray-400" />
          </div>

          <div className="space-y-4">
            {sprintBreakdown.slice(0, 3).map((sprint) => (
              <div
                key={sprint.id}
                className={`p-4 border rounded-xl transition-colors ${
                  sprint.isActive
                    ? 'border-blue-200 bg-blue-50/40'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{sprint.name}</h3>
                    <p className="text-sm text-gray-500">{sprint.dateRange}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{sprint.completionRate}%</span>
                </div>

                <ProgressBar value={sprint.completionRate} />

                <div className="grid grid-cols-4 gap-3 mt-3 text-xs text-gray-600">
                  <span className="text-emerald-600">{sprint.metrics.completed} completed</span>
                  <span className="text-blue-600">{sprint.metrics.inProgress} in progress</span>
                  <span className="text-gray-500">{sprint.metrics.todo} to do</span>
                  <span className="text-right">
                    {sprint.daysLeft !== null ? `${sprint.daysLeft} days left` : '—'}
                  </span>
                </div>
              </div>
            ))}
            {sprintBreakdown.length > 3 && (
              <p className="text-sm text-blue-600 font-medium">
                {sprintBreakdown.length - 3} more sprint{(sprintBreakdown.length - 3) === 1 ? '' : 's'} in detail view
              </p>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Team Performance</h2>
              <p className="text-gray-600 text-sm mt-1">Individual contributions and progress</p>
            </div>
            <UserGroupIcon className="w-6 h-6 text-gray-400" />
          </div>

          <div className="space-y-4">
            {userBreakdown.slice(0, 4).map((user) => (
              <div key={user.id} className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-500">{user.email || 'No email'}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.completionRate}%</span>
                </div>

                <ProgressBar value={user.completionRate} />

                <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                  <span>Total: {user.total} tasks</span>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-600">{user.completed} done</span>
                    <span className="text-blue-600">{user.inProgress} active</span>
                    <span className="text-gray-500">{user.todo} pending</span>
                  </div>
                </div>
              </div>
            ))}
            {userBreakdown.length > 4 && (
              <p className="text-sm text-blue-600 font-medium">
                View all {userBreakdown.length} team members in the Team tab
              </p>
            )}
          </div>
        </section>
      </div>

      {upcomingMilestones.length > 0 && (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Milestones</h2>
              <p className="text-gray-600 text-sm mt-1">Tasks with approaching deadlines</p>
            </div>
            <CalendarIcon className="w-6 h-6 text-gray-400" />
          </div>

          <div className="grid gap-3">
            {upcomingMilestones.map((milestone) => (
              <div key={milestone.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${STATUS_COLORS[milestone.status]}`}>
                    {milestone.status === 'completed' ? (
                      <CheckCircleSolidIcon className="w-4 h-4" />
                    ) : milestone.status === 'inprogress' ? (
                      <ClockSolidIcon className="w-4 h-4" />
                    ) : (
                      <CalendarIcon className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {milestone.title}
                    </h3>
                    <p className="text-sm text-gray-500">{milestone.statusLabel}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      Due {milestone.dueDate}
                    </p>
                    {milestone.daysUntil !== null && (
                      <p className="text-xs text-gray-500">
                        {milestone.daysUntil === 0
                          ? 'Today'
                          : milestone.daysUntil === 1
                            ? 'Tomorrow'
                            : `${milestone.daysUntil} days left`}
                      </p>
                    )}
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-gray-600 transition-all">
                    <EllipsisHorizontalIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Need more insights?</h3>
            <p className="text-gray-600">Generate detailed reports or export your data</p>
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl font-medium transition-colors shadow-sm">
              Export Report
            </button>
            <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors shadow-sm">
              Generate Insights
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSprints = () => (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Sprints"
          value={sprintSummary.total}
          subtitle={`${sprintSummary.active} active now`}
          icon={FlagIcon}
          color="blue"
        />
        <StatCard
          title="Avg. Completion"
          value={`${sprintSummary.avgCompletion}%`}
          subtitle="Across all sprints"
          icon={ArrowTrendingUpIcon}
          color="emerald"
        />
        <StatCard
          title="Completed Sprints"
          value={sprintSummary.completed}
          subtitle="Fully delivered"
          icon={CheckCircleIcon}
          color="purple"
        />
        <StatCard
          title="Total Tasks"
          value={summary.total}
          subtitle={`${summary.inProgress} currently active`}
          icon={ChartBarIcon}
          color="gray"
        />
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Sprint Breakdown</h2>
            <p className="text-gray-600 text-sm mt-1">Velocity and progress for each iteration</p>
          </div>
          <CalendarIcon className="w-6 h-6 text-gray-400" />
        </div>

        {sprintBreakdown.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No sprints have been scheduled yet.</div>
        ) : (
          <div className="space-y-4">
            {sprintBreakdown.map((sprint) => (
              <div
                key={sprint.id}
                className={`p-5 border rounded-xl transition-colors ${
                  sprint.isActive
                    ? 'border-blue-200 bg-blue-50/40'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{sprint.name}</h3>
                      {sprint.isActive && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                          <ClockIcon className="w-4 h-4" /> Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{sprint.dateRange}</p>
                    {sprint.daysLeft !== null && (
                      <p className="text-xs text-gray-500 mt-1">
                        {sprint.daysLeft === 0
                          ? 'Ends today'
                          : sprint.daysLeft < 0
                            ? `${Math.abs(sprint.daysLeft)} days past due`
                            : `${sprint.daysLeft} days remaining`}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-gray-900">{sprint.completionRate}%</p>
                    <p className="text-xs text-gray-500">completion</p>
                  </div>
                </div>

                <div className="mt-4">
                  <ProgressBar value={sprint.completionRate} />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm text-gray-600">
                    <span className="text-emerald-600">{sprint.metrics.completed} completed</span>
                    <span className="text-blue-600">{sprint.metrics.inProgress} in progress</span>
                    <span className="text-gray-500">{sprint.metrics.todo} to do</span>
                    <span>Total: {sprint.metrics.total} tasks</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const renderTeam = () => (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Team Members"
          value={teamSummary.members}
          subtitle={`${teamSummary.active} contributing`}
          icon={UserGroupIcon}
          color="blue"
        />
        <StatCard
          title="Avg. Completion"
          value={`${teamSummary.avgCompletion}%`}
          subtitle="Across the team"
          icon={ArrowTrendingUpIcon}
          color="emerald"
        />
        <StatCard
          title="Tasks Completed"
          value={userBreakdown.reduce((total, user) => total + user.completed, 0)}
          subtitle="Delivered by the team"
          icon={CheckCircleIcon}
          color="purple"
        />
        <StatCard
          title="Tasks In Progress"
          value={userBreakdown.reduce((total, user) => total + user.inProgress, 0)}
          subtitle="Actively being worked on"
          icon={ClockIcon}
          color="gray"
        />
      </section>

      {teamSummary.topContributor && (
        <section className="bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 border border-emerald-100 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                {teamSummary.topContributor.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Top Contributor</h2>
                <p className="text-sm text-gray-600">{teamSummary.topContributor.name}</p>
                <p className="text-xs text-gray-500">{teamSummary.topContributor.email || 'No email'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">{teamSummary.topContributor.completed}</p>
              <p className="text-sm text-gray-600">Tasks completed</p>
              <p className="text-xs text-gray-500 mt-1">{teamSummary.topContributor.completionRate}% completion</p>
            </div>
          </div>
        </section>
      )}

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Team Breakdown</h2>
            <p className="text-gray-600 text-sm mt-1">Contribution by each member</p>
          </div>
          <UserGroupIcon className="w-6 h-6 text-gray-400" />
        </div>

        {userBreakdown.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No team members have been assigned tasks yet.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {userBreakdown.map((user) => (
              <div key={user.id} className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-base">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-500">{user.email || 'No email'}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.completionRate}%</span>
                </div>

                <ProgressBar value={user.completionRate} />

                <div className="grid grid-cols-3 gap-3 mt-3 text-xs text-gray-600">
                  <span className="text-emerald-600">{user.completed} done</span>
                  <span className="text-blue-600">{user.inProgress} active</span>
                  <span className="text-gray-500">{user.todo} pending</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const renderMilestones = () => (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Upcoming Milestones"
          value={milestoneSummary.upcoming}
          subtitle="Scheduled next"
          icon={CalendarIcon}
          color="blue"
        />
        <StatCard
          title="Due Soon"
          value={milestoneSummary.dueSoon}
          subtitle="Within 3 days"
          icon={ClockIcon}
          color="amber"
        />
        <StatCard
          title="Overdue"
          value={milestoneSummary.overdue}
          subtitle="Require attention"
          icon={ExclamationTriangleIcon}
          color="purple"
        />
        <StatCard
          title="Recently Completed"
          value={milestoneSummary.completed}
          subtitle="Last 5 milestones"
          icon={CheckCircleIcon}
          color="emerald"
        />
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Milestones</h2>
            <p className="text-gray-600 text-sm mt-1">Stay ahead of important deadlines</p>
          </div>
          <CalendarIcon className="w-6 h-6 text-gray-400" />
        </div>

        {upcomingMilestones.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No upcoming milestones have been scheduled.</div>
        ) : (
          <div className="space-y-3">
            {upcomingMilestones.map((milestone) => (
              <div key={milestone.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${STATUS_COLORS[milestone.status]}`}>
                    {milestone.status === 'completed' ? (
                      <CheckCircleSolidIcon className="w-4 h-4" />
                    ) : milestone.status === 'inprogress' ? (
                      <ClockSolidIcon className="w-4 h-4" />
                    ) : (
                      <CalendarIcon className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{milestone.title}</h3>
                    <p className="text-sm text-gray-500">{milestone.statusLabel}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Due {milestone.dueDate}</p>
                  {milestone.daysUntil !== null && (
                    <p className="text-xs text-gray-500">
                      {milestone.daysUntil === 0
                        ? 'Today'
                        : milestone.daysUntil === 1
                          ? 'Tomorrow'
                          : `${milestone.daysUntil} days left`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Milestones At Risk</h2>
            <p className="text-gray-600 text-sm mt-1">Overdue or due soon milestones to monitor</p>
          </div>
          <ExclamationTriangleIcon className="w-6 h-6 text-gray-400" />
        </div>

        {atRiskTasks.length === 0 ? (
          <div className="text-center text-gray-500 py-12">You're all caught up. No milestones are at risk right now.</div>
        ) : (
          <div className="space-y-3">
            {atRiskTasks.map((task) => (
              <div key={task.id} className={`p-4 border rounded-xl ${task.isOverdue ? 'border-red-200 bg-red-50/60' : 'border-amber-200 bg-amber-50/60'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{task.title}</h3>
                    <p className="text-sm text-gray-600">{task.statusLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${task.isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                      {task.isOverdue
                        ? 'Overdue'
                        : task.daysUntil === 0
                          ? 'Due today'
                          : task.daysUntil === 1
                            ? 'Due tomorrow'
                            : `Due in ${task.daysUntil} days`}
                    </p>
                    <p className="text-xs text-gray-500">Due {task.dueDate}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {recentlyCompletedMilestones.length > 0 && (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recently Completed</h2>
              <p className="text-gray-600 text-sm mt-1">Latest wins delivered by the team</p>
            </div>
            <CheckCircleIcon className="w-6 h-6 text-gray-400" />
          </div>

          <div className="space-y-3">
            {recentlyCompletedMilestones.map((milestone) => (
              <div key={milestone.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                <div>
                  <h3 className="font-medium text-gray-900">{milestone.title}</h3>
                  <p className="text-sm text-gray-500">Sprint {milestone.sprintId || '—'}</p>
                </div>
                <p className="text-sm text-gray-600">Completed {milestone.completedOn}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );

  const renderActiveView = () => {
    switch (activeView) {
      case 'sprints':
        return renderSprints();
      case 'team':
        return renderTeam();
      case 'milestones':
        return renderMilestones();
      case 'overview':
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Analytics</h1>
          <p className="text-gray-600 mt-1">Track progress, team performance, and milestones</p>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          {['overview', 'sprints', 'team', 'milestones'].map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeView === view
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {renderActiveView()}
    </div>
  );
};

export default ProjectStatistics;
