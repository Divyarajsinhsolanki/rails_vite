import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useMatch } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import {
  FiAward,
  FiBook,
  FiBriefcase,
  FiCalendar,
  FiChevronDown,
  FiClock,
  FiFileText,
  FiGrid,
  FiLayers,
  FiLogOut,
  FiMenu,
  FiMessageSquare,
  FiSettings,
  FiUser,
  FiUsers,
  FiX,
  FiZap,
} from "react-icons/fi";

import { AuthContext } from "../context/AuthContext";
import { fetchProjects } from "./api";
import NotificationCenter from "./NotificationCenter";
import logo from "../images/logo.webp";

const useNavbarEffects = () => {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 10);
  });

  return { scrolled };
};

const resolveSection = (pathname) => {
  const sections = [
    {
      match: (value) => value === "/" || value.startsWith("/calendar"),
      label: "Planning Deck",
      caption: "Schedules, reminders, and deadlines",
    },
    {
      match: (value) => value.startsWith("/momentum"),
      label: "Momentum Hub",
      caption: "Daily priorities, reflection, and learning cadence",
    },
    {
      match: (value) => value.startsWith("/knowledge"),
      label: "Knowledge Grid",
      caption: "Curated learning and external signals",
    },
    {
      match: (value) => value.startsWith("/projects"),
      label: "Project Control",
      caption: "Delivery lanes and project visibility",
    },
    {
      match: (value) => value.startsWith("/teams"),
      label: "Team Network",
      caption: "Collaboration, roles, and team health",
    },
    {
      match: (value) => value.startsWith("/worklog"),
      label: "Work Log",
      caption: "Session detail, delivery notes, and log history",
    },
    {
      match: (value) => value.startsWith("/vault"),
      label: "Asset Vault",
      caption: "Knowledge, files, and reference material",
    },
    {
      match: (value) => value.startsWith("/chat"),
      label: "Conversation Deck",
      caption: "Live threads, mentions, and follow-ups",
    },
    {
      match: (value) => value.startsWith("/notifications"),
      label: "Signal Feed",
      caption: "Alerts, updates, and unread activity",
    },
    {
      match: (value) => value.startsWith("/pdf"),
      label: "Document Studio",
      caption: "Focused PDF editing and markup",
    },
    {
      match: (value) => value.startsWith("/settings"),
      label: "Preferences",
      caption: "Workspace tuning and profile settings",
    },
    {
      match: (value) => value.startsWith("/admin"),
      label: "Admin Console",
      caption: "Operations, access, and control",
    },
  ];

  return sections.find((section) => section.match(pathname)) || {
    label: "Workspace",
    caption: "Focused delivery across the product",
  };
};

const roleLabel = (user) => user?.roles?.[0]?.name?.replace(/_/g, " ") || "Member";

const menuItemClass =
  "group flex w-full items-center gap-3 rounded-[20px] px-4 py-3 text-sm font-medium text-slate-700 hover:bg-white hover:text-slate-950";
const menuIconClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-slate-950/5 text-[var(--theme-color)] transition group-hover:bg-slate-950 group-hover:text-white";

const HolographicAvatar = ({ user }) => {
  const [angle, setAngle] = useState(135);
  const avatarRef = useRef(null);

  useEffect(() => {
    const handleMove = (event) => {
      if (!avatarRef.current) return;

      const rect = avatarRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const nextAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX) * (180 / Math.PI);
      setAngle(nextAngle);
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div
      ref={avatarRef}
      className="group relative h-11 w-11 overflow-hidden rounded-[18px] border border-white/70 shadow-[0_18px_30px_rgb(15_23_42_/_0.16)]"
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(226,237,255,0.72))]" />
      <img
        src={user.profile_picture || `https://ui-avatars.com/api/?name=${user.email}&background=random`}
        alt="User avatar"
        className="relative z-10 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      loading="lazy" />
      <div className="absolute inset-0 z-20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_55%)]" />
      <div
        className="absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `linear-gradient(${angle}deg, rgba(103, 232, 249, 0.42), transparent 38%, rgba(52, 109, 255, 0.38) 72%, rgba(255, 255, 255, 0.12))`,
        }}
      />
    </div>
  );
};

const AnimatedNavLink = ({ to, label, icon: Icon, onClick, fullWidth = false }) => {
  const match = useMatch({ path: to, end: to === "/" });
  const isActive = !!match;
  const layoutId = fullWidth ? "mobile-nav-active-bg" : "desktop-nav-active-bg";
  const frameClass = fullWidth ? "rounded-[18px]" : "rounded-[16px]";
  const contentClass = fullWidth
    ? "gap-2.5 rounded-[18px] px-3 py-2.5 text-sm"
    : "gap-1.5 rounded-[16px] px-2.5 py-1.5 text-[12px] xl:text-[12.5px]";
  const iconClass = fullWidth ? "h-7 w-7 rounded-[14px]" : "h-6 w-6 rounded-[12px]";
  const glyphClass = fullWidth ? "h-3.5 w-3.5" : "h-[13px] w-[13px]";

  return (
    <NavLink to={to} onClick={onClick} className={`group relative ${fullWidth ? "w-full" : "shrink-0"}`}>
      {isActive ? (
        <motion.span
          layoutId={layoutId}
          className={`absolute inset-0 border border-white/85 bg-white/92 shadow-[0_16px_34px_rgb(15_23_42_/_0.12)] ${frameClass}`}
          transition={{ type: "spring", bounce: 0.2, duration: 0.55 }}
        />
      ) : (
        <span className={`absolute inset-0 border border-transparent transition group-hover:border-white/70 group-hover:bg-white/48 ${frameClass}`} />
      )}

      <span
        className={`relative z-10 flex items-center font-semibold ${
          isActive ? "text-slate-950" : "text-slate-600"
        } ${contentClass}`}
      >
        {Icon ? (
          <span
            className={`flex shrink-0 items-center justify-center ${
              isActive
                ? "bg-slate-950 text-white shadow-[0_14px_26px_rgb(15_23_42_/_0.18)]"
                : "border border-white/70 bg-white/70 text-[var(--theme-color)] group-hover:bg-white group-hover:text-slate-950"
            } ${iconClass}`}
          >
            <Icon className={glyphClass} />
          </span>
        ) : null}
        <span className={fullWidth ? "truncate" : ""}>{label}</span>
      </span>
    </NavLink>
  );
};

const ProjectsDropdown = ({ projects, onItemClick, active }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((value) => !value)}
        className={`group relative flex items-center gap-1.5 rounded-[16px] px-2.5 py-1.5 text-[12px] font-semibold xl:text-[12.5px] ${
          active || isOpen ? "text-slate-950" : "text-slate-600"
        }`}
      >
        <span
          className={`absolute inset-0 rounded-[16px] border ${
            active || isOpen
              ? "border-white/85 bg-white/90 shadow-[0_16px_34px_rgb(15_23_42_/_0.12)]"
              : "border-transparent group-hover:border-white/70 group-hover:bg-white/48"
          }`}
        />
        <span
          className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-[12px] ${
            active || isOpen
              ? "bg-slate-950 text-white shadow-[0_14px_26px_rgb(15_23_42_/_0.18)]"
              : "border border-white/70 bg-white/70 text-[var(--theme-color)] group-hover:bg-white group-hover:text-slate-950"
          }`}
        >
          <FiLayers className="h-[13px] w-[13px]" />
        </span>
        <span className="relative z-10">Projects</span>
        {projects.length > 0 ? (
          <span className="relative z-10 inline-flex rounded-full bg-slate-950 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white">
            {projects.length}
          </span>
        ) : null}
        <FiChevronDown
          className={`relative z-10 h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="shell-panel shell-panel-floating shell-panel-strong absolute right-0 top-full z-50 mt-3 w-[19rem] overflow-hidden rounded-[28px] p-2"
          >
            <div className="rounded-[22px] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(235,242,255,0.74))] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[0.66rem] font-semibold uppercase tracking-[0.28em] text-slate-400">
                    Project Access
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">Dashboards and boards</p>
                </div>
                <span className="shell-chip">
                  <span className="shell-chip-dot" />
                  Live
                </span>
              </div>

              <div className="space-y-1">
                <NavLink
                  to="/projects"
                  onClick={() => {
                    onItemClick();
                    setIsOpen(false);
                  }}
                  className="group flex items-center gap-3 rounded-[18px] px-3 py-3 text-sm font-medium text-slate-700 hover:bg-white hover:text-slate-950"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-[var(--theme-color)] transition group-hover:bg-slate-950 group-hover:text-white">
                    <FiGrid className="h-4 w-4" />
                  </span>
                  <span className="truncate">All projects</span>
                </NavLink>

                {projects.length > 0 ? <div className="my-2 shell-grid-divider" /> : null}

                {projects.map((project) => (
                  <NavLink
                    key={project.to}
                    to={project.to}
                    onClick={() => {
                      onItemClick();
                      setIsOpen(false);
                    }}
                    className="group flex items-center gap-3 rounded-[18px] px-3 py-3 text-sm font-medium text-slate-700 hover:bg-white hover:text-slate-950"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-[var(--theme-color)] transition group-hover:bg-slate-950 group-hover:text-white">
                      <FiZap className="h-4 w-4" />
                    </span>
                    <span className="truncate">{project.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

const Navbar = () => {
  const { user, handleLogout } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const { scrolled } = useNavbarEffects();
  const location = useLocation();
  const currentSection = useMemo(() => resolveSection(location.pathname), [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    let isActive = true;

    if (!user) {
      setProjects([]);
      return undefined;
    }

    fetchProjects()
      .then(({ data }) => {
        if (!isActive) return;

        const userProjects = Array.isArray(data)
          ? data.filter((project) => project.users.some((member) => member.id === user.id))
          : [];

        setProjects(
          userProjects.map((project) => ({
            to: `/projects/${project.id}/dashboard`,
            label: project.name,
          }))
        );
      })
      .catch(() => {
        if (isActive) setProjects([]);
      });

    return () => {
      isActive = false;
    };
  }, [user]);

  const navLinks = [
    { to: "/calendar", label: "Calendar", icon: FiCalendar, visible: !!user },
    { to: "/momentum", label: "Momentum", icon: FiZap, visible: !!user },
    { to: "/posts", label: "Updates", icon: FiMessageSquare, visible: !!user },
    { to: "/knowledge", label: "Knowledge", icon: FiBook, visible: !!user },
    { to: "/worklog", label: "Work Log", icon: FiClock, visible: !!user },
    { to: "/chat", label: "Chat", icon: FiMessageSquare, visible: !!user },
    { to: "/vault", label: "Vault", icon: FiMenu, visible: !!user },
    { to: "/pdf", label: "PDF Lab", icon: FiFileText, visible: !!user },
    { to: "/teams", label: "Teams", icon: FiUsers, visible: !!user },
  ];

  const hasAdminRole = user?.roles?.some((role) => ["owner", "admin"].includes(role.name));
  const isOwner = user?.roles?.some((role) => role.name === "owner");
  const profileLinks = [
    hasAdminRole ? { to: "/admin", label: "Admin Panel", icon: FiBriefcase } : null,
    { to: "/profile", label: "My Profile", icon: FiUser },
    { to: "/users", label: "User Management", icon: FiUsers },
    { to: "/departments", label: "Departments", icon: FiGrid },
    isOwner ? { to: "/admin/login-as-user", label: "Login as User", icon: FiLogOut } : null,
    { to: "/settings", label: "Settings", icon: FiSettings },
  ].filter(Boolean);

  const isProjectsSection = location.pathname.startsWith("/projects");

  return (
    <motion.header
      className="sticky top-0 z-50 px-3 pt-3 sm:px-4 lg:px-6"
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="shell-panel shell-panel-strong relative mx-auto flex max-w-[1600px] items-center gap-2 overflow-visible rounded-[32px] px-2.5 py-2.5 sm:px-3.5"
        animate={{ y: scrolled ? -2 : 0, scale: scrolled ? 0.996 : 1 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        style={{ boxShadow: scrolled ? "var(--shell-shadow-lg)" : "var(--shell-shadow-md)" }}
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
        <div className="pointer-events-none absolute inset-y-4 left-[18%] hidden w-px bg-gradient-to-b from-transparent via-white/60 to-transparent opacity-75 lg:block" />

        <Link
          to="/"
          className="group flex min-w-0 items-center gap-2 rounded-[26px] px-1 py-1"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[20px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(229,238,255,0.75))] shadow-[0_18px_38px_rgb(15_23_42_/_0.12)]">
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),transparent_68%)]" />
            <img
              src={logo}
              alt="NexusHub logo"
              className="relative z-10 h-8 w-auto transition-transform duration-500 group-hover:scale-110"
            loading="lazy" />
          </span>
          <div className="min-w-0">
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.34em] text-slate-400">Nexus Shell</p>
            <motion.h1
              className="truncate text-lg font-semibold tracking-[-0.04em] text-slate-950 sm:text-xl"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.32 }}
            >
              Nexus<span className="text-[var(--theme-color)]">Hub</span>
            </motion.h1>
            <p className="hidden max-w-[13rem] truncate text-xs font-medium text-slate-500 min-[1480px]:block">
              {currentSection.caption}
            </p>
          </div>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center lg:flex">
          <div className="scrollbar-hide flex w-full items-center justify-start gap-0.5 overflow-x-auto rounded-[24px] border border-white/60 bg-white/52 p-1 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.82)] xl:justify-center xl:overflow-visible">
            {navLinks.map(
              (link) =>
                link.visible && (
                  <AnimatedNavLink key={link.to} to={link.to} label={link.label} icon={link.icon} />
                )
            )}

            {user ? (
              <ProjectsDropdown
                projects={projects}
                active={isProjectsSection}
                onItemClick={() => setIsMobileMenuOpen(false)}
              />
            ) : null}
          </div>
        </nav>

        <div className="ml-auto shrink-0 flex items-center gap-2 sm:gap-3">
          {user ? (
            <span className="shell-chip hidden min-[1720px]:inline-flex">
              <span className="shell-chip-dot" />
              {roleLabel(user)}
            </span>
          ) : (
            <span className="shell-chip hidden md:inline-flex">
              <span className="shell-chip-dot" />
              Team Workspace
            </span>
          )}

          {user ? (
            <div className="rounded-full border border-white/65 bg-white/62 p-1 shadow-[0_14px_28px_rgb(15_23_42_/_0.08)]">
              <NotificationCenter />
            </div>
          ) : null}

          {user ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen((value) => !value)}
                className="group relative rounded-[22px] border border-white/65 bg-white/58 p-1 shadow-[0_18px_34px_rgb(15_23_42_/_0.08)] hover:bg-white/82"
              >
                <HolographicAvatar user={user} />
                {hasAdminRole ? (
                  <div className="absolute -right-1.5 -top-1.5 z-20 rounded-full border-2 border-white bg-[linear-gradient(135deg,var(--theme-color),var(--theme-secondary))] p-1 text-white shadow-[0_14px_24px_rgb(52_109_255_/_0.32)]">
                    <FiAward className="h-3 w-3" />
                  </div>
                ) : null}
              </button>

              <AnimatePresence>
                {isProfileOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: 14, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.97 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    className="shell-panel shell-panel-floating shell-panel-strong absolute right-0 top-full z-50 mt-4 w-[19rem] overflow-hidden rounded-[30px] p-2"
                  >
                    <div className="rounded-[24px] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(235,242,255,0.74))] p-4">
                      <div className="flex items-start gap-3">
                        <HolographicAvatar user={user} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-950">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500">{user.email}</p>
                          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/75 bg-white/76 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-600">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(74,222,128,0.6)]" />
                            {roleLabel(user)}
                          </div>
                        </div>
                      </div>

                      <div className="my-4 shell-grid-divider" />

                      <div className="space-y-1">
                        {profileLinks.map((link) => {
                          const Icon = link.icon;

                          return (
                            <NavLink
                              key={link.to}
                              to={link.to}
                              onClick={() => setIsProfileOpen(false)}
                              className={menuItemClass}
                            >
                              <span className={menuIconClass}>
                                <Icon className="h-4 w-4" />
                              </span>
                              {link.label}
                            </NavLink>
                          );
                        })}
                      </div>

                      <div className="my-4 shell-grid-divider" />

                      <button
                        onClick={() => {
                          handleLogout();
                          setIsProfileOpen(false);
                        }}
                        className="group flex w-full items-center gap-3 rounded-[20px] px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-500 transition group-hover:bg-rose-600 group-hover:text-white">
                          <FiLogOut className="h-4 w-4" />
                        </span>
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <Link
                to="/"
                state={{ mode: "login" }}
                className="rounded-full border border-white/70 bg-white/58 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-[0_14px_24px_rgb(15_23_42_/_0.06)] hover:bg-white"
              >
                Login
              </Link>
              <Link
                to="/"
                state={{ mode: "signup" }}
                className="rounded-full border border-white/75 bg-[linear-gradient(135deg,var(--theme-color),var(--theme-secondary))] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_36px_rgb(52_109_255_/_0.24)] hover:brightness-110"
              >
                Get Started
              </Link>
            </div>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="rounded-[18px] border border-white/65 bg-white/58 p-2.5 shadow-[0_14px_24px_rgb(15_23_42_/_0.06)] hover:bg-white/82 lg:hidden"
          >
            <div className="space-y-1.5">
              <motion.span
                animate={{ width: isMobileMenuOpen ? 22 : 18 }}
                className="ml-auto block h-0.5 w-5 rounded-full bg-slate-800"
              />
              <motion.span
                animate={{ width: isMobileMenuOpen ? 22 : 24 }}
                className="block h-0.5 w-6 rounded-full bg-slate-800"
              />
            </div>
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isMobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-slate-950/18 px-3 py-3 backdrop-blur-md lg:hidden"
          >
            <motion.div
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 24, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="shell-panel shell-panel-strong relative ml-auto flex h-full w-full max-w-md flex-col overflow-hidden rounded-[32px] bg-white/86"
            >
              <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(103,232,249,0.42),transparent_68%)]" />
              <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(52,109,255,0.18),transparent_72%)]" />

              <div className="relative flex items-center justify-between px-5 pb-4 pt-5">
                <div className="min-w-0">
                  <p className="text-[0.58rem] font-semibold uppercase tracking-[0.34em] text-slate-400">Current Lane</p>
                  <p className="truncate text-lg font-semibold text-slate-950">{currentSection.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{currentSection.caption}</p>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-full border border-white/75 bg-white/82 p-2 text-slate-700 shadow-[0_12px_22px_rgb(15_23_42_/_0.08)] hover:text-slate-950"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <div className="shell-grid-divider mx-5" />

              <nav className="scrollbar-hide flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-2">
                  {user ? (
                    <>
                      {navLinks.map((link, index) =>
                        link.visible ? (
                          <motion.div
                            key={link.to}
                            initial={{ x: 16, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.04 * index }}
                          >
                            <AnimatedNavLink
                              to={link.to}
                              label={link.label}
                              icon={link.icon}
                              fullWidth
                              onClick={() => setIsMobileMenuOpen(false)}
                            />
                          </motion.div>
                        ) : null
                      )}

                      <motion.div
                        initial={{ x: 16, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="pt-4"
                      >
                        <div className="mb-3 flex items-center justify-between px-2">
                          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.28em] text-slate-400">
                            Projects
                          </p>
                          <span className="shell-chip">
                            <span className="shell-chip-dot" />
                            {projects.length > 0 ? projects.length : "Hub"}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <NavLink
                            to="/projects"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="group flex items-center gap-3 rounded-[20px] px-4 py-3 text-sm font-medium text-slate-700 hover:bg-white hover:text-slate-950"
                          >
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-[var(--theme-color)] transition group-hover:bg-slate-950 group-hover:text-white">
                              <FiGrid className="h-4 w-4" />
                            </span>
                            <span className="truncate">All projects</span>
                          </NavLink>

                          {projects.map((project) => (
                            <NavLink
                              key={project.to}
                              to={project.to}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="group flex items-center gap-3 rounded-[20px] px-4 py-3 text-sm font-medium text-slate-700 hover:bg-white hover:text-slate-950"
                            >
                              <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-[var(--theme-color)] transition group-hover:bg-slate-950 group-hover:text-white">
                                <FiLayers className="h-4 w-4" />
                              </span>
                              <span className="truncate">{project.label}</span>
                            </NavLink>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  ) : (
                    <div className="space-y-2 pt-2">
                      <Link
                        to="/"
                        state={{ mode: "login" }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center rounded-[20px] border border-white/75 bg-white/82 px-4 py-3 text-base font-semibold text-slate-800 shadow-[0_14px_24px_rgb(15_23_42_/_0.06)]"
                      >
                        Login
                      </Link>
                      <Link
                        to="/"
                        state={{ mode: "signup" }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,var(--theme-color),var(--theme-secondary))] px-4 py-3 text-base font-semibold text-white shadow-[0_18px_36px_rgb(52_109_255_/_0.24)]"
                      >
                        Get Started
                      </Link>
                    </div>
                  )}
                </div>

                {user ? (
                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.24 }}
                    className="mt-6 rounded-[26px] border border-white/75 bg-white/74 p-4 shadow-[0_18px_40px_rgb(15_23_42_/_0.08)]"
                  >
                    <div className="flex items-center gap-3">
                      <HolographicAvatar user={user} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>

                    <div className="my-4 shell-grid-divider" />

                    <div className="space-y-1">
                      {profileLinks.map((link) => {
                        const Icon = link.icon;

                        return (
                          <NavLink
                            key={link.to}
                            to={link.to}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={menuItemClass}
                          >
                            <span className={menuIconClass}>
                              <Icon className="h-4 w-4" />
                            </span>
                            {link.label}
                          </NavLink>
                        );
                      })}

                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="group flex w-full items-center gap-3 rounded-[20px] px-4 py-3 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-500 transition group-hover:bg-rose-600 group-hover:text-white">
                          <FiLogOut className="h-4 w-4" />
                        </span>
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </nav>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
