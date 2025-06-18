import React, { useEffect, useState, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { Toaster, toast } from "react-hot-toast";
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { startOfWeek, addDays, format, isSameDay, parseISO } from 'date-fns';
import { SchedulerAPI } from '../components/api';

const COLORS = ['#34d399', '#facc15', '#60a5fa'];

function getCompletionData(columns) {
  const total = Object.values(columns).reduce((sum, col) => sum + col.items.length, 0);
  return Object.entries(columns).map(([key, col], i) => ({
    name: col.name,
    value: col.items.length,
    fill: COLORS[i % COLORS.length],
    percent: total ? Math.round((col.items.length / total) * 100) : 0,
  }));
}

function getHeatmapData(columns) {
  const today = startOfWeek(new Date(), { weekStartsOn: 1 });
  const week = Array.from({ length: 7 }, (_, i) => format(addDays(today, i), 'yyyy-MM-dd'));
  const counts = Object.values(columns).flatMap((col) => col.items.map((t) => t.due)).filter(Boolean);
  return week.map((day) => ({
    date: day,
    count: counts.filter((d) => d === day).length,
  }));
}

function generateRecurringTask(baseTask, cycle) {
  const now = new Date();
  let nextDate;
  switch (cycle) {
    case 'daily': nextDate = addDays(now, 1); break;
    case 'weekly': nextDate = addDays(now, 7); break;
    case 'monthly': nextDate = addDays(now, 30); break;
    default: return null;
  }
  return { ...baseTask, id: `task-${idCounter++}`, due: format(nextDate, 'yyyy-MM-dd') };
}

const initialData = {
  todo: { name: "To Do", color: "bg-blue-100", items: [] },
  inprogress: { name: "In Progress", color: "bg-yellow-100", items: [] },
  done: { name: "Completed", color: "bg-green-100", items: [] },
};

let idCounter = 1;

export default function TodoBoard() {
  const [columns, setColumns] = useState(initialData);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskContent, setTaskContent] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editTaskId, setEditTaskId] = useState(null);
  const [editText, setEditText] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTaskDetails, setEditTaskDetails] = useState({
    content: '',
    due: '',
    tags: '',
    createdBy: '',
    assignedTo: '',
    recurring: ''
  });
  const editInputRef = useRef(null);
  const [recurringType, setRecurringType] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  
  useEffect(() => {
    SchedulerAPI.getTasks()
      .then(res => {
        const grouped = groupBy(res.data);
        setColumns(grouped);
      })
      .catch(() => toast.error("Could not load tasks"));
  }, []);

  function groupBy(tasks) {
    const cols = JSON.parse(JSON.stringify(initialData)); 
    tasks.forEach(task => {
      const status = task.status || 'todo';
      cols[status].items.push(task);
    });
    return cols;
  }

  useEffect(() => {
    localStorage.setItem("kanban-tasks", JSON.stringify({ ...columns, _idCounter: idCounter }));
  }, [columns]);

  useEffect(() => {
    if (editInputRef.current) editInputRef.current.focus();
  }, [editTaskId]);

  const handleAddTask = async () => {
    const newTask = { title: taskTitle, content: taskContent, due: dueDate, tags: tags.split(',').map(t=>t.trim()), created_by: createdBy, assigned_to: assignedTo, recurring: recurringType, status: 'todo' };
    const { data } = await SchedulerAPI.createTask({ task: newTask });
    setColumns(prev => ({
      ...prev,
      todo: { ...prev.todo, items: [...prev.todo.items, data] }
    }));
    toast.success("Task added");
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setColumns((prev) => {
        const newCols = { ...prev };
        Object.keys(newCols).forEach((colId) => {
          newCols[colId].items.forEach((task) => {
            if (task.recurring) {
              const today = format(new Date(), 'yyyy-MM-dd');
              if (task.due === today) {
                const newTask = generateRecurringTask(task, task.recurring);
                if (newTask) newCols[colId].items.push(newTask);
              }
            }
          });
        });
        return newCols;
      });
    }, 3600000); // Run every hour
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (colId, taskId) => {
    await SchedulerAPI.deleteTask(taskId);
    setColumns(prev => ({
      ...prev,
      [colId]: { ...prev[colId], items: prev[colId].items.filter(t => t.id !== taskId) }
    }));
    toast.success("Task deleted");
  };

  const handleEditSave = async (colId) => {
    const updates = { ...editTaskDetails, tags: editTaskDetails.tags.split(',').map(t=>t.trim()) };
    const { data } = await SchedulerAPI.updateTask(editTaskId, { task: updates });
    setColumns(prev => ({
      ...prev,
      [colId]: { ...prev[colId], items: prev[colId].items.map(t => t.id === data.id ? data : t) }
    }));
    setEditTaskId(null);
    toast.success("Task updated");
  };

  const handleKeyDown = (e, colId) => {
    if (e.key === "Enter") {
      editTaskId ? handleEditSave(colId) : handleAddTask();
    } else if (e.key === "Escape") {
      setEditTaskId(null);
      setEditText("");
    }
  };
  const term = (searchTerm || "").toLowerCase();

  const onDragEnd = async result => {
    const { source, destination } = result;
    if (!destination) return;
  
    const srcCol = columns[source.droppableId];
    const dstCol = columns[destination.droppableId];
    const item = srcCol.items[source.index];
  
    const updatedItem = { ...item, status: destination.droppableId };
    await SchedulerAPI.moveTask(item.id, { task: { status: updatedItem.status } });
  
    const newSrcItems = Array.from(srcCol.items);
    newSrcItems.splice(source.index, 1);
    const newDstItems = Array.from(dstCol.items);
    newDstItems.splice(destination.index, 0, updatedItem);
  
    setColumns(prev => ({
      ...prev,
      [source.droppableId]: { ...srcCol, items: newSrcItems },
      [destination.droppableId]: { ...dstCol, items: newDstItems }
    }));
  };

  const getDueColor = (due) => {
    if (!due) return "";
    const today = new Date().toISOString().split("T")[0];
    return due < today ? "text-red-600" : due === today ? "text-green-600" : "text-gray-500";
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-blue-700 mb-6 tracking-tight">MyForm Task Control Center</h1>
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-all"
          >
            {showForm ? 'Close Form' : '+ New Task'}
          </button>
        </div>
      </div>

      <Toaster position="top-right" />
      {showForm && (
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          {/* Input Fields */}
          <input
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Task title"
            className="border px-3 py-2 rounded-lg shadow-md focus:ring-2 focus:ring-blue-400 transition-all sm:w-1/3"
          />
          <textarea
            value={taskContent}
            onChange={(e) => setTaskContent(e.target.value)}
            placeholder="Task content"
            className="border px-3 py-2 rounded-lg shadow-md focus:ring-2 focus:ring-blue-400 transition-all sm:w-1/3"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="border px-3 py-2 rounded-lg shadow-md focus:ring-2 focus:ring-blue-400 transition-all sm:w-1/3"
          />
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Comma-separated tags"
            className="border px-3 py-2 rounded-lg shadow-md focus:ring-2 focus:ring-blue-400 transition-all sm:w-1/3"
          />
          <input
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            placeholder="Assigned to"
            className="border px-3 py-2 rounded-lg shadow-md focus:ring-2 focus:ring-blue-400 transition-all"
          />

          {/* Recurring Option and Add Task Button */}
          <div className="sm:w-1/3 flex gap-4">
            <select
              value={recurringType}
              onChange={(e) => setRecurringType(e.target.value)}
              className="border px-3 py-2 rounded-lg shadow-md focus:ring-2 focus:ring-blue-400 transition-all"
            >
              <option value="">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <button
              onClick={handleAddTask}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-all"
            >
              Add Task
            </button>
          </div>
        </div>
      )}


      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-6 shadow-md rounded-lg">
          <h3 className="font-semibold mb-3">Due Date Heatmap</h3>
          <div className="flex gap-2">
            {getHeatmapData(columns).map((d, i) => (
              <div
                key={i}
                className={`p-4 rounded-lg text-center ${
                  d.count === 0 ? 'bg-gray-200' : d.count < 3 ? 'bg-yellow-300' : 'bg-red-500 text-white'
                }`}
              >
                {format(parseISO(d.date), 'EEE')}
                <br />
                {d.count}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 shadow-md rounded-lg">
          <h3 className="font-semibold mb-3">Progress Overview</h3>
          <PieChart width={500} height={250}>
            <Pie
              data={getCompletionData(columns)}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) => `${name}: ${percent}%`}
            >
              {getCompletionData(columns).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
      </div>

      {/* Search */}
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search by keyword or tag"
        className="mb-4 border px-3 py-2 w-full rounded-lg shadow-md focus:ring-2 focus:ring-blue-400 transition-all"
      />

      {/* Drag and Drop Columns */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(columns).map(([columnId, column]) => (
            <Droppable key={columnId} droppableId={columnId}>
              {(provided) => (
                <div
                  className={`${column.color} p-6 rounded-lg shadow-lg min-h-[300px]`}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">{column.name}</h2>
                  {column.items.filter(item => {
                    const content = (item.task_id || "").toLowerCase();
                    
                    const tagMatch = Array.isArray(item.tags)
                      ? item.tags.some(tag => (tag || "").toLowerCase().includes(term))
                      : false;

                    return content.includes(term) || tagMatch;
                }).length === 0 && (
                    <p className="text-sm italic text-gray-500">No matching tasks.</p>
                  )}
      
                  {column.items
                    .filter(item => {
                      const content = (item.task_id || "").toLowerCase();
                      const tagMatch = Array.isArray(item.tags)
                        ? item.tags.some(tag => (tag || "").toLowerCase().includes(term))
                        : false;
                      return content.includes(term) || tagMatch;
                    })
                    .map((item, index) => (
                      <Draggable key={String(item.id)} draggableId={String(item.id)} index={index}>
                        {(provided) => (
                          <div
                            className="bg-white p-4 mb-4 rounded-lg shadow-lg hover:bg-gray-100 transition-all"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            {editTaskId === item.id ? (
                              <div className="flex flex-col gap-2">
                                <input
                                  value={editTaskDetails.content}
                                  onChange={(e) => setEditTaskDetails((prev) => ({ ...prev, content: e.target.value }))}
                                  placeholder="Task content"
                                  className="border p-2 rounded"
                                />
                                <input
                                  type="date"
                                  value={editTaskDetails.due}
                                  onChange={(e) => setEditTaskDetails((prev) => ({ ...prev, due: e.target.value }))}
                                  className="border p-2 rounded"
                                />
                                <input
                                  value={editTaskDetails.tags}
                                  onChange={(e) => setEditTaskDetails((prev) => ({ ...prev, tags: e.target.value }))}
                                  placeholder="Comma-separated tags"
                                  className="border p-2 rounded"
                                />
                                <input
                                  value={editTaskDetails.createdBy}
                                  onChange={(e) => setEditTaskDetails((prev) => ({ ...prev, createdBy: e.target.value }))}
                                  placeholder="Created By"
                                  className="border p-2 rounded"
                                />
                                <input
                                  value={editTaskDetails.assignedTo}
                                  onChange={(e) => setEditTaskDetails((prev) => ({ ...prev, assignedTo: e.target.value }))}
                                  placeholder="Assigned To"
                                  className="border p-2 rounded"
                                />
                                <select
                                  value={editTaskDetails.recurring}
                                  onChange={(e) => setEditTaskDetails((prev) => ({ ...prev, recurring: e.target.value }))}
                                  className="border p-2 rounded"
                                >
                                  <option value="">One-time</option>
                                  <option value="daily">Daily</option>
                                  <option value="weekly">Weekly</option>
                                  <option value="monthly">Monthly</option>
                                </select>
                                <button
                                  onClick={() => handleEditSave(columnId)}
                                  className="bg-green-500 text-white px-4 py-2 rounded"
                                >
                                  Save
                                </button>
                              </div>

                            ) : (
                              <div>
                                <div className="flex justify-between items-start">
                                  <div className="flex-1 text-gray-900">{item.task_id}</div>
                                  <div className="flex flex-col gap-1 text-sm">
                                    <button
                                      onClick={() => {
                                        setEditTaskId(item.id);
                                        setEditTaskDetails({
                                          content: item.task_id,
                                          due: item.due || '',
                                          tags: (item.tags || []).join(', '),
                                          createdBy: item.createdBy || '',
                                          assignedTo: item.assignedTo || '',
                                          recurring: item.recurring || ''
                                        });
                                      }}
                                      className="text-blue-500 hover:text-blue-700"
                                      title="Edit"
                                    >
                                      <FiEdit2 />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(columnId, item.id)}
                                      className="text-red-500 hover:text-red-700"
                                      title="Delete"
                                    >
                                      <FiTrash2 />
                                    </button>
                                  </div>
                                </div>
                                {item.due && (
                                  <div className={`text-xs mt-2 ${getDueColor(item.due)}`}>
                                    Due: {item.due}
                                  </div>
                                )}
                                {item.tags && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {item.tags.map((tag, i) => (
                                      <span
                                        key={i}
                                        className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-full"
                                      >
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {item.createdBy && (
                                  <div className="text-xs text-gray-600 mt-1">Created by: {item.createdBy}</div>
                                )}
                                {item.assignedTo && (
                                  <div className="text-xs text-gray-600">Assigned to: {item.assignedTo}</div>
                                )}

                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}