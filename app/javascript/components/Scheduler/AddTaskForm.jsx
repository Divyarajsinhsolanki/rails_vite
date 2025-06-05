import React, { useState, useEffect } from 'react';

export default function AddTaskForm({developers, dates, types, onAddTask, currentSprintId}) {
  const [formData, setFormData] = useState({ developer_id: '', type: 'code', date: '', task_id: '', task_url: '', estimated_hours: 1 });

  // If dates/devs/types update, reset defaults
  useEffect(() => {
    setFormData(f => ({
      ...f,
      date: dates[0] || f.date,
      developer_id: developers[0]?.id ?? f.developer_id,
      sprint_id: currentSprintId ?? f.sprint_id,
      estimated_hours: f.estimated_hours ?? 1
    }));
  }, [dates, developers, types, currentSprintId]);

  // Show loading state if developers not fetched yet
  if (!developers.length) {
    return <div className="p-4 bg-white border rounded">Loading developers...</div>;
  }

  const handleChange = e => {
    let { name, value } = e.target;
    // Cast numbers for IDs and hours
    if (['developer_id', 'estimated_hours', 'sprint_id'].includes(name)) {
      value = Number(value);
    }
    setFormData(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    const { date, developer_id, type, task_id } = formData;
    if (!date || !developer_id || !type || !task_id.trim()) return;
    onAddTask(formData);
    // reset non-default fields
    setFormData(f => ({
      date: dates[0] || '',
      developer_id: developers[0]?.id || null,
      task_id: '',
      task_url: '',
      estimated_hours: 1,
      sprint_id: currentSprintId || null
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
            name="date"
            value={formData.date || ''}
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
  
        {/* Estimated Hours */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">⏱ Estimated Hours</label>
          <input
            type="number"
            name="estimated_hours"
            min="0"
            step="0.25"
            value={formData.estimated_hours}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
  
      {/* Row 2: Task URL and Button */}
      <div className="flex flex-col sm:flex-row gap-4 items-end">
          
        {/* Task ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">📌 Task ID</label>
          <input
            type="text"
            name="task_id"
            value={formData.task_id || ''}
            onChange={(e) => {
              const input = e.target.value;
              const match = input.match(/HME-\d+/i); // Regex for extracting Jira ticket
              handleChange({
                target: {
                  name: 'task_id',
                  value: match ? match[0] : input,
                },
              });
            }}
            placeholder="e.g., HME-123456"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex-grow">
          <label className="block text-sm font-medium text-gray-700 mb-1">🔗 Task URL</label>
          <input
            type="url"
            name="task_url"
            value={formData.task_url || ''}
            onChange={handleChange}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          🛠️ Add Task
        </button>
      </div>
  
      {/* Hidden Sprint ID */}
      {currentSprintId && (
        <input type="hidden" name="sprint_id" value={formData.sprint_id} />
      )}
    </form>
  );
}
