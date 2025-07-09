import React, { useEffect, useState } from "react";
import { getUsers } from "../components/api";

const Users = () => {
  const [users, setUsers] = useState([]);

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

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-center">Users</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div key={user.id} className="bg-white shadow rounded-lg p-6 flex flex-col items-center">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xl font-bold mb-3">
              {(user.first_name || user.email).charAt(0)}
            </div>
            <h2 className="text-lg font-semibold">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-gray-600 text-sm">{user.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Users;
