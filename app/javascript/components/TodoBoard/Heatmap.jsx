// src/components/Heatmap.js
import React, { useContext, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { getHeatmapData } from '/utils/taskUtils';
import { AuthContext } from '../../context/AuthContext';

const Heatmap = ({ columns }) => {
  const { user } = useContext(AuthContext);
  const [view, setView] = useState('all');

  const filteredColumns =
    view === 'my' && user
      ? Object.fromEntries(
          Object.entries(columns).map(([k, col]) => [k, { ...col, items: col.items.filter(t => t.assigned_to_user === user.id) }])
        )
      : columns;

  const data = getHeatmapData(filteredColumns);

  return (
    <div className="bg-white p-6 shadow-md rounded-lg">
      <h3 className="font-semibold mb-3">Due Date Heatmap</h3>
      <div className="mb-3 flex space-x-2">
        <button
          className={`px-3 py-1 rounded-md text-sm font-medium ${
            view === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
          onClick={() => setView('all')}
        >
          All Tasks
        </button>
        <button
          className={`px-3 py-1 rounded-md text-sm font-medium ${
            view === 'my' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
          onClick={() => setView('my')}
        >
          My Tasks
        </button>
      </div>
      <div className="flex gap-2">
        {data.map((d, i) => (
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
  );
};

export default Heatmap;