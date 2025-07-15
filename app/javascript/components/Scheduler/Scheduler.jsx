import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DndContext, useDraggable, useDroppable, closestCenter } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { SchedulerAPI } from '../api';

// Assuming these are your existing form components
import AddTaskForm from '../Scheduler/AddTaskForm';
import EditTaskForm from '../Scheduler/EditTaskForm';

import {
  PlusCircleIcon,
  PencilIcon,
  TrashIcon,
  LinkIcon,
  CheckCircleIcon,
  XCircleIcon,
  Bars3Icon, // Drag Handle
  CalendarDaysIcon,
  UserGroupIcon,
  TableCellsIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'; // Ensure this path is correct and package installed
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid'; // Ensure this path is correct


// --- Helper Components ---

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-32">
      <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="ml-2 text-gray-600">Loading...</p>
    </div>
  );
}

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <XCircleIcon className="h-7 w-7" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// --- Main Scheduler Components ---

function TaskCard({ task, onEdit, onTaskUpdate }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const [copied, setCopied] = useState(false);

  const style = {
    transform: CSS.Translate.toString(transform),
    // **FIX 2: Increased z-index for dragging item**
    zIndex: isDragging ? 9999 : 'auto',
    opacity: isDragging ? 0.8 : 1,
    boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  };

  const typeColors = {
    'Code': 'bg-green-50 border-green-300 text-green-800',
    'Code review': 'bg-blue-50 border-blue-300 text-blue-800',
    'Dev to QA': 'bg-purple-50 border-purple-300 text-purple-800',
    'Default': 'bg-gray-50 border-gray-300 text-gray-800'
  };
  const cardColor = typeColors[task.type] || typeColors['Default'];

  const toggleStrike = async () => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    onTaskUpdate({ ...task, status: newStatus });
    try {
      const { data: updated } = await SchedulerAPI.updateTaskLog(task.id, { status: newStatus });
      onTaskUpdate(updated);
    } catch (error) {
      console.error("Error updating status:", error);
      onTaskUpdate({ ...task, status: task.status });
      alert("Error: Could not update task status.");
    }
  };

  const deleteTask = async () => {
    const title = task.task?.task_id || task.task_id;
    if (!window.confirm(`Are you sure you want to delete task "${title}"?`)) return;
    onTaskUpdate({ ...task, deleted: true });
    try {
      await SchedulerAPI.deleteTaskLog(task.id);
    } catch (error) {
      console.error("Error deleting task:", error);
      onTaskUpdate({ ...task, deleted: false });
      alert("Error: Could not delete task.");
    }
  };

  const copyLink = (e) => {
    e.stopPropagation();
    const link = task.task?.task_url || task.task_url;
    if (link) {
      navigator.clipboard.writeText(link)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => console.error('Failed to copy link:', err));
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-2.5 mb-2 border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-150 ${cardColor} ${task.status === 'completed' ? 'opacity-70' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start min-w-0">
          <span {...listeners} {...attributes} className="cursor-move p-1 mr-2 text-gray-400 hover:text-gray-700" title="Drag task">
            <Bars3Icon className="h-5 w-5" />
          </span>
          <div>
            {task.task?.task_url || task.task_url ? (
              <a
                href={task.task?.task_url || task.task_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`font-semibold text-sm hover:underline ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-indigo-600'} break-all`}
                title={`Open: ${task.task?.task_id || task.task_id}`}
              >
                {task.task?.task_id || task.task_id}
              </a>
            ) : (
              <span className={`font-semibold text-sm ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-800'} break-all`}>
                {task.task?.task_id || task.task_id}
              </span>
            )}
            <div className="text-xs text-gray-500 mt-0.5">
              <span>{task.hours_logged}h</span>
              <span className="mx-1">|</span>
              <span>{task.type}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
          <button onClick={toggleStrike} title={task.status === 'completed' ? "Mark as not done" : "Mark as done"} className="p-1 text-gray-500 hover:text-green-600 rounded-full hover:bg-gray-100 transition-colors">
            {task.status === 'completed' ? <CheckCircleSolidIcon className="h-5 w-5 text-green-600" /> : <CheckCircleIcon className="h-5 w-5" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Edit task" className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors">
            <PencilIcon className="h-5 w-5" />
          </button>
          {task.task?.task_url && (
            <button onClick={copyLink} title="Copy task link" className="p-1 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100 transition-colors relative">
              <LinkIcon className="h-5 w-5" />
              {copied && <CheckCircleSolidIcon className="h-3 w-3 text-green-500 absolute -top-1 -right-1" />}
            </button>
          )}
          <button onClick={deleteTask} title="Delete task" className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100 transition-colors">
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}


function TaskCell({ date, devId, tasksInCell, setEditingTask, handleTaskUpdate, totalHoursInCell }) {
  const droppableId = `${date}:${devId}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  const cellCapacity = 8;
  const hoursPercentage = Math.min((totalHoursInCell / cellCapacity) * 100, 100);
  let capacityColor = 'bg-green-100';
  if (totalHoursInCell > cellCapacity) capacityColor = 'bg-red-100';
  else if (totalHoursInCell > cellCapacity * 0.75) capacityColor = 'bg-yellow-100';


  return (
    <td
      ref={setNodeRef}
      className={`p-2 border border-gray-200 align-top min-w-[200px] relative transition-colors duration-150 ease-in-out ${isOver ? 'bg-blue-100 outline outline-2 outline-blue-400' : 'bg-white hover:bg-gray-50'}`}
      style={{ minHeight: '100px' }}
    >
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${capacityColor} opacity-70 transition-all duration-300`} style={{ width: `${hoursPercentage}%` }} title={`${totalHoursInCell}h / ${cellCapacity}h`}></div>
      {tasksInCell.filter(t => !t.deleted).map(task => (
        <TaskCard
            key={task.id}
            task={task}
            onEdit={() => setEditingTask(task)}
            onTaskUpdate={handleTaskUpdate}
        />
      ))}
      {tasksInCell.filter(t => !t.deleted).length === 0 && (
        <div className="text-center text-gray-400 text-xs mt-4">Drop tasks here</div>
      )}
    </td>
  );
}

function Scheduler({ sprintId }) {
  const [sprint, setSprint] = useState(null);
  const [developers, setDevelopers] = useState([]);
  const [tasks, setTasks] = useState([]); // will hold task logs
  const [allTasks, setAllTasks] = useState([]); // options from tasks table
  const types = useMemo(() => ['Code', 'Code review', 'Dev to QA', 'Planning', 'Testing', 'Bug Fixing'], []);

  const [loading, setLoading] = useState({sprint: true, developers: true, tasks: true});
  const [error, setError] = useState(null);
  
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [mainHeaderHeight, setMainHeaderHeight] = useState(0); // State to store main header height

  // Ref for the main header
  const mainHeaderRef = useCallback(node => {
    if (node !== null) {
      setMainHeaderHeight(node.getBoundingClientRect().height);
    }
  }, []);


  useEffect(() => {
    if (sprintId) {
      SchedulerAPI.getSprints()
        .then(res => {
          const found = res.data.find(s => s.id === sprintId);
          if (found) setSprint(found);
        })
        .catch(() => setError("Could not load sprint"))
        .finally(() => setLoading(l => ({ ...l, sprint: false })));
    } else {
      SchedulerAPI.getLastSprint()
        .then(res => { setSprint(res.data); setLoading(l => ({ ...l, sprint: false })); })
        .catch(() => {
          setError("Could not load sprint");
          setLoading(l => ({ ...l, sprint: false }));
        });
    }
  }, [sprintId]);

  useEffect(() => {
    const params = sprintId ? { sprint_id: sprintId } : {};
    Promise.all([
      SchedulerAPI.getDevelopers(),
      SchedulerAPI.getTaskLogs(params),
      SchedulerAPI.getTasks(params)
    ])
      .then(([devRes, logRes, taskRes]) => {
        setDevelopers(devRes.data);
        setTasks(logRes.data);
        setAllTasks(taskRes.data);
        setLoading(l => ({ ...l, developers: false, tasks: false }));
      })
      .catch(() => {
        setError("Could not load developers or tasks");
        setLoading(l => ({ ...l, developers: false, tasks: false }));
      });
  }, [sprintId]);
  
  const getWeekdaysInRange = useCallback((start, end) => {
    const datesArr = [];
    if (!start || !end) return datesArr;
    let current = new Date(new Date(start).toISOString().slice(0,10) + 'T00:00:00Z');
    const endDate = new Date(new Date(end).toISOString().slice(0,10) + 'T00:00:00Z');

    while (current <= endDate) {
      const day = current.getUTCDay();
      if (day !== 0 && day !== 6) {
        datesArr.push(current.toISOString().split('T')[0]);
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }
    return datesArr;
  }, []);
  
  const dates = useMemo(() => sprint ? getWeekdaysInRange(sprint.start_date, sprint.end_date) : [], [sprint, getWeekdaysInRange]);

  const tasksByDateDev = useMemo(() => {
    const structuredTasks = {};
    dates.forEach(date => {
      structuredTasks[date] = {};
      developers.forEach(dev => {
        structuredTasks[date][dev.id] = [];
      });
    });
    tasks.forEach(task => {
      if (task.log_date && task.developer_id && structuredTasks[task.log_date] && structuredTasks[task.log_date][task.developer_id]) {
        structuredTasks[task.log_date][task.developer_id].push(task);
      }
    });
    return structuredTasks;
  }, [tasks, dates, developers]);

  const addTask = async (formData) => {
    const tempId = `temp-${Date.now()}`;
    const newTask = { ...formData, id: tempId, developer_id: Number(formData.developer_id), hours_logged: parseFloat(formData.hours_logged) };
    setTasks(prev => [...prev, newTask]);
    setIsAddTaskModalOpen(false);

    try {
      const { data: created } = await SchedulerAPI.createTaskLog({ ...formData });
      setTasks(prev => prev.map(t => t.id === tempId ? created : t));
    } catch (error) {
      console.error("Error adding task:", error);
      setTasks(prev => prev.filter(t => t.id !== tempId));
      alert(`Error: Could not add task. ${error.message}`);
    }
  };

  const saveUpdatedTask = async (formData) => {
    const taskId = formData.id;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...formData, developer_id: Number(formData.developer_id), hours_logged: parseFloat(formData.hours_logged) } : t));
    setEditingTask(null);

    try {
      const { data: updated } = await SchedulerAPI.updateTaskLog(taskId, formData);
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    } catch (error) {
      console.error("Error updating task:", error);
      alert(`Error: Could not update task. ${error.message}`);
    }
  };

  const handleTaskUpdate = useCallback((updatedTask) => {
    setTasks(prevTasks => {
      if (updatedTask.deleted) {
        return prevTasks.filter(t => t.id !== updatedTask.id);
      }
      return prevTasks.map(t => (t.id === updatedTask.id ? updatedTask : t));
    });
  }, []);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const taskId = active.id;
    const [newDate, newDevIdStr] = over.id.split(':');
    const newDevId = parseInt(newDevIdStr, 10);

    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask) return;

    const updatedTaskData = { ...originalTask, log_date: newDate, developer_id: newDevId };
    
    setTasks(prev => prev.map(t => (t.id === taskId ? updatedTaskData : t)));

    try {
      const { data: moved } = await SchedulerAPI.updateTaskLog(taskId, { log_date: newDate, developer_id: newDevId });
      setTasks(prev => prev.map(t => t.id === taskId ? moved : t));
    } catch (error) {
      console.error("Error moving task:", error);
      setTasks(prev => prev.map(t => t.id === taskId ? original : t));
      alert(`Error: Could not move task. ${error.message}`);
    }
  };
  
  const { hoursByDevDate, hoursByDateDev, dailyTotalsPerDev, grandTotalsPerDev, dailyTotalsPerDate } = useMemo(() => {
    const hByDevDate = {};
    developers.forEach(dev => {
      hByDevDate[dev.id] = {};
      dates.forEach(date => hByDevDate[dev.id][date] = 0);
    });

    const hByDateDev = {};
    dates.forEach(date => {
      hByDateDev[date] = {};
      developers.forEach(dev => hByDateDev[date][dev.id] = 0);
    });

    tasks.filter(t => !t.deleted).forEach(task => {
      const hrs = parseFloat(task.hours_logged) || 0;
      if (hByDevDate[task.developer_id] && typeof hByDevDate[task.developer_id][task.log_date] !== 'undefined') {
        hByDevDate[task.developer_id][task.log_date] += hrs;
      }
      if (hByDateDev[task.log_date] && typeof hByDateDev[task.log_date][task.developer_id] !== 'undefined') {
        hByDateDev[task.log_date][task.developer_id] += hrs;
      }
    });
    
    const dtPerDev = {};
    developers.forEach(dev => {
        dtPerDev[dev.id] = {};
        dates.forEach(date => {
            dtPerDev[dev.id][date] = (tasksByDateDev[date]?.[dev.id] || [])
                .filter(t => !t.deleted)
                .reduce((sum, task) => sum + (parseFloat(task.hours_logged) || 0), 0);
        });
    });

    const gtPerDev = {};
    developers.forEach(dev => {
        gtPerDev[dev.id] = dates.reduce((sum, date) => sum + (dtPerDev[dev.id][date] || 0), 0);
    });
    
    const dtPerDate = {};
    dates.forEach(date => {
        dtPerDate[date] = developers.reduce((sum, dev) => sum + (dtPerDev[dev.id][date] || 0), 0);
    });

    return { hoursByDevDate: hByDevDate, hoursByDateDev: hByDateDev, dailyTotalsPerDev: dtPerDev, grandTotalsPerDev: gtPerDev, dailyTotalsPerDate: dtPerDate };
  }, [tasks, developers, dates, tasksByDateDev]);


  const formatDate = useCallback((isoDateString) => {
    if (!isoDateString) return '';
    const date = new Date(isoDateString + 'T00:00:00'); 
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }, []);

  if (loading.sprint || loading.developers || loading.tasks) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header ref={mainHeaderRef} className="bg-white shadow-sm p-4"> {/* Added ref here */}
          <h1 className="text-2xl font-bold text-gray-800 flex items-center"><CalendarDaysIcon className="h-7 w-7 mr-2 text-blue-600"/>Sprint Logs</h1>
        </header>
        <main className="flex-grow container mx-auto p-4 lg:p-6">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  if (error) {
     return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Oops! Something went wrong.</h2>
          <p className="text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  if (!sprint) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        {!loading.sprint && <p>No active sprint selected.</p>}
      </div>
    );
  }

  // **FIX 3: Calculate dynamic top offset for sticky table header**
  const stickyTableHeaderOffset = mainHeaderHeight > 0 ? `${mainHeaderHeight}px` : '4rem'; // Default to 4rem (64px) if height not yet calculated

  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-100 flex flex-col">
        <main className="flex-grow container mx-auto p-4 lg:p-6">
          <section className="mb-8 bg-white/70 backdrop-blur-md shadow-xl rounded-xl overflow-hidden border border-gray-200">
            <header ref={mainHeaderRef} className="bg-white/80 backdrop-blur-md shadow-sm top-0 z-40">
              <div className="container mx-auto px-4 py-3"> {/* Added some padding for better click area */}
                <div className="flex justify-between items-center">
                  <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500 flex items-center">
                    <TableCellsIcon className="h-6 w-6 mr-2 text-sky-600"/> Sprint Logs
                  </h1>
                  <button
                    onClick={() => setIsAddTaskModalOpen(true)}
                    className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out transform hover:scale-105"
                    >
                    <PlusCircleIcon className="h-5 w-5 mr-2" />
                    Add Log
                  </button>
                </div>
              </div>
            </header>
              <div className="overflow-x-auto relative">
                  <table className="min-w-full divide-y divide-gray-200 border-collapse">
                  {/* **FIX 3: Adjusted sticky top position dynamically** */}
                  <thead className="bg-gray-50/80 backdrop-blur-sm sticky z-30" >
                      <tr>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200 sticky left-0 bg-gray-100/90 z-20">
                          Date
                      </th>
                      {developers.map(dev => (
                          <th key={dev.id} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200 whitespace-nowrap">
                          {dev.name}
                          <span className="block text-[10px] font-normal text-gray-400">Total: {grandTotalsPerDev[dev.id] || 0}h</span>
                          </th>
                      ))}
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {dates.length === 0 && (
                          <tr>
                              <td colSpan={developers.length + 1} className="p-6 text-center text-gray-500">
                                  <InformationCircleIcon className="h-8 w-8 mx-auto mb-2 text-gray-400"/>
                                  No dates found for this sprint, or developers are not loaded.
                              </td>
                          </tr>
                      )}
                      {dates.map(date => (
                      <tr key={date} className="hover:bg-sky-50/50 transition-colors duration-100">
                          <td className="px-4 py-3 font-medium text-sm text-gray-700 border-r border-gray-200 sticky left-0 bg-white/90 hover:bg-sky-50/50 z-10 whitespace-nowrap">
                              {formatDate(date)}
                              <span className="block text-xs text-gray-400">{dailyTotalsPerDate[date] || 0}h Total</span>
                          </td>
                          {developers.map(dev => (
                          <TaskCell
                              key={`${date}-${dev.id}`}
                              date={date}
                              devId={dev.id}
                              tasksInCell={tasksByDateDev[date]?.[dev.id] || []}
                              setEditingTask={setEditingTask}
                              handleTaskUpdate={handleTaskUpdate}
                              totalHoursInCell={dailyTotalsPerDev[dev.id]?.[date] || 0}
                          />
                          ))}
                      </tr>
                      ))}
                  </tbody>
                  </table>
              </div>
          </section>

          <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                  <UserGroupIcon className="h-6 w-6 mr-2 text-sky-600"/>Workload Summaries
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white/70 backdrop-blur-md shadow-xl rounded-xl overflow-hidden border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-700 px-5 py-3 border-b border-gray-200">Developer Hours</h3>
                  <div className="overflow-x-auto"> {/* Added overflow-x-auto here for scrolling */}
                      <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50/80">
                          <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Developer</th>
                          {/* **FIX 1: Removed .slice() to show all dates** */}
                          {dates.map(date => (
                              <th key={date} className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{formatDate(date).split(',')[0]}</th>
                          ))}
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                          </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                          {developers.map((dev, index) => (
                          <tr key={dev.id} className={index % 2 === 0 ? undefined : 'bg-gray-50/70'}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">{dev.name}</td>
                              {/* **FIX 1: Removed .slice() to show all dates** */}
                              {dates.map(date => (
                              <td key={date} className="px-3 py-3 whitespace-nowrap text-sm text-gray-600 text-center">{hoursByDevDate[dev.id]?.[date] || '0'}</td>
                              ))}
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-800 text-center">{grandTotalsPerDev[dev.id] || '0'}</td>
                          </tr>
                          ))}
                      </tbody>
                      </table>
                  </div>
                  </div>

                  <div className="bg-white/70 backdrop-blur-md shadow-xl rounded-xl overflow-hidden border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-700 px-5 py-3 border-b border-gray-200">Daily Hours</h3>
                  <div className="overflow-x-auto"> {/* Added overflow-x-auto here for scrolling */}
                      <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50/80">
                          <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                          {/* Showing all developers, ensure this is intended or use slice if needed */}
                          {developers.map(dev => (
                              <th key={dev.id} className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{dev.name.split(' ')[0]}</th>
                          ))}
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                          </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                          {dates.map((date, index) => (
                          <tr key={date} className={index % 2 === 0 ? undefined : 'bg-gray-50/70'}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">{formatDate(date)}</td>
                              {developers.map(dev => (
                              <td key={dev.id} className="px-3 py-3 whitespace-nowrap text-sm text-gray-600 text-center">{hoursByDateDev[date]?.[dev.id] || '0'}</td>
                              ))}
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-800 text-center">{dailyTotalsPerDate[date] || '0'}</td>
                          </tr>
                          ))}
                      </tbody>
                      </table>
                  </div>
                  </div>
              </div>
          </section>
        </main>
      </div>

      <Modal isOpen={isAddTaskModalOpen} onClose={() => setIsAddTaskModalOpen(false)} title="✨ Add Log">
        <AddTaskForm
          developers={developers}
          dates={dates}
          types={types}
          tasks={allTasks}
          onAddTask={addTask}
        />
      </Modal>

      <Modal isOpen={!!editingTask} onClose={() => setEditingTask(null)} title="✏️ Edit Task">
        {editingTask && (
          <EditTaskForm
            task={editingTask}
            developers={developers}
            dates={dates}
            types={types}
            tasks={allTasks}
            onSave={saveUpdatedTask}
            onCancel={() => setEditingTask(null)}
          />
        )}
      </Modal>
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
        .overflow-x-auto::-webkit-scrollbar {
            height: 8px;
            width: 8px; /* For vertical scroll on main content if needed */
        }
        .overflow-x-auto::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
      `}</style>
    </DndContext>
  );
}

export default Scheduler;