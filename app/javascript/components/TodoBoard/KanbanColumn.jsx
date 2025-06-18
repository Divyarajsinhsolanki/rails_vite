// src/components/KanbanColumn.js
import React from 'react';
import { Droppable } from "@hello-pangea/dnd";
import TaskCard from './TaskCard';

const KanbanColumn = ({ columnId, column, tasks, onDelete, onUpdate }) => {
  return (
    <Droppable key={columnId} droppableId={columnId}>
      {(provided) => (
        <div
          className={`${column.color} p-6 rounded-lg shadow-lg min-h-[300px]`}
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-800">{column.name}</h2>
          {tasks.length === 0 && <p className="text-sm italic text-gray-500">No matching tasks.</p>}
          
          {tasks.map((item, index) => (
            <TaskCard 
              key={item.id}
              item={item}
              index={index}
              columnId={columnId}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default KanbanColumn;