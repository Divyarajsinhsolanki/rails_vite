import React, { useState } from 'react';

const TaskForm = ({ onAddTask }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [recurring, setRecurring] = useState("");

  const handleSubmit = () => {
    if (!title) {
        // You should add proper validation and feedback
        alert("Title is required.");
        return;
    }
    const newTask = {
      title,
      content,
      due: dueDate,
      tags: tags.split(',').map(t => t.trim()),
      assigned_to: assignedTo,
      recurring,
      status: 'todo'
    };
    onAddTask(newTask);
    // Clear form
    setTitle("");
    setContent("");
    setDueDate("");
    setTags("");
    setAssignedTo("");
    setRecurring("");
  };

  return (
    <div className="mb-4 flex flex-col sm:flex-row flex-wrap gap-4">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" className="border px-3 py-2 rounded-lg shadow-md focus:ring-2 focus:ring-blue-400 transition-all sm:w-1/3" />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Task content" className="border px-3 py-2 rounded-lg shadow-md focus:ring-2 focus:ring-blue-400 transition-all sm:w-1/3" />
      <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="border px-3 py-2 rounded-lg shadow-md focus:ring-2 focus:ring-blue-400 transition-all sm:w-1/3" />
      <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Comma-separated tags" className="border px-3 py-2 rounded-lg shadow-md focus:ring-2 focus:ring-blue-400 transition-all sm:w-1/3" />
      <input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Assigned to" className="border px-3 py-2 rounded-lg shadow-md focus:ring-2 focus:ring-blue-400 transition-all" />

      <div className="sm:w-1/3 flex gap-4">
        <select value={recurring} onChange={(e) => setRecurring(e.target.value)} className="border px-3 py-2 rounded-lg shadow-md focus:ring-2 focus:ring-blue-400 transition-all">
          <option value="">One-time</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <button onClick={handleSubmit} className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-all">
          Add Task
        </button>
      </div>
    </div>
  );
};

export default TaskForm;