// src/components/KanbanColumn.js
import React from 'react';
import { Droppable } from "@hello-pangea/dnd";
import TaskCard from './TaskCard';

const KanbanColumn = ({ columnId, column, tasks, onDelete, onUpdate }) => {
  const columnStyles = {
    'todo': 'border-t-4 border-cyan-300',
    'inprogress': 'border-t-4 border-fuchsia-300',
    'completed': 'border-t-4 border-emerald-300'
  };
  
  return (
    <Droppable key={columnId} droppableId={columnId}>
      {(provided, snapshot) => (
        <div
          className={`min-h-[420px] rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4 shadow-xl shadow-black/20 backdrop-blur-xl flex flex-col ${snapshot.isDraggingOver ? 'bg-white/15' : ''} ${columnStyles[columnId] || ''}`}
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white flex items-center">
              {column.name}
              <span className="text-sm font-semibold text-cyan-100 ml-3 bg-white/10 px-2 py-1 rounded-full">
                {tasks.length}
              </span>
            </h2>
          </div>
          <div className="flex-grow min-h-[250px] overflow-y-auto">
            {tasks.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm italic text-slate-400">Drop tasks here.</p>
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