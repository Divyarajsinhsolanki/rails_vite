import React, { useState, useEffect } from 'react';
import { CalendarDaysIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import SprintOverview from './SprintOverview';
import Scheduler from '../components/Scheduler/Scheduler';
import TodoBoard from '../components/TodoBoard/TodoBoard';
import SprintManager from '../components/Scheduler/SprintManager';

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

  return (
    <div className="space-y-6">
      <header className="bg-white shadow-sm p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800 flex items-center">
            <CalendarDaysIcon className="h-7 w-7 mr-2 text-blue-600"/>
            {sprint ? `Sprint: ${sprint.name} ${formatDateRange(sprint.start_date, sprint.end_date)} Working Days: ${calculateWorkingDays(sprint.start_date, sprint.end_date)}` : 'Sprint Manager'}
          </h1>
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}>
            {sprint && (
              <p className="text-sm text-gray-600">
                {isCurrentSprint(sprint) ? 'Current Sprint:' : 'Selected Sprint:'}{' '}
                <span className="font-semibold">{sprint.name}</span>
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
      <div className="flex justify-center space-x-4 my-4">
        <button className={`px-4 py-2 rounded-md ${activeTab==='overview'?'bg-indigo-600 text-white':'bg-gray-200'}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`px-4 py-2 rounded-md ${activeTab==='scheduler'?'bg-indigo-600 text-white':'bg-gray-200'}`} onClick={() => setActiveTab('scheduler')}>Scheduler</button>
        <button className={`px-4 py-2 rounded-md ${activeTab==='todo'?'bg-indigo-600 text-white':'bg-gray-200'}`} onClick={() => setActiveTab('todo')}>Todo</button>
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
    </div>
  );
}
