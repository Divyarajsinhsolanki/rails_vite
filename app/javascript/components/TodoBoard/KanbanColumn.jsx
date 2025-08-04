// src/components/KanbanColumn.js
import React from 'react';
import { Droppable } from "@hello-pangea/dnd";
import TaskCard from './TaskCard';

const KanbanColumn = ({ columnId, column, tasks, onDelete, onUpdate }) => {
  const columnStyles = {
    'todo': 'border-t-2 border-[var(--theme-color)]',
    'inprogress': 'border-t-2 border-yellow-500',
    'completed': 'border-t-2 border-green-500'
  };
  
  return (
    <Droppable key={columnId} droppableId={columnId}>
      {(provided, snapshot) => (
        <div
          className={`bg-gray-100 rounded-lg p-2 flex flex-col ${snapshot.isDraggingOver ? 'bg-gray-200' : ''} ${columnStyles[columnId] || ''}`}
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-base font-semibold text-gray-800 flex items-center">
              {column.name}
              <span className="text-xs font-semibold text-gray-500 ml-2 bg-gray-200 px-1.5 py-0.5 rounded-full">
                {tasks.length}
              </span>
            </h2>
          </div>
          <div className="flex-grow min-h-[200px] overflow-y-auto">
            {tasks.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs italic text-gray-500">No tasks here.</p>
              </div>
            )}
            
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
          </div>
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default KanbanColumn;
