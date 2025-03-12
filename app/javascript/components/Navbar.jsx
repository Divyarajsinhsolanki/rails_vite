import React, { useContext } from "react";
import { Link, NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const { user, handleLogout } = useContext(AuthContext);

  return (
    <header className="bg-gray-900 text-white shadow-lg fixed top-0 w-full z-50">
      <div className="container mx-auto flex justify-between items-center p-4">
        <h1 className="text-xl font-bold">MyApp</h1>
        <nav className="flex space-x-6">
          <NavLink to="/" className={({ isActive }) => `px-3 py-2 rounded-md text-lg ${isActive ? "bg-gray-700" : "hover:bg-gray-800"}`}>
            Home
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => `px-3 py-2 rounded-md text-lg ${isActive ? "bg-gray-700" : "hover:bg-gray-800"}`}>
            About
          </NavLink>
          <NavLink to="/posts" className={({ isActive }) => `px-3 py-2 rounded-md text-lg ${isActive ? "bg-gray-700" : "hover:bg-gray-800"}`}>
            Posts
          </NavLink>
          <NavLink to="/view_pdf" className="px-3 py-2 rounded-md text-lg hover:bg-gray-800">
            View PDF
          </NavLink>

          {user ? (
            <>
              <NavLink to="/profile" className="px-3 py-2 rounded-md text-lg hover:bg-gray-800">
                Profile
              </NavLink>
              <button onClick={handleLogout} className="bg-red-600 px-3 py-1 rounded hover:bg-red-700">
                Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className="px-3 py-2 rounded-md text-lg hover:bg-gray-800">
              Login
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
