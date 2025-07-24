import React, { useContext, useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { fetchProjects } from "./api";
import logo from "../images/logo.webp";

const Navbar = () => {
  const { user, handleLogout } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (!user) { setProjects([]); return; }
    fetchProjects().then(({ data }) => {
      const list = Array.isArray(data) ? data.filter(p => p.users.some(u => u.id === user.id)) : [];
      setProjects(list);
    });
  }, [user]);

  return (
    <header className="bg-white shadow-md fixed top-0 w-full z-50">
      <div className="container mx-auto flex justify-between items-center py-3 px-4">
        <Link to="/" className="flex items-center space-x-3">
          <img src={logo} alt="Logo" className="h-10 w-auto" />
          <h1 className="text-2xl font-semibold text-indigo-700">Work Dashboard</h1>
        </Link>

          <nav className="flex items-center gap-6">
            {user ? (
              <>
                {[
                  "posts",
                  "vault",
                  "projects",
                  "teams",
                  "knowledge",
                  "profile",
                  "contact",
                  user.roles?.some((r) => r.name === "owner") && "users",
                  user.roles?.some((r) => r.name === "owner") && "admin",
                ]
                  .filter(Boolean)
                  .map((route) => (
                    <NavLink
                      key={route}
                      to={`/${route}`}
                      className={({ isActive }) =>
                        `relative pb-1 text-gray-700 font-medium hover:text-indigo-600 transition ${
                          isActive
                            ? "after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-500"
                            : ""
                        }`
                      }
                    >
                      {route.charAt(0).toUpperCase() + route.slice(1).replace("_", " ")}
                    </NavLink>
                  ))}

                {projects.map((p) => (
                  <NavLink
                    key={`project-${p.id}`}
                    to={`/projects/${p.id}/dashboard`}
                    className={({ isActive }) =>
                      `relative pb-1 text-gray-700 font-medium hover:text-indigo-600 transition ${
                        isActive
                          ? "after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-500"
                          : ""
                      }`
                    }
                  >
                    {p.name} Dashboard
                  </NavLink>
                ))}

                <button
                  onClick={handleLogout}
                  className="ml-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/"
                  state={{ mode: "login" }}
                  className="text-gray-700 font-medium hover:text-indigo-600 transition"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/"
                  state={{ mode: "signup" }}
                  className="text-gray-700 font-medium hover:text-indigo-600 transition"
                >
                  Sign Up
                </NavLink>
              </>
            )}
          </nav>
      </div>
    </header>
  );
};

export default Navbar;
