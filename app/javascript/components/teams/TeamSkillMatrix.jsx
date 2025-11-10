import React, { useMemo, useState } from "react";
import Avatar from "../ui/Avatar";

const LEVEL_COLORS = {
  expert: "bg-green-100 text-green-800",
  advanced: "bg-amber-100 text-amber-800",
  intermediate: "bg-blue-100 text-blue-800",
  beginner: "bg-gray-100 text-gray-800",
};

const LEVEL_ORDER = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

const TeamSkillMatrix = ({ members = [], skills = [], roles = [] }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" });
  const [filterRole, setFilterRole] = useState("All");

  const skillNames = useMemo(() => skills.map((skill) => skill.name), [skills]);

  const membersWithSkills = useMemo(() => (
    members.map((member) => {
      const lookup = member.skills.reduce((acc, skill) => {
        acc[skill.name] = skill;
        return acc;
      }, {});
      return { ...member, skillLookup: lookup };
    })
  ), [members]);

  const filteredMembers = useMemo(() => {
    if (filterRole === "All") return membersWithSkills;
    return membersWithSkills.filter((member) => member.job_title === filterRole);
  }, [filterRole, membersWithSkills]);

  const sortedMembers = useMemo(() => {
    if (!sortConfig.key) return filteredMembers;

    const sorted = [...filteredMembers].sort((a, b) => {
      const aSkill = a.skillLookup[sortConfig.key];
      const bSkill = b.skillLookup[sortConfig.key];
      const aValue = LEVEL_ORDER[aSkill?.proficiency] || 0;
      const bValue = LEVEL_ORDER[bSkill?.proficiency] || 0;

      if (aValue !== bValue) {
        return sortConfig.direction === "ascending" ? aValue - bValue : bValue - aValue;
      }

      const aEndorsements = aSkill?.endorsements_count || 0;
      const bEndorsements = bSkill?.endorsements_count || 0;
      if (aEndorsements !== bEndorsements) {
        return sortConfig.direction === "ascending"
          ? aEndorsements - bEndorsements
          : bEndorsements - aEndorsements;
      }

      const aName = aSkill?.name || "";
      const bName = bSkill?.name || "";
      return sortConfig.direction === "ascending"
        ? aName.localeCompare(bName)
        : bName.localeCompare(aName);
    });

    return sorted;
  }, [filteredMembers, sortConfig]);

  const handleSort = (skillName) => {
    let direction = "ascending";
    if (sortConfig.key === skillName && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key: skillName, direction });
  };

  if (members.length === 0 || skills.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Team Skill Matrix</h2>
        <p className="text-gray-500">Add a few skills and teammates to visualize your skill coverage.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-6 overflow-hidden min-w-0">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Team Skill Matrix</h2>
          <p className="text-gray-500 text-sm">Click a skill to sort by proficiency or filter by role.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
            <select
              value={filterRole}
              onChange={(event) => setFilterRole(event.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {["All", ...roles].map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <Legend color="bg-green-500" label="Expert" />
            <Legend color="bg-amber-500" label="Advanced" />
            <Legend color="bg-blue-500" label="Intermediate" />
            <Legend color="bg-gray-400" label="Beginner" />
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />
        <div className="overflow-x-auto rounded-lg border border-gray-100 shadow-inner scrollbar-thin max-w-full">
          <table className="w-full min-w-full border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-20">
              <tr>
                <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 sticky left-0 top-0 bg-gray-50 z-30">
                  Team Member
                </th>
                {skillNames.map((skillName) => (
                  <th
                    key={skillName}
                    className="border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 sticky top-0 bg-gray-50"
                    onClick={() => handleSort(skillName)}
                  >
                    <div className="flex items-center justify-center">
                      {skillName}
                      {sortConfig.key === skillName && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 ml-1 ${sortConfig.direction === "ascending" ? "" : "transform rotate-180"}`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedMembers.map((member) => (
                <tr key={member.id} className="group">
                  <td className="border border-gray-200 px-4 py-3 text-sm sticky left-0 top-auto bg-white group-hover:bg-gray-100 transition-colors z-20 shadow-[4px_0_8px_-6px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center">
                      <Avatar
                        name={member.name}
                        src={member.profile_picture}
                        className="w-8 h-8 mr-3 text-sm"
                      />
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-gray-500 text-xs">{member.job_title}</div>
                      </div>
                    </div>
                  </td>
                  {skillNames.map((skillName) => {
                    const skill = member.skillLookup[skillName];
                    if (!skill) {
                      return (
                        <td key={`${member.id}-${skillName}`} className="border border-gray-200 px-4 py-3 text-center bg-white group-hover:bg-gray-50 transition-colors">
                          <span className="text-gray-300">—</span>
                        </td>
                      );
                    }

                    const levelClass = LEVEL_COLORS[skill.proficiency] || LEVEL_COLORS.beginner;

                    return (
                      <td key={`${member.id}-${skillName}`} className="border border-gray-200 px-4 py-3 text-center bg-white group-hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col items-center space-y-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${levelClass}`}>
                            {skill.proficiency_label}
                          </span>
                          <span className="text-[10px] text-gray-500">{skill.endorsements_count} endorsement{skill.endorsements_count === 1 ? "" : "s"}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Legend = ({ color, label }) => (
  <div className="flex items-center">
    <div className={`w-3 h-3 ${color} rounded mr-2`} />
    <span>{label}</span>
  </div>
);

export default TeamSkillMatrix;
