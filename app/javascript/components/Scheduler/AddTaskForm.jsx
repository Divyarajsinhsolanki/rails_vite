import React, { useState, useEffect } from 'react';
import { Combobox } from '@headlessui/react';

export default function AddTaskForm({developers, dates, types, tasks, onAddTask}) {
  const [formData, setFormData] = useState({ developer_id: '', type: 'Code', log_date: '', task_id: '', hours_logged: 1 });
  const [taskQuery, setTaskQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  // If dates/devs/types update, reset defaults
  useEffect(() => {
    setFormData(f => ({
      ...f,
      log_date: dates[0] || f.log_date,
      developer_id: developers[0]?.id ?? f.developer_id,
      hours_logged: f.hours_logged ?? 1
    }));
  }, [dates, developers, types]);

  // Show loading state if developers not fetched yet
  if (!developers.length) {
    return <div className="p-4 bg-white border rounded">Loading developers...</div>;
  }

  const handleChange = e => {
    let { name, value } = e.target;
    // Cast numbers for IDs and hours
    if (['developer_id', 'hours_logged'].includes(name)) {
      value = Number(value);
    }
    setFormData(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    const { log_date, developer_id, type, task_id } = formData;
    if (!log_date || !developer_id || !type || !task_id) return;
    onAddTask(formData);
    // reset non-default fields
    setFormData(f => ({
      log_date: dates[0] || '',
      developer_id: developers[0]?.id || null,
      task_id: '',
      hours_logged: 1
    }));
    setSelectedTask(null);
    setTaskQuery('');
  };

  const filteredTasks = tasks.filter(t =>
    t.task_id.toLowerCase().includes(taskQuery.toLowerCase())
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 bg-white shadow-2xl border border-gray-200 rounded-2xl space-y-4"
    >
      {/* Row 1: Date, Developer, Type, Task ID, Hours */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">📅 Date</label>
          <select
            name="log_date"
            value={formData.log_date || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {dates.map(d => (
              <option key={d} value={d}>
                {new Date(d).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
  
        {/* Developer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">👨‍💻 Developer</label>
          <select
            name="developer_id"
            value={formData.developer_id || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {developers.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
  
        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">🧩 Type</label>
          <select
            name="type"
            value={formData.type || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {types.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
  
        {/* Logged Hours */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">⏱ Hours Logged</label>
          <input
            type="number"
            name="hours_logged"
            min="0"
            step="0.25"
            value={formData.hours_logged}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
  
      {/* Row 2: Task Selection and Button */}
      <div className="flex flex-col sm:flex-row gap-4 items-end">

        {/* Task selection with Combobox */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">📌 Task</label>
          <Combobox
            value={selectedTask}
            onChange={(task) => {
              setSelectedTask(task);
              setFormData(f => ({ ...f, task_id: task?.id || '' }));
            }}
          >
            <div className="relative">
              <Combobox.Input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                displayValue={task => task ? task.task_id : taskQuery}
                onChange={e => {
                  setTaskQuery(e.target.value);
                  setSelectedTask(null);
                  setFormData(f => ({ ...f, task_id: '' }));
                }}
                placeholder="Search tasks..."
                required
              />
              <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white border border-gray-300 shadow-lg">
                {filteredTasks.map(t => (
                  <Combobox.Option
                    key={t.id}
                    value={t}
                    className={({ active }) => `cursor-default select-none p-2 ${active ? 'bg-blue-600 text-white' : 'text-gray-900'}`}
                  >
                    {t.task_id}
                  </Combobox.Option>
                ))}
                {filteredTasks.length === 0 && (
                  <div className="cursor-default select-none p-2 text-gray-500">No tasks found</div>
                )}
              </Combobox.Options>
            </div>
          </Combobox>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          🛠️ Add Log
        </button>
      </div>
    </form>
  );
}
