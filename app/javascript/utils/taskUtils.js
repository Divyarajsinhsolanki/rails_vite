// src/utils/taskUtils.js
import { startOfWeek, addDays, format, parseISO } from 'date-fns';

const COLORS = ['#34d399', '#facc15', '#60a5fa'];

export function getCompletionData(columns) {
  const total = Object.values(columns).reduce((sum, col) => sum + col.items.length, 0);
  return Object.entries(columns).map(([key, col], i) => ({
    name: col.name,
    value: col.items.length,
    fill: COLORS[i % COLORS.length],
    percent: total ? Math.round((col.items.length / total) * 100) : 0,
  }));
}

export function getHeatmapData(columns) {
  const today = startOfWeek(new Date(), { weekStartsOn: 1 });
  const week = Array.from({ length: 7 }, (_, i) => format(addDays(today, i), 'yyyy-MM-dd'));
  const counts = Object.values(columns).flatMap((col) => col.items.map((t) => t.due)).filter(Boolean);
  return week.map((day) => ({
    date: day,
    count: counts.filter((d) => d === day).length,
  }));
}

export const getDueColor = (due) => {
    if (!due) return "";
    const today = new Date().toISOString().split("T")[0];
    return due < today ? "text-red-600" : due === today ? "text-green-600" : "text-gray-500";
};