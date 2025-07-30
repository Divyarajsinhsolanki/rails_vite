import React, { useState, useEffect, useRef } from "react";
import { getUsers } from "./api";

const UserMultiSelect = ({
  selectedUsers,
  setSelectedUsers,
  excludedIds = [],
  placeholder = "Search users...",
}) => {
  const [allUsers, setAllUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await getUsers();
        setAllUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load users", e);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const addUser = (user) => {
    if (!selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setQuery("");
    setShowDropdown(false);
  };

  const removeUser = (id) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== id));
  };

  const filtered = allUsers.filter((u) => {
    const text = `${u.first_name || ""} ${u.last_name || ""} ${u.email || ""}`.toLowerCase();
    const isSelected = selectedUsers.some((s) => s.id === u.id);
    const isExcluded = excludedIds.includes(u.id);
    return text.includes(query.toLowerCase()) && !isSelected && !isExcluded;
  });

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex flex-wrap gap-2 mb-1">
        {selectedUsers.map((u) => (
          <span key={u.id} className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
            {`${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email}
            <button
              type="button"
              className="ml-1 text-blue-500 hover:text-blue-700"
              onClick={() => removeUser(u.id)}
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        placeholder={placeholder}
        className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
      />
      {showDropdown && filtered.length > 0 && (
        <ul className="absolute z-10 bg-white border border-slate-200 rounded-md shadow mt-1 max-h-60 overflow-y-auto w-full">
          {filtered.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => addUser(u)}
                className="block w-full text-left px-3 py-2 hover:bg-slate-100"
              >
                {`${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email} ({u.email})
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserMultiSelect;
