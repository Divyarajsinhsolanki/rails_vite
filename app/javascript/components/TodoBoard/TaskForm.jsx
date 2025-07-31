import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

const TaskForm = ({ onAddTask, onCancel, projectId }) => {
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    status: 'todo',
    assigned_to_user: '',
    end_date: '',
    project_id: projectId || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) return toast.error('Title is required.');
    onAddTask(formData);
    setFormData({ title: '', type: '', status: 'todo', assigned_to_user: '', end_date: '', project_id: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-[var(--theme-color)]"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <input
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-[var(--theme-color)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-[var(--theme-color)]"
          >
            <option value="todo">To Do</option>
            <option value="inprogress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned User ID</label>
          <input
            name="assigned_to_user"
            value={formData.assigned_to_user}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-[var(--theme-color)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project ID</label>
          <input
            name="project_id"
            value={formData.project_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-[var(--theme-color)]"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-[var(--theme-color)]"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-700"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 bg-[var(--theme-color)] text-white rounded-lg shadow hover:brightness-110"
        >
          Add Task
        </button>
      </div>
    </form>
  );
};

export default TaskForm;