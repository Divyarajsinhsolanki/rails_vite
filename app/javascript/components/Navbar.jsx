import React, { useContext, useEffect, useState, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { fetchProjects } from "./api";
import logo from "../images/logo.webp";

// Icons
import {
  FiChevronDown, FiMenu, FiX, FiLogOut, FiUser,
  FiUsers, FiBriefcase, FiHome, FiLayers, FiBook,
  FiMessageSquare, FiSettings, FiZap, FiAward, FiFileText
} from "react-icons/fi";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

// Custom hook for dynamic navbar effects
const useNavbarEffects = () => {
  const [scrolled, setScrolled] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 10);
    setAtTop(latest < 5);
  });

  return { scrolled, atTop };
};

// Holographic Avatar Component
const HolographicAvatar = ({ user }) => {
  const [angle, setAngle] = useState(0);
  const avatarRef = useRef(null);

  useEffect(() => {
    const handleMove = (e) => {
      if (avatarRef.current) {
        const rect = avatarRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const newAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        setAngle(newAngle);
      }
    };

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div 
      ref={avatarRef}
      className="relative h-10 w-10 rounded-full overflow-hidden group"
    >
      <img
        src={user.profile_picture || `https://ui-avatars.com/api/?name=${user.email}&background=random`}
        alt="User Avatar"
        className="absolute inset-0 h-full w-full object-cover z-10 group-hover:opacity-80 transition-opacity"
      />
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(${angle}deg, 
            rgba(59, 130, 246, 0.4) 0%,
            rgba(56, 189, 248, 0.4) 30%,
            rgba(186, 230, 253, 0.4) 70%,
            rgba(59, 130, 246, 0.4) 100%)`,
          filter: 'blur(8px)',
        }}
      />
      <div className="absolute inset-0 rounded-full border-2 border-white/20 group-hover:border-blue-400/30 transition-all duration-300" />
    </div>
  );
};

// Animated NavLink Component
const AnimatedNavLink = ({ to, label, icon: Icon }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <NavLink
      to={to}
      className="relative flex items-center gap-2 px-3 py-2 rounded-lg group"
    >
      <div className={`relative z-10 flex items-center gap-2 ${isActive ? 'text-white' : 'text-zinc-600 dark:text-zinc-300'}`}>
        {Icon && <Icon className="h-5 w-5" />}
        <span className="font-medium">{label}</span>
      </div>
      
      {isActive && (
        <motion.div 
          layoutId="nav-active-bg"
          className="absolute inset-0 bg-gradient-to-r from-blue-500 to-sky-600 rounded-lg shadow-lg"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        />
      )}
      
      {!isActive && (
        <motion.div 
          className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 opacity-0 group-hover:opacity-100 rounded-lg"
          transition={{ duration: 0.2 }}
        />
      )}
    </NavLink>
  );
};

// Projects Dropdown Component
const ProjectsDropdown = ({ projects, onItemClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative group" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <FiLayers className="h-5 w-5" />
        <span className="font-medium">Projects</span>
        <FiChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border dark:border-zinc-700 overflow-hidden z-50"
          >
            {projects.map((project) => (
              <NavLink
                key={project.to}
                to={project.to}
                onClick={() => {
                  onItemClick();
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                <FiZap className="h-4 w-4 text-blue-500" />
                {project.label}
              </NavLink>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Main Navbar Component
const Navbar = () => {
  const { user, handleLogout } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const { scrolled, atTop } = useNavbarEffects();
  const location = useLocation();

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchProjects().then(({ data }) => {
        const userProjects = Array.isArray(data)
          ? data.filter((p) => p.users.some((u) => u.id === user.id))
          : [];
        setProjects(userProjects.map(p => ({
          to: `/projects/${p.id}/dashboard`,
          label: p.name
        })));
      });
    } else {
      setProjects([]);
    }
  }, [user]);

  // Navigation configuration
  const navLinks = [
    { to: "/", label: "Home", icon: FiHome, visible: !!user },
    { to: "/pdf", label: "PDF Modifier", icon: FiFileText, visible: !!user },
    { to: "/knowledge", label: "Knowledge", icon: FiBook, visible: !!user },
    { to: "/vault", label: "Vault", visible: !!user },
    { 
      to: "/teams", 
      label: "Teams", 
      icon: FiUsers, 
      visible: user?.roles?.some(r => ["owner", "team_leader"].includes(r.name)) 
    },
    { 
      to: "/projects", 
      label: "Projects", 
      icon: FiLayers, 
      visible: user?.roles?.some(r => ["owner", "project_manager"].includes(r.name)) 
    },
  ];

  const hasAdminRole = user?.roles?.some((r) => ["owner", "admin"].includes(r.name));
  const isOwner = user?.roles?.some(r => r.name === 'owner');

  // Dynamic background based on scroll and route
  const getNavbarBackground = () => {
    if (location.pathname === '/') {
      return atTop 
        ? 'bg-transparent backdrop-filter-none shadow-none border-transparent' 
        : 'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg shadow-sm border-zinc-200 dark:border-zinc-800';
    }
    return 'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg shadow-sm border-zinc-200 dark:border-zinc-800';
  };

  return (
    <motion.header 
      className={`sticky top-0 w-full z-50 border-b transition-all duration-300 ${getNavbarBackground()}`}
      animate={{
        height: scrolled ? '70px' : '80px',
      }}
    >
      <div className="container mx-auto flex justify-between items-center h-full px-4 sm:px-6">
        {/* Logo */}
        <Link 
          to="/" 
          className="flex items-center gap-3 group" 
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <img src={logo} alt="Logo" className="h-8 w-auto transition-transform group-hover:scale-110" />
          <motion.h1 
            className="hidden sm:block text-xl font-bold text-zinc-800 dark:text-zinc-100"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            Nexus<span className="text-blue-500">Hub</span>
          </motion.h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map(
            (link) =>
              link.visible && (
                <AnimatedNavLink
                  key={link.to}
                  to={link.to}
                  label={link.label}
                  icon={link.icon}
                />
              )
          )}
          
          {projects.length > 0 && (
            <ProjectsDropdown 
              projects={projects} 
              onItemClick={() => setIsMobileMenuOpen(false)}
            />
          )}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="relative"
              >
                <HolographicAvatar user={user} />
                {hasAdminRole && (
                  <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-sky-600 text-white text-xs px-1.5 py-0.5 rounded-full border-2 border-white dark:border-zinc-900">
                    <FiAward className="h-3 w-3" />
                  </div>
                )}
              </button>
              
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-3 w-64 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border dark:border-zinc-700 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b dark:border-zinc-700 bg-gradient-to-r from-blue-500/10 to-sky-600/10">
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                        {user.roles?.[0]?.name.replace("_", " ") || "Member"}
                      </p>
                    </div>
                    
                    <div className="p-2">
                      {hasAdminRole && (
                        <NavLink 
                          to="/admin" 
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        >
                          <FiBriefcase className="h-4 w-4 text-blue-500" />
                          Admin Panel
                        </NavLink>
                      )}
                      
                      <NavLink
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
                      >
                        <FiUser className="h-4 w-4 text-blue-500" />
                        My Profile
                      </NavLink>
                      
                      {isOwner && (
                        <NavLink
                          to="/users"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        >
                          <FiUsers className="h-4 w-4 text-blue-500" />
                          User Management
                        </NavLink>
                      )}
                      
                      <NavLink
                        to="/settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
                      >
                        <FiSettings className="h-4 w-4 text-blue-500" />
                        Settings
                      </NavLink>
                    </div>
                    
                    <div className="border-t dark:border-zinc-700 p-2">
                      <button
                        onClick={() => { handleLogout(); setIsProfileOpen(false); }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        <FiLogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2">
              <Link 
                to="/" 
                state={{ mode: "login" }} 
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Login
              </Link>
              <Link 
                to="/" 
                state={{ mode: "signup" }} 
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-sky-600 rounded-lg hover:from-blue-600 hover:to-sky-700 shadow-md hover:shadow-blue-500/20"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <div className="space-y-1.5">
              <motion.span 
                animate={{ width: isMobileMenuOpen ? '24px' : '20px' }}
                className="block h-0.5 w-6 bg-zinc-700 dark:bg-zinc-200"
              />
              <motion.span 
                animate={{ width: isMobileMenuOpen ? '24px' : '16px' }}
                className="block h-0.5 w-5 bg-zinc-700 dark:bg-zinc-200 ml-auto"
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 bg-white dark:bg-zinc-900 z-50 lg:hidden"
          >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
            
            <div className="relative h-full overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b dark:border-zinc-800">
                <Link 
                  to="/" 
                  className="flex items-center gap-3" 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <img src={logo} alt="Logo" className="h-8 w-auto" />
                  <span className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
                    Nexus<span className="text-blue-500">Hub</span>
                  </span>
                </Link>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <FiX className="h-6 w-6 text-zinc-700 dark:text-zinc-200" />
                </button>
              </div>
              
              <nav className="p-6 flex flex-col h-full">
                <div className="space-y-1 mb-8">
                  {user ? (
                    <>
                      {navLinks.map(link => link.visible && (
                        <motion.div
                          key={link.to}
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          <AnimatedNavLink
                            to={link.to}
                            label={link.label}
                            icon={link.icon}
                            onClick={() => setIsMobileMenuOpen(false)}
                          />
                        </motion.div>
                      ))}
                      
                      {projects.length > 0 && (
                        <motion.div
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.15 }}
                        >
                          <div className="px-3 pt-6 pb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                            Your Projects
                          </div>
                          {projects.map(project => (
                            <NavLink
                              key={project.to}
                              to={project.to}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-5 py-3 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                              <FiZap className="h-4 w-4 text-blue-500" />
                              {project.label}
                            </NavLink>
                          ))}
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        <Link 
                          to="/" 
                          state={{ mode: "login" }} 
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-5 py-3 text-lg font-medium rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          <FiUser className="h-5 w-5" />
                          Login
                        </Link>
                      </motion.div>
                      
                      <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.15 }}
                      >
                        <Link 
                          to="/" 
                          state={{ mode: "signup" }} 
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-5 py-3 text-lg font-medium text-white bg-gradient-to-r from-blue-500 to-sky-600 rounded-lg"
                        >
                          <FiAward className="h-5 w-5" />
                          Get Started
                        </Link>
                      </motion.div>
                    </>
                  )}
                </div>
                
                {user && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-auto pt-6 border-t dark:border-zinc-800 space-y-2"
                  >
                    <div className="flex items-center gap-3 px-5 py-3 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      <HolographicAvatar user={user} />
                      <div>
                        <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    
                    <NavLink
                      to="/settings"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-5 py-3 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <FiSettings className="h-4 w-4" />
                      Settings
                    </NavLink>
                    
                    <button
                      onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                      className="flex items-center gap-3 w-full text-left px-5 py-3 text-sm rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <FiLogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;