import React, { useEffect, useState, useContext, useCallback } from "react";
import { fetchProjects, createProject, updateProject, deleteProject, addProjectUser, deleteProjectUser } from "../components/api";
import UserMultiSelect from "../components/UserMultiSelect";
import { AuthContext } from "../context/AuthContext";
// Import icons (e.g., from Feather Icons)
import { FiPlus, FiEdit, FiTrash2, FiUsers, FiSearch, FiUserPlus, FiChevronRight, FiXCircle, FiCheckCircle, FiInfo, FiLoader, FiCalendar, FiLink, FiFolder } from 'react-icons/fi'; // Added more icons

// --- Utility Components (re-used from Teams UI) ---

// Avatar component with improved styling and accessibility
const Avatar = ({ name, src, size = 'md' }) => {
    const sizeClasses = {
        sm: "w-6 h-6 text-xs",
        md: "w-8 h-8 text-sm",
        lg: "w-10 h-10 text-base",
    };
    const currentSizeClass = sizeClasses[size] || sizeClasses.md;

    // Handle potential 'null' string for src
    if (src && src !== 'null') {
        return (
            <img
                src={src}
                alt={`${name}'s avatar`}
                className={`rounded-full mr-2 object-cover border border-gray-200 ${currentSizeClass}`}
            />
        );
    }
    const initial = name ? name.charAt(0).toUpperCase() : "?";
    return (
        <div className={`rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold mr-2 ${currentSizeClass}`}>
            {initial}
        </div>
    );
};

// Modal component for confirmations and forms
const Modal = ({ isOpen, onClose, title, children, footer, className = "" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className={`bg-white rounded-lg shadow-xl p-6 w-full max-w-lg transform scale-95 animate-scaleIn ${className}`}>
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <FiXCircle className="w-6 h-6" />
                    </button>
                </div>
                <div className="modal-body max-h-[70vh] overflow-y-auto pr-2">
                    {children}
                </div>
                {footer && (
                    <div className="border-t pt-4 mt-4 flex justify-end space-x-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

// Notification/Toast component
const Notification = ({ message, type, onClose }) => {
    const typeClasses = {
        success: "bg-green-100 border-green-400 text-green-700",
        error: "bg-red-100 border-red-400 text-red-700",
        info: "bg-blue-100 border-blue-400 text-blue-700",
    };

    const icon = {
        success: <FiCheckCircle className="w-5 h-5 mr-2" />,
        error: <FiXCircle className="w-5 h-5 mr-2" />,
        info: <FiInfo className="w-5 h-5 mr-2" />,
    }[type];

    return (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-center ${typeClasses[type]} animate-slideInFromRight z-50`}>
            {icon}
            <span>{message}</span>
            <button onClick={onClose} className="ml-4 text-current hover:opacity-75">
                <FiXCircle className="w-4 h-4" />
            </button>
        </div>
    );
};


// --- Main Projects Component ---

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

    // Form States (for Create/Edit Project)
    const [projectForm, setProjectForm] = useState({
        name: "",
        description: "",
        start_date: "",
        end_date: "",
        sheet_integration_enabled: false,
        sheet_id: "",
    });
    const [editingId, setEditingId] = useState(null);
    const [isCreatingNewProject, setIsCreatingNewProject] = useState(false); // Flag for creating a new project

    // Form States (for Add/Remove Members)
    const [memberForm, setMemberForm] = useState({ role: "collaborator" });
    const [selectedUsersToAdd, setSelectedUsersToAdd] = useState([]);

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

    // Event Handlers
    const handleFormChange = (e) =>
        setProjectForm({
            ...projectForm,
            [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
        });
    const handleRoleChange = (e) => setMemberForm({ ...memberForm, role: e.target.value });

    const resetAndCloseForms = () => {
        setEditingId(null);
        setIsCreatingNewProject(false);
        setProjectForm({
            name: "",
            description: "",
            start_date: "",
            end_date: "",
            sheet_integration_enabled: false,
            sheet_id: "",
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
                    addProjectUser({ project_id: selectedProjectId, user_id: u.id, role: memberForm.role })
                )
            );
            setSelectedUsersToAdd([]);
            setMemberForm({ role: "collaborator" });
            await loadProjects();
            setNotification({ message: "Member(s) added successfully!", type: "success" });
        } catch (err) {
            console.error("Failed to add member:", err);
            setNotification({ message: `Failed to add member: ${err.message || 'An error occurred.'}`, type: "error" });
        } finally {
            setIsSaving(false);
        }
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
    const isFormVisible = isCreatingNewProject || editingId;

    // Render UI
    return (
        <div className="flex h-screen bg-gray-100 font-sans text-gray-800">
            {/* Sidebar */}
            <aside className="w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col shadow-lg">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-[var(--theme-color)] text-white">
                    <h2 className="text-xl font-bold">Projects</h2>
                    {canEdit && (
                        <button
                            onClick={handleNewClick}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white text-theme border border-theme hover:bg-theme hover:text-white transition-colors rounded-full shadow-md active:scale-95 transform"
                            title="Create New Project"
                        >
                            <FiPlus className="w-4 h-4" /> New Project
                        </button>
                    )}
                </div>
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[var(--theme-color)] focus:border-[var(--theme-color)] outline-none transition-all duration-200"
                        />
                    </div>
                </div>
                <nav className="flex-1 overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="p-6 flex flex-col items-center justify-center text-gray-500">
                            <FiLoader className="animate-spin text-3xl mb-3 text-[var(--theme-color)]" />
                            <p>Loading projects...</p>
                        </div>
                    ) : filteredProjects.length > 0 ? (
                        projectStatuses.map((status) => (
                            groupedProjects[status] && groupedProjects[status].length > 0 && (
                                <div key={status}>
                                    <h3 className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase">
                                        {status}
                                    </h3>
                                    <ul>
                                        {groupedProjects[status].map((project) => (
                                            <li key={project.id}>
                                                <button
                                                    onClick={() => handleSelectProject(project.id)}
                                                    className={`w-full text-left flex items-center justify-between p-4 border-b border-gray-100 transition-colors duration-200 ${selectedProjectId === project.id ? 'bg-[rgb(var(--theme-color-rgb)/0.1)] text-[var(--theme-color)] border-l-4 border-[var(--theme-color)] font-semibold' : 'hover:bg-gray-50'}`}
                                                >
                                                    <div>
                                                        <p className="text-base">{project.name}</p>
                                                        <p className="text-xs text-gray-500">{project.users.length} member(s)</p>
                                                    </div>
                                                    <FiChevronRight className={`text-gray-400 transition-transform duration-200 ${selectedProjectId === project.id ? 'translate-x-1 text-[var(--theme-color)]' : ''}`} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )
                        ))
                    ) : (
                        <div className="p-6 text-center text-gray-500">
                            <FiFolder className="mx-auto text-5xl text-gray-300 mb-4" />
                            <p className="font-semibold text-lg">No projects found</p>
                            <p className="text-sm">Try adjusting your search or create a new project.</p>
                        </div>
                    )}
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                    {isFormVisible ? (
                        // Create / Edit Project Form
                        <div className="animate-fadeInUp">
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{editingId ? 'Edit Project Details' : 'Create a New Project'}</h1>
                            <p className="text-gray-600 mb-8">{editingId ? `Update information for ${projectForm.name}.` : 'Fill in the details to create a new project.'}</p>
                            <form onSubmit={handleProjectSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
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
                        <div className="animate-fadeIn">
                            <div className="flex justify-between items-start mb-8 pb-4 border-b border-gray-200">
                                <div>
                                    <h1 className="text-4xl font-extrabold text-gray-900">{selectedProject.name}</h1>
                                    <p className="text-gray-600 mt-2 text-lg">{selectedProject.description || 'No description provided for this project.'}</p>
                                    <div className="mt-4 text-sm text-gray-600 flex items-center gap-4">
                                        {selectedProject.start_date && (
                                            <span className="flex items-center gap-1">
                                                <FiCalendar className="text-gray-400" /> Start: {selectedProject.start_date}
                                            </span>
                                        )}
                                        {selectedProject.end_date && (
                                            <span className="flex items-center gap-1">
                                                <FiCalendar className="text-gray-400" /> End: {selectedProject.end_date}
                                            </span>
                                        )}
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                            selectedProject.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            selectedProject.status === 'upcoming' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-blue-100 text-blue-700' // Default for 'running' or undefined
                                        }`}>
                                            {selectedProject.status || 'Running'}
                                        </span>
                                    </div>
                                    {selectedProject.sheet_integration_enabled && selectedProject.sheet_id && (
                                        <div className="mt-4 flex items-center gap-2 text-[var(--theme-color)]">
                                            <FiLink className="w-5 h-5" />
                                            <a href={`https://docs.google.com/spreadsheets/d/${selectedProject.sheet_id}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">
                                                Integrated Google Sheet
                                            </a>
                                        </div>
                                    )}
                                </div>
                                {canEdit && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEditClick(selectedProject)}
                                            className="p-3 text-gray-500 hover:bg-gray-100 rounded-full transition-colors tooltip"
                                            data-tooltip="Edit Project"
                                        >
                                            <FiEdit className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => confirmDeleteProject(selectedProject.id)}
                                            className="p-3 text-red-500 hover:bg-red-100 rounded-full transition-colors tooltip"
                                            data-tooltip="Delete Project"
                                        >
                                            <FiTrash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Member List */}
                            <div className="bg-gray-50 p-6 rounded-xl shadow-inner border border-gray-100">
                                <h3 className="text-xl font-semibold text-gray-800 mb-5 flex items-center gap-2">
                                    <FiUsers className="w-5 h-5 text-[var(--theme-color)]" /> Members ({selectedProject.users.length})
                                </h3>
                                {selectedProject.users.length > 0 ? (
                                    <ul className="space-y-4">
                                        {selectedProject.users.map((member) => (
                                            <li key={member.project_user_id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md">
                                                <div className="flex items-center flex-grow">
                                                    <Avatar name={member.name} src={member.profile_picture} size="lg" />
                                                    <div>
                                                        <p className="font-medium text-lg text-gray-900">{member.name || "Invited User"}</p>
                                                        <p className="text-sm text-gray-500 capitalize">{member.role}</p>
                                                        {member.email && (
                                                            <p className="text-sm text-gray-500">{member.email}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                {canManageMembers && user.id !== member.id && (
                                                    <button
                                                        onClick={() => handleRemoveMember(member.project_user_id, member.name || "this member")}
                                                        className="text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-md transition-colors font-medium"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-center text-gray-500 py-6">This project currently has no members.</p>
                                )}

                                {/* Add Member Form */}
                                {canManageMembers && (
                                    <form onSubmit={handleAddMember} className="mt-8 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Users to Add</label>
                                            <UserMultiSelect selectedUsers={selectedUsersToAdd} setSelectedUsers={setSelectedUsersToAdd} />
                                        </div>
                                        <div>
                                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                            <select
                                                name="role"
                                                id="role"
                                                value={memberForm.role}
                                                onChange={handleRoleChange}
                                                className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-[var(--theme-color)] focus:border-[var(--theme-color)] outline-none appearance-none bg-white pr-8"
                                            >
                                                <option value="owner">Owner</option>
                                                <option value="manager">Manager</option>
                                                <option value="collaborator">Collaborator</option>
                                                <option value="viewer">Viewer</option>
                                            </select>
                                        </div>
                                        <button
                                            type="submit"
                                            className="md:col-span-3 lg:col-span-1 px-5 py-2.5 bg-[var(--theme-color)] text-white rounded-lg hover:brightness-110 transition-colors font-semibold shadow-md flex items-center justify-center gap-2 active:scale-95 transform mt-4 md:mt-0"
                                            disabled={isSaving || selectedUsersToAdd.length === 0}
                                        >
                                            {isSaving ? (
                                                <>
                                                    <FiLoader className="animate-spin" /> Adding...
                                                </>
                                            ) : (
                                                <>
                                                    <FiUserPlus className="w-5 h-5" /> Add Member(s)
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
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
                                        <FiInfo className="text-[var(--theme-color)] text-3xl"/>
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
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                                        project.status === 'completed' ? 'bg-green-100 text-green-700' :
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
                                                    {project.start_date && <span className="flex items-center gap-1"><FiCalendar className="w-4 h-4"/>{project.start_date}</span>}
                                                    {project.end_date && <span className="flex items-center gap-1"><FiChevronRight className="w-4 h-4"/>{project.end_date}</span>}
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
                title="Confirm Delete"
                footer={
                    <>
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-5 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteProject}
                            className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <FiLoader className="animate-spin" /> Deleting...
                                </>
                            ) : (
                                <>
                                    <FiTrash2 /> Delete
                                </>
                            )}
                        </button>
                    </>
                }
            >
                <p className="text-gray-700">Are you sure you want to delete the project "<span className="font-semibold">{projects.find(p => p.id === projectToDeleteId)?.name}</span>"? This action cannot be undone.</p>
            </Modal>

            {/* Notification Toast */}
            {notification && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}
        </div>
    );
};

export default Projects;