import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const initialTasks = [
  {
    id: "1",
    taskId: "HME-201983",
    title: "MyForms – Rails 6 Upgrade – Setup – Fax Cover Sheet – Check Module Functionality and Fix if needed",
    assigned: "Ankit",
    working: "Hardik",
    startDate: "2025-07-02",
    status: "todo",
    commits: 11,
    prs: 1,
    hours: 6,
    order: 1,
  },
  {
    id: "2",
    taskId: "HME-201984",
    title: "Implement new login flow",
    assigned: "Nirav",
    working: "Nirav",
    startDate: "2025-07-03",
    status: "inprogress",
    commits: 5,
    prs: 2,
    hours: 4,
    order: 2,
  },
  {
    id: "3",
    taskId: "HME-201985",
    title: "Finalize report generation",
    assigned: "Natvar",
    working: "Natvar",
    startDate: "2025-07-01",
    status: "done",
    commits: 8,
    prs: 1,
    hours: 5,
    order: 3,
  },
];

const statuses = {
  todo: { name: "To Do", color: "border-gray-300" },
  inprogress: { name: "In Progress", color: "border-blue-300" },
  done: { name: "Done", color: "border-green-300" },
};

export default function SprintBoard() {
  const [tasks, setTasks] = useState(initialTasks);
  const [developer, setDeveloper] = useState("");
  const [statusFilter, setStatusFilter] = useState({ todo: true, inprogress: true, done: true });
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const developers = Array.from(new Set(tasks.map(t => t.assigned)));

  const handleDragEnd = result => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    setTasks(prev => {
      const updated = Array.from(prev);
      const [removed] = updated.splice(source.index, 1);
      removed.status = destination.droppableId;
      updated.splice(destination.index, 0, removed);
      return updated;
    });
  };

  const filtered = tasks.filter(t => {
    const devMatch = developer ? (t.assigned === developer || t.working === developer) : true;
    const statusMatch = statusFilter[t.status];
    const startMatch = dateRange.start ? new Date(t.startDate) >= new Date(dateRange.start) : true;
    const endMatch = dateRange.end ? new Date(t.startDate) <= new Date(dateRange.end) : true;
    return devMatch && statusMatch && startMatch && endMatch;
  });

  const tasksByStatus = Object.keys(statuses).reduce((acc, key) => {
    acc[key] = filtered.filter(t => t.status === key);
    return acc;
  }, {});

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Sprint Board</h1>

      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="block text-sm font-medium">Developer</label>
          <select value={developer} onChange={e => setDeveloper(e.target.value)} className="border rounded p-1">
            <option value="">All</option>
            {developers.map(dev => <option key={dev}>{dev}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {Object.entries(statuses).map(([key, s]) => (
            <label key={key} className="flex items-center gap-1 text-sm">
              <input type="checkbox" checked={statusFilter[key]} onChange={e => setStatusFilter(prev => ({ ...prev, [key]: e.target.checked }))} />
              {s.name}
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          <div>
            <label className="block text-sm font-medium">Start</label>
            <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="border rounded p-1" />
          </div>
          <div>
            <label className="block text-sm font-medium">End</label>
            <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="border rounded p-1" />
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(statuses).map(([key, status]) => (
            <Droppable droppableId={key} key={key}>
              {provided => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="bg-gray-50 p-3 rounded min-h-[300px]">
                  <h2 className="font-medium mb-2">{status.name}</h2>
                  {tasksByStatus[key].map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {prov => (
                        <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} className="bg-white border-l-4 mb-2 p-3 rounded shadow-sm" style={{ borderColor: status.color.replace('border-', '') }}>
                          <div className="text-sm font-semibold text-blue-600">{task.taskId}</div>
                          <div className="text-sm font-medium text-gray-800 break-normal">{task.title}</div>
                          <div className="text-xs text-gray-600 mt-1">Assigned: {task.assigned} • Working: {task.working}</div>
                          <div className="text-xs text-gray-600">Start: {task.startDate}</div>
                          <div className="text-xs text-gray-600">Commits: {task.commits} PRs: {task.prs} Hours: {task.hours} Order: {task.order}</div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
