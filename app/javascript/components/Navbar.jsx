import React, { useContext } from "react";
import { Link, NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import logo from "../images/logo.jpg"; // Import your logo

const Navbar = () => {
  const { user, handleLogout } = useContext(AuthContext);

  return (
    <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg fixed top-0 w-full z-50">
      <div className="container mx-auto flex justify-between items-center p-2">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Logo" className="h-10 w-auto mr-3" />
          <h1 className="text-xl font-bold">MyApp</h1>
        </Link>

        <nav className="flex space-x-6">
          <NavLink to="/posts" className={({ isActive }) => `px-3 py-2 rounded-md text-lg ${isActive ? "bg-indigo-900" : "hover:bg-purple-800"}`}>
            Posts
          </NavLink>

          {user ? (
            <>
              <NavLink to="/profile" className={({ isActive }) => `px-3 py-2 rounded-md text-lg ${isActive ? "bg-indigo-900" : "hover:bg-purple-800"}`}>
                Profile
              </NavLink>
              <button onClick={handleLogout} className="bg-red-600 px-3 py-1 rounded hover:bg-red-700">
                Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className={({ isActive }) => `px-3 py-2 rounded-md text-lg ${isActive ? "bg-indigo-900" : "hover:bg-purple-800"}`}>
              Login
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
