// src/components/Heatmap.js
import React from 'react';
import { format, parseISO } from 'date-fns';
import { getHeatmapData } from '/utils/taskUtils';

const Heatmap = ({ columns }) => {
  const data = getHeatmapData(columns);

  return (
    <div className="bg-white p-6 shadow-md rounded-lg">
      <h3 className="font-semibold mb-3">Due Date Heatmap</h3>
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