import React, { useState, useEffect } from 'react';

export default function EditTaskForm({ task, developers, dates, types, tasks, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    id: task.id,
    log_date: task.log_date || '',
    developer_id: task.developer_id || developers[0]?.id || '',
    task_id: task.task_id || '',
    hours_logged: task.hours_logged || 1,
    type: task.type || 'Code',
    status: task.status || 'todo'
  });

  useEffect(() => {
    setFormData({
      id: task.id,
      log_date: task.log_date || '',
      developer_id: task.developer_id || developers[0]?.id || '',
      task_id: task.task_id || '',
      hours_logged: task.hours_logged || 1,
      type: task.type || 'Code',
      status: task.status || 'todo'
    });
  }, [task, developers, types]);

  const handleChange = e => {
    let { name, value } = e.target;
    if (['developer_id', 'hours_logged'].includes(name)) {
      value = Number(value);
    }
    setFormData(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    const { log_date, developer_id, task_id } = formData;
    if (!log_date || !developer_id || !task_id) return;
    onSave(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 bg-white shadow-2xl border border-gray-200 rounded-2xl space-y-4"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">📅 Date</label>
          <select
            name="log_date"
            value={formData.log_date}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
            value={formData.developer_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {developers.map(dev => (
              <option key={dev.id} value={dev.id}>{dev.name}</option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">🧩 Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Row 2: Task ID + URL */}
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        {/* Task ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">📌 Task ID</label>
          <select
            name="task_id"
            value={formData.task_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Task</option>
            {tasks.map(t => (
              <option key={t.id} value={t.id}>{t.task_id}</option>
            ))}
          </select>
        </div>


        {/* Save Button */}
        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2 rounded-lg shadow hover:bg-green-700 transition"
        >
          💾 Save Changes
        </button>
      </div>
    </form>
  );
}
