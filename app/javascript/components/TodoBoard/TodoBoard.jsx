import React, { useEffect, useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { Toaster, toast } from "react-hot-toast";
import { SchedulerAPI } from '../api';

// Component Imports
import TaskForm from "./TaskForm";
import KanbanColumn from "./KanbanColumn";
import Heatmap from "./Heatmap";
import ProgressPieChart from "./ProgressPieChart";

const initialData = {
  todo: { name: "To Do", color: "bg-blue-100", items: [] },
  inprogress: { name: "In Progress", color: "bg-yellow-100", items: [] },
  done: { name: "Completed", color: "bg-green-100", items: [] },
};

export default function TodoBoard({ sprintId, onSprintChange }) {
  const [columns, setColumns] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [sprints, setSprints] = useState([]);
  const [selectedSprintId, setSelectedSprintId] = useState(sprintId || null);

  useEffect(() => {
    if (sprintId) setSelectedSprintId(sprintId);
  }, [sprintId]);

  // --- DATA FETCHING & INITIALIZATION ---
  useEffect(() => {
    SchedulerAPI.getSprints()
      .then(res => {
        setSprints(res.data);
        if (res.data.length) {
          if(!sprintId) {
            setSelectedSprintId(res.data[0].id);
            onSprintChange && onSprintChange(res.data[0].id);
          }
        }
      })
      .catch(() => toast.error("Could not load sprints"));
  }, []);

  useEffect(() => {
    if (!selectedSprintId) return;
    SchedulerAPI.getTasks({ sprint_id: selectedSprintId })
      .then(res => {
        const grouped = groupBy(res.data);
        setColumns(grouped);
      })
      .catch(() => toast.error("Could not load tasks"));
  }, [selectedSprintId]);

  useEffect(() => {
    if (onSprintChange && selectedSprintId) {
      onSprintChange(selectedSprintId);
    }
  }, [selectedSprintId]);

  function groupBy(tasks) {
    const cols = JSON.parse(JSON.stringify(initialData));
    tasks.forEach(task => {
      const status = task.status || 'todo';
      if(cols[status]) {
        cols[status].items.push(task);
      }
    });
    return cols;
  }
  
  // --- HANDLERS ---
  const handleAddTask = async (newTaskData) => {
    try {
      const payload = { ...newTaskData, sprint_id: selectedSprintId };
      const { data } = await SchedulerAPI.createTask({ task: payload });
      setColumns(prev => ({
        ...prev,
        todo: { ...prev.todo, items: [...prev.todo.items, data] }
      }));
      toast.success("Task added successfully");
      setShowForm(false); // Hide form on successful add
    } catch (error) {
      toast.error("Failed to add task.");
    }
  };

  const handleDeleteTask = async (colId, taskId) => {
    try {
      await SchedulerAPI.deleteTask(taskId);
      setColumns(prev => ({
        ...prev,
        [colId]: { ...prev[colId], items: prev[colId].items.filter(t => t.id !== taskId) }
      }));
      toast.success("Task deleted");
    } catch (error) {
      toast.error("Failed to delete task.");
    }
  };
  
  const handleUpdateTask = async (colId, taskId, updates) => {
     try {
        const { data } = await SchedulerAPI.updateTask(taskId, { task: updates });
        setColumns(prev => ({
            ...prev,
            [colId]: { ...prev[colId], items: prev[colId].items.map(t => t.id === data.id ? data : t) }
        }));
        toast.success("Task updated");
    } catch (error) {
        toast.error("Failed to update task.");
    }
  };

  const onDragEnd = async result => {
    const { source, destination } = result;
    if (!destination) return;
  
    const srcCol = columns[source.droppableId];
    const item = srcCol.items[source.index];

    // Optimistic UI Update
    const newSrcItems = Array.from(srcCol.items);
    newSrcItems.splice(source.index, 1);
    const newDstItems = Array.from(columns[destination.droppableId].items);
    const updatedItem = { ...item, status: destination.droppableId };
    newDstItems.splice(destination.index, 0, updatedItem);

    setColumns(prev => ({
      ...prev,
      [source.droppableId]: { ...srcCol, items: newSrcItems },
      [destination.droppableId]: { ...columns[destination.droppableId], items: newDstItems }
    }));
    
    // API Call
    try {
        await SchedulerAPI.moveTask(item.id, { task: { status: updatedItem.status } });
    } catch (error) {
        toast.error("Failed to move task. Reverting.");
        // Revert UI on failure
        newDstItems.splice(destination.index, 1);
        newSrcItems.splice(source.index, 0, item);
        setColumns(prev => ({
            ...prev,
            [source.droppableId]: { ...srcCol, items: newSrcItems },
            [destination.droppableId]: { ...columns[destination.droppableId], items: newDstItems }
        }));
    }
  };
  
  const filteredColumns = Object.entries(columns).reduce((acc, [colId, colData]) => {
      const term = (searchTerm || "").toLowerCase();
      acc[colId] = {
        ...colData,
        items: colData.items.filter(item => {
            const content = (item.task_id || "").toLowerCase();
            const tagMatch = Array.isArray(item.tags) ? item.tags.some(tag => (tag || "").toLowerCase().includes(term)) : false;
            return content.includes(term) || tagMatch;
        })
      };
      return acc;
  }, {});

  return (
    <div className="p-4">
      <Toaster position="top-right" />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-semibold text-blue-700 tracking-tight">MyForm Task Control Center</h1>
          <select
            className="border px-2 py-1 rounded-md"
            value={selectedSprintId || ''}
            onChange={e => {
              const val = Number(e.target.value);
              setSelectedSprintId(val);
              onSprintChange && onSprintChange(val);
            }}
          >
            {sprints.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <button onClick={() => setShowForm(prev => !prev)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-all">
          {showForm ? 'Close Form' : '+ New Task'}
        </button>
      </div>
      
      {showForm && <TaskForm onAddTask={handleAddTask} />}

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Heatmap columns={columns} />
        <ProgressPieChart columns={columns} />
      </div>

      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search by keyword or tag..."
        className="mb-4 border px-3 py-2 w-full rounded-lg shadow-md focus:ring-2 focus:ring-blue-400 transition-all"
      />
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(filteredColumns).map(([columnId, column]) => (
                <KanbanColumn
                    key={columnId}
                    columnId={columnId}
                    column={column}
                    tasks={column.items}
                    onDelete={handleDeleteTask}
                    onUpdate={handleUpdateTask}
                />
            ))}
        </div>
      </DragDropContext>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Tasks in Selected Sprint</h2>
        <ul className="list-disc pl-5 space-y-1">
          {Object.values(columns).flatMap(c => c.items).map(task => (
            <li key={task.id}>{task.task_id}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}