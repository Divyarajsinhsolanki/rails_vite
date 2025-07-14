import React, { useState, useEffect } from 'react';

export default function AddTaskForm({developers, dates, types, tasks, onAddTask}) {
  const [formData, setFormData] = useState({ developer_id: '', type: 'Code', log_date: '', task_id: '', hours_logged: 1 });

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
  };

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

        {/* Task ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">📌 Task</label>
          <select
            name="task_id"
            value={formData.task_id || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Task</option>
            {tasks.map(t => (
              <option key={t.id} value={t.id}>
                {t.task_id}{t.task_url ? ` - ${t.task_url}` : ''}
              </option>
            ))}
          </select>
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
