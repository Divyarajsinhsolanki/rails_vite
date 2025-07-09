import React, { useEffect, useState } from "react";
import { getUsers, deleteUser, updateUser } from "../components/api";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    date_of_birth: "",
    profile_picture: null,
  });

  const fetchUsers = async () => {
    try {
      const { data } = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user) => {
    setEditingId(user.id);
    setFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      date_of_birth: user.date_of_birth || "",
      profile_picture: null,
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
    `${u.first_name || ''} ${u.last_name || ''} ${u.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">User Directory</h1>

      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-8 w-full md:w-1/2 mx-auto block border rounded-lg px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-400"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((user) => (
          <div key={user.id} className="bg-white border border-gray-100 shadow-md rounded-xl p-6 flex flex-col items-center text-center">
            {editingId === user.id ? (
              <form onSubmit={handleUpdate} className="w-full" encType="multipart/form-data">
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="First Name"
                  className="w-full mb-2 p-2 border rounded"
                  required
                />
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className="w-full mb-2 p-2 border rounded"
                  required
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="w-full mb-2 p-2 border rounded"
                  required
                />
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth || ''}
                  onChange={handleChange}
                  className="w-full mb-2 p-2 border rounded"
                />
                <input
                  type="file"
                  name="profile_picture"
                  onChange={handleChange}
                  className="w-full mb-4"
                  accept="image/*"
                />
                <div className="flex justify-center space-x-2">
                  <button type="submit" className="px-4 py-1 bg-green-500 text-white rounded">
                    Update
                  </button>
                  <button type="button" onClick={handleCancel} className="px-4 py-1 bg-gray-400 text-white rounded">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                {user.profile_picture && user.profile_picture !== 'null' ? (
                  <img
                    src={user.profile_picture}
                    alt="Profile"
                    className="w-20 h-20 mb-4 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 text-white text-3xl font-bold flex items-center justify-center">
                    {(user.first_name || user.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <h2 className="text-lg font-semibold mb-1">
                  {user.first_name} {user.last_name}
                </h2>
                <p className="text-gray-500 text-sm mb-1">{user.email}</p>
                {user.date_of_birth && (
                  <p className="text-gray-400 text-xs mb-2">
                    DOB: {new Date(user.date_of_birth).toLocaleDateString()}
                  </p>
                )}
                <div className="flex space-x-2 mt-2">
                  <button onClick={() => handleEdit(user)} className="px-3 py-1 bg-blue-500 text-white rounded">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(user.id)} className="px-3 py-1 bg-red-500 text-white rounded">
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Users;
