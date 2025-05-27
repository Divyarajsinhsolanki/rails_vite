import React, { useState, useEffect } from 'react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import AddTaskForm from '../Scheduler/AddTaskForm';
import EditTaskForm from '../Scheduler/EditTaskForm';
import SprintManager from '../SprintManager'

function Scheduler() {

  const [sprint, setSprint] = useState(null);
  useEffect(() => {
    fetch('/sprints/last.json')
      .then(res => res.json())
      .then(data => setSprint(data));
  }, []);

  function getWeekdaysInRange(start, end) {
    const dates = [];
    let current = new Date(start);
    const endDate = new Date(end);
  
    while (current <= endDate) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) { // Exclude Sundays (0) and Saturdays (6)
        dates.push(current.toISOString().split('T')[0]); // YYYY-MM-DD
      }
      current.setDate(current.getDate() + 1);
    }
  
    return dates;
  }
  
  const dates = sprint ? getWeekdaysInRange(sprint.start_date, sprint.end_date) : [];

  const [developers, setDevelopers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const types = ['Code', 'Code review'];

  useEffect(() => {
    // Fetch developers list
    fetch('/developers.json')
      .then(res => res.json())
      .then(data => setDevelopers(data));

      // Fetch tasks list
    fetch('/tasks.json')
      .then(res => res.json())
      .then(data => setTasks(data));
  }, []);

  const tasksByDate = {};
  for (const task of tasks) {
    const { date, developer_id } = task;
    if (!tasksByDate[date]) tasksByDate[date] = {};
    if (!tasksByDate[date][developer_id]) tasksByDate[date][developer_id] = [];
    tasksByDate[date][developer_id].push(task);
  }

  const [editingTaskId, setEditingTaskId] = useState(null);

  // Add a new task
  const [formResetKey, setFormResetKey] = useState(0);
  const addTask = (form) => {
    fetch('/tasks.json', {
      method: 'POST',
      headers: { 
        'X-CSRF-Token': document.querySelector("meta[name='csrf-token']").content,
        'Content-Type': 'application/json' },
      body: JSON.stringify({ task: {
        task_id:         form.task_id,
        task_url:        form.task_url,
        task_type:       form.type,
        estimated_hours: form.estimated_hours,
        date:            form.date,
        sprint_id:       form.sprint_id,
        developer_id:    form.developer_id
      }})
    })
    .then(r => r.json())
    .then(created => {
      setTasks(prev => [...prev, created]);
      setFormResetKey(prev => prev + 1);
    });
  };

  // Update an existing task
  const updateTask = (form) => {
    fetch(`/tasks/${form.id}.json`, {
      method: 'PATCH',
      headers: { 
        'X-CSRF-Token': document.querySelector("meta[name='csrf-token']").content,
        'Content-Type': 'application/json' },
      body: JSON.stringify({ task: {
        task_id:         form.task_id,
        task_url:        form.task_url,
        task_type:       form.type,
        estimated_hours: form.estimated_hours,
        date:            form.date,
        sprint_id:       form.sprint_id,
        developer_id:    form.developer_id
      }})
    })
    .then(r => r.json())
    .then(updated => setTasks(prev =>
      prev.map(t => t.id === updated.id ? updated : t)
    ));
  };

  const handleTaskUpdate = (updatedTask) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  // Drag-and-drop handler
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!active || !over) return;
  
    const taskId = active.id;
    const [newDate, newDevId] = over.id.split(':');
  
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
  
    // Optimistic update
    setTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, date: newDate, developer_id: parseInt(newDevId) } : t)
    );
  
    // Persist change
    fetch(`/tasks/${taskId}.json`, {
      method: 'PATCH',
      headers: {
        'X-CSRF-Token': document.querySelector("meta[name='csrf-token']").content,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ task: { date: newDate, developer_id: newDevId } })
    });
  };


  // Calculate summary matrices
  const hoursByDevDate = {}; // { dev: { date: hoursSum } }
  developers.forEach(dev => {
    hoursByDevDate[dev.id] = {};
    dates.forEach(date => {
      hoursByDevDate[dev.id][date] = 0;
    });
  });
  tasks.forEach(task => {
    const hrs = parseFloat(task.estimated_hours) || 0;
    if (!hoursByDevDate[task.developer_id]) return;
    if (!hoursByDevDate[task.developer_id][task.date]) hoursByDevDate[task.developer_id][task.date] = 0;
    hoursByDevDate[task.developer_id][task.date] += hrs;
  });

  const hoursByDateDev = {}; // { date: { dev: hoursSum } }
  dates.forEach(date => {
    hoursByDateDev[date] = {};
    developers.forEach(dev => {
      hoursByDateDev[date][dev.id] = 0;
    });
  });
  tasks.forEach(task => {
    const hrs = parseFloat(task.estimated_hours) || 0;

    if (
      hoursByDateDev[task.date] &&
      typeof hoursByDateDev[task.date][task.developer_id] !== 'undefined'
    ) {
      hoursByDateDev[task.date][task.developer_id] += hrs;
    }
  });

  // Format date for display
  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="container mx-auto p-4 pt-[80px] pb-[50px]">
      <h1 className="text-2xl font-bold mb-4">Sprint Task Manager</h1>

      <SprintManager onSprintChange={(updatedSprint) => setSprint(updatedSprint)} />
      {/* Form to add new tasks */}
      <AddTaskForm key={formResetKey} developers={developers} dates={dates} types={types} onAddTask={addTask} />

      {/* Task grid with drag-and-drop */}
      <div className="overflow-auto mt-4">
        <DndContext onDragEnd={handleDragEnd}>
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr>
                <th className="p-2 border bg-gray-200">Date</th>
                {developers.map(dev => (
                  <th key={dev.id} className="border px-4 py-2 text-left">
                    {dev.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dates.map(date => (
                <tr key={date}>
                  <td className="border px-4 py-2">{formatDate(date)}</td>
                  {developers.map(dev => (
                    <TaskCell
                      key={`${date}-${dev.id}`}
                      date={date}
                      dev={dev.id}
                      tasks={tasksByDate[date]?.[dev.id] || []}
                      editingTaskId={editingTaskId}
                      setEditingTaskId={setEditingTaskId}
                      updateTask={updateTask}
                      developers={developers}
                      dates={dates}
                      handleTaskUpdate={handleTaskUpdate}
                      types={types}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </DndContext>
      </div>

      {/* Summary tables */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Summary by Developer (Hours)</h2>
        <table className="min-w-full bg-white border border-gray-300 mb-4">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Developer</th>
              {dates.map(date => (
                <th key={date} className="p-2 border">{formatDate(date)}</th>
              ))}
              <th className="p-2 border">Total</th>
            </tr>
          </thead>
          <tbody>
            {developers.map(dev => {
              const total = dates.reduce((sum, date) => sum + (hoursByDevDate[dev.id][date] || 0), 0);
              return (
                <tr key={dev.id}>
                  <td className="p-2 border font-medium">{dev.name}</td>
                  {dates.map(date => (
                    <td key={date} className="p-2 border text-center">
                      {hoursByDevDate[dev.id][date] || ''}
                    </td>
                  ))}
                  <td className="p-2 border font-medium text-center">{total || ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <h2 className="text-xl font-semibold mb-2">Summary by Date (Hours)</h2>
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Date</th>
              {developers.map(dev => (
                <th key={dev.id} className="p-2 border">{dev.name}</th>
              ))}
              <th className="p-2 border">Total</th>
            </tr>
          </thead>
          <tbody>
            {dates.map(date => {
              const total = developers.reduce((sum, dev) => sum + (hoursByDateDev[date][dev.id] || 0), 0);
              return (
                <tr key={date}>
                  <td className="p-2 border">{formatDate(date)}</td>
                  {developers.map(dev => (
                    <td key={dev.id} className="p-2 border text-center">
                      {hoursByDateDev[date][dev.id] || ''}
                    </td>
                  ))}
                  <td className="p-2 border font-medium text-center">{total || ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Cell component with droppable area
function TaskCell({ date, dev, tasks, editingTaskId, setEditingTaskId, updateTask, developers, dates, handleTaskUpdate, types }) {
  const droppableId = `${date}:${dev}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  return (
    <td ref={setNodeRef} className={`p-2 border align-top ${isOver ? 'bg-yellow-100' : ''}`}>
      {tasks.filter(t => !t.deleted).map(task => (
        editingTaskId === task.id
          ? <EditTaskForm
              task={task}
              developers={developers}
              dates={dates}
              types={types}
              onSave={(updated) => { updateTask(updated); setEditingTaskId(null); }}
              onCancel={() => setEditingTaskId(null)}
            />
          : <TaskCard
              key={task.id}
              task={task}
              onEdit={() => setEditingTaskId(task.id)}
              onTaskUpdate={handleTaskUpdate}
            />
      ))}
    </td>
  );
}

// Draggable task card
function TaskCard({ task, onEdit, onTaskUpdate }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const [copied, setCopied] = useState(false);
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1
  };
  const bgColor = task.task_type === 'Code' ? 'bg-green-50' : 'bg-blue-50';

  const toggleStrike = () => {
    const updatedStrike = !task.is_struck;

    fetch(`/tasks/${task.id}.json`, {
      method: 'PATCH',
      headers: {
        'X-CSRF-Token': document.querySelector("meta[name='csrf-token']").content,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ task: { is_struck: updatedStrike } })
    }).then(res => res.json())
      .then(onTaskUpdate);
  };

  const deleteTask = () => {
    if (!window.confirm(`Delete task "${task.task_id}"?`)) return;

    fetch(`/tasks/${task.id}.json`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': document.querySelector("meta[name='csrf-token']").content,
        'Content-Type': 'application/json'
      }
    }).then(() => {
      onTaskUpdate({ ...task, deleted: true }); // trigger removal via filter outside
    });
  };

  const copyLink = () => {
    if (task.task_url) {
      navigator.clipboard.writeText(task.task_url)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1000);
        });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-2 p-1 border rounded ${bgColor}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-1">
          {/* Drag handle */}
          <span {...listeners} {...attributes} className="cursor-move px-1">⠿</span>

          {/* Task ID */}
          {task.task_url ? (
            <a
              href={task.task_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-blue-600 underline ${task.is_struck ? 'line-through' : ''}`}
            >
              {task.task_id}
            </a>
          ) : (
            <span className={`${task.is_struck ? 'line-through' : ''}`}>{task.task_id}</span>
          )}

          {/* Meta */}
          <span className="ml-2 text-sm text-gray-600">- {task.estimated_hours}h</span>
          <span className="ml-1 text-xs italic">({task.task_type})</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 text-xs text-gray-700">
          <button onClick={toggleStrike} title="Mark done" className="hover:text-black">✅</button>
          <button onClick={onEdit} title="Edit" className="hover:text-black">✏️</button>
          {task.task_url && (
            <button onClick={copyLink} title="Copy link" className="hover:text-blue-600">
              🔗{copied && <span className="ml-1 text-green-600">✔️</span>}
            </button>
          )}
          <button onClick={deleteTask} title="Delete" className="hover:text-red-600">🗑️</button>
        </div>
      </div>
    </div>
  );
}

export default Scheduler;
