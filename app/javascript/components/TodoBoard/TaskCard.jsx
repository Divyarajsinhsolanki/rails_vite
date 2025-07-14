// src/components/TaskCard.js
import React, { useState } from 'react';
import { Draggable } from "@hello-pangea/dnd";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { getDueColor } from '/utils/taskUtils';

const TaskCard = ({ item, index, columnId, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editDetails, setEditDetails] = useState({
      content: item.task_id,
      due: item.due || '',
      tags: (item.tags || []).join(', '),
      assigned_to_user: item.assigned_to_user || '',
      recurring: item.recurring || ''
  });

  const handleSave = () => {
    const updates = {
        ...editDetails,
        tags: editDetails.tags.split(',').map(t => t.trim())
    };
    onUpdate(columnId, item.id, updates);
    setIsEditing(false);
  }

  const renderEditForm = () => (
    <div className="flex flex-col gap-2">
      <input value={editDetails.content} onChange={(e) => setEditDetails(prev => ({ ...prev, content: e.target.value }))} placeholder="Task content" className="border p-2 rounded" />
      <input type="date" value={editDetails.due} onChange={(e) => setEditDetails(prev => ({ ...prev, due: e.target.value }))} className="border p-2 rounded" />
      <input value={editDetails.tags} onChange={(e) => setEditDetails(prev => ({ ...prev, tags: e.target.value }))} placeholder="Comma-separated tags" className="border p-2 rounded" />
      <input value={editDetails.assigned_to_user} onChange={(e) => setEditDetails(prev => ({ ...prev, assigned_to_user: e.target.value }))} placeholder="Assigned To" className="border p-2 rounded" />
      <select value={editDetails.recurring} onChange={(e) => setEditDetails(prev => ({ ...prev, recurring: e.target.value }))} className="border p-2 rounded">
        <option value="">One-time</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </select>
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
        {item.assigned_user && (
          <div className="text-xs text-gray-600">Assigned to: {item.assigned_user.first_name || item.assigned_user.email}</div>
        )}
        {item.end_date && <div className="text-xs text-gray-600">End Date: {item.end_date}</div>}
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