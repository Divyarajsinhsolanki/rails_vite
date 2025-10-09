import React from "react";

/**
 * Skill chips with optional endorsement counts and hover interactions.
 * skills: expected array like [{ id, name, proficiency_label, endorsements_count }]
 */
const SkillChips = ({ skills = [], editable=false, onChange }) => {
  const handleRemove = (id) => {
    const next = skills.filter(s => s.id !== id);
    onChange && onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {skills.length === 0 && <div className="text-gray-400">No skills added yet.</div>}
      {skills.map((s) => (
        <div key={s.id || s.name} className="flex items-center gap-2 bg-white border px-3 py-1 rounded-full shadow-sm hover:shadow-md transition">
          <div className="text-sm font-medium text-gray-700">{s.name}</div>
          <div className="text-xs text-gray-400">{s.proficiency_label || s.proficiency}</div>
          <div className="text-xs text-[var(--theme-color)] ml-1">{"★".repeat(Math.min(3, (s.proficiency || 0)))}</div>
          <div className="text-xs text-gray-400 px-2">• {s.endorsements_count || 0}</div>
          {editable && (
            <button onClick={() => handleRemove(s.id)} className="ml-2 text-xs text-red-400 hover:text-red-600">×</button>
          )}
        </div>
      ))}
    </div>
  );
};

export default SkillChips;