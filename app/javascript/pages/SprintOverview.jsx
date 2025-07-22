import React, { useState, useEffect } from 'react';
import { SchedulerAPI, getUsers } from '../components/api';
import { Toaster, toast } from 'react-hot-toast';
import SpinnerOverlay from '../components/ui/SpinnerOverlay';
import { FiX } from 'react-icons/fi';
import { CalendarDaysIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const mapTask = (t) => ({
    id: t.task_id,
    dbId: t.id,
    sprintId: t.sprint_id,
    title: t.title || 'title not added',
    description: t.description || '',
    link: t.task_url,
    estimatedHours: t.estimated_hours,
    status: t.status === 'completed' ? 'Completed' : t.status === 'inprogress' ? 'In Progress' : 'To Do',
    assignedTo: [t.developer_id].filter(Boolean).map(String),
    assignedUser: t.assigned_to_user,
    order: t.order,
    startDate: t.start_date || t.date,
    endDate: t.end_date || t.due_date || t.date,
});

// Task Details Modal Component
const TaskDetailsModal = ({ task, developers, users, sprints, onClose, onUpdate, onDelete }) => {
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

  const handleUserChange = (e) => {
    setEditedTask(prev => ({ ...prev, assignedUser: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(editedTask);
  };

  return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="relative bg-white rounded-xl shadow-2xl p-8 w-full max-w-4xl transform transition-all scale-100 opacity-100 overflow-y-auto max-h-[80vh]">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                    <FiX className="w-5 h-5" />
                </button>
                <h2 className="text-3xl font-bold text-indigo-700 mb-6 text-center">Task Details</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
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
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="To Do">To Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                            <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700 mb-1">
                                Task Title
                            </label>
                            <textarea
                                id="taskTitle"
                                name="title"
                                value={editedTask.title}
                                onChange={handleChange}
                                rows="3"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            ></textarea>
                        </div>
                        {/* <div className="md:col-span-2 lg:col-span-3">
                            <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                id="taskDescription"
                                name="description"
                                value={editedTask.description}
                                onChange={handleChange}
                                rows="2"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            ></textarea>
                        </div> */}
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
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
                                Assigned To Developer
                            </label>
                            <select
                                id="assignedTo"
                                name="assignedTo"
                                value={editedTask.assignedTo}
                                onChange={handleDeveloperChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                Assigned User
                            </label>
                            <select
                                id="assignedUser"
                                name="assignedUser"
                                value={editedTask.assignedUser || ''}
                                onChange={handleUserChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Select user</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.first_name ? `${u.first_name}` : u.email}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="sprintId" className="block text-sm font-medium text-gray-700 mb-1">
                                Sprint
                            </label>
                            <select
                                id="sprintId"
                                name="sprintId"
                                value={editedTask.sprintId || ''}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Unassigned</option>
                                {sprints.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                id="startDate"
                                name="startDate"
                                value={editedTask.startDate}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                id="endDate"
                                name="endDate"
                                value={editedTask.endDate}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <button
                            type="button"
                            onClick={() => onDelete(task.dbId)}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition duration-200 ease-in-out shadow-md"
                        >
                            Delete Task
                        </button>
                        <div className="space-x-4">
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
                    </div>
                </form>
            </div>
        </div>
    );
};

// Add Task Modal Component
const AddTaskModal = ({ developers, users, onClose, onCreate }) => {
    const [newTask, setNewTask] = useState({
        task_id: '',
        task_url: '',
        status: 'todo',
        title: '',
        description: '',
        estimated_hours: '',
        developer_id: developers[0]?.id || '',
        assigned_to_user: '',
        start_date: '',
        end_date: '',
        order: ''
    });

    useEffect(() => {
        setNewTask(t => ({ ...t, developer_id: developers[0]?.id || '' }));
    }, [developers]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewTask(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreate(newTask);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="relative bg-white rounded-xl shadow-2xl p-8 w-full max-w-4xl transform transition-all scale-100 opacity-100 overflow-y-auto max-h-[80vh]">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                    <FiX className="w-5 h-5" />
                </button>
                <h2 className="text-3xl font-bold text-indigo-700 mb-6 text-center">Add Task</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        <div>
                            <label htmlFor="task_id" className="block text-sm font-medium text-gray-700 mb-1">
                                Task ID
                            </label>
                            <input
                                type="text"
                                id="task_id"
                                name="task_id"
                                value={newTask.task_id}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="task_url" className="block text-sm font-medium text-gray-700 mb-1">
                                Task Link
                            </label>
                            <input
                                type="url"
                                id="task_url"
                                name="task_url"
                                value={newTask.task_url}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                id="status"
                                name="status"
                                value={newTask.status}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="todo">To Do</option>
                                <option value="inprogress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                Task Title
                            </label>
                            <textarea
                                id="title"
                                name="title"
                                value={newTask.title}
                                onChange={handleChange}
                                rows="3"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            ></textarea>
                        </div>
                        {/* <div className="md:col-span-2 lg:col-span-3">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={newTask.description}
                                onChange={handleChange}
                                rows="2"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            ></textarea>
                        </div> */}
                        <div>
                            <label htmlFor="estimated_hours" className="block text-sm font-medium text-gray-700 mb-1">
                                Estimated Hours
                            </label>
                            <input
                                type="number"
                                id="estimated_hours"
                                name="estimated_hours"
                                value={newTask.estimated_hours}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="developer_id" className="block text-sm font-medium text-gray-700 mb-1">
                                Assigned To Developer
                            </label>
                            <select
                                id="developer_id"
                                name="developer_id"
                                value={newTask.developer_id}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {developers.map(dev => (
                                    <option key={dev.id} value={dev.id}>
                                        {dev.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="assigned_to_user" className="block text-sm font-medium text-gray-700 mb-1">
                                Assigned User
                            </label>
                            <select
                                id="assigned_to_user"
                                name="assigned_to_user"
                                value={newTask.assigned_to_user}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Select user</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.first_name ? `${u.first_name}` : u.email}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                id="start_date"
                                name="start_date"
                                value={newTask.start_date}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                id="end_date"
                                name="end_date"
                                value={newTask.end_date}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                value={newTask.order}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                            Create Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Main Component
const SprintOverview = ({ sprintId, onSprintChange }) => {
    const [sprints, setSprints] = useState([]);
    const [developers, setDevelopers] = useState([]);
    const [users, setUsers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [backlogTasks, setBacklogTasks] = useState([]);
    const [selectedSprintId, setSelectedSprintId] = useState(sprintId || null);
    const [filterUsers, setFilterUsers] = useState([]);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (sprintId) setSelectedSprintId(sprintId);
    }, [sprintId]);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingBacklog, setEditingBacklog] = useState(false);
    const [addingToBacklog, setAddingToBacklog] = useState(false);

    const toggleUserFilter = (id) => {
        setFilterUsers(prev =>
            prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
        );
    };

    useEffect(() => {
        SchedulerAPI.getDevelopers().then(res => setDevelopers(res.data));
        getUsers().then(res => setUsers(Array.isArray(res.data) ? res.data : []));
        fetch('/api/sprints.json')
            .then(res => res.json())
            .then(data => {
                setSprints(data);
                if (data.length && !sprintId) {
                    setSelectedSprintId(data[0].id);
                    if(onSprintChange) onSprintChange(data[0].id);
                }
            });
    }, []);

    useEffect(() => {
        if (onSprintChange && selectedSprintId !== null) {
            onSprintChange(selectedSprintId);
        }
    }, [selectedSprintId]);

    useEffect(() => {
        if (selectedSprintId === null) return;
        SchedulerAPI.getTasks({ sprint_id: selectedSprintId }).then(res => {
            const mapped = res.data.map(mapTask);
            setTasks(mapped);
        });
    }, [selectedSprintId]);

    useEffect(() => {
        SchedulerAPI.getTasks().then(res => {
            const mapped = res.data.filter(t => !t.sprint_id).map(mapTask);
            setBacklogTasks(mapped);
        });
    }, []);

    const filteredTasks = tasks.filter(task => {
        if (task.sprintId !== selectedSprintId) return false;
        if (filterUsers.length && !filterUsers.includes(String(task.assignedUser))) return false;
        return true;
    });

    // Group tasks by developer so we can display them together in the table
    const developerMap = developers.reduce((acc, d) => {
        acc[String(d.id)] = d;
        return acc;
    }, {});

    const tasksByDeveloper = filteredTasks.reduce((acc, task) => {
        const devId = task.assignedTo?.[0] ? String(task.assignedTo[0]) : 'unassigned';
        if (!acc[devId]) acc[devId] = [];
        acc[devId].push(task);
        return acc;
    }, {});

    const sortDevelopers = (a, b) => {
        const nameA = developerMap[a]?.name?.toLowerCase() || 'zzzz';
        const nameB = developerMap[b]?.name?.toLowerCase() || 'zzzz';
        if (nameA === 'ankitsir') return -1;
        if (nameB === 'ankitsir') return 1;
        return nameA.localeCompare(nameB);
    };

    const groupedTasks = Object.keys(tasksByDeveloper)
        .sort(sortDevelopers)
        .map(devId => {
            const taskList = tasksByDeveloper[devId].sort((a, b) => (a.order || 0) - (b.order || 0));
            const totalHours = taskList.reduce((sum, t) => sum + (parseFloat(t.estimatedHours) || 0), 0);
            return {
                developer: developerMap[devId],
                devId,
                tasks: taskList,
                totalHours
            };
        });

    const filteredBacklogTasks = backlogTasks.filter(task => {
        if (filterUsers.length && !filterUsers.includes(String(task.assignedUser))) return false;
        return true;
    });

    const backlogByDeveloper = filteredBacklogTasks.reduce((acc, task) => {
        const devId = task.assignedTo?.[0] ? String(task.assignedTo[0]) : 'unassigned';
        if (!acc[devId]) acc[devId] = [];
        acc[devId].push(task);
        return acc;
    }, {});

    const groupedBacklog = Object.keys(backlogByDeveloper)
        .sort(sortDevelopers)
        .map(devId => {
            const taskList = backlogByDeveloper[devId].sort((a, b) => (a.order || 0) - (b.order || 0));
            const totalHours = taskList.reduce((sum, t) => sum + (parseFloat(t.estimatedHours) || 0), 0);
            return {
                developer: developerMap[devId],
                devId,
                tasks: taskList,
                totalHours
            };
        });

    const getDeveloperNames = (devIds) => devIds.map(id => developers.find(dev => String(dev.id) === String(id))?.name || 'Unknown').join(', ');

    const getUserName = (userId) => {
        const user = users.find(u => String(u.id) === String(userId));
        if (!user) return 'Unknown';
        return user.first_name ? `${user.first_name}` : user.email;
    };

    const currentSprint = sprints.find(s => s.id === selectedSprintId);

    const openTaskModal = (task, backlog = false) => {
        setCurrentTask(task);
        setEditingBacklog(backlog);
        setShowTaskModal(true);
    };

    const onDragEnd = async (result) => {
        if (!result.destination) return;

        const srcDev = result.source.droppableId.replace('dev-', '');
        const dstDev = result.destination.droppableId.replace('dev-', '');

        // Build map of tasks by developer sorted by order so
        // indices from the UI match the underlying arrays
        const map = tasks.reduce((acc, t) => {
            const d = t.assignedTo?.[0] ? String(t.assignedTo[0]) : 'unassigned';
            if (!acc[d]) acc[d] = [];
            acc[d].push({ ...t });
            return acc;
        }, {});
        Object.values(map).forEach(list =>
            list.sort((a, b) => (a.order || 0) - (b.order || 0))
        );

        const sourceList = map[srcDev] || [];
        const [moved] = sourceList.splice(result.source.index, 1);
        moved.assignedTo = dstDev === 'unassigned' ? [] : [dstDev];
        const destList = map[dstDev] || (map[dstDev] = []);
        destList.splice(result.destination.index, 0, moved);

        // Reassign orders
        sourceList.forEach((t, i) => { t.order = i + 1; });
        if (srcDev !== dstDev) destList.forEach((t, i) => { t.order = i + 1; });

        const newTasks = Object.values(map).flat();
        setTasks(newTasks);

        // Persist changes for affected tasks
        const updates = [...sourceList, ...destList];
        await Promise.all(updates.map(t => {
            const devId = t.assignedTo?.[0] ? Number(t.assignedTo[0]) : null;
            return SchedulerAPI.updateTask(t.dbId, { developer_id: devId, order: t.order });
        }));
    };

    const handleUpdateTask = async (updatedTask) => {
        try {
            const payload = {
                task_id: updatedTask.id,
                sprint_id: updatedTask.sprintId ? Number(updatedTask.sprintId) : null,
                title: updatedTask.title,
                description: updatedTask.description,
                start_date: updatedTask.startDate,
                end_date: updatedTask.endDate,
                task_url: updatedTask.link,
                estimated_hours: updatedTask.estimatedHours,
                developer_id: Number(updatedTask.assignedTo?.[0]) || null,
                assigned_to_user: updatedTask.assignedUser || null,
                status: updatedTask.status?.toLowerCase().replace(" ", "") || "todo",
                order: updatedTask.order
            };
            await SchedulerAPI.updateTask(updatedTask.dbId, payload);

            const mapped = { ...updatedTask, sprintId: payload.sprint_id, id: payload.task_id };

            if (payload.sprint_id === null) {
                setTasks(tasks.filter(t => t.dbId !== updatedTask.dbId));
                setBacklogTasks(prev => {
                    const others = prev.filter(t => t.dbId !== updatedTask.dbId);
                    return [...others, mapped];
                });
            } else if (payload.sprint_id === selectedSprintId) {
                setBacklogTasks(prev => prev.filter(t => t.dbId !== updatedTask.dbId));
                setTasks(prev => {
                    const others = prev.filter(t => t.dbId !== updatedTask.dbId);
                    return [...others, mapped];
                });
            } else {
                setTasks(prev => prev.filter(t => t.dbId !== updatedTask.dbId));
                setBacklogTasks(prev => prev.filter(t => t.dbId !== updatedTask.dbId));
            }
        } catch (e) {
            console.error("Failed to update task", e);
        }
        setShowTaskModal(false);
    };

    const handleDeleteTask = async (dbId) => {
        try {
            await SchedulerAPI.deleteTask(dbId);
            if (editingBacklog) {
                setBacklogTasks(backlogTasks.filter(t => t.dbId !== dbId));
            } else {
                setTasks(tasks.filter(t => t.dbId !== dbId));
            }
        } catch (e) {
            console.error('Failed to delete task', e);
        }
        setShowTaskModal(false);
    };
    const handleAddTask = async (newTask) => {
        try {
            const payload = {
                ...newTask,
                type: 'Code',
                sprint_id: addingToBacklog ? null : selectedSprintId,
                developer_id: Number(newTask.developer_id) || null,
                assigned_to_user: newTask.assigned_to_user || null,
                status: newTask.status,
                date: newTask.start_date || new Date().toISOString().slice(0,10)
            };
            const { data } = await SchedulerAPI.createTask(payload);
            const mapped = mapTask(data);
            if (addingToBacklog) {
                setBacklogTasks([...backlogTasks, mapped]);
            } else {
                setTasks([...tasks, mapped]);
            }
        } catch (e) {
            console.error('Failed to add task', e);
        }
        setShowAddModal(false);
    };

    const handleImport = async () => {
        if (!selectedSprintId) return;
        try {
            setProcessing(true);
            await SchedulerAPI.importSprintTasks(selectedSprintId);
            toast.success('Imported tasks from sheet');
        } catch (e) {
            toast.error('Import failed');
        }
        setProcessing(false);
    };

    const handleBacklogImport = async () => {
        try {
            setProcessing(true);
            await SchedulerAPI.importBacklogTasks();
            toast.success('Imported backlog from sheet');
            const res = await SchedulerAPI.getTasks();
            const mapped = res.data.filter(t => !t.sprint_id).map(mapTask);
            setBacklogTasks(mapped);
        } catch (e) {
            toast.error('Import failed');
        }
        setProcessing(false);
    };

    const handleExport = async () => {
        if (!selectedSprintId) return;
        try {
            setProcessing(true);
            await SchedulerAPI.exportSprintTasks(selectedSprintId);
            toast.success('Exported tasks to sheet');
        } catch (e) {
            toast.error('Export failed');
        }
        setProcessing(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-100 p-8 font-sans text-gray-800">
            <Toaster position="top-right" />
            {processing && <SpinnerOverlay />}
            <div className="max-w-8xl mx-auto bg-white rounded-xl shadow-lg p-4">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500 flex items-center">
                            <CalendarDaysIcon className="h-7 w-7 mr-2"/>Sprint Task Manager
                        </h1>
                        <div className="flex flex-wrap items-center space-x-2">
                            {users.map(u => (
                                <div
                                    key={u.id}
                                    onClick={() => toggleUserFilter(String(u.id))}
                                    className={`cursor-pointer w-8 h-8 rounded-full border-2 ${filterUsers.includes(String(u.id)) ? 'border-blue-500' : 'border-transparent'}`}
                                >
                                    {u.profile_picture && u.profile_picture !== 'null' ? (
                                        <img src={u.profile_picture} alt={u.first_name}
                                             className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 text-white text-xs font-bold flex items-center justify-center">
                                            {(u.first_name || u.email).charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => { setAddingToBacklog(false); setShowAddModal(true); }}
                            className="flex items-center bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md"
                        >
                            <PlusCircleIcon className="h-5 w-5 mr-2" />
                            Add Task
                        </button>
                        <button
                            onClick={handleImport}
                            className="flex items-center bg-green-500 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md"
                        >
                            Import from Sheet
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md"
                        >
                            Export to Sheet
                        </button>
                    </div>
                </div>

                {/* Tasks Table */}
                <div className="overflow-x-auto bg-white rounded-xl shadow-md">
                    <DragDropContext onDragEnd={onDragEnd}>
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
                                    Assigned To Developer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Assigned User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Start Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    End Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-xl">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        {groupedTasks.length > 0 ? (
                            groupedTasks.map(group => (
                                <Droppable droppableId={`dev-${group.devId}`} key={group.devId}>
                                    {(provided) => (
                                        <tbody ref={provided.innerRef} {...provided.droppableProps} className="bg-white divide-y divide-gray-200">
                                                <tr className="bg-gray-100">
                                                    <td colSpan="9" className="px-6 py-2 font-semibold text-gray-700">
                                                        {group.developer ? group.developer.name : 'Unassigned'} - Total Est. Hours: {group.totalHours}
                                                    </td>
                                                </tr>
                                                {group.tasks.map((task, idx) => (
                                                    <Draggable key={task.dbId} draggableId={`task-${task.dbId}`} index={idx}>
                                                        {(prov) => (
                                                            <tr ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} className="hover:bg-gray-50 cursor-pointer" onClick={() => openTaskModal(task)}>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                    {task.order}
                                                                </td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-indigo-600 hover:underline">
                                                                    <a href={task.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                                                        {task.id}
                                                                    </a>
                                                                </td>
                                                                <td className="px-6 py-3 whitespace-normal text-sm text-gray-900">
                                                                    {task.title}
                                                                </td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                    {task.estimatedHours}
                                                                </td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                    {getDeveloperNames(task.assignedTo)}
                                                                </td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                    {getUserName(task.assignedUser)}
                                                                </td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                    {new Date(task.startDate).getDate()}
                                                                </td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                    {new Date(task.endDate).getDate()}
                                                                </td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm">
                                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                                        ${task.status === 'Completed' ? 'bg-green-100 text-green-800' : ''}
                                                                        ${task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : ''}
                                                                        ${task.status === 'To Do' ? 'bg-blue-100 text-blue-800' : ''}
                                                                    `}>
                                                                        {task.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </tbody>
                                        )}
                                    </Droppable>
                                ))
                            ) : (
                                <tbody>
                                    <tr>
                                        <td colSpan="9" className="px-6 py-3 text-center text-gray-500">
                                            No tasks found for this sprint.
                                        </td>
                                    </tr>
                                </tbody>
                            )}
                    </table>
                    </DragDropContext>
                </div>
            </div>

            {/* Backlog Tasks */}
            <div className="max-w-8xl mx-auto bg-white rounded-xl shadow-lg p-4 mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500 flex items-center">
                        <CalendarDaysIcon className="h-7 w-7 mr-2"/>Backlog
                    </h1>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => { setAddingToBacklog(true); setShowAddModal(true); }}
                            className="flex items-center bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md"
                        >
                            <PlusCircleIcon className="h-5 w-5 mr-2" />
                            Add Task
                        </button>
                        <button
                            onClick={handleBacklogImport}
                            className="flex items-center bg-green-500 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md"
                        >
                            Import Backlog
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto bg-white rounded-xl shadow-md">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-xl">Order</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Hours</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To Developer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-xl">Status</th>
                            </tr>
                        </thead>
                        {groupedBacklog.length > 0 ? (
                            groupedBacklog.map(group => (
                                <tbody key={group.devId} className="bg-white divide-y divide-gray-200">
                                    <tr className="bg-gray-100">
                                        <td colSpan="9" className="px-6 py-2 font-semibold text-gray-700">
                                            {group.developer ? group.developer.name : 'Unassigned'} - Total Est. Hours: {group.totalHours}
                                        </td>
                                    </tr>
                                    {group.tasks.map(task => (
                                        <tr key={task.dbId} className="hover:bg-gray-50 cursor-pointer" onClick={() => openTaskModal(task, true)}>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{task.order}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-indigo-600 hover:underline">
                                                <a href={task.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{task.id}</a>
                                            </td>
                                            <td className="px-6 py-3 whitespace-normal text-sm text-gray-900">{task.title}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{task.estimatedHours}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{getDeveloperNames(task.assignedTo)}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{getUserName(task.assignedUser)}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{new Date(task.startDate).getDate()}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{new Date(task.endDate).getDate()}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                    ${task.status === 'Completed' ? 'bg-green-100 text-green-800' : ''}
                                                    ${task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : ''}
                                                    ${task.status === 'To Do' ? 'bg-blue-100 text-blue-800' : ''}`}>{task.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            ))
                        ) : (
                            <tbody>
                                <tr>
                                    <td colSpan="9" className="px-6 py-3 text-center text-gray-500">No backlog tasks found.</td>
                                </tr>
                            </tbody>
                        )}
                    </table>
                </div>
            </div>

            {/* Add Task Modal */}
            {showAddModal && (
                <AddTaskModal
                    developers={developers}
                    users={users}
                    onClose={() => setShowAddModal(false)}
                    onCreate={handleAddTask}
                />
            )}

            {/* Task Details Modal */}
            {showTaskModal && currentTask && (
                <TaskDetailsModal
                    task={currentTask}
                    developers={developers}
                    users={users}
                    sprints={sprints}
                    onClose={() => setShowTaskModal(false)}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                />
            )}
        </div>
    );
};

export default SprintOverview;
