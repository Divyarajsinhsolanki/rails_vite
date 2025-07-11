import React, { useState, useEffect } from 'react';
import { SchedulerAPI } from '../components/api';

// Helper to calculate working days between two dates excluding weekends
const calculateWorkingDays = (start, end) => {
  let count = 0;
  const current = new Date(start);
  const last = new Date(end);
  while (current <= last) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count += 1; // exclude Sunday(0) and Saturday(6)
    current.setDate(current.getDate() + 1);
  }
  return count;
};

// Task Details Modal Component
const TaskDetailsModal = ({ task, developers, onClose, onUpdate }) => {
  const [editedTask, setEditedTask] = useState({ ...task });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedTask(prev => ({ ...prev, [name]: value }));
  };

  const handleDeveloperChange = (e) => {
    const { options } = e.target;
    const selectedDevIds = Array.from(options)
      .filter(option => option.selected)
      .map(option => option.value);
    setEditedTask(prev => ({ ...prev, assignedTo: selectedDevIds }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(editedTask);
  };

  return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl transform transition-all scale-100 opacity-100">
                <h2 className="text-3xl font-bold text-indigo-700 mb-6 text-center">Task Details</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label htmlFor="taskId" className="block text-sm font-medium text-gray-700 mb-1">
                                Task ID
                            </label>
                            <input
                                type="text"
                                id="taskId"
                                name="id"
                                value={editedTask.id}
                                onChange={handleChange}
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                readOnly
                            />
                        </div>
                        <div>
                            <label htmlFor="taskLink" className="block text-sm font-medium text-gray-700 mb-1">
                                Task Link
                            </label>
                            <input
                                type="url"
                                id="taskLink"
                                name="link"
                                value={editedTask.link}
                                onChange={handleChange}
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="col-span-2">
                            <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700 mb-1">
                                Task Title
                            </label>
                            <textarea
                                id="taskTitle"
                                name="title"
                                value={editedTask.title}
                                onChange={handleChange}
                                rows="2"
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            ></textarea>
                        </div>
                        <div className="col-span-2">
                            <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                id="taskDescription"
                                name="description"
                                value={editedTask.description}
                                onChange={handleChange}
                                rows="5"
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            ></textarea>
                        </div>
                        <div>
                            <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700 mb-1">
                                Estimated Hours
                            </label>
                            <input
                                type="number"
                                id="estimatedHours"
                                name="estimatedHours"
                                value={editedTask.estimatedHours}
                                onChange={handleChange}
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                id="status"
                                name="status"
                                value={editedTask.status}
                                onChange={handleChange}
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="To Do">To Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Done">Done</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
                                Assigned To Developer
                            </label>
                            <select
                                id="assignedTo"
                                name="assignedTo"
                                multiple
                                value={editedTask.assignedTo}
                                onChange={handleDeveloperChange}
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-24"
                            >
                                {developers.map(dev => (
                                    <option key={dev.id} value={dev.id}>
                                        {dev.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="assignedUser" className="block text-sm font-medium text-gray-700 mb-1">
                                Assigned User ID
                            </label>
                            <input
                                type="number"
                                id="assignedUser"
                                name="assignedUser"
                                value={editedTask.assignedUser || ''}
                                onChange={handleChange}
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="scheduledStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                                Scheduled Start Date
                            </label>
                            <input
                                type="date"
                                id="scheduledStartDate"
                                name="scheduledStartDate"
                                value={editedTask.scheduledStartDate}
                                onChange={handleChange}
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="scheduledEndDate" className="block text-sm font-medium text-gray-700 mb-1">
                                Scheduled End Date
                            </label>
                            <input
                                type="date"
                                id="scheduledEndDate"
                                name="scheduledEndDate"
                                value={editedTask.scheduledEndDate}
                                onChange={handleChange}
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-1">
                                Order
                            </label>
                            <input
                                type="number"
                                id="order"
                                name="order"
                                value={editedTask.order}
                                onChange={handleChange}
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition duration-200 ease-in-out shadow-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition duration-200 ease-in-out shadow-md"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Main Component
const SprintDashboard = () => {
    const [sprints, setSprints] = useState([]);
    const [developers, setDevelopers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [selectedSprintId, setSelectedSprintId] = useState(null);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);

    useEffect(() => {
        SchedulerAPI.getDevelopers().then(res => setDevelopers(res.data));
        SchedulerAPI.getTasks().then(res => {
            const mapped = res.data.map(t => ({
                id: t.task_id,
                dbId: t.id,
                sprintId: t.sprint_id,
                title: `${t.type}`,
                description: '',
                link: t.task_url,
                estimatedHours: t.estimated_hours,
                status: t.status === 'done' ? 'Done' : t.status === 'inprogress' ? 'In Progress' : 'To Do',
                assignedTo: [t.developer_id].filter(Boolean).map(String),
                assignedUser: t.assigned_to_user,
                assignedDeveloper: t.assigned_to_developer,
                order: t.order,
                scheduledStartDate: t.date,
                scheduledEndDate: t.due_date || t.date,
            }));
            setTasks(mapped);
        });
        fetch('/api/sprints.json')
            .then(res => res.json())
            .then(data => {
                setSprints(data);
                if (data.length) setSelectedSprintId(data[0].id);
            });
    }, []);

    const filteredTasks = tasks.filter(task => task.sprintId === selectedSprintId);

    const getDeveloperNames = (devIds) => devIds.map(id => developers.find(dev => String(dev.id) === String(id))?.name || 'Unknown').join(', ');

    const currentSprint = sprints.find(s => s.id === selectedSprintId);
    const workingDays = currentSprint ? calculateWorkingDays(currentSprint.start_date, currentSprint.end_date) : 0;

    const openTaskModal = (task) => {
        setCurrentTask(task);
        setShowTaskModal(true);
    };

    const handleUpdateTask = (updatedTask) => {
        setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
        setShowTaskModal(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8 font-sans text-gray-800">
            <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-8">
                <h1 className="text-4xl font-extrabold text-center text-indigo-700 mb-10">
                    Sprint Management Dashboard
                </h1>

                {/* Sprint Selector */}
                <div className="mb-8 flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4">
                    <label htmlFor="sprint-select" className="text-lg font-semibold text-gray-700">
                        Select Sprint:
                    </label>
                    <select
                        id="sprint-select"
                        className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                        value={selectedSprintId || ''}
                        onChange={(e) => setSelectedSprintId(Number(e.target.value))}
                    >
                        {sprints.map((sprint) => (
                            <option key={sprint.id} value={sprint.id}>
                                {sprint.name} ({sprint.start_date} to {sprint.end_date})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Current Sprint Overview */}
                {selectedSprintId && (
                    <div className="bg-indigo-50 p-6 rounded-xl shadow-inner mb-8">
                        <h2 className="text-2xl font-bold text-indigo-800 mb-4">
                            Current Sprint: {sprints.find(s => s.id === selectedSprintId)?.name}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-lg">
                            <p>
                                <span className="font-semibold">Start Date:</span>{' '}
                                {currentSprint?.start_date}
                            </p>
                            <p>
                                <span className="font-semibold">End Date:</span>{' '}
                                {currentSprint?.end_date}
                            </p>
                            <p>
                                <span className="font-semibold">Working Days:</span>{' '}
                                {workingDays}
                            </p>
                        </div>
                    </div>
                )}

                {/* Tasks Table */}
                <div className="overflow-x-auto bg-white rounded-xl shadow-md">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-xl">
                                    Order
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Task ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Task Title
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Est. Hours
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Assigned To
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Scheduled Start
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Scheduled End
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-xl">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTasks.length > 0 ? (
                                filteredTasks.map((task) => (
                                    <tr key={task.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openTaskModal(task)}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {task.order}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 hover:underline">
                                            <a href={task.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                                {task.id}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 whitespace-normal text-sm text-gray-900">
                                            {task.title}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {task.estimatedHours}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {getDeveloperNames(task.assignedTo)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(task.scheduledStartDate).getDate()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(task.scheduledEndDate).getDate()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                ${task.status === 'Done' ? 'bg-green-100 text-green-800' : ''}
                                                ${task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : ''}
                                                ${task.status === 'To Do' ? 'bg-blue-100 text-blue-800' : ''}
                                            `}>
                                                {task.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                                        No tasks found for this sprint.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Task Details Modal */}
            {showTaskModal && currentTask && (
                <TaskDetailsModal
                    task={currentTask}
                    developers={developers}
                    onClose={() => setShowTaskModal(false)}
                    onUpdate={handleUpdateTask}
                />
            )}
        </div>
    );
};

export default SprintDashboard;
