import React from "react";

/**
 * Small stat cards used on profile
 * props.stats = { projects: number, teams: number, posts: number }
 */
const ProfileStats = ({ stats = {} }) => {
  const items = [
    { key: "projects", label: "Projects", value: stats.projects || 0, accent: "from-green-400 to-teal-400" },
    { key: "teams", label: "Teams", value: stats.teams || 0, accent: "from-indigo-400 to-violet-400" },
    { key: "posts", label: "Posts", value: stats.posts || 0, accent: "from-yellow-300 to-orange-400" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((it) => (
        <div key={it.key} className="p-3 rounded-lg bg-gradient-to-br to-white/30 from-white/70 border shadow-sm flex flex-col items-start">
          <div className={`text-xs font-semibold text-gray-600`}>{it.label}</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{it.value}</div>
        </div>
      ))}
    </div>
  );
};

export default ProfileStats;