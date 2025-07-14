import React, { useState } from 'react';
import { CalendarDaysIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import SprintOverview from './SprintOverview';
import Scheduler from '../components/Scheduler/Scheduler';
import TodoBoard from '../components/TodoBoard/TodoBoard';
import SprintManager from '../components/Scheduler/SprintManager';

export default function SprintDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sprintId, setSprintId] = useState(null);
  const [sprint, setSprint] = useState(null);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);

  const handleSprintChange = (s) => {
    setSprint(s);
    setSprintId(s?.id || null);
  };

  return (
    <div className="space-y-6">
      <header className="bg-white shadow-sm p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <CalendarDaysIcon className="h-7 w-7 mr-2 text-blue-600"/>
            Sprint Task Manager
          </h1>
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}>
            {sprint && (
              <p className="text-sm text-gray-600">
                Current Sprint: <span className="font-semibold">{sprint.name}</span>
              </p>
            )}
            {isHeaderExpanded ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </div>
        {isHeaderExpanded && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <SprintManager onSprintChange={handleSprintChange} />
          </div>
        )}
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
