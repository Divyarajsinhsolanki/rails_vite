// src/components/ProgressPieChart.js
import React from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { getCompletionData } from '/utils/taskUtils';

const ProgressPieChart = ({ columns }) => {
  const data = getCompletionData(columns);

  return (
    <div className="bg-white p-6 shadow-md rounded-lg">
      <h3 className="font-semibold mb-3">Progress Overview</h3>
      <PieChart width={500} height={250}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ name, percent }) => `${name}: ${percent}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </div>
  );
};

export default ProgressPieChart;