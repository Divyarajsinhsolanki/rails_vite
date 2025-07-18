import React, { useState, useEffect } from 'react';
import { CalendarDaysIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import SprintOverview from './SprintOverview';
import Scheduler from '../components/Scheduler/Scheduler';
import TodoBoard from '../components/TodoBoard/TodoBoard';
import SprintManager from '../components/Scheduler/SprintManager';
import Sheet from './Sheet';

const calculateWorkingDays = (start, end) => {
  let count = 0;
  const current = new Date(start);
  const last = new Date(end);
  while (current <= last) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count += 1;
    current.setDate(current.getDate() + 1);
  }
  return count;
};

const formatDateRange = (start, end) => {
  const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} - ${fmt(end)}`;
};

export default function SprintDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sprintId, setSprintId] = useState(null);
  const [sprint, setSprint] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);

  // Load all sprints on mount and select the current one
  useEffect(() => {
    fetch('/api/sprints.json')
      .then(res => res.json())
      .then(data => {
        setSprints(data || []);
        if (data && data.length) {
          const today = new Date();
          const current = data.find(s => {
            const start = new Date(s.start_date);
            const end = new Date(s.end_date);
            return today >= start && today <= end;
          });
          if (current) {
            setSprint(current);
            setSprintId(current.id);
          }
        }
      });
  }, []);

  const isCurrentSprint = (s) => {
    if (!s) return false;
    const today = new Date();
    const start = new Date(s.start_date);
    const end = new Date(s.end_date);
    return today >= start && today <= end;
  };

  const handleSprintChange = (s) => {
    if (typeof s === 'number' || typeof s === 'string') {
      const found = sprints.find(sp => sp.id === Number(s));
      if (found) setSprint(found);
      setSprintId(Number(s));
    } else {
      setSprint(s);
      setSprintId(s?.id || null);
    }
    setIsHeaderExpanded(false);
  };

  const handleImport = async () => {
    if (!sprintId) return;
    try {
      await SchedulerAPI.importSprintTasks(sprintId);
      alert('Imported tasks from sheet');
    } catch (e) {
      alert('Import failed');
    }
  };

  const handleExport = async () => {
    if (!sprintId) return;
    try {
      await SchedulerAPI.exportSprintTasks(sprintId);
      alert('Exported tasks to sheet');
    } catch (e) {
      alert('Export failed');
    }
  };

  return (
    <div className="space-y-6">
      <header className="bg-white shadow-sm p-2">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800 flex items-center">
            <CalendarDaysIcon className="h-7 w-7 mr-2 text-blue-600"/>
            {sprint ? (
              <span className="flex flex-col sm:flex-row sm:items-center">
                <span className="truncate">Sprint: {sprint.name}</span>
                <span className="sm:ml-4 text-xl font-medium text-gray-600">
                  ({formatDateRange(sprint.start_date, sprint.end_date)})
                </span>
                <span className="sm:ml-4 text-xl font-medium text-gray-600">
                  Working Days: {calculateWorkingDays(sprint.start_date, sprint.end_date)}
                </span>
              </span>
            ) : (
              'Sprint Manager'
            )}
          </h1>
          <div
            className="flex items-center space-x-3 cursor-pointer select-none p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
            onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
          >
            {sprint && (
              <p className="text-m text-gray-600">
                {isCurrentSprint(sprint) ? 'Current Sprint:' : 'Selected Sprint:'}{' '}
                <span className="font-semibold text-blue-700">{sprint.name}</span>
              </p>
            )}
            {isHeaderExpanded ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </div>
        <div className={`mt-4 border-t border-gray-200 pt-4 ${isHeaderExpanded ? '' : 'hidden'}`}>
          <SprintManager onSprintChange={handleSprintChange} />
        </div>
      </header>
      {/* Tab Navigation */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex bg-white rounded-full p-1 shadow-md border border-gray-100">
          <button
            className={`px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 ease-in-out
              ${activeTab === 'overview'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'
              }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 ease-in-out ml-2
              ${activeTab === 'scheduler'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'
              }`}
            onClick={() => setActiveTab('scheduler')}
          >
            Scheduler
          </button>
          <button
            className={`px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 ease-in-out ml-2
              ${activeTab === 'todo'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'
              }`}
          onClick={() => setActiveTab('todo')}
        >
          Todo
        </button>
        <button
          className={`px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 ease-in-out ml-2
            ${activeTab === 'sheet'
              ? 'bg-blue-500 text-white shadow-lg'
              : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'
            }`}
          onClick={() => setActiveTab('sheet')}
        >
          Sheet
        </button>
        </div>
        <div className="flex space-x-2 ml-4">
          <button
            onClick={handleImport}
            className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600"
          >
            Import from Sheet
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
          >
            Export to Sheet
          </button>
        </div>
      </div>
      {activeTab === 'overview' && (
        <SprintOverview sprintId={sprintId} onSprintChange={handleSprintChange} />
      )}
      {activeTab === 'scheduler' && (
        <Scheduler sprintId={sprintId} />
      )}
      {activeTab === 'todo' && (
        <TodoBoard sprintId={sprintId} onSprintChange={handleSprintChange} />
      )}
      {activeTab === 'sheet' && (
        <Sheet sheetName={sprint?.name} />
      )}
    </div>
  );
}
