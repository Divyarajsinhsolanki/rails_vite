import React, { useEffect, useMemo, useState } from 'react';

const EMPTY_ARRAY = [];

const numberOrZero = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const formatHours = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '0h';
  const normalized = numericValue.toFixed(2).replace(/\.0+$/, '').replace(/\.(\d*?)0+$/, '.$1');
  return `${normalized}h`;
};

const resolveDefaultLogDate = (dates = []) => {
  if (!dates.length) return '';

  const today = new Date().toISOString().slice(0, 10);
  if (dates.includes(today)) return today;
  return dates[dates.length - 1] || dates[0];
};

const resolveDefaultLogType = (viewMode, types = []) => {
  const preferredType = viewMode === 'qa' ? 'Testing' : 'Code';
  return types.includes(preferredType) ? preferredType : (types[0] || preferredType);
};

const pickPlannedHours = (task) => {
  const candidates = [
    task?.estimated_hours,
    task?.type === 'qa' ? task?.qa_hours : task?.dev_hours,
    task?.type === 'qa' ? task?.dev_hours : task?.qa_hours,
    task?.total_hours
  ];

  const plannedHours = candidates.find((value) => value !== null && value !== undefined && value !== '');
  return numberOrZero(plannedHours);
};

const buildLoggedHoursByTask = (logs = []) =>
  logs.reduce((accumulator, log) => {
    const taskId = log?.task_id ?? log?.task?.id;
    if (!taskId || log?.deleted) return accumulator;

    accumulator[String(taskId)] = (accumulator[String(taskId)] || 0) + numberOrZero(log.hours_logged);
    return accumulator;
  }, {});

const buildDailyHoursByMemberDate = (logs = []) =>
  logs.reduce((accumulator, log) => {
    const developerId = log?.developer_id ?? log?.developerId;
    const logDate = log?.log_date ?? log?.logDate;
    if (!developerId || !logDate || log?.deleted) return accumulator;

    if (!accumulator[String(developerId)]) accumulator[String(developerId)] = {};
    accumulator[String(developerId)][logDate] = (accumulator[String(developerId)][logDate] || 0) + numberOrZero(log.hours_logged);
    return accumulator;
  }, {});

const appendOrMergeEntry = (entries, nextEntry) => {
  const existingEntry = entries.find((entry) => (
    entry.task_id === nextEntry.task_id &&
    entry.developer_id === nextEntry.developer_id &&
    entry.log_date === nextEntry.log_date &&
    entry.type === nextEntry.type
  ));

  if (existingEntry) {
    existingEntry.hours_logged += nextEntry.hours_logged;
    return;
  }

  entries.push(nextEntry);
};

const buildDistributionPlan = ({ rows, dates, startDate, maxHoursPerDay, existingLogs, logType }) => {
  const distributionDates = dates.filter((date) => date >= startDate);
  const perDayLimit = numberOrZero(maxHoursPerDay);
  const dailyHoursByMemberDate = buildDailyHoursByMemberDate(existingLogs);
  const selectedRows = rows.filter((row) => row.selected && row.developerId && numberOrZero(row.hours) > 0);
  const entries = [];
  let overflowHours = 0;
  let overflowTasks = 0;

  selectedRows.forEach((row) => {
    const developerId = String(row.developerId);
    let remainingHours = numberOrZero(row.hours);

    distributionDates.forEach((date) => {
      if (remainingHours <= 0 || perDayLimit <= 0) return;

      const currentHours = dailyHoursByMemberDate[developerId]?.[date] || 0;
      const availableHours = Math.max(perDayLimit - currentHours, 0);
      if (availableHours <= 0) return;

      const assignedHours = Math.min(remainingHours, availableHours);
      appendOrMergeEntry(entries, {
        task_id: row.taskId,
        developer_id: Number(developerId),
        log_date: date,
        type: logType,
        hours_logged: assignedHours,
        status: 'todo'
      });

      if (!dailyHoursByMemberDate[developerId]) dailyHoursByMemberDate[developerId] = {};
      dailyHoursByMemberDate[developerId][date] = currentHours + assignedHours;
      remainingHours -= assignedHours;
    });

    if (remainingHours > 0 && distributionDates.length) {
      const lastDate = distributionDates[distributionDates.length - 1];
      appendOrMergeEntry(entries, {
        task_id: row.taskId,
        developer_id: Number(developerId),
        log_date: lastDate,
        type: logType,
        hours_logged: remainingHours,
        status: 'todo'
      });

      if (!dailyHoursByMemberDate[developerId]) dailyHoursByMemberDate[developerId] = {};
      dailyHoursByMemberDate[developerId][lastDate] = (dailyHoursByMemberDate[developerId][lastDate] || 0) + remainingHours;
      overflowHours += remainingHours;
      overflowTasks += 1;
    }
  });

  return {
    entries,
    selectedRows,
    distributionDates,
    overflowHours,
    overflowTasks
  };
};

const sortTasks = (left, right) => {
  const leftOrder = Number(left?.order) || Number.MAX_SAFE_INTEGER;
  const rightOrder = Number(right?.order) || Number.MAX_SAFE_INTEGER;
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;

  const leftDate = left?.end_date || left?.start_date || '';
  const rightDate = right?.end_date || right?.start_date || '';
  if (leftDate !== rightDate) return String(leftDate).localeCompare(String(rightDate));

  return String(left?.task_id || left?.title || left?.id).localeCompare(String(right?.task_id || right?.title || right?.id));
};

const resolveSuggestedDeveloperId = (task, developers, viewMode) => {
  const safeDevelopers = Array.isArray(developers) ? developers : EMPTY_ARRAY;
  const availableIds = new Set(safeDevelopers.map((developer) => String(developer.id)));
  const candidateIds = viewMode === 'qa'
    ? [task?.assigned_to_user, task?.assigned_user?.id, task?.developer_id, task?.developer?.id]
    : [task?.developer_id, task?.developer?.id, task?.assigned_to_user, task?.assigned_user?.id];

  const matchingId = candidateIds.find((candidateId) => candidateId && availableIds.has(String(candidateId)));
  return matchingId ? String(matchingId) : (safeDevelopers[0] ? String(safeDevelopers[0].id) : '');
};

export default function BulkLogForm({
  tasks,
  existingLogs,
  developers,
  dates,
  types,
  viewMode = 'combined',
  onSubmit,
  onCancel
}) {
  const safeTasks = useMemo(() => Array.isArray(tasks) ? tasks : EMPTY_ARRAY, [tasks]);
  const safeExistingLogs = useMemo(() => Array.isArray(existingLogs) ? existingLogs : EMPTY_ARRAY, [existingLogs]);
  const safeDevelopers = useMemo(() => Array.isArray(developers) ? developers : EMPTY_ARRAY, [developers]);
  const safeDates = useMemo(() => Array.isArray(dates) ? dates : EMPTY_ARRAY, [dates]);
  const safeTypes = useMemo(() => Array.isArray(types) ? types : EMPTY_ARRAY, [types]);
  const [logDate, setLogDate] = useState('');
  const [logType, setLogType] = useState('');
  const [maxHoursPerDay, setMaxHoursPerDay] = useState('8');
  const [applyDeveloperId, setApplyDeveloperId] = useState('');
  const [showOnlyRemaining, setShowOnlyRemaining] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loggedHoursByTask = buildLoggedHoursByTask(safeExistingLogs);
    const nextRows = [...safeTasks]
      .sort(sortTasks)
      .map((task) => {
        const plannedHours = pickPlannedHours(task);
        const loggedHours = numberOrZero(loggedHoursByTask[String(task.id)]);
        const remainingHours = plannedHours - loggedHours;
        const suggestedHours = remainingHours > 0 ? remainingHours : 0;

        return {
          taskId: task.id,
          taskKey: task.task_id,
          taskUrl: task.task_url,
          title: task.title,
          plannedHours,
          loggedHours,
          remainingHours,
          developerId: resolveSuggestedDeveloperId(task, safeDevelopers, viewMode),
          hours: suggestedHours > 0 ? String(suggestedHours) : '',
          selected: suggestedHours > 0
        };
      });

    setRows(nextRows);
    setLogDate(resolveDefaultLogDate(safeDates));
    setLogType(resolveDefaultLogType(viewMode, safeTypes));
    setMaxHoursPerDay('8');
    setApplyDeveloperId(safeDevelopers[0] ? String(safeDevelopers[0].id) : '');
    setShowOnlyRemaining(true);
    setError('');
  }, [safeTasks, safeExistingLogs, safeDevelopers, safeDates, safeTypes, viewMode]);

  const visibleRows = useMemo(
    () => rows.filter((row) => !showOnlyRemaining || row.selected || row.remainingHours > 0),
    [rows, showOnlyRemaining]
  );

  const selectedRows = useMemo(
    () => rows.filter((row) => row.selected),
    [rows]
  );

  const selectedHoursTotal = useMemo(
    () => selectedRows.reduce((sum, row) => sum + numberOrZero(row.hours), 0),
    [selectedRows]
  );

  const distributionPreview = useMemo(
    () => buildDistributionPlan({
      rows,
      dates: safeDates,
      startDate: logDate,
      maxHoursPerDay,
      existingLogs: safeExistingLogs,
      logType
    }),
    [rows, safeDates, logDate, maxHoursPerDay, safeExistingLogs, logType]
  );

  const remainingTaskCount = useMemo(
    () => rows.filter((row) => row.remainingHours > 0).length,
    [rows]
  );

  const updateRow = (taskId, updater) => {
    setRows((currentRows) => currentRows.map((row) => (
      row.taskId === taskId ? updater(row) : row
    )));
  };

  const toggleSelection = (taskId) => {
    setError('');
    updateRow(taskId, (row) => ({
      ...row,
      selected: !row.selected,
      hours: !row.selected && !row.hours && row.remainingHours > 0 ? String(row.remainingHours) : row.hours
    }));
  };

  const handleHoursChange = (taskId, value) => {
    setError('');
    updateRow(taskId, (row) => ({ ...row, hours: value }));
  };

  const handleDeveloperChange = (taskId, value) => {
    setError('');
    updateRow(taskId, (row) => ({ ...row, developerId: value }));
  };

  const selectRemainingTasks = () => {
    setRows((currentRows) => currentRows.map((row) => ({
      ...row,
      selected: row.remainingHours > 0,
      hours: row.remainingHours > 0 ? String(row.remainingHours) : row.hours
    })));
  };

  const clearSelection = () => {
    setRows((currentRows) => currentRows.map((row) => ({ ...row, selected: false })));
  };

  const fillRemainingHours = () => {
    setRows((currentRows) => currentRows.map((row) => (
      row.selected
        ? { ...row, hours: row.remainingHours > 0 ? String(row.remainingHours) : row.hours }
        : row
    )));
  };

  const applyDeveloperToSelected = () => {
    if (!applyDeveloperId) return;

    setRows((currentRows) => currentRows.map((row) => (
      row.selected ? { ...row, developerId: applyDeveloperId } : row
    )));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!logDate) {
      setError('Select a start date.');
      return;
    }

    if (!logType) {
      setError('Select a log type.');
      return;
    }

    if (numberOrZero(maxHoursPerDay) <= 0) {
      setError('Per day max hours must be greater than 0.');
      return;
    }

    const invalidRow = selectedRows.find((row) => !row.developerId || numberOrZero(row.hours) <= 0);
    if (invalidRow) {
      setError(`Complete the assignee and hours for ${invalidRow.taskKey || invalidRow.title}.`);
      return;
    }

    if (!distributionPreview.distributionDates.length) {
      setError('No sprint dates are available from the selected start date.');
      return;
    }

    if (!distributionPreview.entries.length) {
      setError('Select at least one task with hours greater than 0.');
      return;
    }

    await onSubmit(distributionPreview.entries);
  };

  if (safeDevelopers.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        No members are available in this view. Switch the sprint toggle or add matching project members first.
      </div>
    );
  }

  if (safeTasks.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        No sprint tasks are available for bulk logging in the current view.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 xl:grid-cols-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Start Date</label>
          <select
            value={logDate}
            onChange={(event) => setLogDate(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)]"
          >
            {safeDates.map((date) => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Log Type</label>
          <select
            value={logType}
            onChange={(event) => setLogType(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)]"
          >
            {safeTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Per Day Max Hours</label>
          <input
            type="number"
            min="0.25"
            step="0.25"
            value={maxHoursPerDay}
            onChange={(event) => setMaxHoursPerDay(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Apply Member</label>
          <div className="flex gap-2">
            <select
              value={applyDeveloperId}
              onChange={(event) => setApplyDeveloperId(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)]"
            >
              <option value="">Select member</option>
              {safeDevelopers.map((developer) => (
                <option key={developer.id} value={developer.id}>{developer.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={applyDeveloperToSelected}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white"
            >
              Apply
            </button>
          </div>
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={showOnlyRemaining}
              onChange={(event) => setShowOnlyRemaining(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[var(--theme-color)] focus:ring-[var(--theme-color)]"
            />
            Show only remaining work
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tasks With Remaining Hours</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{remainingTaskCount}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected Tasks</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{selectedRows.length}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected Hours</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{formatHours(selectedHoursTotal)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Generated Log Rows</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{distributionPreview.entries.length}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Bulk log starts from <span className="font-semibold text-slate-800">{logDate ? new Date(logDate).toLocaleDateString() : 'the selected date'}</span> and fills each working day up to <span className="font-semibold text-slate-800">{formatHours(maxHoursPerDay)}</span> for each member before moving the remaining task hours to the next sprint date.
      </div>

      {distributionPreview.overflowHours > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {formatHours(distributionPreview.overflowHours)} could not fit within the daily limit for {distributionPreview.overflowTasks} task{distributionPreview.overflowTasks === 1 ? '' : 's'} and will be added on the last sprint day so you can adjust manually.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={selectRemainingTasks}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Select Remaining Tasks
        </button>
        <button
          type="button"
          onClick={fillRemainingHours}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Fill Remaining Hours
        </button>
        <button
          type="button"
          onClick={clearSelection}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Clear Selection
        </button>
      </div>

      <div className="max-h-[45vh] overflow-auto rounded-2xl border border-slate-200 lg:max-h-[50vh]">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="sticky top-0 bg-slate-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Pick</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Task</th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Planned</th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Logged</th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Remaining</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Member</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Hours To Log</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">
                  No tasks match the current bulk log filters.
                </td>
              </tr>
            )}
            {visibleRows.map((row) => {
              const remainingTone = row.remainingHours > 0
                ? 'text-emerald-700'
                : row.remainingHours < 0
                  ? 'text-red-600'
                  : 'text-slate-500';

              return (
                <tr key={row.taskId} className={row.selected ? 'bg-[rgb(var(--theme-color-rgb)/0.04)]' : undefined}>
                  <td className="px-3 py-3 align-top">
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={() => toggleSelection(row.taskId)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--theme-color)] focus:ring-[var(--theme-color)]"
                    />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="min-w-[260px]">
                      {row.taskUrl ? (
                        <a
                          href={row.taskUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-indigo-600 hover:underline"
                        >
                          {row.taskKey}
                        </a>
                      ) : (
                        <div className="text-sm font-semibold text-slate-900">{row.taskKey}</div>
                      )}
                      <div className="mt-1 text-sm text-slate-600">{row.title}</div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-sm text-slate-700">{formatHours(row.plannedHours)}</td>
                  <td className="px-3 py-3 text-center text-sm text-slate-700">{formatHours(row.loggedHours)}</td>
                  <td className={`px-3 py-3 text-center text-sm font-semibold ${remainingTone}`}>{formatHours(row.remainingHours)}</td>
                  <td className="px-3 py-3">
                    <select
                      value={row.developerId}
                      onChange={(event) => handleDeveloperChange(row.taskId, event.target.value)}
                      className="w-full min-w-[180px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)]"
                    >
                      <option value="">Select member</option>
                      {safeDevelopers.map((developer) => (
                        <option key={developer.id} value={developer.id}>{developer.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      value={row.hours}
                      onChange={(event) => handleHoursChange(row.taskId, event.target.value)}
                      className="w-full min-w-[120px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)]"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-[var(--theme-color)] px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
        >
          Create Bulk Logs
        </button>
      </div>
    </form>
  );
}
