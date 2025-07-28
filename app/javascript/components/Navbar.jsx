import React, { useContext, useEffect, useState, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { fetchProjects } from "./api";
import logo from "../images/logo.webp";

// Third-party libraries for icons and animations
import { FiChevronDown, FiMenu, FiX, FiLogOut, FiUser, FiUsers, FiBriefcase } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

// Helper hook to detect clicks outside an element (for closing dropdowns)
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
    };
  }, [ref, handler]);
};

// --- Reusable Dropdown Component ---
const NavDropdown = ({ triggerText, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  useClickOutside(dropdownRef, () => setIsOpen(false));

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-base font-medium text-zinc-600 hover:text-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400 transition-colors"
      >
        {triggerText}
        <FiChevronDown
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-48 bg-white dark:bg-zinc-800 rounded-md shadow-lg border dark:border-zinc-700 z-50"
          >
            <ul className="py-1">
              {items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main Navbar Component ---
const Navbar = () => {
  const { user, handleLogout } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useClickOutside(profileRef, () => setIsProfileOpen(false));

  useEffect(() => {
    if (user) {
      fetchProjects().then(({ data }) => {
        const userProjects = Array.isArray(data)
          ? data.filter((p) => p.users.some((u) => u.id === user.id))
          : [];
        setProjects(userProjects);
      });
    } else {
      setProjects([]);
    }
  }, [user]);

  // --- Navigation Links Data (Clean & Maintainable) ---
  const navLinks = [
    { to: "/posts", label: "Community", visible: !!user },
    { to: "/knowledge", label: "Knowledge Board", visible: !!user },
    // ADDED: Teams link with role-based visibility
    { 
      to: "/teams", 
      label: "Manage Teams", 
      visible: user?.roles?.some(r => ["owner", "team_leader"].includes(r.name)) 
    },
    { 
      to: "/projects", 
      label: "Manage Projects", 
      visible: user?.roles?.some(r => ["owner", "project_manager"].includes(r.name)) 
    },
  ];

  const projectLinks = projects.map((p) => ({
    to: `/projects/${p.id}/dashboard`,
    label: `${p.name} Board`,
  }));

  const hasAdminRole = user?.roles?.some((r) => ["owner", "admin"].includes(r.name));
  const isOwner = user?.roles?.some(r => r.name === 'owner');

  return (
    <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg shadow-sm sticky top-0 w-full z-50 border-b border-zinc-200 dark:border-zinc-800">
      <div className="container mx-auto flex justify-between items-center py-3 px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
          <img src={logo} alt="Logo" className="h-9 w-auto" />
          <h1 className="hidden sm:block text-xl font-bold text-zinc-800 dark:text-zinc-100">
            Dashboard
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map(
            (link) =>
              link.visible && (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `text-base font-medium transition-colors ${
                      isActive
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-zinc-600 hover:text-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              )
          )}
          {projectLinks.length > 0 && (
            <NavDropdown triggerText="Projects" items={projectLinks} />
          )}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative" ref={profileRef}>
              <button onClick={() => setIsProfileOpen(!isProfileOpen)}>
                <img
                  src={user.profile_picture || `https://ui-avatars.com/api/?name=${user.email}&background=random`}
                  alt="User Avatar"
                  className="h-9 w-9 rounded-full ring-2 ring-offset-2 dark:ring-offset-zinc-900 ring-transparent hover:ring-indigo-500 transition-all"
                />
              </button>
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-3 w-56 bg-white dark:bg-zinc-800 rounded-md shadow-lg border dark:border-zinc-700"
                  >
                    <div className="px-4 py-3 border-b dark:border-zinc-700">
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{user.first_name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {user.roles?.[0]?.name.replace("_", " ") || "Member"}
                      </p>
                    </div>
                    <ul className="py-2">
                       {hasAdminRole && (
                          <li>
                            <NavLink to="/admin" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"><FiBriefcase/> Admin Panel</NavLink>
                          </li>
                        )}
                        <li>
                            <NavLink to="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"><FiUser/> Profile</NavLink>
                        </li>
                        {/* ADDED: Users link with role-based visibility */}
                        {isOwner && (
                            <li>
                                <NavLink to="/users" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"><FiUsers /> Manage Users</NavLink>
                            </li>
                        )}
                    </ul>
                    <div className="border-t dark:border-zinc-700 px-2 py-2">
                        <button
                        onClick={() => { handleLogout(); setIsProfileOpen(false); }}
                        className="flex items-center gap-3 w-full rounded-md px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                            <FiLogOut /> Logout
                        </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2">
              <Link to="/" state={{ mode: "login" }} className="px-4 py-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-500">Login</Link>
              <Link to="/" state={{ mode: "signup" }} className="px-4 py-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-full hover:bg-indigo-500">Sign Up</Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button onClick={() => setIsMobileMenuOpen(true)}>
              <FiMenu className="h-6 w-6 text-zinc-700 dark:text-zinc-200" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 bg-white dark:bg-zinc-900 z-50 lg:hidden"
          >
            <div className="flex justify-between items-center p-4 border-b dark:border-zinc-800">
                <Link to="/" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
                    <img src={logo} alt="Logo" className="h-9 w-auto" />
                </Link>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                    <FiX className="h-6 w-6 text-zinc-700 dark:text-zinc-200" />
                </button>
            </div>
            <nav className="p-4 flex flex-col h-[calc(100vh-65px)]">
              <div className="flex-grow space-y-2">
                {user ? (
                    <>
                        {navLinks.map(link => link.visible && (
                            <NavLink key={link.to} to={link.to} onClick={() => setIsMobileMenuOpen(false)} className="block text-lg font-medium p-3 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800">{link.label}</NavLink>
                        ))}
                        {projectLinks.length > 0 && <h3 className="px-3 pt-4 text-sm font-semibold text-zinc-400 uppercase">Projects</h3>}
                        {projectLinks.map(link => (
                            <NavLink key={link.to} to={link.to} onClick={() => setIsMobileMenuOpen(false)} className="block p-3 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800">{link.label}</NavLink>
                        ))}
                    </>
                ) : (
                    <>
                        <Link to="/" state={{ mode: "login" }} onClick={() => setIsMobileMenuOpen(false)} className="block p-3 text-lg">Login</Link>
                        <Link to="/" state={{ mode: "signup" }} onClick={() => setIsMobileMenuOpen(false)} className="block p-3 text-lg">Sign Up</Link>
                    </>
                )}
              </div>
              {/* ADDED: Profile & Logout links at the bottom of the mobile menu */}
              {user && (
                <div className="border-t dark:border-zinc-800 pt-4 space-y-2">
                    <NavLink to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"><FiUser /> Profile</NavLink>
                    {isOwner && (
                      <NavLink to="/users" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"><FiUsers /> Manage Users</NavLink>
                    )}
                    <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 w-full text-left p-3 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10">
                      <FiLogOut /> Logout
                    </button>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;