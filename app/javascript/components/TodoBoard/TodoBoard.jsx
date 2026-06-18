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
import { XCircleIcon, PlusIcon, UserIcon, Squares2X2Icon, MagnifyingGlassIcon, SparklesIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

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

const getTaskTypeParam = (viewMode) => (
  viewMode === 'qa' ? 'qa' : viewMode === 'dev' ? 'Code' : null
);

const isStructuredTask = (task) => ['Code', 'qa'].includes(task?.type);

export default function TodoBoard({ sprintId, projectId, onSprintChange, viewMode = 'combined' }) {
  const { user } = useContext(AuthContext);
  const [columns, setColumns] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [sprints, setSprints] = useState([]);
  const [selectedSprintId, setSelectedSprintId] = useState(sprintId || null);
  const [taskView, setTaskView] = useState('all');
  const taskTypeParam = getTaskTypeParam(viewMode);

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
    if (!selectedSprintId) {
      setColumns(groupBy([]));
      return;
    }

    const params = { sprint_id: selectedSprintId, project_id: projectId };
    if (taskTypeParam) params.type = taskTypeParam;
    SchedulerAPI.getTasks(params)
      .then(res => {
        const grouped = groupBy((res.data || []).filter(isStructuredTask));
        setColumns(grouped);
      })
      .catch(() => toast.error("Could not load tasks"));
  }, [selectedSprintId, projectId, taskTypeParam]);

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
  const allTasks = Object.values(columns).flatMap(col => col.items);
  const totalTasks = allTasks.length;
  const completedTasks = columns.completed?.items.length || 0;
  const inProgressTasks = columns.inprogress?.items.length || 0;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const focusLoad = totalTasks ? Math.round((inProgressTasks / totalTasks) * 100) : 0;
  const overdueTasks = allTasks.filter(task => {
    if (!task.end_date || task.status === 'completed') return false;
    return new Date(task.end_date) < new Date(new Date().toDateString());
  }).length;

  const suggestions = [
    overdueTasks > 0
      ? `${overdueTasks} overdue task${overdueTasks === 1 ? '' : 's'} need a due-date reset or owner check-in.`
      : 'No overdue work is visible — keep the sprint buffer protected.',
    focusLoad > 45
      ? 'In-progress load is high. Move one item to Done before starting another task.'
      : 'Work-in-progress looks healthy. Keep the team focused on the active lane.',
    completionRate < 35
      ? 'Completion is still ramping up. Pull the smallest task forward for quick momentum.'
      : 'Completion trend is solid. Capture learnings before closing the sprint.'
  ];

  // --- HANDLERS ---
  const handleAddTask = async (newTaskData) => {
    try {
      const payload = { ...newTaskData };
      const assigneeName = user?.first_name || user?.name || user?.email || '';
      // ensure the task is assigned to the current user
      if (user) payload.assigned_to_user = user.id;
      if (projectId) payload.project_id = projectId;
      if (selectedSprintId) payload.sprint_id = selectedSprintId;

      if (viewMode === 'qa') {
        payload.type = 'qa';
        payload.developer_id = null;
        payload.qa_assigned = payload.qa_assigned || assigneeName;
      } else {
        if (!user?.id) {
          toast.error("Current user is required to create a dev task.");
          return;
        }
        payload.type = 'Code';
        payload.developer_id = payload.developer_id || user.id;
      }

      const { data } = await SchedulerAPI.createTask(payload);
      if (!isStructuredTask(data) || (taskTypeParam && data.type !== taskTypeParam)) {
        setShowForm(false);
        return;
      }
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
      if (!isStructuredTask(data) || (taskTypeParam && data.type !== taskTypeParam)) {
        setColumns(prev => ({
          ...prev,
          [colId]: { ...prev[colId], items: prev[colId].items.filter(t => t.id !== data.id) }
        }));
        toast.success("Task updated");
        return;
      }

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
    <div className="relative min-h-screen overflow-hidden bg-[#070910] px-4 pb-10 pt-4 font-sans text-slate-100 sm:px-8">
      <div className="pointer-events-none absolute -left-28 top-10 h-72 w-72 rounded-full bg-fuchsia-500/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-28 h-52 bg-[radial-gradient(ellipse_at_center,rgba(167,139,250,0.2),transparent_65%)]" />
      <div className="relative mx-auto max-w-[1520px] rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-6">
        <Toaster position="top-right" />
        <header className="relative mb-6 overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl sm:p-8">
          <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-[conic-gradient(from_180deg,theme(colors.fuchsia.400),theme(colors.cyan.200),theme(colors.violet.700),theme(colors.fuchsia.400))] opacity-40 blur-2xl" />
          <div className="absolute bottom-0 right-10 h-32 w-80 rotate-[-8deg] rounded-full bg-gradient-to-r from-cyan-200/40 via-fuchsia-300/30 to-transparent blur-xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-full border border-cyan-200/30 bg-cyan-200/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.28em] text-cyan-100">
                  <SparklesIcon className="mr-2 h-4 w-4" /> Project Todo
                </span>
                {viewMode !== 'dev' && (
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${viewMode === 'qa'
                    ? 'border-purple-200/40 bg-purple-300/15 text-purple-100'
                    : 'border-indigo-200/40 bg-indigo-300/15 text-indigo-100'
                    }`}>
                    {viewMode === 'qa' ? 'QA mode' : 'Combined mode'}
                  </span>
                )}
              </div>
              <h1 className="max-w-4xl text-4xl font-black tracking-[-0.06em] text-white sm:text-6xl">
                A glassy sprint command center for clear priorities.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Track due-date heat, progress, and task flow in one immersive board inspired by dimensional analytics dashboards.
              </p>
              <div className="mt-6 grid max-w-2xl grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Complete</p>
                  <p className="mt-2 text-3xl font-black text-white">{completionRate}%</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active</p>
                  <p className="mt-2 text-3xl font-black text-white">{inProgressTasks}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Overdue</p>
                  <p className="mt-2 text-3xl font-black text-rose-100">{overdueTasks}</p>
                </div>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-fuchsia-100">Smart suggestions</p>
                  <h2 className="mt-1 text-xl font-bold text-white">Improve this sprint</h2>
                </div>
                <ArrowTrendingUpIcon className="h-7 w-7 text-cyan-100" />
              </div>
              <ul className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <li key={suggestion} className="rounded-2xl border border-white/10 bg-slate-900/50 p-3 text-sm leading-5 text-slate-200">
                    <span className="mr-2 font-black text-cyan-200">0{index + 1}</span>{suggestion}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </header>

        <div className="mb-6 flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-white/10 p-3 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tasks by ID, title or tag..."
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-3 pl-12 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-200/60 focus:ring-2 focus:ring-cyan-200/20"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-cyan-300 px-5 py-3 font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02]"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Task</span>
            </button>
            <div className="flex rounded-2xl border border-white/10 bg-slate-950/70 p-1">
              {[["all", "All Tasks", Squares2X2Icon], ["my", "My Tasks", UserIcon]].map(([value, label, Icon]) => (
                <button
                  key={value}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${taskView === value ? 'bg-white text-slate-950 shadow' : 'text-slate-300 hover:bg-white/10'}`}
                  onClick={() => setTaskView(value)}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add a New Task">
          <TaskForm onAddTask={handleAddTask} onCancel={() => setShowForm(false)} defaultType={viewMode === 'qa' ? 'qa' : 'Code'} />
        </Modal>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Heatmap columns={columns} view={taskView} onViewChange={setTaskView} sprint={currentSprint} />
          <ProgressPieChart columns={applyView(columns)} />
        </div>

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
