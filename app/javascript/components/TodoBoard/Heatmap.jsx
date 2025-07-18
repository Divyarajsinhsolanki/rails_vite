// src/components/Heatmap.js
import React, { useContext } from 'react';
import { format, parseISO } from 'date-fns';
import { getHeatmapData } from '/utils/taskUtils';
import { AuthContext } from '../../context/AuthContext';

const Heatmap = ({ columns, view, onViewChange }) => {
  const { user } = useContext(AuthContext);

  const filteredColumns =
    view === 'my' && user
      ? Object.fromEntries(
          Object.entries(columns).map(([k, col]) => [k, { ...col, items: col.items.filter(t => t.assigned_to_user === user.id) }])
        )
      : columns;

  const data = getHeatmapData(filteredColumns);

  const todayISO = new Date().toISOString().split('T')[0];
  const tasksDueToday = Object.values(filteredColumns)
    .flatMap(col => col.items)
    .filter(t => (t.end_date || t.due) === todayISO);

  return (
    <div className="bg-white p-6 shadow-md rounded-lg">
      <h3 className="font-semibold mb-3">Due Date Heatmap</h3>
      <div className="flex gap-2">
        {data.map((d, i) => (
          <div
            key={i}
            className={`p-4 rounded-lg text-center ${
              d.count === 0 ? 'bg-gray-200' : d.count < 5 ? 'bg-yellow-300' : 'bg-red-500 text-white'
            }`}
          >
            {format(parseISO(d.date), 'EEE')}
            <br />
            {d.count}
          </div>
        ))}
      </div>
      <div className="mt-4">
        <h4 className="font-semibold mb-2">Tasks Due Today</h4>
        {tasksDueToday.length ? (
          <ul className="list-disc pl-5 text-sm">
            {tasksDueToday.map(t => (
              <li key={t.id}>{t.title || t.task_id}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">None</p>
        )}
      </div>
    </div>
  );
};

export default Heatmap;