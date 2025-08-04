// src/components/Heatmap.js
import React, { useContext, useState, useMemo, useEffect } from 'react';
import { format, parseISO, addDays, differenceInCalendarDays } from 'date-fns';
import { getHeatmapData } from '/utils/taskUtils';
import { AuthContext } from '../../context/AuthContext';
import { FiCalendar, FiAlertTriangle, FiInfo, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Heatmap = ({ columns, view, onViewChange, sprint }) => {
  const { user } = useContext(AuthContext);

  const filteredColumns =
    view === 'my' && user
      ? Object.fromEntries(
          Object.entries(columns).map(([k, col]) => [k, { ...col, items: col.items.filter(t => t.assigned_to_user === user.id) }])
        )
      : columns;

  const weekStarts = useMemo(() => {
    if (!sprint) return [];
    const start = parseISO(sprint.start_date);
    const end = parseISO(sprint.end_date);
    const totalWeeks = Math.ceil((differenceInCalendarDays(end, start) + 1) / 7);
    return Array.from({ length: totalWeeks }, (_, i) => addDays(start, i * 7));
  }, [sprint]);

  const today = useMemo(() => new Date(), []);

  const defaultWeekIndex = useMemo(() => {
    const idx = weekStarts.findIndex(ws => today >= ws && today < addDays(ws, 7));
    return idx === -1 ? 0 : idx;
  }, [weekStarts, today]);

  const [weekIndex, setWeekIndex] = useState(defaultWeekIndex);

  useEffect(() => {
    setWeekIndex(defaultWeekIndex);
  }, [defaultWeekIndex]);

  const currentWeekStart = weekStarts[weekIndex] || today;
  const data = getHeatmapData(filteredColumns, currentWeekStart);

  const [selectedDate, setSelectedDate] = useState(format(today, 'yyyy-MM-dd'));
  useEffect(() => {
    const weekEnd = addDays(currentWeekStart, 6);
    if (today >= currentWeekStart && today <= weekEnd) {
      setSelectedDate(format(today, 'yyyy-MM-dd'));
    } else {
      setSelectedDate(format(currentWeekStart, 'yyyy-MM-dd'));
    }
  }, [currentWeekStart, today]);

  const todayISO = format(today, 'yyyy-MM-dd');
  const tasksDue = Object.values(filteredColumns)
    .flatMap(col => col.items)
    .filter(t => (t.end_date || t.due) === selectedDate);

  const getTooltipText = (count) => {
    if (count === 0) return "No tasks due.";
    if (count === 1) return "1 task due.";
    return `${count} tasks due.`;
  };

  const handlePrev = () => setWeekIndex(i => Math.max(0, i - 1));
  const handleNext = () => setWeekIndex(i => Math.min(weekStarts.length - 1, i + 1));

  return (
    <div className="bg-white p-6 shadow-lg rounded-xl border border-gray-100">
      <div className="flex items-center mb-4">
        <FiCalendar className="text-[var(--theme-color)] mr-3" size={24} />
        <h3 className="text-xl font-bold text-gray-800">Due Date Heatmap</h3>
        {weekStarts.length > 1 && (
          <div className="ml-auto flex gap-2">
            <button
              onClick={handlePrev}
              disabled={weekIndex === 0}
              className="p-1 rounded border disabled:opacity-50"
            >
              <FiChevronLeft />
            </button>
            <button
              onClick={handleNext}
              disabled={weekIndex === weekStarts.length - 1}
              className="p-1 rounded border disabled:opacity-50"
            >
              <FiChevronRight />
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-2 mb-6">
        {data.map((d, i) => {
          const intensity = d.count === 0 ? 'bg-gray-100 text-gray-500'
                          : d.count < 3 ? 'bg-yellow-200 text-yellow-800'
                          : d.count < 6 ? 'bg-orange-300 text-orange-800'
                          : 'bg-red-400 text-white';
          return (
            <div key={i} className="relative group flex-1">
              <div
                onClick={() => setSelectedDate(d.date)}
                className={`p-3 rounded-lg text-center cursor-pointer transition-all transform group-hover:scale-110 ${intensity} ${selectedDate === d.date ? 'ring-2 ring-offset-2 ring-[var(--theme-color)]' : ''}`}
              >
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
          <span>
            Tasks Due {selectedDate === todayISO ? 'Today' : format(parseISO(selectedDate), 'MMM d, yyyy')}
          </span>
        </h4>
        {tasksDue.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {tasksDue.map(t => (
              <li
                key={t.id}
                className={`flex items-center p-2 rounded-md ${
                  t.status && t.status.toLowerCase() === 'completed'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-gray-50'
                }`}
              >
                <FiInfo className="text-[var(--theme-color)] mr-3 shrink-0" />
                <span className="font-semibold">{t.task_id}</span>
                <span className="text-gray-600 mx-2">-</span>
                <span className="truncate">{t.title}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 italic">No tasks due on this day.</p>
        )}
      </div>
    </div>
  );
};

export default Heatmap;