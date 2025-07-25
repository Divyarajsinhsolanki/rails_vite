import React, { useEffect, useState, useContext } from "react";
import { fetchProjects, createProject, updateProject, deleteProject, addProjectUser, deleteProjectUser } from "../components/api";
import UserMultiSelect from "../components/UserMultiSelect";
import { AuthContext } from "../context/AuthContext";
// Import icons (e.g., from Feather Icons)
import { FiPlus, FiEdit, FiTrash2, FiUsers, FiSearch, FiUserPlus, FiChevronRight } from 'react-icons/fi';

// A small utility component for user avatars
const Avatar = ({ name, src }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="w-8 h-8 rounded-full mr-3 object-cover"
      />
    );
  }
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm mr-3">
      {initial}
    </div>
  );
};

const Projects = () => {
  const { user } = useContext(AuthContext);
  const canEdit = user?.roles?.some((r) => ["owner", "project_manager"].includes(r.name));
  const canManageMembers = user?.roles?.some((r) => r.name === "admin");

  // State Management
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  
  // Form States
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    sheet_integration_enabled: false,
    sheet_id: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [memberForm, setMemberForm] = useState({ role: "collaborator" });
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState([]);

  // Data Fetching
  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const { data } = await fetchProjects();
      const validProjects = Array.isArray(data) ? data : [];
      setProjects(validProjects);
      // If a project was selected, keep it selected. Otherwise, select the user's project or the first one.
      if (!validProjects.some(t => t.id === selectedProjectId)) {
        const userProject = validProjects.find((t) => t.users.some((u) => u.id === user?.id));
        setSelectedProjectId(userProject ? userProject.id : (validProjects[0]?.id || null));
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Event Handlers
  const handleFormChange = (e) =>
    setProjectForm({
      ...projectForm,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    });
  const handleRoleChange = (e) => setMemberForm({ ...memberForm, role: e.target.value });

  const resetAndCloseForms = () => {
    setEditingId(null);
    setIsCreating(false);
    setProjectForm({
      name: "",
      description: "",
      start_date: "",
      end_date: "",
      sheet_integration_enabled: false,
      sheet_id: "",
    });
  };
  
  const handleSelectProject = (id) => {
    setSelectedProjectId(id);
    resetAndCloseForms();
  }

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    const action = editingId ? updateProject(editingId, projectForm) : createProject(projectForm);
    try {
      await action;
      resetAndCloseForms();
      await loadProjects(); // Reload to get the latest data
    } catch (err) {
      console.error("Failed to save project:", err);
      // Here you could add user-facing error notifications
    }
  };

  const handleEditClick = (project) => {
    setEditingId(project.id);
    setIsCreating(false);
    setProjectForm({
      name: project.name,
      description: project.description || "",
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      sheet_integration_enabled: project.sheet_integration_enabled || false,
      sheet_id: project.sheet_id || "",
    });
    setSelectedProjectId(project.id);
  };
  
  const handleNewClick = () => {
      setIsCreating(true);
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
  }

  const handleDeleteProject = async (id) => {
    // Replace window.confirm with a proper modal for better UX
    if (!window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;
    try {
      await deleteProject(id);
      if (selectedProjectId === id) {
          setSelectedProjectId(null);
      }
      await loadProjects();
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (selectedUsersToAdd.length === 0) return;
    try {
      await Promise.all(
        selectedUsersToAdd.map((u) =>
          addProjectUser({ project_id: selectedProjectId, user_id: u.id, role: memberForm.role })
        )
      );
      setSelectedUsersToAdd([]);
      setMemberForm({ role: "collaborator" });
      await loadProjects();
    } catch (err) {
      console.error("Failed to add member:", err);
    }
  };

  const handleRemoveMember = async (projectUserId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      await deleteProjectUser(projectUserId);
      await loadProjects();
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  };
  
  // Derived State
  const filteredProjects = projects.filter((t) =>
    `${t.name} ${t.users.map((u) => u.name).join(" ")}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const groupedProjects = filteredProjects.reduce((acc, project) => {
    const status = project.status || 'running';
    acc[status] = acc[status] || [];
    acc[status].push(project);
    return acc;
  }, {});

  
  const selectedProject = projects.find((t) => t.id === selectedProjectId);
  const isFormVisible = isCreating || editingId;

  // Render UI
  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-80 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Projects</h2>
          {canEdit && (
            <button onClick={handleNewClick} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <FiPlus /> New Project
            </button>
          )}
        </div>
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-300 rounded-md pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="p-4 text-slate-500">Loading projects...</p>
          ) : filteredProjects.length > 0 ? (
            ['upcoming', 'running', 'completed'].map((status) => (
              groupedProjects[status] && groupedProjects[status].length > 0 && (
                <div key={status}>
                  <h3 className="px-4 pt-4 pb-2 text-xs font-semibold text-slate-500 uppercase">
                    {status}
                  </h3>
                  <ul>
                    {groupedProjects[status].map((project) => (
                      <li key={project.id}>
                        <button
                          onClick={() => handleSelectProject(project.id)}
                          className={`w-full text-left flex items-center justify-between p-4 border-b border-slate-100 transition-colors ${selectedProjectId === project.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100'}`}
                        >
                          <div>
                            <p className="font-semibold">
                              {project.name}
                              <span className="ml-2 text-xs text-slate-500 capitalize">{project.status}</span>
                            </p>
                            <p className="text-xs text-slate-500">{project.users.length} member(s)</p>
                          </div>
                          <FiChevronRight className={`transition-transform ${selectedProjectId === project.id ? 'translate-x-1' : ''}`} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ))
          ) : (
            <div className="p-6 text-center text-slate-500">
                <FiUsers className="mx-auto text-4xl text-slate-300 mb-2"/>
                <p className="font-semibold">No projects found</p>
                <p className="text-sm">Try adjusting your search.</p>
            </div>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
            {isFormVisible ? (
                // Create / Edit Project Form
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-1">{editingId ? 'Edit Project' : 'Create a New Project'}</h1>
                    <p className="text-slate-500 mb-6">{editingId ? `Updating ${projectForm.name}` : 'This will create a new project that you can add members to.'}</p>
                    <form onSubmit={handleProjectSubmit} className="space-y-4 bg-white p-6 border border-slate-200 rounded-lg shadow-sm">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                            <input id="name" name="name" value={projectForm.name} onChange={handleFormChange} placeholder="e.g. Engineering" required className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"/>
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea id="description" name="description" value={projectForm.description} onChange={handleFormChange} placeholder="A short description of the project's purpose" className="w-full border border-slate-300 rounded-md p-2 h-24 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="start_date" className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                                <input type="date" id="start_date" name="start_date" value={projectForm.start_date} onChange={handleFormChange} className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                            </div>
                            <div>
                                <label htmlFor="end_date" className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                                <input type="date" id="end_date" name="end_date" value={projectForm.end_date} onChange={handleFormChange} className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="inline-flex items-center gap-2">
                                <input type="checkbox" name="sheet_integration_enabled" checked={projectForm.sheet_integration_enabled} onChange={handleFormChange} className="rounded" />
                                <span className="text-sm font-medium text-slate-700">Enable Sheet Integration</span>
                            </label>
                        </div>
                        {projectForm.sheet_integration_enabled && (
                        <div>
                            <label htmlFor="sheet_id" className="block text-sm font-medium text-slate-700 mb-1">Sheet ID</label>
                            <input id="sheet_id" name="sheet_id" value={projectForm.sheet_id} onChange={handleFormChange} className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        </div>
                        )}
                        <div className="flex items-center gap-3">
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">{editingId ? "Save Changes" : "Create Project"}</button>
                            <button type="button" onClick={resetAndCloseForms} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors">Cancel</button>
                        </div>
                    </form>
                </div>
            ) : selectedProject ? (
                // Selected Project Details
                <div>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">{selectedProject.name}</h1>
                            <p className="text-slate-500 mt-1">{selectedProject.description || 'No description provided.'}</p>
                        </div>
                        {canEdit && (
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleEditClick(selectedProject)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-md transition-colors"><FiEdit /></button>
                                <button onClick={() => handleDeleteProject(selectedProject.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-md transition-colors"><FiTrash2 /></button>
                            </div>
                        )}
                    </div>
                    
                    {/* Member List */}
                    <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Members ({selectedProject.users.length})</h3>
                        <ul className="space-y-3">
                            {selectedProject.users.map((member) => (
                                <li key={member.project_user_id} className="flex justify-between items-center">
                                    <div className="flex items-center">
                                        <Avatar name={member.name} src={member.profile_picture} />
                                        <div>
                                            <p className="font-medium text-slate-800">{member.name || "Invited User"}</p>
                                            <p className="text-sm text-slate-500 capitalize">{member.role}</p>
                                        </div>
                                    </div>
                                    {canManageMembers && user.id !== member.id && (
                                        <button onClick={() => handleRemoveMember(member.project_user_id)} className="text-sm text-slate-500 hover:text-red-600 transition-colors">Remove</button>
                                    )}
                                </li>
                            ))}
                        </ul>
                        {/* Add Member Form */}
                        {canManageMembers && (
                            <form onSubmit={handleAddMember} className="mt-6 pt-6 border-t border-slate-200 flex items-end gap-3">
                                <div className="flex-grow">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Users</label>
                                    <UserMultiSelect selectedUsers={selectedUsersToAdd} setSelectedUsers={setSelectedUsersToAdd} />
                                </div>
                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                    <select name="role" value={memberForm.role} onChange={handleRoleChange} className="border border-slate-300 rounded-md p-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                                        <option value="owner">Owner</option>
                                        <option value="manager">Manager</option>
                                        <option value="collaborator">Collaborator</option>
                                        <option value="viewer">Viewer</option>
                                    </select>
                                </div>
                                <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors">
                                    <FiUserPlus /> Add
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            ) : (
                // Show list of project cards when no project is selected
                <div>
                    {projects.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {projects.map((project) => (
                                <div key={project.id} className="border border-slate-200 rounded-lg shadow-sm p-4 bg-white flex flex-col justify-between">
                                    <div className="mb-4">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-semibold text-slate-800">{project.name}</h3>
                                            <span className="text-xs text-slate-500 capitalize">{project.status}</span>
                                        </div>
                                        {project.description && (
                                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{project.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center -space-x-2 mb-4">
                                        {project.users.slice(0,3).map((member) => (
                                            <Avatar key={member.id} name={member.name} src={member.profile_picture} />
                                        ))}
                                        {project.users.length > 3 && (
                                            <span className="text-xs text-slate-500 ml-2">+{project.users.length - 3} more</span>
                                        )}
                                    </div>
                                    <button onClick={() => handleSelectProject(project.id)} className="self-start text-sm text-blue-600 hover:underline">
                                        View Details
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center h-full flex flex-col items-center justify-center mt-[-5rem]">
                            <FiUsers className="text-6xl text-slate-300 mb-4" />
                            <h2 className="text-xl font-semibold text-slate-700">Welcome to Projects</h2>
                            <p className="text-slate-500 mt-1">Create a new project to get started.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default Projects;
