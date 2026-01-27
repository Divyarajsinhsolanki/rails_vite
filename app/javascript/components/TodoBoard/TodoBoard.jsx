import React, { useEffect, useState, useContext } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { Toaster, toast } from "react-hot-toast";
import { SchedulerAPI } from '../api';
import { AuthContext } from '../../context/AuthContext';

// Component Imports
import TaskForm from "./TaskForm";
import KanbanColumn from "./KanbanColumn";
import Heatmap from "./Heatmap";
import ProgressPieChart from "./ProgressPieChart";
import { XCircleIcon, PlusIcon, UserIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl transform transition-all scale-95 opacity-0 animate-modalShow">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const initialData = {
  todo: { name: "To Do", color: "bg-[rgb(var(--theme-color-rgb)/0.1)]", items: [] },
  inprogress: { name: "In Progress", color: "bg-yellow-100", items: [] },
  completed: { name: "Completed", color: "bg-green-100", items: [] },
};

export default function TodoBoard({ sprintId, projectId, onSprintChange, qaMode = false }) {
  const { user } = useContext(AuthContext);
  const [columns, setColumns] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [sprints, setSprints] = useState([]);
  const [selectedSprintId, setSelectedSprintId] = useState(sprintId || null);
  const [taskView, setTaskView] = useState('all');

  useEffect(() => {
    if (sprintId) setSelectedSprintId(sprintId);
  }, [sprintId]);

  // --- DATA FETCHING & INITIALIZATION ---
  useEffect(() => {
    if (!projectId) return;
    SchedulerAPI.getSprints(projectId)
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : [];
        setSprints(list);
        if (!sprintId && list.length) {
          const today = new Date();
          const current =
            list.find(s => {
              const start = new Date(s.start_date);
              const end = new Date(s.end_date);
              return today >= start && today <= end;
            }) || list[0];
          setSelectedSprintId(current.id);
          onSprintChange && onSprintChange(current.id);
        }
      })
      .catch(() => toast.error("Could not load sprints"));
  }, [projectId, sprintId]);

  useEffect(() => {
    const params = selectedSprintId ? { sprint_id: selectedSprintId, project_id: projectId } : { type: 'general' };
    if (qaMode) params.type = 'qa';
    SchedulerAPI.getTasks(params)
      .then(res => {
        const grouped = groupBy(res.data);
        setColumns(grouped);
      })
      .catch(() => toast.error("Could not load tasks"));
  }, [selectedSprintId, projectId, qaMode]);

  useEffect(() => {
    if (onSprintChange && selectedSprintId) {
      onSprintChange(selectedSprintId);
    }
  }, [selectedSprintId]);

  function groupBy(tasks) {
    const cols = JSON.parse(JSON.stringify(initialData));
    tasks.forEach(task => {
      const status = task.status || 'todo';
      if (cols[status]) {
        cols[status].items.push(task);
      }
    });
    return cols;
  }

  const currentSprint = sprints.find(s => s.id === selectedSprintId);

  // --- HANDLERS ---
  const handleAddTask = async (newTaskData) => {
    try {
      const payload = { ...newTaskData };
      // ensure the task is assigned to the current user
      if (user) payload.assigned_to_user = user.id;
      payload.type = qaMode ? 'qa' : payload.type;
      if (projectId) payload.project_id = projectId;
      if (selectedSprintId) payload.sprint_id = selectedSprintId;
      const { data } = await SchedulerAPI.createTask(payload);
      const statusKey = data.status || 'todo';
      setColumns(prev => ({
        ...prev,
        [statusKey]: { ...prev[statusKey], items: [...prev[statusKey].items, data] }
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
      const { data } = await SchedulerAPI.updateTask(taskId, updates);
      const newStatus = data.status || colId;
      setColumns(prev => {
        // if status didn't change, update in place
        if (newStatus === colId) {
          return {
            ...prev,
            [colId]: {
              ...prev[colId],
              items: prev[colId].items.map(t => t.id === data.id ? data : t)
            }
          };
        }

        const updatedPrev = { ...prev };
        // remove task from the original column
        updatedPrev[colId] = {
          ...updatedPrev[colId],
          items: updatedPrev[colId].items.filter(t => t.id !== data.id)
        };
        // add task to the column corresponding to its new status
        updatedPrev[newStatus] = {
          ...updatedPrev[newStatus],
          items: [...updatedPrev[newStatus].items, data]
        };
        return updatedPrev;
      });
      toast.success("Task updated");
    } catch (error) {
      toast.error("Failed to update task.");
    }
  };

  const onDragEnd = async result => {
    const { source, destination } = result;
    if (!destination) return;

    // Reordering within the same column
    if (source.droppableId === destination.droppableId) {
      if (source.index === destination.index) return; // nothing changed

      const column = columns[source.droppableId];
      const newItems = Array.from(column.items);
      const [movedItem] = newItems.splice(source.index, 1);
      newItems.splice(destination.index, 0, movedItem);

      setColumns(prev => ({
        ...prev,
        [source.droppableId]: { ...column, items: newItems }
      }));
      return;
    }

    const srcCol = columns[source.droppableId];
    const dstCol = columns[destination.droppableId];
    const srcItems = Array.from(srcCol.items);
    const [movedItem] = srcItems.splice(source.index, 1);
    const dstItems = Array.from(dstCol.items);
    const updatedItem = { ...movedItem, status: destination.droppableId };
    dstItems.splice(destination.index, 0, updatedItem);

    setColumns(prev => ({
      ...prev,
      [source.droppableId]: { ...srcCol, items: srcItems },
      [destination.droppableId]: { ...dstCol, items: dstItems }
    }));

    // API Call
    try {
      await SchedulerAPI.moveTask(movedItem.id, { task: { status: updatedItem.status } });
    } catch (error) {
      toast.error("Failed to move task. Reverting.");
      // Revert UI on failure
      dstItems.splice(destination.index, 1);
      srcItems.splice(source.index, 0, movedItem);
      setColumns(prev => ({
        ...prev,
        [source.droppableId]: { ...srcCol, items: srcItems },
        [destination.droppableId]: { ...dstCol, items: dstItems }
      }));
    }
  };
  const applyView = cols =>
    taskView === 'my' && user
      ? Object.fromEntries(
        Object.entries(cols).map(([k, col]) => [k, { ...col, items: col.items.filter(t => t.assigned_to_user === user.id) }])
      )
      : cols;

  const filteredColumns = Object.entries(applyView(columns)).reduce((acc, [colId, colData]) => {
    const term = (searchTerm || "").toLowerCase();
    acc[colId] = {
      ...colData,
      items: colData.items.filter(item => {
        const content = (item.task_id || item.title || "").toLowerCase();
        const tagMatch = Array.isArray(item.tags) ? item.tags.some(tag => (tag || "").toLowerCase().includes(term)) : false;
        return content.includes(term) || tagMatch;
      })
    };
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-100 px-8 pb-8 pt-2 font-sans text-gray-800">
      <div className="max-w-8xl mx-auto bg-white rounded-xl shadow-lg p-4">
        <Toaster position="top-right" />
        <header className="mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="mb-4 sm:mb-0 flex items-center gap-3">
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-color)] to-[var(--theme-color)] flex items-center">
                <Squares2X2Icon className="h-7 w-7 mr-2" />Taskboard
              </h1>
              {qaMode && (
                <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 border border-purple-200">
                  QA mode
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-[var(--theme-color)] hover:brightness-110 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:scale-105"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add Task</span>
              </button>
              <div className="flex bg-white rounded-full p-1 shadow-md border border-gray-200">
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-in-out ${taskView === 'all'
                      ? 'bg-[var(--theme-color)] text-white shadow'
                      : 'text-gray-600 hover:bg-[rgb(var(--theme-color-rgb)/0.1)]'
                    }`}
                  onClick={() => setTaskView('all')}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                  All Tasks
                </button>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-in-out ml-1 ${taskView === 'my'
                      ? 'bg-[var(--theme-color)] text-white shadow'
                      : 'text-gray-600 hover:bg-[rgb(var(--theme-color-rgb)/0.1)]'
                    }`}
                  onClick={() => setTaskView('my')}
                >
                  <UserIcon className="h-5 w-5" />
                  My Tasks
                </button>
              </div>
            </div>
          </div>
        </header>

        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add a New Task">
          <TaskForm onAddTask={handleAddTask} onCancel={() => setShowForm(false)} defaultType={qaMode ? 'qa' : 'general'} />
        </Modal>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Heatmap columns={columns} view={taskView} onViewChange={setTaskView} sprint={currentSprint} />
          <ProgressPieChart columns={applyView(columns)} />
        </div>

        {/* <div className="mb-6">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search tasks by ID, title or tag..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[var(--theme-color)] focus:border-[var(--theme-color)] transition-all"
        />
      </div> */}

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
        <style>{`
        @keyframes modalShow {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-modalShow {
          animation: modalShow 0.3s ease-out forwards;
        }
      `}</style>
      </div>
    </div>
  );
}
