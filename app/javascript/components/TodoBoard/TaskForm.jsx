import React, { useState } from 'react';

const TaskForm = ({ onAddTask }) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("todo");
  const [assignedToUser, setAssignedToUser] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = () => {
    if (!title) {
      alert("Title is required.");
      return;
    }
    const newTask = {
      title,
      type,
      status,
      assigned_to_user: assignedToUser,
      end_date: endDate,
    };
    onAddTask(newTask);
    // Clear form
    setTitle("");
    setType("");
    setStatus("todo");
    setAssignedToUser("");
    setEndDate("");
  };

  return (
    <div className="mb-4 flex flex-col sm:flex-row flex-wrap gap-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="border px-3 py-2 rounded-lg shadow-md focus:ring-2 focus:ring-blue-400 transition-all sm:w-1/3"
      />
      <input
        value={type}
        onChange={(e) => setType(e.target.value)}
        placeholder="Type"
        className="border px-3 py-2 rounded-lg shadow-md focus:ring-2 focus:ring-blue-400 transition-all sm:w-1/3"
      />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="border px-3 py-2 rounded-lg shadow-md focus:ring-2 focus:ring-blue-400 transition-all sm:w-1/3"
      >
        <option value="todo">To Do</option>
        <option value="inprogress">In Progress</option>
        <option value="done">Done</option>
      </select>
      <input
        value={assignedToUser}
        onChange={(e) => setAssignedToUser(e.target.value)}
        placeholder="Assigned User ID"
        className="border px-3 py-2 rounded-lg shadow-md focus:ring-2 focus:ring-blue-400 transition-all sm:w-1/3"
      />
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className="border px-3 py-2 rounded-lg shadow-md focus:ring-2 focus:ring-blue-400 transition-all sm:w-1/3"
      />
      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-all"
      >
        Add Task
      </button>
    </div>
  );
};

export default TaskForm;