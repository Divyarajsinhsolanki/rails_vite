import React, { useEffect, useState } from "react";
import { getUsers } from "../components/api";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await getUsers();
        setUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

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
          <div
            key={user.id}
            className="bg-white border border-gray-100 shadow-md rounded-xl p-6 flex flex-col items-center text-center transition-transform transform hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 text-white text-3xl font-bold flex items-center justify-center">
              {(user.first_name || user.email).charAt(0).toUpperCase()}
            </div>
            <h2 className="text-lg font-semibold mb-1">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-gray-500 text-sm mb-1">{user.email}</p>
            {user.date_of_birth && (
              <p className="text-gray-400 text-xs">
                DOB: {new Date(user.date_of_birth).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Users;
