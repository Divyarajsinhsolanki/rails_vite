import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  format, startOfDay, endOfDay, addDays, isSameDay, getDay, startOfWeek, endOfWeek, parse,
  differenceInMinutes, addMinutes, isBefore, isAfter, eachDayOfInterval, startOfMonth,
  endOfMonth, eachWeekOfInterval, isSameMonth, isSameWeek
} from 'date-fns';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClockIcon,
  CalendarIcon,
  PlusIcon,
  PencilIcon, 
  TrashIcon,
  ChartPieIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  PlayIcon,
  SparklesIcon,
  StopIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  DocumentTextIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TagIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import {
  fetchWorkPriorities,
  fetchWorkCategories,
  fetchWorkTags,
  getWorkLogs,
  createWorkLog,
  updateWorkLog,
  deleteWorkLog,
  getWorkNote,
  createWorkNote,
  updateWorkNote
} from '../components/api';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// --- Constants ---
const POMODORO_DURATION = 30; // minutes
const SHORT_BREAK_DURATION = 15; // minutes
const LONG_BREAK_DURATION = 30; // minutes
const POMODOROS_FOR_LONG_BREAK = 4;

// --- Helpers ---
const hexToRgba = (hex, alpha = 1) => {
  if (!hex) return '';
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// --- Reusable Components ---
const Modal = ({ children, isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// --- Main WorkLog Component ---
const WorkLog = () => {
  // --- State Management ---
  const [priorities, setPriorities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [dailyNote, setDailyNote] = useState('');
  const [noteId, setNoteId] = useState(null);
  const [activeTimer, setActiveTimer] = useState(null);
  const [pomodoroState, setPomodoroState] = useState({
    mode: 'work',
    count: 0,
    timeLeft: POMODORO_DURATION * 60,
    isActive: false
  });
  const [isExpandedView, setIsExpandedView] = useState(false);
  const [tags, setTags] = useState([]);
  const [productivityScore, setProductivityScore] = useState(0);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'weekly'
  const [filter, setFilter] = useState({
    categories: [],
    priorities: [],
    tags: []
  });
  
  const timerRef = useRef(null);
  const pomodoroRef = useRef(null);

  const formatLog = (log) => ({
    id: log.id,
    title: log.title,
    description: log.description,
    startTime: log.start_time,
    endTime: log.end_time,
    category: log.category?.id,
    priority: log.priority?.id,
    date: new Date(log.log_date),
    createdAt: new Date(log.created_at),
    updatedAt: new Date(log.updated_at),
    actualMinutes: log.actual_minutes || 0,
    tags: (log.tags || []).map(t => t.name)
  });

  // --- Data Fetching ---
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const { data: priorityData } = await fetchWorkPriorities();
        setPriorities(priorityData.sort((a, b) => a.id - b.id));
      } catch {}

      try {
        const { data: categoryData } = await fetchWorkCategories();
        setCategories(categoryData.sort((a, b) => a.id - b.id));
      } catch {}

      try {
        const { data: tagData } = await fetchWorkTags();
        setTags(tagData.map(t => t.name));
      } catch {}
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = viewMode === 'weekly'
          ? {
              from: format(startOfWeek(selectedDate), 'yyyy-MM-dd'),
              to: format(endOfWeek(selectedDate), 'yyyy-MM-dd')
            }
          : { date: format(selectedDate, 'yyyy-MM-dd') };
        const { data } = await getWorkLogs(params);
        setTasks(data.map(formatLog));
      } catch {}

      try {
        const { data: noteData } = await getWorkNote(format(selectedDate, 'yyyy-MM-dd'));
        setDailyNote(noteData.content || '');
        setNoteId(noteData.id || null);
      } catch {
        setDailyNote('');
        setNoteId(null);
      }
    };
    fetchData();
  }, [selectedDate, viewMode]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const payload = { note_date: format(selectedDate, 'yyyy-MM-dd'), content: dailyNote };
      if (noteId) {
        try {
          await updateWorkNote(noteId, payload);
        } catch {}
      } else if (dailyNote.trim() !== '') {
        try {
          const { data } = await createWorkNote(payload);
          setNoteId(data.id);
        } catch {}
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [dailyNote, selectedDate]);

  // --- Timer Effects ---
  useEffect(() => {
    if (activeTimer) {
      timerRef.current = setInterval(() => {
        setTasks(prev => prev.map(task => {
          if (task.id === activeTimer.taskId) {
            const updated = { ...task, actualMinutes: task.actualMinutes + 1 };
            updateWorkLog(task.id, { actual_minutes: updated.actualMinutes });
            return updated;
          }
          return task;
        }));
      }, 60000); // Update every minute
    }
    
    return () => clearInterval(timerRef.current);
  }, [activeTimer]);

  useEffect(() => {
    if (pomodoroState.isActive) {
      pomodoroRef.current = setInterval(() => {
        setPomodoroState(prev => {
          if (prev.timeLeft <= 0) {
            clearInterval(pomodoroRef.current);
            handlePomodoroComplete();
            return { ...prev, isActive: false };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    
    return () => clearInterval(pomodoroRef.current);
  }, [pomodoroState.isActive]);

  // --- Memoized Calculations ---
  const priorityOrder = useMemo(() => (
    priorities.reduce((acc, p, index) => {
      acc[p.id] = index + 1;
      return acc;
    }, {})
  ), [priorities]);
  const filteredTasks = useMemo(() => {
    return tasks.filter(task =>
      (filter.categories.length === 0 || filter.categories.includes(task.category)) &&
      (filter.priorities.length === 0 || filter.priorities.includes(task.priority)) &&
      (filter.tags.length === 0 || filter.tags.some(tag => task.tags?.includes(tag)))
    );
  }, [tasks, filter]);

  const currentTasks = useMemo(() => {
    let filtered = viewMode === 'weekly'
      ? filteredTasks
      : filteredTasks.filter(task => isSameDay(task.date, selectedDate));

    return filtered.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }

      // Then by start time
      return a.startTime.localeCompare(b.startTime);
    });
  }, [filteredTasks, viewMode, selectedDate, priorityOrder]);

  const timeSummary = useMemo(() => {
    const summary = {
      totalMinutes: 0,
      byCategory: {},
      byPriority: {},
      productiveMinutes: 0
    };

    const breakCategory = categories.find(c => c.name === 'Break');
    const breakCategoryId = breakCategory ? breakCategory.id : null;

    categories.forEach(cat => summary.byCategory[cat.id] = 0);
    priorities.forEach(pri => summary.byPriority[pri.id] = 0);
    
    currentTasks.forEach(task => {
      const start = parse(task.startTime, 'HH:mm', new Date());
      const end = parse(task.endTime, 'HH:mm', new Date());
      let duration = differenceInMinutes(end, start);
      
      if (duration < 0) duration += 24 * 60; // Handle overnight tasks
      
      if (duration > 0) {
        summary.totalMinutes += duration;
        summary.byCategory[task.category] = (summary.byCategory[task.category] || 0) + duration;
        summary.byPriority[task.priority] = (summary.byPriority[task.priority] || 0) + duration;

        // Only count non-break tasks as productive
        if (task.category !== breakCategoryId) {
          summary.productiveMinutes += duration;
        }
      }
    });
    
    // Calculate productivity score (0-100)
    const maxPossible = 8 * 60; // 8 hours
    const score = Math.min(100, Math.round((summary.productiveMinutes / maxPossible) * 100));
    setProductivityScore(score);
    
    return summary;
  }, [currentTasks, categories, priorities]);

  const weeklySummary = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: addDays(weekStart, 6)
    });

    return weekDays.map(day => {
      const dayTasks = filteredTasks.filter(task => isSameDay(task.date, day));
      const minutes = dayTasks.reduce((total, task) => {
        const start = parse(task.startTime, 'HH:mm', new Date());
        const end = parse(task.endTime, 'HH:mm', new Date());
        let duration = differenceInMinutes(end, start);
        if (duration < 0) duration += 24 * 60;
        return total + duration;
      }, 0);

      return {
        date: day,
        minutes,
        dayName: format(day, 'EEE')
      };
    });
  }, [filteredTasks, selectedDate]);

  // --- Handlers ---
  const handleDateChange = useCallback((days) => {
    setSelectedDate(current => addDays(current, days));
  }, []);

  const openForm = useCallback((task = null) => {
    setEditingTask(task);
    setShowForm(true);
  }, []);
  
  const closeForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const handleSaveTask = async (taskData) => {
    const payload = {
      title: taskData.title,
      description: taskData.description,
      log_date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: taskData.startTime,
      end_time: taskData.endTime,
      category_id: taskData.category,
      priority_id: taskData.priority,
      tags: taskData.tags || []
    };

    if (editingTask) {
      try {
        const { data } = await updateWorkLog(editingTask.id, payload);
        setTasks(tasks.map(t => t.id === data.id ? formatLog(data) : t));
      } catch {}
    } else {
      try {
        const { data } = await createWorkLog(payload);
        setTasks([...tasks, formatLog(data)]);
      } catch {}
    }
    closeForm();
  };

  const handleDelete = async (taskId) => {
    await deleteWorkLog(taskId);
    setTasks(tasks.filter(task => task.id !== taskId));
    if (activeTimer?.taskId === taskId) {
      stopTimer();
    }
  };
  
  const startTimer = (taskId) => {
    setActiveTimer({ taskId, startTime: new Date() });
    setActiveTaskId(taskId);
  };
  
  const stopTimer = () => {
    if (activeTimer) {
      const task = tasks.find(t => t.id === activeTimer.taskId);
      if (task) {
        updateWorkLog(task.id, { actual_minutes: task.actualMinutes });
      }
    }
    setActiveTimer(null);
    setActiveTaskId(null);
  };
  
  const startPomodoro = () => {
    setPomodoroState(prev => ({
      ...prev,
      isActive: true,
      timeLeft: prev.mode === 'work' 
        ? POMODORO_DURATION * 60
        : prev.mode === 'shortBreak' 
          ? SHORT_BREAK_DURATION * 60
          : LONG_BREAK_DURATION * 60
    }));
  };
  
  const pausePomodoro = () => {
    setPomodoroState(prev => ({ ...prev, isActive: false }));
  };
  
  const resetPomodoro = () => {
    setPomodoroState({
      mode: 'work',
      count: 0,
      timeLeft: POMODORO_DURATION * 60,
      isActive: false
    });
  };
  
  const handlePomodoroComplete = () => {
    if (pomodoroState.mode === 'work') {
      const newCount = pomodoroState.count + 1;
      const nextMode = newCount % POMODOROS_FOR_LONG_BREAK === 0 
        ? 'longBreak' 
        : 'shortBreak';
      
      setPomodoroState({
        mode: nextMode,
        count: newCount,
        timeLeft: nextMode === 'shortBreak' 
          ? SHORT_BREAK_DURATION * 60 
          : LONG_BREAK_DURATION * 60,
        isActive: false
      });
      
      // Add a break task automatically
      const breakDuration = nextMode === 'shortBreak' 
        ? SHORT_BREAK_DURATION 
        : LONG_BREAK_DURATION;
      
      const now = new Date();
      const startTime = format(now, 'HH:mm');
      const endTime = format(addMinutes(now, breakDuration), 'HH:mm');
      
      const breakCat = categories.find(c => c.name === 'Break');
      const lowPriority = priorities.find(p => p.name === 'Low');
      handleSaveTask({
        title: `${nextMode === 'shortBreak' ? 'Short' : 'Long'} Break`,
        description: `Pomodoro break after ${newCount} work sessions`,
        startTime,
        endTime,
        category: breakCat?.id,
        priority: lowPriority?.id
      });
    } else {
      setPomodoroState({
        mode: 'work',
        count: pomodoroState.count,
        timeLeft: POMODORO_DURATION * 60,
        isActive: false
      });
    }
  };
  
  const getTasksForDate = (date) => filteredTasks.filter(task => isSameDay(task.date, date));
  
  const toggleFilter = (type, value) => {
    setFilter(prev => {
      const currentValues = prev[type] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return { ...prev, [type]: newValues };
    });
  };
  
  const clearFilters = () => {
    setFilter({ categories: [], priorities: [], tags: [] });
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 font-sans text-gray-800 p-4 sm:p-6 lg:p-8 ${isExpandedView ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
                <SparklesIcon className="h-8 w-8 text-indigo-500"/>
                Work Log
              </h1>
              <p className="text-gray-500 mt-1">Your personal dashboard for productivity and time management.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsExpandedView(!isExpandedView)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                title={isExpandedView ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isExpandedView ? (
                  <ArrowsPointingInIcon className="h-5 w-5" />
                ) : (
                  <ArrowsPointingOutIcon className="h-5 w-5" />
                )}
              </button>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setViewMode('daily')}
                  className={`px-4 py-2 rounded-lg ${viewMode === 'daily' ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  Daily
                </button>
                <button 
                  onClick={() => setViewMode('weekly')}
                  className={`px-4 py-2 rounded-lg ${viewMode === 'weekly' ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  Weekly
                </button>
              </div>
            </div>
          </div>
          
          {/* Productivity Score */}
          <div className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">Today's Productivity</h2>
                <p className="text-indigo-100 text-sm">
                  {timeSummary.productiveMinutes > 0 
                    ? `${Math.floor(timeSummary.productiveMinutes / 60)}h ${timeSummary.productiveMinutes % 60}m of productive work`
                    : "Start tracking your work to see insights"}
                </p>
              </div>
              
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeDasharray={`${productivityScore}, 100`}
                  />
                  <text x="18" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                    {productivityScore}%
                  </text>
                </svg>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Calendar & Summary */}
          <aside className="lg:col-span-1 space-y-8">
            <CalendarWidget 
              selectedDate={selectedDate} 
              setSelectedDate={setSelectedDate}
              handleDateChange={handleDateChange}
              getTasksForDate={getTasksForDate}
              viewMode={viewMode}
            />
            
            <PomodoroWidget 
              pomodoroState={pomodoroState}
              onStart={startPomodoro}
              onPause={pausePomodoro}
              onReset={resetPomodoro}
            />
            
            <TimeSummaryWidget
              timeSummary={timeSummary}
              categories={categories}
              priorities={priorities}
              weeklySummary={weeklySummary}
              viewMode={viewMode}
            />
            
            {viewMode === 'daily' && (
              <DailyNotes 
                note={dailyNote} 
                onChange={setDailyNote} 
              />
            )}
          </aside>
          
          {/* Right Column - Timeline */}
          <section className="lg:col-span-2">
            <FilterWidget
              categories={categories}
              priorities={priorities}
              tags={tags}
              filter={filter}
              onToggleFilter={toggleFilter}
              onClearFilters={clearFilters}
            />
            
            <TimelineView
              tasks={currentTasks}
              selectedDate={selectedDate}
              categories={categories}
              priorities={priorities}
              onAddTask={() => openForm()}
              onEditTask={openForm}
              onDeleteTask={handleDelete}
              onStartTimer={startTimer}
              onStopTimer={stopTimer}
              activeTaskId={activeTaskId}
              viewMode={viewMode}
              weeklySummary={weeklySummary}
              timeSummary={timeSummary}
            />
          </section>
        </main>
        
        <TaskFormModal
          isOpen={showForm}
          onClose={closeForm}
          onSave={handleSaveTask}
          task={editingTask}
          categories={categories}
          priorities={priorities}
          lastTaskEnd={currentTasks[currentTasks.length - 1]?.endTime}
          tags={tags}
          setTags={setTags}
        />
      </div>
    </div>
  );
};

// --- Child Components ---

const CalendarWidget = ({ selectedDate, setSelectedDate, handleDateChange, getTasksForDate, viewMode }) => {
  const weekStartsOn = 1; // Monday
  const firstDayOfMonth = startOfMonth(selectedDate);
  const lastDayOfMonth = endOfMonth(selectedDate);
  
  // For weekly view
  const weekStart = startOfWeek(selectedDate, { weekStartsOn });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6)
  });
  
  // For monthly view
  const monthWeeks = eachWeekOfInterval(
    { start: firstDayOfMonth, end: lastDayOfMonth },
    { weekStartsOn }
  );

  return (
    <motion.div layout className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {viewMode === 'daily' 
            ? format(selectedDate, 'MMMM yyyy') 
            : `Week of ${format(weekStart, 'MMM d')}`}
        </h2>
        <div className="flex items-center space-x-1">
          <button onClick={() => handleDateChange(-1)} className="p-2 rounded-lg hover:bg-gray-100">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button onClick={() => setSelectedDate(new Date())} className="px-3 py-1.5 text-sm font-medium bg-gray-100 rounded-lg hover:bg-gray-200">
            Today
          </button>
          <button onClick={() => handleDateChange(1)} className="p-2 rounded-lg hover:bg-gray-100">
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {viewMode === 'daily' ? (
        <>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 font-medium">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 mt-2">
            {monthWeeks.flatMap(weekStart => 
              eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) }).map((date, i) => {
                const isSelected = isSameDay(date, selectedDate);
                const hasTasks = getTasksForDate(date).length > 0;
                const isCurrentMonth = isSameMonth(date, selectedDate);
                
                return (
                  <button
                    key={`${weekStart}-${i}`}
                    onClick={() => setSelectedDate(date)}
                    className={`h-9 w-9 rounded-full flex items-center justify-center text-sm transition-colors relative
                      ${isSelected ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-gray-100'}
                      ${!isCurrentMonth ? 'text-gray-300' : ''}
                    `}
                  >
                    {format(date, 'd')}
                    {hasTasks && <span className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'}`}></span>}
                  </button>
                );
              })
            )}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-7 gap-1 mt-4">
          {weekDays.map((date, i) => {
            const isSelected = isSameDay(date, selectedDate);
            const hasTasks = getTasksForDate(date).length > 0;
            
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors
                  ${isSelected ? 'bg-indigo-100 border border-indigo-300' : 'hover:bg-gray-100'}
                `}
              >
                <div className="text-sm text-gray-500">{format(date, 'EEE')}</div>
                <div className="font-medium mt-1">{format(date, 'd')}</div>
                {hasTasks && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1"></span>}
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

const PomodoroWidget = ({ pomodoroState, onStart, onPause, onReset }) => {
  const minutes = Math.floor(pomodoroState.timeLeft / 60);
  const seconds = pomodoroState.timeLeft % 60;
  const progress = (pomodoroState.timeLeft / 
    (pomodoroState.mode === 'work' 
      ? POMODORO_DURATION * 60 
      : pomodoroState.mode === 'shortBreak' 
        ? SHORT_BREAK_DURATION * 60 
        : LONG_BREAK_DURATION * 60)
  ) * 100;

  return (
    <motion.div layout className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Pomodoro Timer</h2>
        <div className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1 text-sm">
          <span className={`w-2 h-2 rounded-full ${pomodoroState.mode === 'work' ? 'bg-red-500' : 'bg-green-500'}`}></span>
          <span className="font-medium">
            {pomodoroState.mode === 'work' 
              ? 'Work' 
              : pomodoroState.mode === 'shortBreak' 
                ? 'Short Break' 
                : 'Long Break'}
          </span>
        </div>
      </div>
      
      <div className="relative">
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-6">
          <div 
            className={`h-full ${pomodoroState.mode === 'work' ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="text-center mb-6">
          <div className="text-4xl font-bold tracking-tighter">
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {pomodoroState.mode === 'work' 
              ? `Session ${pomodoroState.count + 1}` 
              : 'Take a break!'}
          </div>
        </div>
        
        <div className="flex justify-center gap-3">
          {pomodoroState.isActive ? (
            <button onClick={onPause} className="px-5 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900">
              <StopIcon className="h-5 w-5 inline mr-2" />
              Pause
            </button>
          ) : (
            <button onClick={onStart} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <PlayIcon className="h-5 w-5 inline mr-2" />
              Start
            </button>
          )}
          <button onClick={onReset} className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50">
            Reset
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const TimeSummaryWidget = ({ timeSummary, categories, priorities, weeklySummary, viewMode }) => {
  const totalHours = (timeSummary.totalMinutes / 60).toFixed(1);
  
  // Weekly chart data
  const weeklyChartData = {
    labels: weeklySummary.map(day => day.dayName),
    datasets: [{
      label: 'Minutes Worked',
      data: weeklySummary.map(day => day.minutes),
      backgroundColor: '#6366f1',
      borderRadius: 4,
    }]
  };

  return (
    <motion.div layout className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ChartPieIcon className="h-5 w-5" />
          {viewMode === 'daily' ? 'Daily Summary' : 'Weekly Overview'}
        </h2>
        <span className="font-bold text-indigo-600 text-lg">{totalHours} hrs</span>
      </div>
      
      {viewMode === 'daily' ? (
        timeSummary.totalMinutes > 0 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              {categories.map(cat => {
                const minutes = timeSummary.byCategory[cat.id];
                if (!minutes) return null;
                const percentage = (minutes / timeSummary.totalMinutes * 100).toFixed(0);
                return (
                  <div key={cat.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.hex }}></span>
                      <span className="font-medium">{cat.name}</span>
                    </div>
                    <span className="text-gray-500">
                      {Math.floor(minutes / 60)}h {minutes % 60}m ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">By Priority</h3>
              <div className="space-y-2">
                {priorities.map(pri => {
                  const minutes = timeSummary.byPriority[pri.id];
                  if (!minutes) return null;
                  return (
                    <div key={pri.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: pri.hex }}></span>
                        <span className="font-medium">{pri.name}</span>
                      </div>
                      <span className="text-gray-500">
                        {Math.floor(minutes / 60)}h {minutes % 60}m
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ClockIcon className="h-12 w-12 mx-auto text-gray-300" />
            <p className="mt-2 text-sm">Log a task to see your time breakdown.</p>
          </div>
        )
      ) : (
        <div className="h-64">
          <Bar 
            data={weeklyChartData} 
            options={{ 
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value) {
                      return value + 'm';
                    }
                  }
                }
              }
            }} 
          />
        </div>
      )}
    </motion.div>
  );
};

const DailyNotes = ({ note, onChange }) => {
  return (
    <motion.div layout className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <DocumentTextIcon className="h-5 w-5" />
          Daily Notes
        </h2>
      </div>
      
      <textarea
        value={note}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Reflect on your day, note important insights, or plan for tomorrow..."
        className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
      />
      
      <div className="mt-3 text-xs text-gray-500 flex items-center">
        <LightBulbIcon className="h-4 w-4 mr-1" />
        Tip: These notes are saved automatically
      </div>
    </motion.div>
  );
};

const FilterWidget = ({ categories, priorities, tags, filter, onToggleFilter, onClearFilters }) => {
  const hasFilters = filter.categories.length > 0 || filter.priorities.length > 0 || filter.tags.length > 0;
  
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
      <div className="flex flex-wrap gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-1">Category</h3>
          <div className="flex flex-wrap gap-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => onToggleFilter('categories', cat.id)}
                className={`px-2 py-1 text-xs rounded-full transition-all ${
                  filter.categories.includes(cat.id)
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={filter.categories.includes(cat.id) ? { backgroundColor: cat.hex } : {}}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-1">Priority</h3>
          <div className="flex flex-wrap gap-1">
            {priorities.map(pri => (
              <button
                key={pri.id}
                onClick={() => onToggleFilter('priorities', pri.id)}
                className={`px-2 py-1 text-xs rounded-full transition-all ${
                  filter.priorities.includes(pri.id)
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={filter.priorities.includes(pri.id) ? { backgroundColor: pri.hex } : {}}
              >
                {pri.name}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-1">Tags</h3>
          <div className="flex flex-wrap gap-1">
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => onToggleFilter('tags', tag)}
                className={`px-2 py-1 text-xs rounded-full transition-all flex items-center ${
                  filter.tags.includes(tag)
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <TagIcon className="h-3 w-3 mr-1" />
                {tag}
              </button>
            ))}
          </div>
        </div>
        
        {hasFilters && (
          <div className="flex items-end">
            <button
              onClick={onClearFilters}
              className="px-3 py-1 text-xs bg-gray-800 text-white rounded-lg hover:bg-gray-900"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const TimelineView = ({ 
  tasks, 
  selectedDate, 
  categories, 
  priorities,
  onAddTask, 
  onEditTask, 
  onDeleteTask,
  onStartTimer,
  onStopTimer,
  activeTaskId,
  viewMode,
  weeklySummary,
  timeSummary
}) => {
  const hours = Array.from({ length: 18 }, (_, i) => i + 5); // 5 AM to 10 PM
  
  const timeToPosition = (time) => {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = (h * 60 + m) - (5 * 60); // Minutes from 5 AM
    return (totalMinutes / (18 * 60)) * 100; // As a percentage of the total height
  };
  
  const getDuration = (task) => {
    const start = parse(task.startTime, 'HH:mm', new Date());
    const end = parse(task.endTime, 'HH:mm', new Date());
    let duration = differenceInMinutes(end, start);
    if (duration < 0) duration += 24 * 60; // Handle overnight tasks
    return duration;
  };
  
  if (viewMode === 'weekly') {
    return (
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Weekly Overview</h2>
            <p className="text-sm text-gray-500">
              {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d')} - 
              {format(addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), 6), 'MMM d')}
            </p>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {weeklySummary.map((day, index) => (
              <div key={index} className="text-center">
                <div className="font-medium text-sm text-gray-700">{day.dayName}</div>
                <div className="text-lg font-bold mt-1">{Math.floor(day.minutes / 60)}h {day.minutes % 60}m</div>
                
                <div className="mt-4 space-y-2">
                  {tasks.filter(task => isSameDay(task.date, day.date)).map(task => {
                    const category = categories.find(c => c.id === task.category);
                    const priority = priorities.find(p => p.id === task.priority);
                    
                    return (
                      <div
                        key={task.id}
                        className="p-2 rounded-lg text-left text-xs border-l-4"
                        style={{
                          borderLeftColor: priority?.hex,
                          backgroundColor: category ? hexToRgba(category.hex, 0.1) : undefined,
                        }}
                      >
                        <div className="font-medium truncate">{task.title}</div>
                        <div className="text-gray-500 truncate">{task.startTime} - {task.endTime}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold">Timeline for {format(selectedDate, 'MMMM d')}</h2>
          <p className="text-sm text-gray-500">
            {tasks.length} tasks scheduled · Total: {Math.floor(timeSummary.totalMinutes / 60)}h {timeSummary.totalMinutes % 60}m
          </p>
        </div>
        <button onClick={onAddTask} className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-700 transition-all">
          <PlusIcon className="h-5 w-5" />
          <span>Add Task</span>
        </button>
      </div>

      <div className="p-6">
        {tasks.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-lg font-medium text-gray-900 mb-1">It's a blank canvas!</h3>
            <p className="text-gray-500 mb-4">Add your first task to start building your day.</p>
            <button onClick={onAddTask} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
              Log First Task
            </button>
          </div>
        ) : (
          <div className="relative">
            {/* Hour Markers */}
            <div className="absolute left-0 top-0 bottom-0 w-12">
              {hours.map(hour => (
                <div key={hour} className="h-[calc(100%/18)] text-right pr-2 text-xs text-gray-400 border-t border-gray-100 flex items-center justify-end">
                  {hour % 12 === 0 ? 12 : hour % 12} {hour < 12 || hour === 24 ? 'am' : 'pm'}
                </div>
              ))}
            </div>

            {/* Timeline Grid */}
            <div className="ml-12">
              {hours.map(hour => <div key={hour} className="h-14 border-t border-gray-200"></div>)}
            </div>

            {/* Task Items */}
            <div className="absolute top-0 bottom-0 left-12 right-0">
              <AnimatePresence>
                {tasks.map(task => {
                  const category = categories.find(c => c.id === task.category);
                  const priority = priorities.find(p => p.id === task.priority);
                  const top = timeToPosition(task.startTime);
                  const duration = getDuration(task);
                  const height = (duration / (18 * 60)) * 100;
                  
                  return (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="absolute w-full p-2 group"
                      style={{ top: `${top}%`, height: `${height}%` }}
                    >
                      <div
                        className="rounded-lg p-3 h-full flex flex-col justify-between text-white shadow-lg overflow-hidden relative"
                        style={{ backgroundColor: category?.hex }}
                      >
                        <div className="absolute top-0 left-0 w-full h-1 bg-white/30"></div>
                        
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-sm truncate">{task.title}</h3>
                            {priority && (
                              <span
                                className="ml-2 px-2 py-0.5 text-xs rounded-full text-white"
                                style={{ backgroundColor: priority.hex }}
                              >
                                {priority.name}
                              </span>
                            )}
                          </div>
                          <p className="text-xs opacity-80 truncate">{task.startTime} - {task.endTime}</p>
                          {task.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {task.tags.map(tag => (
                                <span key={tag} className="bg-black/20 px-1.5 py-0.5 rounded text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-2 flex items-center justify-between">
                          {activeTaskId === task.id ? (
                            <button 
                              onClick={() => onStopTimer()}
                              className="text-xs bg-red-500 hover:bg-red-600 px-2 py-1 rounded flex items-center"
                            >
                              <StopIcon className="h-3 w-3 mr-1" />
                              Stop Timer
                            </button>
                          ) : (
                            <button 
                              onClick={() => onStartTimer(task.id)}
                              className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded flex items-center"
                            >
                              <PlayIcon className="h-3 w-3 mr-1" />
                              Start Timer
                            </button>
                          )}
                          
                          <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onEditTask(task)} className="p-1.5 bg-black/20 rounded-full hover:bg-black/40">
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button onClick={() => onDeleteTask(task.id)} className="p-1.5 bg-black/20 rounded-full hover:bg-black/40">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TaskFormModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  task, 
  categories, 
  priorities,
  lastTaskEnd,
  tags,
  setTags
}) => {
  const [formState, setFormState] = useState({});
  const [newTag, setNewTag] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      const defaultStartTime = lastTaskEnd || '09:00';
      const parsedTime = parse(defaultStartTime, 'HH:mm', new Date());
      const defaultEndTime = format(addMinutes(parsedTime, 60), 'HH:mm');
      
      setFormState(task || {
        title: '',
        description: '',
        startTime: defaultStartTime,
        endTime: defaultEndTime,
        category: categories[0]?.id,
        priority: priorities[0]?.id,
        tags: []
      });
    }
  }, [task, isOpen, lastTaskEnd]);
  
  const handleChange = e => setFormState({ ...formState, [e.target.name]: e.target.value });
  
  const handleTagChange = (tag) => {
    const currentTags = formState.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
      
    setFormState({ ...formState, tags: newTags });
  };
  
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      handleTagChange(newTag.trim());
    }
    setNewTag('');
  };
  
  const handleStartTimer = () => {
    const now = new Date();
    setFormState({
      ...formState,
      title: formState.title || 'New Timed Task',
      startTime: format(now, 'HH:mm'),
      endTime: format(addMinutes(now, 60), 'HH:mm'),
    });
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSave(formState);
  };
  
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="p-6 flex justify-between items-center border-b border-gray-200">
          <h2 className="text-xl font-semibold">{task ? 'Edit Task' : 'Add New Task'}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <input 
              type="text" 
              name="title" 
              value={formState.title || ''} 
              onChange={handleChange} 
              placeholder="What are you working on?" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" 
              required 
            />
            <button 
              type="button" 
              onClick={handleStartTimer} 
              title="Start Timer" 
              className="flex-shrink-0 flex items-center gap-2 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <PlayIcon className="h-5 w-5" />
            </button>
          </div>
          
          <textarea 
            name="description" 
            value={formState.description || ''} 
            onChange={handleChange} 
            placeholder="Add a description..." 
            rows="3" 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          ></textarea>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={formState.category || categories[0]?.id}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                name="priority"
                value={formState.priority || priorities[0]?.id}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {priorities.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input 
                type="time" 
                name="startTime" 
                value={formState.startTime || ''} 
                onChange={handleChange} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input 
                type="time" 
                name="endTime" 
                value={formState.endTime || ''} 
                onChange={handleChange} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                required 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(formState.tags || []).map(tag => (
                <span 
                  key={tag} 
                  className="flex items-center bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-sm"
                >
                  {tag}
                  <button 
                    type="button" 
                    onClick={() => handleTagChange(tag)} 
                    className="ml-1 text-indigo-500 hover:text-indigo-700"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newTag} 
                onChange={(e) => setNewTag(e.target.value)} 
                placeholder="Add new tag" 
                className="flex-grow p-2 border border-gray-300 rounded-lg"
              />
              <button 
                type="button" 
                onClick={handleAddTag} 
                className="px-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
              >
                Add
              </button>
            </div>
            
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.filter(tag => !(formState.tags || []).includes(tag)).map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagChange(tag)}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 flex justify-end items-center gap-3 rounded-b-2xl">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">Cancel</button>
          <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm">{task ? 'Update Task' : 'Save Task'}</button>
        </div>
      </form>
    </Modal>
  );
};

// --- Helper Functions ---
export default WorkLog;

