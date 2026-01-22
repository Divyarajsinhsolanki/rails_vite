import React, { useEffect, useState, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchProjects, createProject, updateProject, deleteProject, addProjectUser, updateProjectUser, deleteProjectUser, leaveProject, SchedulerAPI } from "../components/api";
import UserMultiSelect from "../components/UserMultiSelect";
import { AuthContext } from "../context/AuthContext";
import {
    FiPlus, FiEdit2, FiTrash2, FiUsers, FiSearch, FiUserPlus,
    FiChevronRight, FiX, FiCheck, FiInfo, FiLoader, FiCalendar,
    FiLink, FiFolder, FiAlertTriangle, FiTrendingUp, FiActivity,
    FiCheckCircle, FiXCircle
} from 'react-icons/fi';

// --- Premium UI Components ---

const Avatar = ({ name, src, size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: "w-7 h-7 text-xs",
        md: "w-9 h-9 text-sm",
        lg: "w-11 h-11 text-base",
        xl: "w-14 h-14 text-lg",
    };
    const currentSizeClass = sizeClasses[size] || sizeClasses.md;

    if (src && src !== 'null') {
        return (
            <img
                src={src}
                alt={`${name} 's avatar`}
                className={`rounded-full object-cover ring-2 ring-white dark:ring-zinc-800 shadow-sm ${currentSizeClass} ${className}`}
            />
        );
    }
    const initial = name ? name.charAt(0).toUpperCase() : "?";
    const colors = [
        'bg-gradient-to-br from-violet-400 to-violet-600',
        'bg-gradient-to-br from-blue-400 to-blue-600',
        'bg-gradient-to-br from-emerald-400 to-emerald-600',
        'bg-gradient-to-br from-amber-400 to-amber-600',
        'bg-gradient-to-br from-rose-400 to-rose-600',
    ];
    const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;

    return (
        <div className={`rounded-full ${colors[colorIndex]} text-white flex items-center justify-center font-bold ring-2 ring-white dark:ring-zinc-800 shadow-sm ${currentSizeClass} ${className}`}>
            {initial}
        </div>
    );
};

const AvatarStack = ({ members, max = 4 }) => {
    const visible = members.slice(0, max);
    const remaining = members.length - max;
    return (
        <div className="flex items-center -space-x-2">
            {visible.map((member, i) => (
                <motion.div
                    key={member.id || i}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative hover:z-10 hover:scale-110 transition-transform"
                >
                    <Avatar name={member.name} src={member.profile_picture} size="md" />
                </motion.div>
            ))}
            {remaining > 0 && (
                <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-semibold flex items-center justify-center ring-2 ring-white dark:ring-zinc-800">
                    +{remaining}
                </div>
            )}
        </div>
    );
};

const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
    const sizeClasses = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.4 }}
                        className={`relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full ${sizeClasses[size]} overflow-hidden`}
                    >
                        <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h3>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 max-h-[60vh] overflow-y-auto">{children}</div>
                        {footer && (
                            <div className="flex items-center justify-end gap-3 p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const Notification = ({ message, type, onClose }) => {
    const styles = {
        success: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300",
        error: "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300",
        info: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300",
    };
    const icons = { success: <FiCheck className="w-5 h-5" />, error: <FiX className="w-5 h-5" />, info: <FiInfo className="w-5 h-5" /> };
    return (
        <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${styles[type]}`}
        >
            {icons[type]}
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><FiX className="w-4 h-4" /></button>
        </motion.div>
    );
};


// Helper constants & components

const INITIAL_TASK_STATS = {
    todo: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    nextDueDate: null,
    total: 0,
};

const ProjectHealthCard = ({ stats, loading, error }) => {
    const formatDueDate = (dueDate) => {
        if (!dueDate) return null;
        const date = new Date(dueDate);
        if (Number.isNaN(date.getTime())) return null;
        return date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const completionPercentage = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
    const segments = [
        { key: "todo", label: "To do", value: stats.todo, color: "bg-slate-300" },
        { key: "inProgress", label: "In progress", value: stats.inProgress, color: "bg-sky-400" },
        { key: "completed", label: "Completed", value: stats.completed, color: "bg-emerald-400" },
    ];

    const healthState = (() => {
        if (!stats.total) {
            return {
                label: "Awaiting activity",
                badgeClass: "bg-slate-100 text-slate-600",
                icon: <FiInfo className="h-4 w-4" />,
            };
        }

        if (stats.overdue > 0) {
            return {
                label: "At risk",
                badgeClass: "bg-red-100 text-red-700 border border-red-200",
                icon: <FiAlertTriangle className="h-4 w-4" />,
            };
        }

        if (completionPercentage >= 75) {
            return {
                label: "On track",
                badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
                icon: <FiTrendingUp className="h-4 w-4" />,
            };
        }

        return {
            label: "Monitor",
            badgeClass: "bg-sky-100 text-sky-700 border border-sky-200",
            icon: <FiActivity className="h-4 w-4" />,
        };
    })();

    return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--theme-color)] via-sky-400 to-blue-500" />
            <div className="relative p-6 space-y-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Project Health</p>
                        <h3 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-slate-900">
                            <FiActivity className="text-[var(--theme-color)]" />
                            Health Overview
                        </h3>
                    </div>
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${healthState.badgeClass}`}>
                        {healthState.icon}
                        {healthState.label}
                    </span>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-10 text-slate-500">
                        <FiLoader className="animate-spin text-2xl text-[var(--theme-color)]" />
                        <p className="text-sm">Fetching the latest tasks…</p>
                    </div>
                ) : error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
                        Unable to load project health right now. Please try again later.
                    </div>
                ) : stats.total === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                        No tasks found for this project yet. Start by creating a task to visualise the project health.
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <div className="flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Overall progress</p>
                                    <p className="text-4xl font-semibold text-slate-900">{completionPercentage}%</p>
                                </div>
                                <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                    {stats.total} tasks tracked
                                </span>
                            </div>
                            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                                <div className="flex h-full w-full">
                                    {segments.map((segment) =>
                                        segment.value > 0 ? (
                                            <div
                                                key={segment.key}
                                                className={`${segment.color} h-full transition-all duration-500`}
                                                style={{ width: `${(segment.value / stats.total) * 100}%` }}
                                            />
                                        ) : null
                                    )}
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                                {segments.map((segment) => (
                                    <span key={segment.key} className="inline-flex items-center gap-2">
                                        <span className={`h-2.5 w-2.5 rounded-full ${segment.color}`} />
                                        {segment.label}: <span className="font-semibold text-slate-700">{segment.value}</span>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="rounded-xl border border-slate-200 bg-white/60 p-4 shadow-sm">
                                <p className="text-xs uppercase tracking-wide text-slate-500">Active tasks</p>
                                <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.todo + stats.inProgress}</p>
                                <p className="text-xs text-slate-500">Across to-do and in-progress stages.</p>
                            </div>
                            <div
                                className={`flex items-center gap-3 rounded-xl border p-4 shadow-sm ${stats.overdue > 0
                                    ? "border-red-200 bg-red-50"
                                    : "border-emerald-200 bg-emerald-50"
                                    }`}
                            >
                                <FiXCircle
                                    className={`h-6 w-6 ${stats.overdue > 0 ? "text-red-500" : "text-emerald-500"}`}
                                />
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Overdue tasks</p>
                                    <p
                                        className={`text-2xl font-semibold ${stats.overdue > 0 ? "text-red-600" : "text-emerald-600"
                                            }`}
                                    >
                                        {stats.overdue}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {stats.overdue > 0 ? "Requires attention" : "All deadlines on track"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                            <FiCalendar className="h-6 w-6 text-[var(--theme-color)]" />
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500">Next due date</p>
                                <p className="text-base font-semibold text-slate-900">
                                    {formatDueDate(stats.nextDueDate) || "No upcoming deadlines"}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main Projects Component ---

const WORKLOAD_STATUSES = ["free", "partial", "full", "overloaded"];

const Projects = () => {
    const { user } = useContext(AuthContext);
    const canEdit = user?.roles?.some((r) => ["owner", "project_manager"].includes(r.name));
    const canManageMembers = user?.roles?.some((r) => r.name === "admin");

    // State Management
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false); // For form submission loading
    const [searchQuery, setSearchQuery] = useState("");
    const [projectTasks, setProjectTasks] = useState([]);
    const [projectTaskStats, setProjectTaskStats] = useState(() => ({ ...INITIAL_TASK_STATS }));
    const [isProjectTasksLoading, setIsProjectTasksLoading] = useState(false);
    const [projectTasksError, setProjectTasksError] = useState(false);
    const [qaViewActive, setQaViewActive] = useState(false);

    // Form States (for Create/Edit Project)
    const [projectForm, setProjectForm] = useState({
        name: "",
        description: "",
        start_date: "",
        end_date: "",
        sheet_integration_enabled: false,
        sheet_id: "",
        qa_mode_enabled: false,
    });
    const [editingId, setEditingId] = useState(null);
    const [isCreatingNewProject, setIsCreatingNewProject] = useState(false); // Flag for creating a new project

    // Form States (for Add/Remove Members)
    const [memberForm, setMemberForm] = useState({
        role: "collaborator",
        allocation_percentage: 0,
        workload_status: "partial",
    });
    const [selectedUsersToAdd, setSelectedUsersToAdd] = useState([]);

    const [editingMemberId, setEditingMemberId] = useState(null);
    const [editingMemberData, setEditingMemberData] = useState({
        allocation_percentage: 0,
        workload_status: "partial",
    });

    // Modals & Notifications
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [projectToDeleteId, setProjectToDeleteId] = useState(null);
    const [notification, setNotification] = useState(null); // { message, type }

    // Data Fetching
    const loadProjects = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await fetchProjects();
            const validProjects = Array.isArray(data) ? data : [];
            setProjects(validProjects);
            // After loading, ensure selectedProjectId is still valid or reset it
            if (selectedProjectId && !validProjects.some((p) => p.id === selectedProjectId)) {
                setSelectedProjectId(null);
            }
        } catch (error) {
            console.error("Failed to fetch projects:", error);
            setNotification({ message: "Failed to load projects.", type: "error" });
            setProjects([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedProjectId]); // Dependency on selectedProjectId to re-validate selection

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    useEffect(() => {
        if (!selectedProjectId) {
            setQaViewActive(false);
            return;
        }

        const currentProject = projects.find((proj) => proj.id === selectedProjectId);
        if (!currentProject?.qa_mode_enabled && qaViewActive) {
            setQaViewActive(false);
        }
    }, [projects, selectedProjectId, qaViewActive]);

    useEffect(() => {
        const resetTaskState = () => {
            setProjectTasks([]);
            setProjectTaskStats({ ...INITIAL_TASK_STATS });
            setProjectTasksError(false);
            setIsProjectTasksLoading(false);
        };

        if (!selectedProjectId) {
            resetTaskState();
            return;
        }

        const currentProject = projects.find((proj) => proj.id === selectedProjectId);
        let isMounted = true;
        const computeTaskStats = (tasks) => {
            const stats = { ...INITIAL_TASK_STATS };
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let nearestUpcoming = null;
            let fallbackNearest = null;

            tasks.forEach((task) => {
                const status = (task.status || "").toLowerCase().replace(/-/g, "_");
                if (status === "todo" || status === "to_do") {
                    stats.todo += 1;
                } else if (status === "in_progress") {
                    stats.inProgress += 1;
                } else if (status === "completed" || status === "done") {
                    stats.completed += 1;
                }

                if (task.due_date) {
                    const dueDate = new Date(task.due_date);
                    if (!Number.isNaN(dueDate.getTime())) {
                        if (!fallbackNearest || dueDate < fallbackNearest) {
                            fallbackNearest = dueDate;
                        }

                        if (dueDate < today && status !== "completed" && status !== "done") {
                            stats.overdue += 1;
                        }

                        if ((status !== "completed" && status !== "done") && dueDate >= today) {
                            if (!nearestUpcoming || dueDate < nearestUpcoming) {
                                nearestUpcoming = dueDate;
                            }
                        }
                    }
                }
            });

            stats.total = tasks.length;
            const selectedDueDate = nearestUpcoming || fallbackNearest;
            stats.nextDueDate = selectedDueDate ? selectedDueDate.toISOString() : null;

            return stats;
        };

        const fetchTasks = async () => {
            setIsProjectTasksLoading(true);
            setProjectTasksError(false);
            setProjectTasks([]);
            setProjectTaskStats({ ...INITIAL_TASK_STATS });
            try {
                const params = { project_id: selectedProjectId };
                if (qaViewActive && currentProject?.qa_mode_enabled) {
                    params.type = "qa";
                }
                const { data } = await SchedulerAPI.getTasks(params);
                if (!isMounted) return;
                const tasks = Array.isArray(data) ? data : [];
                setProjectTasks(tasks);
                setProjectTaskStats(computeTaskStats(tasks));
            } catch (error) {
                console.error("Failed to fetch project tasks:", error);
                if (!isMounted) return;
                setProjectTasksError(true);
                setProjectTasks([]);
                setProjectTaskStats({ ...INITIAL_TASK_STATS });
            } finally {
                if (isMounted) {
                    setIsProjectTasksLoading(false);
                }
            }
        };

        fetchTasks();

        return () => {
            isMounted = false;
        };
    }, [selectedProjectId, qaViewActive, projects]);

    // Event Handlers
    const handleFormChange = (e) =>
        setProjectForm({
            ...projectForm,
            [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
        });
    const handleMemberFormChange = (e) => {
        const { name, value } = e.target;
        setMemberForm({
            ...memberForm,
            [name]: name === "allocation_percentage" ? parseInt(value || 0, 10) : value,
        });
    };

    const resetAndCloseForms = () => {
        setEditingId(null);
        setIsCreatingNewProject(false);
        setEditingMemberId(null);
        setProjectForm({
            name: "",
            description: "",
            start_date: "",
            end_date: "",
            sheet_integration_enabled: false,
            sheet_id: "",
            qa_mode_enabled: false,
        });
        setNotification(null); // Clear any form-related notifications
    };

    const handleSelectProject = (id) => {
        setSelectedProjectId(id);
        resetAndCloseForms(); // Close any open forms when selecting a new project
    }

    const handleProjectSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setNotification(null); // Clear previous notifications

        const action = editingId ? updateProject(editingId, projectForm) : createProject(projectForm);
        try {
            await action;
            resetAndCloseForms();
            await loadProjects(); // Reload to get the latest data
            setNotification({ message: `Project ${editingId ? 'updated' : 'created'} successfully!`, type: "success" });
        } catch (err) {
            console.error("Failed to save project:", err);
            setNotification({ message: `Failed to save project: ${err.message || 'An error occurred.'}`, type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditClick = (project) => {
        setEditingId(project.id);
        setIsCreatingNewProject(false);
        setProjectForm({
            name: project.name,
            description: project.description || "",
            start_date: project.start_date || "",
            end_date: project.end_date || "",
            sheet_integration_enabled: project.sheet_integration_enabled || false,
            sheet_id: project.sheet_id || "",
            qa_mode_enabled: project.qa_mode_enabled || false,
        });
        setSelectedProjectId(project.id); // Ensure the project is selected in the sidebar
        setNotification(null);
    };

    const handleNewClick = () => {
        setIsCreatingNewProject(true);
        setEditingId(null);
        setSelectedProjectId(null); // Deselect any project
        setProjectForm({
            name: "",
            description: "",
            start_date: "",
            end_date: "",
            sheet_integration_enabled: false,
            sheet_id: "",
            qa_mode_enabled: false,
        });
        setNotification(null);
    }

    const confirmDeleteProject = (id) => {
        setProjectToDeleteId(id);
        setShowDeleteConfirm(true);
    };

    const handleDeleteProject = async () => {
        setShowDeleteConfirm(false);
        setIsSaving(true); // Indicate deletion is in progress
        setNotification(null);

        try {
            await deleteProject(projectToDeleteId);
            if (selectedProjectId === projectToDeleteId) {
                setSelectedProjectId(null);
            }
            await loadProjects();
            setNotification({ message: "Project deleted successfully!", type: "success" });
        } catch (err) {
            console.error("Failed to delete project:", err);
            setNotification({ message: `Failed to delete project: ${err.message || 'An error occurred.'}`, type: "error" });
        } finally {
            setIsSaving(false);
            setProjectToDeleteId(null);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (selectedUsersToAdd.length === 0) {
            setNotification({ message: "Please select users to add.", type: "info" });
            return;
        }
        setIsSaving(true);
        setNotification(null);

        try {
            await Promise.all(
                selectedUsersToAdd.map((u) =>
                    addProjectUser({
                        project_id: selectedProjectId,
                        user_id: u.id,
                        role: memberForm.role,
                        allocation_percentage: memberForm.allocation_percentage,
                        workload_status: memberForm.workload_status,
                    })
                )
            );
            setSelectedUsersToAdd([]);
            setMemberForm({ role: "collaborator", allocation_percentage: 0, workload_status: "partial" });
            await loadProjects();
            setNotification({ message: "Member(s) added successfully!", type: "success" });
        } catch (err) {
            console.error("Failed to add member:", err);
            setNotification({ message: `Failed to add member: ${err.message || 'An error occurred.'}`, type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    const startEditingMember = (member) => {
        setEditingMemberId(member.project_user_id);
        setEditingMemberData({
            allocation_percentage: member.allocation_percentage || 0,
            workload_status: member.workload_status || "partial",
        });
    };

    const handleEditingMemberChange = (e) => {
        const { name, value } = e.target;
        setEditingMemberData({
            ...editingMemberData,
            [name]: name === "allocation_percentage" ? parseInt(value || 0, 10) : value,
        });
    };

    const handleSaveMemberEdit = async (projectUserId) => {
        setIsSaving(true);
        setNotification(null);
        try {
            await updateProjectUser(projectUserId, editingMemberData);
            await loadProjects();
            setNotification({ message: "Member updated successfully!", type: "success" });
            setEditingMemberId(null);
        } catch (err) {
            console.error("Failed to update member:", err);
            setNotification({ message: `Failed to update member: ${err.message || 'An error occurred.'}`, type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    const cancelMemberEdit = () => {
        setEditingMemberId(null);
    };

    const handleRemoveMember = async (projectUserId, memberName) => {
        if (!window.confirm(`Are you sure you want to remove ${memberName} from this project?`)) return; // A simple confirm for now, can be replaced by modal
        setIsSaving(true); // Indicate removal is in progress
        setNotification(null);

        try {
            await deleteProjectUser(projectUserId);
            await loadProjects();
            setNotification({ message: `${memberName} removed from project.`, type: "success" });
        } catch (err) {
            console.error("Failed to remove member:", err);
            setNotification({ message: `Failed to remove ${memberName}: ${err.message || 'An error occurred.'}`, type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleLeaveProject = async () => {
        if (!window.confirm('Are you sure you want to leave this project?')) return;
        setIsSaving(true);
        setNotification(null);

        try {
            await leaveProject(selectedProjectId);
            await loadProjects();
            setNotification({ message: 'You have left the project.', type: 'success' });
        } catch (err) {
            console.error('Failed to leave project:', err);
            setNotification({ message: `Failed to leave project: ${err.message || 'An error occurred.'}`, type: 'error' });
        } finally {
            setIsSaving(false);
            setSelectedProjectId(null);
        }
    };

    // Derived State for rendering
    const filteredProjects = projects.filter((p) =>
        `${p.name} ${p.description || ''} ${p.users.map((u) => u.name).join(" ")}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
    );

    const groupedProjects = filteredProjects.reduce((acc, project) => {
        const status = project.status || 'running'; // Default to 'running' if status is not set
        acc[status] = acc[status] || [];
        acc[status].push(project);
        return acc;
    }, {});

    const projectStatuses = ['running', 'upcoming', 'completed']; // Define order for display

    const selectedProject = projects.find((p) => p.id === selectedProjectId);
    const taskScopeLabel = qaViewActive ? "QA tasks" : "project tasks";
    const activeTaskCount = projectTaskStats.todo + projectTaskStats.inProgress;
    const completionRate = projectTaskStats.total
        ? Math.round((projectTaskStats.completed / projectTaskStats.total) * 100)
        : 0;
    const activeTaskDisplay = isProjectTasksLoading ? "—" : activeTaskCount;
    const completionDisplay = isProjectTasksLoading
        ? "—"
        : projectTaskStats.total
            ? `${completionRate}%`
            : "0%";
    const isFormVisible = isCreatingNewProject || editingId;

    // Render UI
    return (
        <div className="flex h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
            {/* Sidebar */}
            <aside className="w-80 flex-shrink-0 bg-white dark:bg-zinc-800 border-r border-zinc-100 dark:border-zinc-700 flex flex-col">
                <div className="p-5 border-b border-zinc-100 dark:border-zinc-700 bg-gradient-to-r from-violet-600 to-purple-600">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <FiFolder className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-white">Projects</h2>
                        </div>
                        <span className="text-sm text-white/70">{projects.length}</span>
                    </div>
                </div>

                <div className="p-4">
                    <div className="relative">
                        <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-700/50 border border-zinc-200 dark:border-zinc-600 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-3 space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                            <FiLoader className="w-8 h-8 animate-spin text-violet-500 mb-3" />
                            <p className="text-sm">Loading projects...</p>
                        </div>
                    ) : filteredProjects.length > 0 ? (
                        projectStatuses.map((status) => (
                            groupedProjects[status] && groupedProjects[status].length > 0 && (
                                <div key={status}>
                                    <h3 className="px-2 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                                        {status}
                                    </h3>
                                    <div className="space-y-2">
                                        {groupedProjects[status].map((project) => (
                                            <motion.button
                                                key={project.id}
                                                onClick={() => handleSelectProject(project.id)}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${selectedProjectId === project.id
                                                    ? 'bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200 dark:border-violet-800 shadow-md'
                                                    : 'bg-white dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-700/50 hover:border-zinc-200 dark:hover:border-zinc-600 hover:shadow-md'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className={`font-semibold ${selectedProjectId === project.id ? 'text-violet-700 dark:text-violet-300' : 'text-zinc-800 dark:text-white'}`}>
                                                        {project.name}
                                                    </h4>
                                                    <FiChevronRight className={`w-4 h-4 transition-transform ${selectedProjectId === project.id ? 'text-violet-500 translate-x-1' : 'text-zinc-400'}`} />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <AvatarStack members={project.users} max={3} />
                                                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                                        {project.users.length} member{project.users.length !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            )
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <FiFolder className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                            <p className="font-medium text-zinc-600 dark:text-zinc-400">No projects found</p>
                            <p className="text-sm text-zinc-500">Try a different search</p>
                        </div>
                    )}
                </nav>

                {canEdit && (
                    <div className="p-4 border-t border-zinc-100 dark:border-zinc-700">
                        <button
                            onClick={handleNewClick}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                        >
                            <FiPlus className="w-4 h-4" />
                            New Project
                        </button>
                    </div>
                )}
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-8">
                    {isFormVisible ? (
                        // Create / Edit Project Form
                        <div className="animate-fadeInUp">
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{editingId ? 'Edit Project Details' : 'Create a New Project'}</h1>
                            <p className="text-gray-600 mb-8">{editingId ? `Update information for ${projectForm.name}.` : 'Fill in the details to create a new project.'}</p>
                            <form onSubmit={handleProjectSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 required-label">Project Name</label>
                                    <input
                                        id="name"
                                        name="name"
                                        value={projectForm.name}
                                        onChange={handleFormChange}
                                        placeholder="e.g. Website Redesign"
                                        required
                                        className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-[var(--theme-color)] focus:border-[var(--theme-color)] outline-none transition-all duration-200"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 text-xs">(Optional)</span></label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={projectForm.description}
                                        onChange={handleFormChange}
                                        placeholder="A short description of the project's purpose and goals."
                                        className="w-full border border-gray-300 rounded-lg p-3 h-32 resize-y text-base focus:ring-2 focus:ring-[var(--theme-color)] focus:border-[var(--theme-color)] outline-none transition-all duration-200"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            id="start_date"
                                            name="start_date"
                                            value={projectForm.start_date}
                                            onChange={handleFormChange}
                                            className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-[var(--theme-color)] focus:border-[var(--theme-color)] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">End Date <span className="text-gray-400 text-xs">(Optional)</span></label>
                                        <input
                                            type="date"
                                            id="end_date"
                                            name="end_date"
                                            value={projectForm.end_date}
                                            onChange={handleFormChange}
                                            className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-[var(--theme-color)] focus:border-[var(--theme-color)] outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            name="qa_mode_enabled"
                                            id="qa_mode_enabled"
                                            checked={projectForm.qa_mode_enabled}
                                            onChange={handleFormChange}
                                            className="h-5 w-5 text-[var(--theme-color)] rounded border-gray-300 focus:ring-[var(--theme-color)]"
                                        />
                                        <label htmlFor="qa_mode_enabled" className="text-sm font-medium text-gray-700">Enable QA Mode</label>
                                    </div>
                                    <p className="text-xs text-gray-500 ml-7">Adds a QA view toggle to the project so QA-assigned tasks, scheduler items, and stats can be reviewed separately.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="sheet_integration_enabled"
                                        id="sheet_integration_enabled"
                                        checked={projectForm.sheet_integration_enabled}
                                        onChange={handleFormChange}
                                        className="h-5 w-5 text-[var(--theme-color)] rounded border-gray-300 focus:ring-[var(--theme-color)]"
                                    />
                                    <label htmlFor="sheet_integration_enabled" className="text-sm font-medium text-gray-700">Enable Sheet Integration</label>
                                </div>
                                {projectForm.sheet_integration_enabled && (
                                    <div>
                                        <label htmlFor="sheet_id" className="block text-sm font-medium text-gray-700 mb-1">Google Sheet ID</label>
                                        <input
                                            id="sheet_id"
                                            name="sheet_id"
                                            value={projectForm.sheet_id}
                                            onChange={handleFormChange}
                                            placeholder="Enter Google Sheet ID (e.g., 1AB2C3D4E5F6G7H8I9J0K)"
                                            className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-[var(--theme-color)] focus:border-[var(--theme-color)] outline-none"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">This ID is found in the URL of your Google Sheet.</p>
                                    </div>
                                )}
                                <div className="flex items-center gap-4 justify-end">
                                    <button
                                        type="button"
                                        onClick={resetAndCloseForms}
                                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium active:scale-95 transform"
                                        disabled={isSaving}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-[var(--theme-color)] text-white rounded-lg hover:brightness-110 transition-colors font-semibold shadow-md flex items-center gap-2 justify-center active:scale-95 transform"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <>
                                                <FiLoader className="animate-spin" /> Saving...
                                            </>
                                        ) : (
                                            editingId ? "Save Changes" : "Create Project"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : selectedProject ? (
                        // Selected Project Details
                        <div className="animate-fadeIn space-y-10">
                            <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-8 shadow-sm">
                                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h1 className="text-4xl font-extrabold text-gray-900">{selectedProject.name}</h1>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${selectedProject.status === 'completed'
                                                    ? 'bg-green-100 text-green-700'
                                                    : selectedProject.status === 'upcoming'
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                    }`}
                                            >
                                                {selectedProject.status || 'Running'}
                                            </span>
                                        </div>
                                        <p className="max-w-3xl text-lg text-gray-600">
                                            {selectedProject.description || 'No description provided for this project.'}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                            {selectedProject.start_date && (
                                                <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                                                    <FiCalendar className="text-gray-400" /> Start {selectedProject.start_date}
                                                </span>
                                            )}
                                            {selectedProject.end_date && (
                                                <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                                                    <FiCalendar className="text-gray-400" /> End {selectedProject.end_date}
                                                </span>
                                            )}
                                        </div>
                                        {selectedProject.qa_mode_enabled && (
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={qaViewActive}
                                                    onClick={() => setQaViewActive((prev) => !prev)}
                                                    className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-200 shadow-sm ${qaViewActive ? 'bg-purple-600' : 'bg-slate-300'
                                                        }`}
                                                >
                                                    <span
                                                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${qaViewActive ? 'translate-x-8' : 'translate-x-1'
                                                            }`}
                                                    />
                                                </button>
                                                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${qaViewActive
                                                    ? 'border-purple-200 bg-purple-50 text-purple-700'
                                                    : 'border-slate-200 bg-slate-50 text-slate-700'
                                                    }`}>
                                                    QA mode {qaViewActive ? 'enabled' : 'available'}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {qaViewActive
                                                        ? 'Showing QA-assigned tasks, scheduler items, and statistics.'
                                                        : 'Switch on to focus on QA ownership and progress.'}
                                                </span>
                                            </div>
                                        )}
                                        {selectedProject.sheet_integration_enabled && selectedProject.sheet_id && (
                                            <a
                                                href={`https://docs.google.com/spreadsheets/d/${selectedProject.sheet_id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--theme-color)] hover:underline"
                                            >
                                                <FiLink className="h-5 w-5" /> Integrated Google Sheet
                                            </a>
                                        )}
                                    </div>
                                    {canEdit && (
                                        <div className="flex items-center gap-3 self-start rounded-full bg-white/80 px-4 py-2 shadow-sm">
                                            <button
                                                onClick={() => handleEditClick(selectedProject)}
                                                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[var(--theme-color)]"
                                            >
                                                <FiEdit2 className="h-4 w-4" /> Edit project
                                            </button>
                                            <span className="h-5 w-px bg-slate-200" aria-hidden="true" />
                                            <button
                                                onClick={() => confirmDeleteProject(selectedProject.id)}
                                                className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600"
                                            >
                                                <FiTrash2 className="h-4 w-4" /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                                        <p className="text-xs uppercase tracking-wide text-slate-500">Members</p>
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-2xl font-semibold text-slate-900">{selectedProject.users.length}</span>
                                            <FiUsers className="h-6 w-6 text-[var(--theme-color)]" />
                                        </div>
                                        <p className="text-xs text-slate-500">Collaborators assigned to this project.</p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                                        <p className="text-xs uppercase tracking-wide text-slate-500">
                                            {qaViewActive ? 'Active QA tasks' : 'Active tasks'}
                                        </p>
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-2xl font-semibold text-slate-900">{activeTaskDisplay}</span>
                                            <FiActivity className="h-6 w-6 text-[var(--theme-color)]" />
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {isProjectTasksLoading
                                                ? 'Refreshing task data…'
                                                : qaViewActive
                                                    ? 'Across QA to-do and in-progress states.'
                                                    : 'Across to-do and in-progress states.'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                                        <p className="text-xs uppercase tracking-wide text-slate-500">
                                            {qaViewActive ? 'QA completion' : 'Completion'}
                                        </p>
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-2xl font-semibold text-slate-900">{completionDisplay}</span>
                                            <FiCheckCircle className="h-6 w-6 text-[var(--theme-color)]" />
                                        </div>
                                        {!isProjectTasksLoading && projectTaskStats.total > 0 ? (
                                            <p className="text-xs text-slate-500">{projectTaskStats.completed} of {projectTaskStats.total} {taskScopeLabel} completed.</p>
                                        ) : (
                                            <p className="text-xs text-slate-500">Completion rate updates as tasks change.</p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="grid grid-cols-1 items-start gap-10 xl:grid-cols-[2fr_1fr]">
                                <div className="space-y-8">
                                    <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm">
                                        <div className="mb-5 flex items-center justify-between">
                                            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                                <FiUsers className="h-5 w-5 text-[var(--theme-color)]" /> Members ({selectedProject.users.length})
                                            </h3>
                                        </div>
                                        {selectedProject.users.length > 0 ? (
                                            <ul className="space-y-4">
                                                {selectedProject.users.map((member) => (
                                                    <li
                                                        key={member.project_user_id}
                                                        className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm transition-all duration-200 hover:shadow-md"
                                                    >
                                                        {editingMemberId === member.project_user_id ? (
                                                            <>
                                                                <div className="flex flex-1 items-center gap-4">
                                                                    <Avatar name={member.name} src={member.profile_picture} size="lg" />
                                                                    <div className="space-y-3">
                                                                        <p className="text-lg font-medium text-gray-900">{member.name || 'Invited User'}</p>
                                                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                                                            <input
                                                                                type="number"
                                                                                name="allocation_percentage"
                                                                                min="0"
                                                                                max="100"
                                                                                value={editingMemberData.allocation_percentage}
                                                                                onChange={handleEditingMemberChange}
                                                                                className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-[var(--theme-color)] focus:border-[var(--theme-color)] sm:w-28"
                                                                            />
                                                                            <select
                                                                                name="workload_status"
                                                                                value={editingMemberData.workload_status}
                                                                                onChange={handleEditingMemberChange}
                                                                                className="w-full rounded-lg border border-gray-300 p-2 text-sm capitalize focus:ring-2 focus:ring-[var(--theme-color)] focus:border-[var(--theme-color)] sm:w-40"
                                                                            >
                                                                                {WORKLOAD_STATUSES.map((s) => (
                                                                                    <option key={s} value={s} className="capitalize">
                                                                                        {s}
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex shrink-0 items-center gap-2">
                                                                    <button
                                                                        onClick={() => handleSaveMemberEdit(member.project_user_id)}
                                                                        className="rounded-md px-3 py-1 text-sm font-medium text-green-600 transition-colors hover:bg-green-50 hover:text-green-700"
                                                                    >
                                                                        Save
                                                                    </button>
                                                                    <button
                                                                        onClick={cancelMemberEdit}
                                                                        className="rounded-md px-3 py-1 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="flex flex-1 items-start gap-4">
                                                                    <Avatar name={member.name} src={member.profile_picture} size="lg" />
                                                                    <div className="space-y-1">
                                                                        <p className="text-lg font-medium text-gray-900">{member.name || 'Invited User'}</p>
                                                                        <p className="text-sm capitalize text-gray-500">{member.role}</p>
                                                                        {member.email && <p className="text-sm text-gray-500">{member.email}</p>}
                                                                        <p className="text-sm text-gray-500">Allocation: {member.allocation_percentage}% ({member.workload_status})</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex shrink-0 items-center gap-2">
                                                                    {(canManageMembers || member.id === user.id) && (
                                                                        <button
                                                                            onClick={() => startEditingMember(member)}
                                                                            className="rounded-md px-3 py-1 text-sm font-medium text-[var(--theme-color)] transition-colors hover:bg-[rgb(var(--theme-color-rgb)/0.1)]"
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                    )}
                                                                    {canManageMembers && user.id !== member.id && (
                                                                        <button
                                                                            onClick={() => handleRemoveMember(member.project_user_id, member.name || 'this member')}
                                                                            className="rounded-md px-3 py-1 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    )}
                                                                    {member.id === user.id && user.roles?.some((r) => r.name === 'project_manager') && (
                                                                        <button
                                                                            onClick={handleLeaveProject}
                                                                            className="rounded-md px-3 py-1 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
                                                                        >
                                                                            Leave
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
                                                This project currently has no members.
                                            </div>
                                        )}

                                        {canManageMembers && (
                                            <form onSubmit={handleAddMember} className="mt-8 grid grid-cols-1 items-end gap-4 border-t border-slate-200 pt-6 md:grid-cols-6">
                                                <div className="md:col-span-2">
                                                    <label className="mb-1 block text-sm font-medium text-gray-700">Select users to add</label>
                                                    <UserMultiSelect
                                                        selectedUsers={selectedUsersToAdd}
                                                        setSelectedUsers={setSelectedUsersToAdd}
                                                        excludedIds={selectedProject.users.map((u) => u.id)}
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor="role" className="mb-1 block text-sm font-medium text-gray-700">Role</label>
                                                    <select
                                                        name="role"
                                                        id="role"
                                                        value={memberForm.role}
                                                        onChange={handleMemberFormChange}
                                                        className="w-full rounded-lg border border-gray-300 bg-white p-3 text-base focus:ring-2 focus:ring-[var(--theme-color)] focus:border-[var(--theme-color)]"
                                                    >
                                                        <option value="owner">Owner</option>
                                                        <option value="manager">Manager</option>
                                                        <option value="collaborator">Collaborator</option>
                                                        <option value="viewer">Viewer</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label htmlFor="allocation_percentage" className="mb-1 block text-sm font-medium text-gray-700">Allocation %</label>
                                                    <input
                                                        type="number"
                                                        name="allocation_percentage"
                                                        id="allocation_percentage"
                                                        min="0"
                                                        max="100"
                                                        value={memberForm.allocation_percentage}
                                                        onChange={handleMemberFormChange}
                                                        className="w-full rounded-lg border border-gray-300 p-3 text-base focus:ring-2 focus:ring-[var(--theme-color)] focus:border-[var(--theme-color)]"
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor="workload_status" className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                                                    <select
                                                        name="workload_status"
                                                        id="workload_status"
                                                        value={memberForm.workload_status}
                                                        onChange={handleMemberFormChange}
                                                        className="w-full rounded-lg border border-gray-300 bg-white p-3 text-base capitalize focus:ring-2 focus:ring-[var(--theme-color)] focus:border-[var(--theme-color)]"
                                                    >
                                                        {WORKLOAD_STATUSES.map((s) => (
                                                            <option key={s} value={s} className="capitalize">
                                                                {s}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <button
                                                    type="submit"
                                                    className="md:col-span-1 flex items-center justify-center gap-2 rounded-lg bg-[var(--theme-color)] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-transform transition-colors duration-200 hover:brightness-110 active:scale-95"
                                                    disabled={isSaving || selectedUsersToAdd.length === 0}
                                                >
                                                    {isSaving ? (
                                                        <>
                                                            <FiLoader className="animate-spin" /> Adding...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FiUserPlus className="h-5 w-5" /> Add member(s)
                                                        </>
                                                    )}
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-6 xl:sticky xl:top-8">
                                    {selectedProject.qa_mode_enabled && (
                                        <div
                                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${qaViewActive
                                                ? 'border-purple-200 bg-purple-50 text-purple-700'
                                                : 'border-slate-200 bg-slate-50 text-slate-700'
                                                }`}
                                        >
                                            <FiActivity className={qaViewActive ? 'text-purple-600' : 'text-slate-500'} />
                                            <span>{qaViewActive ? 'QA mode metrics' : 'Delivery metrics'}</span>
                                        </div>
                                    )}
                                    <ProjectHealthCard
                                        stats={projectTaskStats}
                                        loading={isProjectTasksLoading}
                                        error={projectTasksError}
                                    />
                                </div>
                            </section>
                        </div>
                    ) : isLoading ? (
                        <div className="text-center h-full flex flex-col items-center justify-center min-h-[50vh]">
                            <FiLoader className="animate-spin text-5xl mb-4 text-[var(--theme-color)]" />
                            <p className="text-gray-600 text-lg">Loading project data...</p>
                        </div>
                    ) : (
                        // Show introductory message or all project cards
                        <div>
                            {projects.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                                    <div className="md:col-span-full bg-[rgb(var(--theme-color-rgb)/0.1)] border border-[var(--theme-color)] rounded-xl p-6 mb-4 flex items-center gap-4 shadow-sm">
                                        <FiInfo className="text-[var(--theme-color)] text-3xl" />
                                        <div>
                                            <h2 className="text-xl font-semibold text-[var(--theme-color)]">Select a Project to View Details</h2>
                                            <p className="text-[var(--theme-color)] text-sm">Click on any project in the sidebar to manage its members and edit its information.</p>
                                        </div>
                                    </div>
                                    {projects.map((project) => (
                                        <div key={project.id} className="border border-gray-200 rounded-xl shadow-md p-6 bg-white flex flex-col justify-between transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                                            onClick={() => handleSelectProject(project.id)}
                                        >
                                            <div className="mb-4">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="text-xl font-bold text-gray-900">{project.name}</h3>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${project.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        project.status === 'upcoming' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-blue-100 text-blue-700' // Default for 'running' or undefined
                                                        }`}>
                                                        {project.status || 'Running'}
                                                    </span>
                                                </div>
                                                {project.description && (
                                                    <p className="text-sm text-gray-600 line-clamp-3">{project.description}</p>
                                                )}
                                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-3">
                                                    {project.start_date && <span className="flex items-center gap-1"><FiCalendar className="w-4 h-4" />{project.start_date}</span>}
                                                    {project.end_date && <span className="flex items-center gap-1"><FiChevronRight className="w-4 h-4" />{project.end_date}</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center -space-x-2 mb-4">
                                                {project.users.slice(0, 4).map((member) => ( // Show up to 4 avatars
                                                    <Avatar key={member.id} name={member.name} src={member.profile_picture} size="md" />
                                                ))}
                                                {project.users.length > 4 && (
                                                    <span className="text-sm text-gray-500 ml-4 font-medium">+{project.users.length - 4} more</span>
                                                )}
                                                {project.users.length === 0 && (
                                                    <span className="text-sm text-gray-500 italic">No members yet</span>
                                                )}
                                            </div>
                                            <button className="self-start text-base text-[var(--theme-color)] hover:underline flex items-center gap-1">
                                                View Details <FiChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center h-full flex flex-col items-center justify-center min-h-[70vh]">
                                    <FiFolder className="text-8xl text-gray-300 mb-6" />
                                    <h2 className="text-3xl font-extrabold text-gray-800">No Projects Created Yet</h2>
                                    <p className="text-gray-600 mt-2 text-lg max-w-md">
                                        It looks like there are no projects in your organization. Get started by creating your first project!
                                    </p>
                                    {canEdit && (
                                        <button
                                            onClick={handleNewClick}
                                            className="mt-8 px-8 py-3 bg-[var(--theme-color)] text-white rounded-lg hover:brightness-110 transition-colors font-semibold shadow-lg flex items-center gap-2 active:scale-95 transform"
                                        >
                                            <FiPlus /> Create First Project
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                title="Delete Project"
                footer={
                    <>
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-4 py-2 text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteProject}
                            disabled={isSaving}
                            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                            {isSaving ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiTrash2 className="w-4 h-4" />}
                            Delete
                        </button>
                    </>
                }
            >
                <p className="text-zinc-600 dark:text-zinc-400">
                    Are you sure you want to delete <span className="font-semibold text-zinc-800 dark:text-white">{projects.find(p => p.id === projectToDeleteId)?.name}</span>? This action cannot be undone.
                </p>
            </Modal>

            {/* Notification */}
            <AnimatePresence>
                {notification && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Projects;
