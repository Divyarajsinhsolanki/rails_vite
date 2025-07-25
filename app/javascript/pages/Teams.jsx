import React, { useEffect, useState, useContext } from "react";
import { fetchTeams, createTeam, updateTeam, deleteTeam, addTeamUser, deleteTeamUser } from "../components/api";
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

const Teams = () => {
  const { user } = useContext(AuthContext);
  const canEdit = user?.roles?.some((r) => ["owner", "team_leader"].includes(r.name));
  const canManageMembers = user?.roles?.some((r) => r.name === "admin");

  // State Management
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form States
  const [teamForm, setTeamForm] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [memberForm, setMemberForm] = useState({ role: "member" });
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState([]);

  // Data Fetching
  const loadTeams = async () => {
    setIsLoading(true);
    try {
      const { data } = await fetchTeams();
      const validTeams = Array.isArray(data) ? data : [];
      setTeams(validTeams);
      // If a team was selected, keep it selected. Otherwise, select the user's team or the first one.
      if (!validTeams.some(t => t.id === selectedTeamId)) {
        const userTeam = validTeams.find((t) => t.users.some((u) => u.id === user?.id));
        setSelectedTeamId(userTeam ? userTeam.id : (validTeams[0]?.id || null));
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error);
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      const userTeam = teams.find((t) => t.users.some((u) => u.id === user?.id));
      setSelectedTeamId(userTeam ? userTeam.id : teams[0].id);
    }
  }, [teams, selectedTeamId, user]);

  // Event Handlers
  const handleFormChange = (e) => setTeamForm({ ...teamForm, [e.target.name]: e.target.value });
  const handleRoleChange = (e) => setMemberForm({ ...memberForm, role: e.target.value });

  const resetAndCloseForms = () => {
    setEditingId(null);
    setIsCreating(false);
    setTeamForm({ name: "", description: "" });
  };
  
  const handleSelectTeam = (id) => {
    setSelectedTeamId(id);
    resetAndCloseForms();
  }

  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    const action = editingId ? updateTeam(editingId, teamForm) : createTeam(teamForm);
    try {
      await action;
      resetAndCloseForms();
      await loadTeams(); // Reload to get the latest data
    } catch (err) {
      console.error("Failed to save team:", err);
      // Here you could add user-facing error notifications
    }
  };

  const handleEditClick = (team) => {
    setEditingId(team.id);
    setIsCreating(false);
    setTeamForm({ name: team.name, description: team.description || "" });
    setSelectedTeamId(team.id);
  };
  
  const handleNewClick = () => {
      setIsCreating(true);
      setEditingId(null);
      setSelectedTeamId(null); // Deselect any team
      setTeamForm({ name: "", description: "" });
  }

  const handleDeleteTeam = async (id) => {
    // Replace window.confirm with a proper modal for better UX
    if (!window.confirm("Are you sure you want to delete this team? This action cannot be undone.")) return;
    try {
      await deleteTeam(id);
      if (selectedTeamId === id) {
          setSelectedTeamId(null);
      }
      await loadTeams();
    } catch (err) {
      console.error("Failed to delete team:", err);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (selectedUsersToAdd.length === 0) return;
    try {
      await Promise.all(
        selectedUsersToAdd.map((u) =>
          addTeamUser({ team_id: selectedTeamId, user_id: u.id, role: memberForm.role })
        )
      );
      setSelectedUsersToAdd([]);
      setMemberForm({ role: "member" });
      await loadTeams();
    } catch (err) {
      console.error("Failed to add member:", err);
    }
  };

  const handleRemoveMember = async (teamUserId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      await deleteTeamUser(teamUserId);
      await loadTeams();
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  };
  
  // Derived State
  const filteredTeams = teams.filter((t) =>
    `${t.name} ${t.users.map((u) => u.name).join(" ")}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );
  
  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const isFormVisible = isCreating || editingId;

  // Render UI
  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-80 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Teams</h2>
          {canEdit && (
            <button onClick={handleNewClick} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <FiPlus /> New Team
            </button>
          )}
        </div>
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-300 rounded-md pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="p-4 text-slate-500">Loading teams...</p>
          ) : filteredTeams.length > 0 ? (
            <ul>
              {filteredTeams.map((team) => (
                <li key={team.id}>
                  <button
                    onClick={() => handleSelectTeam(team.id)}
                    className={`w-full text-left flex items-center justify-between p-4 border-b border-slate-100 transition-colors ${selectedTeamId === team.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100'}`}
                  >
                    <div>
                        <p className="font-semibold">{team.name}</p>
                        <p className="text-xs text-slate-500">{team.users.length} member(s)</p>
                    </div>
                    <FiChevronRight className={`transition-transform ${selectedTeamId === team.id ? 'translate-x-1' : ''}`} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 text-center text-slate-500">
                <FiUsers className="mx-auto text-4xl text-slate-300 mb-2"/>
                <p className="font-semibold">No teams found</p>
                <p className="text-sm">Try adjusting your search.</p>
            </div>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
            {isFormVisible ? (
                // Create / Edit Team Form
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-1">{editingId ? 'Edit Team' : 'Create a New Team'}</h1>
                    <p className="text-slate-500 mb-6">{editingId ? `Updating ${teamForm.name}` : 'This will create a new team that you can add members to.'}</p>
                    <form onSubmit={handleTeamSubmit} className="space-y-4 bg-white p-6 border border-slate-200 rounded-lg shadow-sm">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Team Name</label>
                            <input id="name" name="name" value={teamForm.name} onChange={handleFormChange} placeholder="e.g. Engineering" required className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"/>
                        </div>
                         <div>
                            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea id="description" name="description" value={teamForm.description} onChange={handleFormChange} placeholder="A short description of the team's purpose" className="w-full border border-slate-300 rounded-md p-2 h-24 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                        </div>
                        <div className="flex items-center gap-3">
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">{editingId ? "Save Changes" : "Create Team"}</button>
                            <button type="button" onClick={resetAndCloseForms} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors">Cancel</button>
                        </div>
                    </form>
                </div>
            ) : selectedTeam ? (
                // Selected Team Details
                <div>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">{selectedTeam.name}</h1>
                            <p className="text-slate-500 mt-1">{selectedTeam.description || 'No description provided.'}</p>
                        </div>
                        {canEdit && (
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleEditClick(selectedTeam)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-md transition-colors"><FiEdit /></button>
                                <button onClick={() => handleDeleteTeam(selectedTeam.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-md transition-colors"><FiTrash2 /></button>
                            </div>
                        )}
                    </div>
                    
                    {/* Member List */}
                    <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Members ({selectedTeam.users.length})</h3>
                        <ul className="space-y-3">
                            {selectedTeam.users.map((member) => (
                                <li key={member.team_user_id} className="flex justify-between items-center">
                                    <div className="flex items-center">
                                        <Avatar name={member.name} src={member.profile_picture} />
                                        <div>
                                            <p className="font-medium text-slate-800">{member.name || "Invited User"}</p>
                                            <p className="text-sm text-slate-500 capitalize">{member.role}</p>
                                            {member.email && (
                                              <p className="text-sm text-slate-500">Email: {member.email}</p>
                                            )}
                                            <p className="text-sm text-slate-500">Team: {selectedTeam.name}</p>
                                        </div>
                                    </div>
                                    {canManageMembers && user.id !== member.id && (
                                        <button onClick={() => handleRemoveMember(member.team_user_id)} className="text-sm text-slate-500 hover:text-red-600 transition-colors">Remove</button>
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
                                        <option value="admin">Admin</option>
                                        <option value="member">Member</option>
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
            ) : isLoading ? (
                <div className="text-center h-full flex flex-col items-center justify-center mt-[-5rem]">
                    <p className="text-slate-500">Loading...</p>
                </div>
            ) : (
                // Empty State for Main Content
                <div className="text-center h-full flex flex-col items-center justify-center mt-[-5rem]">
                    <FiUsers className="text-6xl text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700">Welcome to Teams</h2>
                    <p className="text-slate-500 mt-1">
                        {teams.length > 0 ? "Select a team from the sidebar to view its details." : "Create a new team to get started."}
                    </p>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default Teams;