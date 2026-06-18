// src/components/ProgressPieChart.js
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getCompletionData } from '/utils/taskUtils';
import { FiPieChart, FiCheckCircle, FiTrendingUp, FiList } from 'react-icons/fi';

const ProgressPieChart = ({ columns }) => {
  const data = getCompletionData(columns);
  const totalTasks = data.reduce((sum, entry) => sum + entry.value, 0);

  const renderLegend = () => {
    return (
      <div className="mt-6 grid grid-cols-3 gap-3">
        {data.map((entry) => {
          let Icon;
          switch (entry.name) {
            case 'To Do': Icon = FiList; break;
            case 'In Progress': Icon = FiTrendingUp; break;
            case 'Completed': Icon = FiCheckCircle; break;
            default: Icon = FiPieChart;
          }
          return (
            <div key={entry.name} className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-center backdrop-blur">
              <div className="flex items-center justify-center text-sm font-semibold" style={{ color: entry.fill }}>
                <Icon className="mr-2" />
                <span>{entry.name}</span>
              </div>
              <span className="mt-1 block text-2xl font-black text-white">{entry.value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative h-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/75 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl flex flex-col">
      <div className="relative z-10 flex items-center mb-4">
        <FiPieChart className="text-cyan-200 mr-3" size={24} />
        <h3 className="text-xl font-bold text-white">Progress Overview</h3>
      </div>
      <div className="relative w-full flex-grow flex items-center justify-center min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={false}
              innerRadius={60}
              outerRadius={88}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`${value} tasks`, null]}
              contentStyle={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #e0e0e0',
                  borderRadius: '10px',
                  backdropFilter: 'blur(5px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              cursor={{ fill: 'rgba(200, 200, 200, 0.2)' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute text-center pointer-events-none">
          <span className="text-5xl font-black text-white">{totalTasks}</span>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Total Tasks</p>
        </div>
      </div>
      {renderLegend()}
    </div>
  );
};

export default ProgressPieChart;