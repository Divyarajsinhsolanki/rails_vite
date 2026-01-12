import React, { useEffect, useState } from "react";
import { 
  Search, Edit2, Trash2, X, Check, Upload, PencilLine,
  Mail, Calendar, Users as UsersIcon 
} from "lucide-react";
import {
  getUsers,
  deleteUser,
  updateUser,
  fetchTeams,
  fetchProjects,
  fetchRoles,
  fetchDepartments,
} from "../components/api";

const Users = () => {
  // --- State Management ---
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoModalUser, setPhotoModalUser] = useState(null);
  const [photoForm, setPhotoForm] = useState({
    profile_picture: null,
    cover_photo: null,
  });
  
  // Data Lists
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "", last_name: "", email: "",
    date_of_birth: "", profile_picture: null,
    cover_photo: null, roles: [], department_id: ""
  });

  // Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // --- Helpers ---
  const formatRole = (role) =>
    role.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

  // --- API Calls ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [uData, tData, pData, rData, dData] = await Promise.all([
        getUsers(), fetchTeams(), fetchProjects(), fetchRoles(), fetchDepartments()
      ]);
      
      setUsers(Array.isArray(uData.data) ? uData.data : []);
      setTeams(Array.isArray(tData.data) ? tData.data : []);
      setProjects(Array.isArray(pData.data) ? pData.data : []);
      setRoles(Array.isArray(rData.data) ? rData.data : []);
      setDepartments(Array.isArray(dData.data) ? dData.data : []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Handlers ---
  const handleEdit = (user) => {
    setEditingId(user.id);
    setFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      date_of_birth: user.date_of_birth || "",
      department_id: user.department_id || "",
      profile_picture: null,
      cover_photo: null,
      roles: user.roles || [],
    });
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
      const newRoles = prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role];
      return { ...prev, roles: newRoles };
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      const data = new FormData();
      // Append fields (simplified for brevity)
      Object.keys(formData).forEach(key => {
        if (key === 'roles') {
          formData.roles.forEach(r => data.append("user[role_names][]", r));
        } else if (key === 'profile_picture' || key === 'cover_photo') {
          if (formData[key]) data.append(`user[${key}]`, formData[key]);
        } else {
          data.append(`user[${key}]`, formData[key]);
        }
      });
      
      await updateUser(editingId, data);
      setEditingId(null);
      fetchData(); // Refresh list
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  const initiateDelete = (user) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const openPhotoModal = (user) => {
    setPhotoModalUser(user);
    setPhotoForm({
      profile_picture: null,
      cover_photo: null,
    });
    setPhotoModalOpen(true);
  };

  const closePhotoModal = () => {
    setPhotoModalOpen(false);
    setPhotoModalUser(null);
    setPhotoForm({ profile_picture: null, cover_photo: null });
  };

  const handlePhotoChange = (e) => {
    const { name, files } = e.target;
    setPhotoForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : null,
    }));
  };

  const handlePhotoUpdate = async (e) => {
    e.preventDefault();
    if (!photoModalUser) return;

    const data = new FormData();
    if (photoForm.profile_picture) {
      data.append("user[profile_picture]", photoForm.profile_picture);
    }
    if (photoForm.cover_photo) {
      data.append("user[cover_photo]", photoForm.cover_photo);
    }

    if (!photoForm.profile_picture && !photoForm.cover_photo) {
      closePhotoModal();
      return;
    }

    try {
      await updateUser(photoModalUser.id, data);
      await fetchData();
      closePhotoModal();
    } catch (error) {
      console.error("Photo update failed", error);
    }
  };

  const filteredUsers = users.filter(u =>
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  // --- Render Helpers ---
  const UserCard = ({ user }) => {
    const isEditing = editingId === user.id;
    const userTeams = teams.filter(t => t.users?.some(u => u.id === user.id));
    
    // Default gradients for cover if none exists
    const gradients = [
      "from-blue-400 to-indigo-500",
      "from-emerald-400 to-teal-500",
      "from-orange-400 to-pink-500",
      "from-purple-400 to-indigo-500"
    ];
    const randomGradient = gradients[user.id % gradients.length];

    if (isEditing) {
      return (
        <div className="bg-white rounded-2xl shadow-xl ring-2 ring-indigo-500/20 p-6 relative overflow-hidden transition-all">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Edit2 size={18} className="text-indigo-600" /> Edit Profile
          </h3>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">First Name</label>
                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="w-full mt-1 p-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" required />
              </div>
              <div className="col-span-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Last Name</label>
                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="w-full mt-1 p-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" required />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full mt-1 p-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Department</label>
                <select name="department_id" value={formData.department_id} onChange={handleChange} className="w-full mt-1 p-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                  <option value="">None</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Birth Date</label>
                <input type="date" name="date_of_birth" value={formData.date_of_birth?.split('T')[0]} onChange={handleChange} className="w-full mt-1 p-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
              </div>
            </div>

            {/* Role Selection Chips */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Roles</label>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleChange(role)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      formData.roles.includes(role)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    {formatRole(role)}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Check size={16} /> Save
              </button>
              <button type="button" onClick={() => setEditingId(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <X size={16} /> Cancel
              </button>
            </div>
          </form>
        </div>
      );
    }

    // View Mode
    return (
      <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 flex flex-col h-full relative">
        {/* Banner */}
        <div className={`h-24 w-full bg-gradient-to-r ${randomGradient} relative`}>
            {user.cover_photo && (
                <img src={user.cover_photo} alt="cover" className="w-full h-full object-cover opacity-80" />
            )}
            <button
              type="button"
              onClick={() => openPhotoModal(user)}
              className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/70 text-gray-700 px-2.5 py-1 text-xs font-semibold shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <PencilLine size={14} />
              <span>Edit photos</span>
            </button>
        </div>

        {/* Profile Pic & Header */}
        <div className="px-6 relative flex-grow">
          <div className="absolute -top-10 left-6">
            <div className="relative">
              <img
                src={user.profile_picture || `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=random`}
                alt="Profile"
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                onError={(e) => { e.target.src=`https://placehold.co/100x100?text=${user.first_name?.[0]}`; }}
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></span>
            </div>
          </div>

          <div className="mt-12 mb-4">
             <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">
                    {user.first_name} {user.last_name}
                    </h2>
                    <p className="text-indigo-600 font-medium text-sm mb-2">{user.department_name || "Unassigned Dept"}</p>
                </div>
             </div>
            
            {/* Meta Data */}
            <div className="space-y-2 mt-3 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    <span className="truncate">{user.email}</span>
                </div>
                {user.date_of_birth && (
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span>{new Date(user.date_of_birth).toLocaleDateString()}</span>
                    </div>
                )}
                 {userTeams.length > 0 && (
                    <div className="flex items-start gap-2">
                        <UsersIcon size={14} className="text-gray-400 mt-1" />
                        <span className="flex-1 truncate">{userTeams.map(t => t.name).join(", ")}</span>
                    </div>
                )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              {user.roles?.map((role) => (
                <span key={role} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-100">
                  {formatRole(role)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center opacity-80 group-hover:opacity-100 transition-opacity">
            <button 
                onClick={() => handleEdit(user)}
                className="text-gray-600 hover:text-indigo-600 font-medium text-sm flex items-center gap-2 transition-colors"
            >
                <Edit2 size={16} /> Edit
            </button>
            <button 
                onClick={() => initiateDelete(user)}
                className="text-gray-400 hover:text-red-600 font-medium text-sm flex items-center gap-2 transition-colors"
            >
                <Trash2 size={16} /> Delete
            </button>
        </div>
      </div>
    );
  };

  // --- Main UI ---
  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Team Directory
            </h1>
            <p className="text-slate-500 mt-1 text-lg">Manage your team members, roles, and assignments.</p>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full md:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-80 shadow-sm animate-pulse border border-gray-100"></div>
            ))}
          </div>
        ) : (
            <>
                {filteredUsers.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="inline-flex justify-center items-center w-20 h-20 rounded-full bg-slate-100 mb-4">
                            <Search className="text-slate-400" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">No users found</h3>
                        <p className="text-slate-500">Try adjusting your search terms.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                        {filteredUsers.map((user) => (
                        <UserCard key={user.id} user={user} />
                        ))}
                    </div>
                )}
            </>
        )}
      </div>

      {/* Photo Update Modal */}
      {photoModalOpen && photoModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <form
            onSubmit={handlePhotoUpdate}
            encType="multipart/form-data"
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative"
          >
            <button
              type="button"
              onClick={closePhotoModal}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <PencilLine size={18} />
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500 font-semibold tracking-wide">
                  Update Photos
                </p>
                <h3 className="text-lg font-bold text-gray-900">
                  {photoModalUser.first_name} {photoModalUser.last_name}
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block border border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-indigo-300 transition-colors">
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Upload size={16} className="text-indigo-600" />
                  Profile Picture
                </span>
                <input
                  type="file"
                  name="profile_picture"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="mt-2 block w-full text-xs text-gray-600"
                />
              </label>

              <label className="block border border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-indigo-300 transition-colors">
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Upload size={16} className="text-indigo-600" />
                  Background Photo
                </span>
                <input
                  type="file"
                  name="cover_photo"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="mt-2 block w-full text-xs text-gray-600"
                />
              </label>
            </div>

            <div className="mt-5 flex gap-3 justify-end">
              <button
                type="button"
                onClick={closePhotoModal}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-colors"
              >
                Save changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Custom Modal for Deletion */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete User?</h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to remove <span className="font-semibold text-gray-800">{userToDelete?.first_name}</span>? 
                This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 shadow-md shadow-red-200 transition-colors"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
