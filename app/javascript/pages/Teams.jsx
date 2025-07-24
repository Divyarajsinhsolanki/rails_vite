import React, { useEffect, useState, useContext } from "react";
import { fetchTeams, createTeam, updateTeam, deleteTeam, addTeamUser, deleteTeamUser } from "../components/api";
import { AuthContext } from "../context/AuthContext";

const Teams = () => {
  const { user } = useContext(AuthContext);
  const canEdit = user?.roles?.some((r) => r.name === "owner");
  const canManageMembers = user?.roles?.some((r) => r.name === "admin");

  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [memberForm, setMemberForm] = useState({ user_id: "", role: "member" });
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState(null);

  const loadTeams = async () => {
    try {
      const { data } = await fetchTeams();
      setTeams(Array.isArray(data) ? data : []);
    } catch {
      setTeams([]);
    }
  };

  useEffect(() => { loadTeams(); }, []);
  useEffect(() => {
    if (teams.length && !selectedTeamId) {
      const mine = teams.find((t) => t.users.some((u) => u.id === user?.id));
      setSelectedTeamId(mine ? mine.id : teams[0].id);
    }
  }, [teams, user, selectedTeamId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateTeam(editingId, form);
        setEditingId(null);
      } else {
        await createTeam(form);
      }
      setForm({ name: "", description: "" });
      loadTeams();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (team) => {
    setEditingId(team.id);
    setForm({ name: team.name, description: team.description || "" });
  };

  const handleDeleteTeam = async (id) => {
    if (!window.confirm("Delete this team?")) return;
    try {
      await deleteTeam(id);
      loadTeams();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMemberChange = (e) => setMemberForm({ ...memberForm, [e.target.name]: e.target.value });

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await addTeamUser({ ...memberForm, team_id: selectedTeamId });
      setMemberForm({ user_id: "", role: "member" });
      loadTeams();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMember = async (teamUserId) => {
    if (!window.confirm("Remove this member?")) return;
    try {
      await deleteTeamUser(teamUserId);
      loadTeams();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = teams.filter((t) =>
    `${t.name} ${t.users.map((u) => u.name).join(" ")}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Teams</h1>

      <div className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Search teams or members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 flex-grow rounded"
        />
        {filtered.length > 0 && (
          <select
            value={selectedTeamId || ''}
            onChange={(e) => setSelectedTeamId(parseInt(e.target.value))}
            className="border p-2 rounded"
          >
            {filtered.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
      </div>

      {canEdit && (
        <form onSubmit={handleSubmit} className="space-y-2 bg-white p-4 border rounded">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Name"
            required
            className="border p-2 w-full rounded"
          />
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
            className="border p-2 w-full rounded"
          />
          <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">
            {editingId ? "Update Team" : "Create Team"}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm({ name: "", description: "" }); }} className="ml-2 px-3 py-1 bg-gray-500 text-white rounded">
              Cancel
            </button>
          )}
        </form>
      )}

      <div className="space-y-4">
        {selectedTeam ? (
          <div className="border rounded p-4 bg-white shadow">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">{selectedTeam.name}</h2>
                {selectedTeam.description && <p className="text-sm text-gray-600">{selectedTeam.description}</p>}
              </div>
              {canEdit && (
                <div className="space-x-2">
                  <button onClick={() => handleEdit(selectedTeam)} className="px-2 py-1 bg-blue-500 text-white rounded">Edit</button>
                  <button onClick={() => handleDeleteTeam(selectedTeam.id)} className="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
                </div>
              )}
            </div>
            <ul className="mt-2 text-sm list-disc pl-5">
              {selectedTeam.users.map((u) => (
                <li key={u.team_user_id} className="flex justify-between items-center">
                  <span>{u.name || "User"} - {u.role}</span>
                  {canManageMembers && (
                    <button onClick={() => handleRemoveMember(u.team_user_id)} className="ml-2 text-red-600">Remove</button>
                  )}
                </li>
              ))}
            </ul>
            {canManageMembers && (
              <form onSubmit={handleAddMember} className="mt-4 flex space-x-2">
                <input
                  name="user_id"
                  value={memberForm.user_id}
                  onChange={handleMemberChange}
                  placeholder="User ID"
                  className="border p-1 flex-grow rounded"
                />
                <select name="role" value={memberForm.role} onChange={handleMemberChange} className="border p-1 rounded">
                  <option value="admin">admin</option>
                  <option value="member">member</option>
                  <option value="viewer">viewer</option>
                </select>
                <button type="submit" className="px-2 py-1 bg-green-500 text-white rounded">Add</button>
              </form>
            )}
          </div>
        ) : (
          <p>No teams found.</p>
        )}
      </div>
    </div>
  );
};

export default Teams;
