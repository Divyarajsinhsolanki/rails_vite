// src/components/TaskCard.js
import React, { useState, useEffect } from 'react';
import { Draggable } from "@hello-pangea/dnd";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { getDueColor } from '/utils/taskUtils';
import { getUsers } from '../api';
import { toast } from 'react-hot-toast';

const TaskCard = ({ item, index, columnId, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editDetails, setEditDetails] = useState({
      title: item.title || '',
      type: item.type || '',
      status: item.status || 'todo',
      assigned_to_user: item.assigned_to_user || '',
      end_date: item.end_date || ''
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!isEditing) return;
    getUsers()
      .then(res => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch(() => toast.error('Failed to load users'));
  }, [isEditing]);

  const handleSave = () => {
    const updates = { ...editDetails };
    onUpdate(columnId, item.id, updates);
    setIsEditing(false);
  };

  const renderEditForm = () => (
    <div className="flex flex-col gap-2">
      <input
        value={editDetails.title}
        onChange={(e) => setEditDetails(prev => ({ ...prev, title: e.target.value }))}
        placeholder="Title"
        className="border p-2 rounded"
      />
      <input
        value={editDetails.type}
        onChange={(e) => setEditDetails(prev => ({ ...prev, type: e.target.value }))}
        placeholder="Type"
        className="border p-2 rounded"
      />
      <select
        value={editDetails.status}
        onChange={(e) => setEditDetails(prev => ({ ...prev, status: e.target.value }))}
        className="border p-2 rounded"
      >
        <option value="todo">To Do</option>
        <option value="inprogress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
      <select
        value={editDetails.assigned_to_user}
        onChange={(e) => setEditDetails(prev => ({ ...prev, assigned_to_user: e.target.value }))}
        className="border p-2 rounded"
      >
        <option value="">Unassigned</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>
            {u.first_name ? u.first_name : u.email}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={editDetails.end_date}
        onChange={(e) => setEditDetails(prev => ({ ...prev, end_date: e.target.value }))}
        className="border p-2 rounded"
      />
      <button onClick={handleSave} className="bg-green-500 text-white px-4 py-2 rounded">Save</button>
      <button onClick={() => setIsEditing(false)} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
    </div>
  );

  const renderTaskDetails = () => (
     <div>
        <div className="flex justify-between items-start">
            <div className="flex-1 text-gray-900">
              {item.task_url ? (
                <a href={item.task_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  {item.task_id}
                </a>
              ) : (
                item.task_id
              )}
            </div>
            <div className="flex flex-col gap-1 text-sm">
                <button onClick={() => setIsEditing(true)} className="text-blue-500 hover:text-blue-700" title="Edit"><FiEdit2 /></button>
                <button onClick={() => onDelete(columnId, item.id)} className="text-red-500 hover:text-red-700" title="Delete"><FiTrash2 /></button>
            </div>
        </div>
        <div className="text-sm text-gray-800 mt-1">{item.title || 'No Title'}</div>
        {item.due && <div className={`text-xs mt-2 ${getDueColor(item.due)}`}>Due: {item.due}</div>}
        {item.tags && (
            <div className="flex flex-wrap gap-1 mt-2">
                {item.tags.map((tag, i) => <span key={i} className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-full">#{tag}</span>)}
            </div>
        )}
        {item.createdBy && <div className="text-xs text-gray-600 mt-1">Created by: {item.createdBy}</div>}
        {(item.end_date || item.assigned_user) && (
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            {item.end_date && <span>End Date: {item.end_date}</span>}
            {item.assigned_user && (
              <span className="ml-auto">Assigned to: {item.assigned_user.first_name || item.assigned_user.email}</span>
            )}
          </div>
        )}
    </div>
  );

  return (
    <Draggable key={String(item.id)} draggableId={String(item.id)} index={index}>
      {(provided) => (
        <div
          className="bg-white p-4 mb-4 rounded-lg shadow-lg hover:bg-gray-100 transition-all"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {isEditing ? renderEditForm() : renderTaskDetails()}
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;