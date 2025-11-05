import React, { useState, useEffect, useMemo } from 'react';
import { Combobox } from '@headlessui/react';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To do', icon: '📝' },
  { value: 'completed', label: 'Completed', icon: '✅' }
];

export default function EditTaskForm({ task, developers, dates, types, tasks, onSave, onCancel }) {
  const fallbackType = types[0] || 'Code';
  const initialTaskId = task?.task?.id ?? task?.task_id ?? '';

  const initialSelectedTask = useMemo(
    () => tasks.find(t => String(t.id) === String(initialTaskId)) || null,
    [tasks, initialTaskId]
  );

  const [formData, setFormData] = useState({
    id: task.id,
    log_date: task.log_date || dates[0] || '',
    developer_id: task.developer_id || developers[0]?.id || '',
    task_id: initialSelectedTask?.id || initialTaskId || '',
    hours_logged: task.hours_logged || 1,
    type: task.type || fallbackType,
    status: task.status || 'todo'
  });
  const [taskQuery, setTaskQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState(initialSelectedTask);
  const availableTypes = types.length ? types : [fallbackType];

  useEffect(() => {
    const nextTaskId = task?.task?.id ?? task?.task_id ?? '';
    const nextSelectedTask = tasks.find(t => String(t.id) === String(nextTaskId)) || null;

    setSelectedTask(nextSelectedTask);
    setTaskQuery(nextSelectedTask ? '' : (task?.task?.task_id ?? ''));
    setFormData({
      id: task.id,
      log_date: task.log_date || dates[0] || '',
      developer_id: task.developer_id || developers[0]?.id || '',
      task_id: nextSelectedTask?.id || nextTaskId || '',
      hours_logged: task.hours_logged || 1,
      type: task.type || fallbackType,
      status: task.status || 'todo'
    });
  }, [task, developers, dates, tasks, fallbackType]);

  const handleChange = event => {
    const { name, type, value: rawValue } = event.target;
    let value = rawValue;

    if (type === 'radio' && name === 'developer_id') {
      value = Number(value);
    } else if (['developer_id', 'hours_logged'].includes(name)) {
      value = Number(value);
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = event => {
    event.preventDefault();
    const { log_date, developer_id, task_id } = formData;
    if (!log_date || !developer_id || !task_id) return;
    const numericDeveloperId = Number(developer_id);
    const numericHours = Number(formData.hours_logged);
    const numericTaskId = Number(task_id);

    onSave({
      ...formData,
      developer_id: Number.isNaN(numericDeveloperId) ? developer_id : numericDeveloperId,
      hours_logged: Number.isNaN(numericHours) ? formData.hours_logged : numericHours,
      task_id: Number.isNaN(numericTaskId) ? task_id : numericTaskId
    });
  };

  const filteredTasks = tasks.filter(t =>
    (t.task_id ?? '')
      .toString()
      .toLowerCase()
      .includes(taskQuery.toLowerCase())
  );

  const handleStatusChange = statusValue => {
    setFormData(prev => ({ ...prev, status: statusValue }));
  };

  if (!developers.length) {
    return <div className="p-6 bg-white border border-gray-200 rounded-2xl">Loading developers...</div>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 bg-white shadow-2xl border border-gray-200 rounded-2xl space-y-6"
    >
      {/* Row 1: Date and Hours */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">📅 Date</label>
          <select
            name="log_date"
            value={formData.log_date || ''}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent"
          >
            {dates.map(d => (
              <option key={d} value={d}>
                {new Date(d).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">⏱ Hours Logged</label>
          <input
            type="number"
            name="hours_logged"
            min="0"
            step="0.25"
            value={formData.hours_logged}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent"
          />
        </div>
      </div>

      {/* Row 2: Developer Radio Group */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">👨‍💻 Developer</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {developers.map(developer => (
            <label
              key={developer.id}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                formData.developer_id === developer.id
                  ? 'border-[var(--theme-color)] bg-[rgb(var(--theme-color-rgb)/0.08)]'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="developer_id"
                value={developer.id}
                checked={formData.developer_id === developer.id}
                onChange={handleChange}
                className="text-[var(--theme-color)] focus:ring-[var(--theme-color)]"
                required
              />
              <span className="ml-2 text-sm font-medium">{developer.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Row 3: Type Radio Group */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">🧩 Type</label>
        <div className="flex flex-wrap gap-3">
          {availableTypes.map(type => (
            <label
              key={type}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                formData.type === type
                  ? 'border-[var(--theme-color)] bg-[rgb(var(--theme-color-rgb)/0.08)]'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="type"
                value={type}
                checked={formData.type === type}
                onChange={handleChange}
                className="text-[var(--theme-color)] focus:ring-[var(--theme-color)]"
                required
              />
              <span className="ml-2 text-sm font-medium">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Row 4: Status Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">📈 Status</label>
        <div className="flex flex-wrap gap-3">
          {STATUS_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleStatusChange(option.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--theme-color)] ${
                formData.status === option.value
                  ? 'border-[var(--theme-color)] bg-[rgb(var(--theme-color-rgb)/0.1)] text-[var(--theme-color)]'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-800'
              }`}
            >
              <span>{option.icon}</span>
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Row 5: Task Selection and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">📌 Task</label>
          <Combobox
            value={selectedTask}
            onChange={taskOption => {
              setSelectedTask(taskOption);
              setFormData(prev => ({ ...prev, task_id: taskOption?.id || '' }));
            }}
          >
            <div className="relative">
              <Combobox.Input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent"
                displayValue={taskOption => (taskOption ? taskOption.task_id : taskQuery)}
                onChange={event => {
                  setTaskQuery(event.target.value);
                  setSelectedTask(null);
                  setFormData(prev => ({ ...prev, task_id: '' }));
                }}
                placeholder="Search tasks..."
                required
              />
              <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white border border-gray-300 shadow-lg">
                {filteredTasks.length === 0 && taskQuery !== '' ? (
                  <div className="cursor-default select-none p-3 text-gray-500">No tasks found</div>
                ) : (
                  filteredTasks.map(t => (
                    <Combobox.Option
                      key={t.id}
                      value={t}
                      className={({ active }) => `cursor-default select-none p-3 ${active ? 'bg-[rgb(var(--theme-color-rgb)/0.12)] text-[var(--theme-color)]' : 'text-gray-900'}`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{t.task_id}</span>
                        {t.title && <span className="text-xs text-gray-500">{t.title}</span>}
                      </div>
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </div>
          </Combobox>
        </div>

        <div className="flex w-full sm:w-auto gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 sm:flex-initial px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
            >
              ✖️ Cancel
            </button>
          )}
          <button
            type="submit"
            className="flex-1 sm:flex-initial bg-[var(--theme-color)] text-white px-6 py-3 rounded-lg shadow hover:brightness-110 transition-colors font-medium"
          >
            💾 Save Changes
          </button>
        </div>
      </div>
    </form>
  );
}
