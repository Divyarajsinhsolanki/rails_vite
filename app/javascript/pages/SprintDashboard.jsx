import React, { useState } from 'react';
import SprintOverview from './SprintOverview';
import Scheduler from '../components/Scheduler/Scheduler';
import TodoBoard from '../components/TodoBoard/TodoBoard';
import SprintManager from '../components/Scheduler/SprintManager';

export default function SprintDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sprintId, setSprintId] = useState(null);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center mb-4">Sprint Dashboard</h1>
      <SprintManager onSprintChange={s => setSprintId(s?.id)} />
      <div className="flex justify-center space-x-4 my-4">
        <button className={`px-4 py-2 rounded-md ${activeTab==='overview'?'bg-indigo-600 text-white':'bg-gray-200'}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`px-4 py-2 rounded-md ${activeTab==='scheduler'?'bg-indigo-600 text-white':'bg-gray-200'}`} onClick={() => setActiveTab('scheduler')}>Scheduler</button>
        <button className={`px-4 py-2 rounded-md ${activeTab==='todo'?'bg-indigo-600 text-white':'bg-gray-200'}`} onClick={() => setActiveTab('todo')}>Todo</button>
      </div>
      {activeTab === 'overview' && (
        <SprintOverview sprintId={sprintId} onSprintChange={setSprintId} />
      )}
      {activeTab === 'scheduler' && (
        <Scheduler sprintId={sprintId} />
      )}
      {activeTab === 'todo' && (
        <TodoBoard sprintId={sprintId} onSprintChange={setSprintId} />
      )}
    </div>
  );
}
