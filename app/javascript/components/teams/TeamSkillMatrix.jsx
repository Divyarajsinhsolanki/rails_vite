import React, { useMemo, useState } from "react";

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
    <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
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

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10">
                Team Member
              </th>
              {skillNames.map((skillName) => (
                <th
                  key={skillName}
                  className="border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
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
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-4 py-3 text-sm sticky left-0 bg-white z-10">
                  <div className="flex items-center">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8 mr-3" />
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
                      <td key={`${member.id}-${skillName}`} className="border border-gray-200 px-4 py-3 text-center">
                        <span className="text-gray-300">—</span>
                      </td>
                    );
                  }

                  const levelClass = LEVEL_COLORS[skill.proficiency] || LEVEL_COLORS.beginner;

                  return (
                    <td key={`${member.id}-${skillName}`} className="border border-gray-200 px-4 py-3 text-center">
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
  );
};

const Legend = ({ color, label }) => (
  <div className="flex items-center">
    <div className={`w-3 h-3 ${color} rounded mr-2`} />
    <span>{label}</span>
  </div>
);

export default TeamSkillMatrix;
