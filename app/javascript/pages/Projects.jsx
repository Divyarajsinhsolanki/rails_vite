import React, { useEffect, useState, useContext } from "react";
import { fetchProjects, createProject, updateProject, deleteProject, addProjectUser, deleteProjectUser, getUsers } from "../components/api";
import { AuthContext } from "../context/AuthContext";
// Import icons (e.g., from Feather Icons)
import { FiPlus, FiEdit, FiTrash2, FiUsers, FiSearch, FiX, FiUserPlus, FiChevronRight } from 'react-icons/fi';

// A small utility component for user avatars
const Avatar = ({ name }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm mr-3">
      {initial}
    </div>
  );
};

const Projects = () => {
  const { user } = useContext(AuthContext);
  const canEdit = user?.roles?.some((r) => r.name === "owner");
  const canManageMembers = user?.roles?.some((r) => r.name === "admin");

  // State Management
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  
  // Form States
  const [projectForm, setProjectForm] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [memberForm, setMemberForm] = useState({ user_id: "", role: "collaborator" });

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
    const loadUsers = async () => {
      try {
        const { data } = await getUsers();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Event Handlers
  const handleFormChange = (e) => setProjectForm({ ...projectForm, [e.target.name]: e.target.value });
  const handleMemberFormChange = (e) => setMemberForm({ ...memberForm, [e.target.name]: e.target.value });

  const resetAndCloseForms = () => {
    setEditingId(null);
    setIsCreating(false);
    setProjectForm({ name: "", description: "" });
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
    setProjectForm({ name: project.name, description: project.description || "" });
    setSelectedProjectId(project.id);
  };
  
  const handleNewClick = () => {
      setIsCreating(true);
      setEditingId(null);
      setSelectedProjectId(null); // Deselect any project
      setProjectForm({ name: "", description: "" });
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
    if (!memberForm.user_id) return;
    try {
      await addProjectUser({ ...memberForm, project_id: selectedProjectId });
      setMemberForm({ user_id: "", role: "collaborator" }); // Reset form
      await loadProjects(); // Refresh data
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

  const filteredUsers = users.filter((u) =>
    `${u.first_name} ${u.last_name} ${u.email}`
      .toLowerCase()
      .includes(userSearch.toLowerCase())
  );
  
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
            <ul>
              {filteredProjects.map((project) => (
                <li key={project.id}>
                  <button
                    onClick={() => handleSelectProject(project.id)}
                    className={`w-full text-left flex items-center justify-between p-4 border-b border-slate-100 transition-colors ${selectedProjectId === project.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100'}`}
                  >
                    <div>
                        <p className="font-semibold">{project.name}</p>
                        <p className="text-xs text-slate-500">{project.users.length} member(s)</p>
                    </div>
                    <FiChevronRight className={`transition-transform ${selectedProjectId === project.id ? 'translate-x-1' : ''}`} />
                  </button>
                </li>
              ))}
            </ul>
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
                                        <Avatar name={member.name} />
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
                                    <label htmlFor="user_search" className="block text-sm font-medium text-slate-700 mb-1">Find User</label>
                                    <input
                                        id="user_search"
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        placeholder="Search users..."
                                        className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                    <select
                                        name="user_id"
                                        value={memberForm.user_id}
                                        onChange={handleMemberFormChange}
                                        className="w-full mt-2 border border-slate-300 rounded-md p-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    >
                                        <option value="">Select user</option>
                                        {filteredUsers.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {`${u.first_name} ${u.last_name}`.trim() || u.email}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                    <select name="role" value={memberForm.role} onChange={handleMemberFormChange} className="border border-slate-300 rounded-md p-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
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
                // Empty State for Main Content
                <div className="text-center h-full flex flex-col items-center justify-center mt-[-5rem]">
                    <FiUsers className="text-6xl text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700">Welcome to Projects</h2>
                    <p className="text-slate-500 mt-1">
                        {projects.length > 0 ? "Select a project from the sidebar to view its details." : "Create a new project to get started."}
                    </p>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default Projects;
