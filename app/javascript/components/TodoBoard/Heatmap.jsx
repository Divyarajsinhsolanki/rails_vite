// src/components/Heatmap.js
import React, { useContext } from 'react';
import { format, parseISO } from 'date-fns';
import { getHeatmapData } from '/utils/taskUtils';
import { AuthContext } from '../../context/AuthContext';
import { FiCalendar, FiAlertTriangle, FiInfo } from 'react-icons/fi';

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

  const getTooltipText = (count) => {
    if (count === 0) return "No tasks due.";
    if (count === 1) return "1 task due.";
    return `${count} tasks due.`;
  };

  return (
    <div className="bg-white p-6 shadow-lg rounded-xl border border-gray-100">
      <div className="flex items-center mb-4">
        <FiCalendar className="text-blue-500 mr-3" size={24} />
        <h3 className="text-xl font-bold text-gray-800">Due Date Heatmap</h3>
      </div>
      
      <div className="flex justify-center gap-2 mb-6">
        {data.map((d, i) => {
          const intensity = d.count === 0 ? 'bg-gray-100 text-gray-500' 
                          : d.count < 3 ? 'bg-yellow-200 text-yellow-800'
                          : d.count < 6 ? 'bg-orange-300 text-orange-800'
                          : 'bg-red-400 text-white';
          return (
            <div key={i} className="relative group flex-1">
              <div className={`p-3 rounded-lg text-center transition-all transform group-hover:scale-110 ${intensity}`}>
                <div className="text-sm font-semibold">{format(parseISO(d.date), 'EEE')}</div>
                <div className="text-2xl font-bold">{d.count}</div>
              </div>
              <div className="absolute bottom-full mb-2 w-max bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none left-1/2 -translate-x-1/2">
                {getTooltipText(d.count)}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-semibold text-gray-700 flex items-center mb-3">
          <FiAlertTriangle className="text-red-500 mr-2" />
          <span>Tasks Due Today</span>
        </h4>
        {tasksDueToday.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {tasksDueToday.map(t => (
              <li key={t.id} className="flex items-center bg-gray-50 p-2 rounded-md">
                <FiInfo className="text-blue-500 mr-3 shrink-0" />
                <span className="font-semibold text-gray-800">{t.task_id}</span>
                <span className="text-gray-600 mx-2">-</span>
                <span className="truncate text-gray-600">{t.title}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 italic">No tasks due today. Kick back and relax!</p>
        )}
      </div>
    </div>
  );
};

export default Heatmap;