import React from "react";
import {
  FiActivity,
  FiArchive,
  FiBarChart2,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiCloud,
  FiCode,
  FiCpu,
  FiDatabase,
  FiGitBranch,
  FiLayers,
  FiLock,
  FiMessageSquare,
  FiMonitor,
  FiShield,
  FiTrello,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import WorkspaceOrb from "../components/landing/WorkspaceOrb";

const galleryObjects = [
  {
    eyebrow: "Original Login Object",
    title: "Command workspace with orbiting product tools.",
    description: "The current login 3D object style, kept here as the baseline for comparing future landing visuals.",
    metrics: [["5", "Core modules"], ["360°", "Orbit view"], ["Live", "Team signal"]],
    orbitItems: [
      { label: "Calendar", icon: FiCalendar, angle: 8, tone: "from-sky-300 to-cyan-200" },
      { label: "Vault", icon: FiLock, angle: 78, tone: "from-amber-300 to-orange-200" },
      { label: "Chat", icon: FiMessageSquare, angle: 148, tone: "from-fuchsia-300 to-pink-200" },
      { label: "Knowledge", icon: FiBookOpen, angle: 218, tone: "from-emerald-300 to-teal-200" },
      { label: "Projects", icon: FiTrello, angle: 292, tone: "from-violet-300 to-indigo-200" },
    ],
    featureCards: [
      { title: "Review Goal", metric: "Base", copy: "Use this as the exact reference point for the login page motion and spacing." },
      { title: "Best For", metric: "Auth", copy: "A balanced object for login, signup, and welcome screens." },
    ],
  },
  {
    eyebrow: "Sprint Reactor",
    title: "A delivery engine for sprints, blockers, and release flow.",
    description: "A sharper blue-violet object concept for project planning and high-velocity engineering screens.",
    metrics: [["12", "Sprint lanes"], ["98%", "Flow health"], ["24h", "Cycle pulse"]],
    orbitItems: [
      { label: "Backlog", icon: FiArchive, angle: 0, tone: "from-blue-300 to-cyan-200" },
      { label: "Branches", icon: FiGitBranch, angle: 60, tone: "from-indigo-300 to-violet-200" },
      { label: "Checks", icon: FiCheckCircle, angle: 120, tone: "from-emerald-300 to-lime-200" },
      { label: "Builds", icon: FiCpu, angle: 180, tone: "from-slate-200 to-blue-200" },
      { label: "Velocity", icon: FiZap, angle: 240, tone: "from-amber-300 to-yellow-200" },
      { label: "Reports", icon: FiBarChart2, angle: 300, tone: "from-fuchsia-300 to-pink-200" },
    ],
    featureCards: [
      { title: "Motion Feel", metric: "Fast", copy: "Works well when the page should feel energetic and engineering-focused." },
      { title: "Review Note", metric: "Blue", copy: "Keeps the login style but adds more nodes around the central object." },
    ],
  },
  {
    eyebrow: "Secure Vault Core",
    title: "A premium security orb for vault and admin experiences.",
    description: "Warmer gold highlights, shield cues, and locked orbit nodes for credential-heavy workflows.",
    metrics: [["AES", "Secure layer"], ["0", "Leaks"], ["Role", "Access guard"]],
    orbitItems: [
      { label: "Keys", icon: FiLock, angle: 18, tone: "from-amber-200 to-yellow-300" },
      { label: "Audit", icon: FiShield, angle: 90, tone: "from-orange-300 to-rose-200" },
      { label: "Storage", icon: FiDatabase, angle: 162, tone: "from-stone-200 to-amber-100" },
      { label: "Cloud", icon: FiCloud, angle: 234, tone: "from-cyan-200 to-blue-200" },
      { label: "Teams", icon: FiUsers, angle: 306, tone: "from-emerald-300 to-teal-200" },
    ],
    featureCards: [
      { title: "Mood", metric: "Trust", copy: "Good for screens that need a confident, locked-down visual tone." },
      { title: "Accent", metric: "Gold", copy: "Adds a different color direction while staying inside the same component system." },
    ],
  },
  {
    eyebrow: "Knowledge Nebula",
    title: "A learning constellation for insights and team memory.",
    description: "Softer teal and emerald orbit nodes make this object useful for knowledge and learning dashboards.",
    metrics: [["AI", "Prompts"], ["42", "Bookmarks"], ["Daily", "Learn loop"]],
    orbitItems: [
      { label: "Articles", icon: FiBookOpen, angle: 30, tone: "from-emerald-200 to-teal-200" },
      { label: "Signals", icon: FiActivity, angle: 102, tone: "from-cyan-300 to-sky-200" },
      { label: "Layers", icon: FiLayers, angle: 174, tone: "from-lime-200 to-emerald-300" },
      { label: "Ideas", icon: FiZap, angle: 246, tone: "from-yellow-200 to-amber-200" },
      { label: "Notes", icon: FiArchive, angle: 318, tone: "from-violet-200 to-fuchsia-200" },
    ],
    featureCards: [
      { title: "Mood", metric: "Calm", copy: "A calmer review option for content-heavy pages and insight cards." },
      { title: "Accent", metric: "Teal", copy: "Keeps the 3D depth but makes the palette lighter and more educational." },
    ],
  },
  {
    eyebrow: "Operations Radar",
    title: "A live status object for dashboards and momentum pages.",
    description: "More active nodes and stronger status language for monitoring people, work, and daily momentum.",
    metrics: [["Live", "Radar"], ["7", "Teams"], ["Now", "Alerts"]],
    orbitItems: [
      { label: "Pulse", icon: FiActivity, angle: 12, tone: "from-rose-300 to-orange-200" },
      { label: "People", icon: FiUsers, angle: 72, tone: "from-sky-300 to-blue-200" },
      { label: "Screens", icon: FiMonitor, angle: 132, tone: "from-slate-200 to-cyan-200" },
      { label: "Tasks", icon: FiCheckCircle, angle: 192, tone: "from-emerald-300 to-lime-200" },
      { label: "Metrics", icon: FiBarChart2, angle: 252, tone: "from-purple-300 to-fuchsia-200" },
      { label: "Code", icon: FiCode, angle: 312, tone: "from-indigo-300 to-violet-200" },
    ],
    featureCards: [
      { title: "Mood", metric: "Active", copy: "Best when the page should feel alive, operational, and status-driven." },
      { title: "Density", metric: "High", copy: "Six orbit nodes create a busier object for review against the original." },
    ],
  },
  {
    eyebrow: "Minimal Crystal",
    title: "A cleaner object when the form needs more breathing room.",
    description: "A quieter version with fewer labels, simple metrics, and light cyan/purple tones for elegant auth pages.",
    metrics: [["3", "Signals"], ["Soft", "Glow"], ["Clean", "Layout"]],
    orbitItems: [
      { label: "Plan", icon: FiTrello, angle: 20, tone: "from-cyan-200 to-blue-100" },
      { label: "Chat", icon: FiMessageSquare, angle: 140, tone: "from-violet-200 to-purple-100" },
      { label: "Safe", icon: FiShield, angle: 260, tone: "from-emerald-200 to-teal-100" },
    ],
    featureCards: [
      { title: "Mood", metric: "Light", copy: "A less crowded option if the login form should be the main focus." },
      { title: "Review", metric: "Simple", copy: "Useful for comparing minimal and detailed visual directions." },
    ],
  },
];

const ObjectGallery = () => {
  return (
    <div className="min-h-screen rounded-[2rem] bg-slate-950 px-4 py-10 text-white shadow-2xl shadow-slate-950/20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-cyan-200/30 bg-cyan-200/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-cyan-100">
              3D object review
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
              Review more login-style 3D objects in one place.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
              These options reuse the same 3D visual language from the login page with different orbit icons, copy, density, and color direction.
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-950/20 hover:-translate-y-1 hover:bg-white/15"
          >
            Back to login
          </Link>
        </div>

        <div className="grid gap-8 2xl:grid-cols-2">
          {galleryObjects.map((object) => (
            <WorkspaceOrb
              key={object.eyebrow}
              eyebrow={object.eyebrow}
              title={object.title}
              description={object.description}
              metrics={object.metrics}
              featureCards={object.featureCards}
              orbitItems={object.orbitItems}
              className="min-h-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ObjectGallery;
