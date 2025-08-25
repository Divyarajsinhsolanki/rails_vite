import React, { useState, useEffect } from 'react';
import { Combobox } from '@headlessui/react';

export default function AddTaskForm({ developers, dates, types, tasks, onAddTask }) {
  const [formData, setFormData] = useState({ 
    developer_id: '', 
    type: types[0] || 'Code', 
    log_date: '', 
    task_id: '', 
    hours_logged: 1 
  });
  const [taskQuery, setTaskQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  // If dates/devs/types update, reset defaults
  useEffect(() => {
    setFormData(f => ({
      ...f,
      log_date: dates[0] || f.log_date,
      developer_id: developers[0]?.id ?? f.developer_id,
      type: types[0] || f.type,
      hours_logged: f.hours_logged ?? 1
    }));
  }, [dates, developers, types]);

  // Show loading state if developers not fetched yet
  if (!developers.length) {
    return <div className="p-4 bg-white border rounded">Loading developers...</div>;
  }

  const handleChange = e => {
    let { name, value, type } = e.target;
    
    // Handle radio buttons specifically
    if (type === 'radio') {
      // Cast numbers for IDs
      if (name === 'developer_id') {
        value = Number(value);
      }
      setFormData(f => ({ ...f, [name]: value }));
      return;
    }
    
    // Cast numbers for IDs and hours for other inputs
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
      ...f,
      log_date: dates[0] || '',
      developer_id: developers[0]?.id || '',
      type: types[0] || 'Code',
      task_id: '',
      hours_logged: 1
    }));
    setSelectedTask(null);
    setTaskQuery('');
  };

  // Safely match tasks that may not have a task_id
  const filteredTasks = tasks.filter(t =>
    (t.task_id ?? '')
      .toString()
      .toLowerCase()
      .includes(taskQuery.toLowerCase())
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 bg-white shadow-2xl border border-gray-200 rounded-2xl space-y-6"
    >
      {/* Row 1: Date and Hours */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">📅 Date</label>
          <select
            name="log_date"
            value={formData.log_date || ''}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {dates.map(d => (
              <option key={d} value={d}>
                {new Date(d).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
  
        {/* Logged Hours */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">⏱ Hours Logged</label>
          <input
            type="number"
            name="hours_logged"
            min="0"
            step="0.25"
            value={formData.hours_logged}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="developer_id"
                value={developer.id}
                checked={formData.developer_id === developer.id}
                onChange={handleChange}
                className="text-blue-600 focus:ring-blue-500"
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
          {types.map(type => (
            <label 
              key={type} 
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                formData.type === type 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="type"
                value={type}
                checked={formData.type === type}
                onChange={handleChange}
                className="text-blue-600 focus:ring-blue-500"
                required
              />
              <span className="ml-2 text-sm font-medium">{type}</span>
            </label>
          ))}
        </div>
      </div>
  
      {/* Row 4: Task Selection and Button */}
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        {/* Task selection with Combobox */}
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">📌 Task</label>
          <Combobox
            value={selectedTask}
            onChange={(task) => {
              setSelectedTask(task);
              setFormData(f => ({ ...f, task_id: task?.id || '' }));
            }}
          >
            <div className="relative">
              <Combobox.Input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className={({ active }) => `cursor-default select-none p-3 ${active ? 'bg-blue-100 text-blue-800' : 'text-gray-900'}`}
                  >
                    {t.task_id}
                  </Combobox.Option>
                ))}
                {filteredTasks.length === 0 && taskQuery !== '' && (
                  <div className="cursor-default select-none p-3 text-gray-500">No tasks found</div>
                )}
              </Combobox.Options>
            </div>
          </Combobox>
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition-colors font-medium"
        >
          🛠️ Add Log
        </button>
      </div>
    </form>
  );
}
