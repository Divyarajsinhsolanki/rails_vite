import React, { useEffect, useState } from "react";
import {
  getUsers,
  deleteUser,
  updateUser,
  fetchTeams,
  fetchProjects,
  fetchRoles,
} from "../components/api";

const Users = () => {
  const formatRole = (role) =>
    role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    date_of_birth: "",
    profile_picture: null,
    cover_photo: null,
    roles: [],
  });
  const [userToDelete, setUserToDelete] = useState(null);
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [roles, setRoles] = useState([]);

  const fetchUsers = async () => {
    try {
      const { data } = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]); // Ensure users is always an array
    }
  };

  const fetchTeamsData = async () => {
    try {
      const { data } = await fetchTeams();
      setTeams(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching teams:", error);
      setTeams([]);
    }
  };

  const fetchProjectsData = async () => {
    try {
      const { data } = await fetchProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    }
  };

  const fetchRolesData = async () => {
    try {
      const { data } = await fetchRoles();
      setRoles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching roles:", error);
      setRoles([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTeamsData();
    fetchProjectsData();
    fetchRolesData();
  }, []);

  const handleEdit = (user) => {
    setEditingId(user.id);
    setFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      date_of_birth: user.date_of_birth || "",
      profile_picture: null,
      cover_photo: null,
      roles: user.roles || [],
    });
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleRoleChange = (role) => {
    setFormData((prev) => {
      const roles = prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role];
      return { ...prev, roles };
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      const data = new FormData();
      data.append("user[first_name]", formData.first_name);
      data.append("user[last_name]", formData.last_name);
      data.append("user[email]", formData.email);
      data.append("user[date_of_birth]", formData.date_of_birth);
      if (formData.profile_picture) {
        data.append("user[profile_picture]", formData.profile_picture);
      }
      if (formData.cover_photo) {
        data.append("user[cover_photo]", formData.cover_photo);
      }
      formData.roles.forEach((r) => data.append("user[role_names][]", r));
      await updateUser(editingId, data);
      setEditingId(null);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const filtered = users.filter(u =>
    `${u.first_name || ''} ${u.last_name || ''} ${u.email || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Base styles for the 3D effect buttons
  const buttonBaseStyle =
    "px-5 py-2 rounded-full text-sm font-semibold text-white shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[var(--theme-color)]";
  const inputBaseStyle =
    "w-full bg-[rgb(var(--theme-color-rgb)/0.05)] border border-[rgb(var(--theme-color-rgb)/0.3)] rounded-lg p-2 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)]";
  const roleButtonBase =
    "px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 transform hover:scale-105 focus:outline-none";
  const uploadContainerStyle =
    "w-full bg-white/70 border border-dashed border-[rgb(var(--theme-color-rgb)/0.4)] rounded-xl p-3 text-left shadow-sm hover:shadow-md transition-all duration-200";

  return (
    <div className="min-h-screen bg-[rgb(var(--theme-color-rgb)/0.1)] text-gray-800 font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-color)] to-[var(--theme-color)]">User Directory</h1>
        <p className="text-center mb-8 text-gray-600">A futuristic interface to manage your users.</p>
        
        <div className="mb-10 max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border-2 border-gray-200 rounded-full px-6 py-3 text-gray-900 placeholder-gray-400 shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:border-transparent transition-all duration-300"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filtered.map((user) => {
            const userTeams = teams.filter(t => t.users.some(u => u.id === user.id)).map(t => t.name);
            const userProjects = projects.filter(p => p.users.some(u => u.id === user.id)).map(p => p.name);
            return (
            <div key={user.id} className="bg-white/60 backdrop-blur-md border border-gray-200 shadow-2xl shadow-[rgb(var(--theme-color-rgb)/0.1)] rounded-3xl p-6 flex flex-col items-center text-center transition-all duration-300 hover:bg-white/80 hover:shadow-[rgb(var(--theme-color-rgb)/0.2)]">
              {editingId === user.id ? (
                <form onSubmit={handleUpdate} className="w-full flex flex-col gap-3" encType="multipart/form-data">
                  <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="First Name" className={inputBaseStyle} required />
                  <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Last Name" className={inputBaseStyle} required />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className={inputBaseStyle} required />
                  <input type="date" name="date_of_birth" value={formData.date_of_birth || ''} onChange={handleChange} className={`${inputBaseStyle} text-gray-500`} />
                  <div className={uploadContainerStyle}>
                    <label
                      htmlFor="profile_picture"
                      className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2"
                    >
                      Profile Photo
                    </label>
                    <input
                      id="profile_picture"
                      type="file"
                      name="profile_picture"
                      onChange={handleChange}
                      className="w-full text-xs text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[rgb(var(--theme-color-rgb)/0.2)] file:text-[var(--theme-color)] hover:file:bg-[rgb(var(--theme-color-rgb)/0.3)]"
                      accept="image/*"
                    />
                    <p className="mt-1 text-[10px] text-gray-500">Use a clear square image for the best look.</p>
                  </div>
                  <div className={uploadContainerStyle}>
                    <label
                      htmlFor="cover_photo"
                      className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2"
                    >
                      Profile Background
                    </label>
                    <input
                      id="cover_photo"
                      type="file"
                      name="cover_photo"
                      onChange={handleChange}
                      className="w-full text-xs text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[rgb(var(--theme-color-rgb)/0.2)] file:text-[var(--theme-color)] hover:file:bg-[rgb(var(--theme-color-rgb)/0.3)]"
                      accept="image/*"
                    />
                    <p className="mt-1 text-[10px] text-gray-500">Wide landscape images work best for cover photos.</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {roles.map((role) => (
                      <button
                        type="button"
                        key={role}
                        onClick={() => handleRoleChange(role)}
                        className={`${roleButtonBase} ${
                          formData.roles.includes(role)
                            ? "bg-[var(--theme-color)] text-white border-[var(--theme-color)] shadow-md"
                            : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {formatRole(role)}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex justify-center space-x-3 mt-2">
                    <button type="submit" className={`${buttonBaseStyle} bg-gradient-to-br from-green-400 to-teal-500 focus:ring-green-400/50`}>Update</button>
                    <button type="button" onClick={handleCancel} className={`${buttonBaseStyle} bg-gradient-to-br from-gray-500 to-gray-700 focus:ring-gray-500/50`}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="relative mb-4">
                    <img
                      src={user.profile_picture || `https://placehold.co/100x100/EFF6FF/1E40AF?text=${(user.first_name || user.email || 'U').charAt(0).toUpperCase()}`}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-[rgb(var(--theme-color-rgb)/0.5)] shadow-lg"
                      onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/100x100/F9FAFB/9CA3AF?text=Err`; }}
                    />
                     <div className="absolute inset-0 rounded-full border-2 border-black/10 animate-pulse"></div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {user.first_name} {user.last_name}
                  </h2>
                  <p className="text-[var(--theme-color)] text-sm mb-1">{user.email}</p>
                  {user.date_of_birth && (
                    <p className="text-gray-500 text-xs mb-1">
                      Born: {new Date(user.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                  {user.roles && (
                    <p className="text-gray-500 text-xs">Roles: {user.roles.map(formatRole).join(', ')}</p>
                  )}
                  {userTeams.length > 0 && (
                    <p className="text-gray-500 text-xs">Teams: {userTeams.join(', ')}</p>
                  )}
                  {userProjects.length > 0 && (
                    <p className="text-gray-500 text-xs mb-4">Projects: {userProjects.join(', ')}</p>
                  )}
                  <div className="flex space-x-3 mt-auto pt-4">
                    <button onClick={() => handleEdit(user)} className={`${buttonBaseStyle} bg-theme focus:ring-[var(--theme-color)]`}>Edit</button>
                    <button onClick={() => handleDelete(user.id)} className={`${buttonBaseStyle} bg-gradient-to-br from-pink-500 to-red-600 focus:ring-pink-500/50`}>Delete</button>
                  </div>
                </>
              )}
            </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/80 border border-red-300 rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Deletion</h3>
            <p className="text-gray-700 mb-6">Are you sure you want to permanently delete this user?</p>
            <div className="flex justify-center space-x-4">
              <button onClick={confirmDelete} className={`${buttonBaseStyle} bg-gradient-to-br from-pink-500 to-red-600 focus:ring-pink-500/50`}>Yes, Delete</button>
              <button onClick={() => setUserToDelete(null)} className={`${buttonBaseStyle} bg-gradient-to-br from-gray-500 to-gray-700 focus:ring-gray-500/50`}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
