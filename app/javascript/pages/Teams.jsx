import React, { useEffect, useState, useContext } from "react";
import { fetchTeams, createTeam, updateTeam, deleteTeam } from "../components/api";
import { AuthContext } from "../context/AuthContext";

const Teams = () => {
  const { user } = useContext(AuthContext);
  const canEdit = user?.roles?.some((r) => ["owner", "admin"].includes(r.name));

  const [teams, setTeams] = useState([]);
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

  const filtered = teams.filter((t) => {
    const text = `${t.name} ${t.users.map((u) => u.name).join(" ")}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

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
        {filtered.map((team) => (
          <div key={team.id} className="border rounded p-4 bg-white shadow">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">{team.name}</h2>
                {team.description && <p className="text-sm text-gray-600">{team.description}</p>}
              </div>
              {canEdit && (
                <div className="space-x-2">
                  <button onClick={() => handleEdit(team)} className="px-2 py-1 bg-blue-500 text-white rounded">Edit</button>
                  <button onClick={() => handleDeleteTeam(team.id)} className="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
                </div>
              )}
            </div>
            <ul className="mt-2 text-sm list-disc pl-5">
              {team.users.map((u) => (
                <li key={u.id}>{u.name || "User"} - {u.role}</li>
              ))}
            </ul>
          </div>
        ))}
        {filtered.length === 0 && <p>No teams found.</p>}
      </div>
    </div>
  );
};

export default Teams;
