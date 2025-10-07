import React, { useMemo, useState } from "react";
import { SAMPLE_SKILL_PROFILES, SAMPLE_RECENT_ENDORSEMENTS, SAMPLE_RECOMMENDED_RESOURCES } from "./skillProfiles";

const SKILL_COLORS = {
  Expert: "bg-green-100 text-green-800",
  Advanced: "bg-amber-100 text-amber-800",
  Intermediate: "bg-blue-100 text-blue-800",
  Beginner: "bg-gray-100 text-gray-800"
};

const AvailabilityPill = ({ availability }) => {
  if (!availability) {
    return null;
  }
  const classes =
    availability === "Available Now"
      ? "bg-green-100 text-green-800"
      : availability === "Available in 2 weeks"
      ? "bg-amber-100 text-amber-800"
      : "bg-red-100 text-red-800";

  return <span className={`px-3 py-1 rounded-full text-sm font-medium ${classes}`}>{availability}</span>;
};

const TeamSkillMatrix = ({ members, skills, levels }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" });
  const [filterRole, setFilterRole] = useState("All");

  const roles = useMemo(() => {
    const distinct = new Set(members.map((member) => member.role).filter(Boolean));
    return ["All", ...Array.from(distinct)];
  }, [members]);

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const filteredMembers = members.filter((member) => filterRole === "All" || member.role === filterRole);

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = levels?.[a.id]?.[sortConfig.key] || "";
    const bValue = levels?.[b.id]?.[sortConfig.key] || "";
    if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
    return 0;
  });

  if (!skills.length) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Team Skill Matrix</h2>
        <p className="text-gray-600">Skill data has not been added for this team yet. Once profiles include skill levels, the matrix will render here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Team Skill Matrix</h2>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <LegendSwatch color="bg-green-500" label="Expert" />
            <LegendSwatch color="bg-amber-500" label="Advanced" />
            <LegendSwatch color="bg-blue-500" label="Intermediate" />
            <LegendSwatch color="bg-gray-300" label="Beginner" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10">
                  Team Member
                </th>
                {skills.map((skill) => (
                  <th
                    key={skill}
                    className="border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort(skill)}
                  >
                    <div className="flex items-center justify-center">
                      {skill}
                      {sortConfig.key === skill && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 ml-1 ${sortConfig.direction === "ascending" ? "" : "transform rotate-180"}`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
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
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-gray-500 text-xs">{member.role}</div>
                    </div>
                  </td>
                  {skills.map((skill) => {
                    const level = levels?.[member.id]?.[skill];
                    const badgeClass = level ? SKILL_COLORS[level] || "bg-gray-100 text-gray-800" : "";
                    return (
                      <td key={`${member.id}-${skill}`} className="border border-gray-200 px-4 py-3 text-center">
                        {level ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeClass}`}>{level}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SkillGapAnalysis members={members} skills={skills} levels={levels} />
    </div>
  );
};

const LegendSwatch = ({ color, label }) => (
  <div className="flex items-center">
    <div className={`w-3 h-3 ${color} rounded mr-2`} />
    <span className="text-sm">{label}</span>
  </div>
);

const SkillGapAnalysis = ({ members, skills, levels }) => {
  const counts = useMemo(() => {
    const result = {};
    members.forEach((member) => {
      skills.forEach((skill) => {
        const level = levels?.[member.id]?.[skill];
        if (!level) return;
        if (!result[skill]) {
          result[skill] = { Expert: 0, Advanced: 0, Intermediate: 0, Beginner: 0 };
        }
        result[skill][level] = (result[skill][level] || 0) + 1;
      });
    });
    return result;
  }, [members, skills, levels]);

  const skillsSorted = Object.entries(counts).sort(([, a], [, b]) => (b.Expert || 0) - (a.Expert || 0));
  const topDeveloped = skillsSorted.slice(0, 3);
  const needingDevelopment = skillsSorted.slice(-3).reverse();

  if (!skillsSorted.length) {
    return null;
  }

  const progressWidth = (value, index) => `${Math.max(10, 80 - index * 20)}%`;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Skill Gap Analysis</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Most Developed Skills</h3>
          <div className="space-y-3">
            {topDeveloped.map(([skill, levels], index) => (
              <SkillProgressBar
                key={skill}
                skill={skill}
                label={`${levels.Expert || 0} expert${(levels.Expert || 0) === 1 ? "" : "s"}`}
                width={progressWidth(levels.Expert || 0, index)}
                color="bg-green-500"
              />
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Skills Needing Development</h3>
          <div className="space-y-3">
            {needingDevelopment.map(([skill, levels], index) => (
              <SkillProgressBar
                key={skill}
                skill={skill}
                label={`${levels.Expert || 0} expert${(levels.Expert || 0) === 1 ? "" : "s"}`}
                width={progressWidth(levels.Expert || 0, index)}
                color="bg-amber-500"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SkillProgressBar = ({ skill, label, width, color }) => (
  <div>
    <div className="flex justify-between text-sm mb-1">
      <span>{skill}</span>
      <span>{label}</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div className={`${color} h-2 rounded-full`} style={{ width }} />
    </div>
  </div>
);

const SkillSearch = ({ skills, experts, recentEndorsements }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [roleFilter, setRoleFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("All");

  const roles = useMemo(() => {
    const set = new Set(experts.map((expert) => expert.role).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [experts]);

  const availabilityOptions = useMemo(() => {
    const set = new Set(experts.map((expert) => expert.availability).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [experts]);

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
  };

  const filteredExperts = experts.filter((expert) => {
    const matchesSearch =
      !searchTerm ||
      expert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expert.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSkills = !selectedSkills.length || selectedSkills.every((skill) => expert.skills.includes(skill));

    const matchesRole = roleFilter === "All" || expert.role === roleFilter;

    const matchesAvailability = availabilityFilter === "All" || expert.availability === availabilityFilter;

    return matchesSearch && matchesSkills && matchesRole && matchesAvailability;
  });

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Find Team Experts</h2>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search by name or role</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search team members..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {availabilityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {skills.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Skills</label>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedSkills.includes(skill)
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  {skill}
                  {selectedSkills.includes(skill) && <span className="ml-1">×</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">
            {filteredExperts.length} {filteredExperts.length === 1 ? "expert found" : "experts found"}
          </p>
          {selectedSkills.length > 0 && (
            <div className="text-sm text-gray-500">Filtering by: {selectedSkills.join(", ")}</div>
          )}
        </div>

        <div className="space-y-4">
          {filteredExperts.length > 0 ? (
            filteredExperts.map((expert) => (
              <div key={expert.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex items-center mb-4 md:mb-0">
                    <div className="bg-indigo-100 rounded-full p-1 mr-4">
                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{expert.name}</h3>
                      <p className="text-gray-600">{expert.role}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <AvailabilityPill availability={expert.availability} />
                    {typeof expert.projects === "number" && (
                      <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {expert.projects} project{expert.projects === 1 ? "" : "s"}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Top Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {expert.skills.map((skill) => (
                      <div key={skill} className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
                        <span className="font-medium">{skill}</span>
                        {expert.endorsements?.[skill] && (
                          <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full">
                            {expert.endorsements[skill]} endorsements
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
                    View Full Profile
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No experts found</h3>
              <p className="text-gray-500">Try adjusting your filters to find the right expert.</p>
            </div>
          )}
        </div>
      </div>

      {recentEndorsements?.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Skill Endorsements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentEndorsements.map((endorsement, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 mr-3" />
                  <div>
                    <p className="font-medium">{endorsement.from}</p>
                    <p className="text-gray-500 text-sm">Endorsed {endorsement.to}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                    {endorsement.skill}
                  </span>
                  <span className="text-gray-500 text-sm">{endorsement.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SkillEndorsements = ({ userSkills, topExperts }) => {
  const [skills, setSkills] = useState(userSkills);

  const handleEndorse = (index) => {
    setSkills((prev) =>
      prev.map((skill, idx) =>
        idx === index && !skill.endorsed
          ? { ...skill, endorsed: true, endorsements: (skill.endorsements || 0) + 1 }
          : skill
      )
    );
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Your Skills & Endorsements</h2>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">Add Skill</button>
        </div>

        {skills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.map((skill, index) => (
              <div key={skill.name} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">{skill.name}</h3>
                    <p className="text-gray-600">
                      {skill.endorsements} endorsement{skill.endorsements === 1 ? "" : "s"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleEndorse(index)}
                    disabled={skill.endorsed}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      skill.endorsed
                        ? "bg-green-100 text-green-800 cursor-default"
                        : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                    }`}
                  >
                    {skill.endorsed ? "✓ Endorsed" : "+ Endorse"}
                  </button>
                </div>
                {skill.endorsed && <p className="mt-2 text-sm text-gray-500">You endorsed this skill</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">Add your primary skills so teammates can endorse your expertise.</p>
        )}
      </div>

      {topExperts.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Team Experts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topExperts.map((expert) => (
              <div key={expert.name} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <div className="bg-indigo-100 rounded-full p-2 mr-3">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{expert.name}</h3>
                    <p className="text-gray-600 text-sm">{expert.role}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">{expert.skill}</span>
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Top Expert
                  </span>
                </div>
                <p className="mt-3 text-gray-600 text-sm">{expert.endorsements} endorsements</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const LearningGoals = ({ goals, resources }) => {
  const [learningGoals, setLearningGoals] = useState(goals);

  const toggleCheckpoint = (goalId, checkpointId) => {
    setLearningGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) return goal;
        const updatedCheckpoints = goal.checkpoints.map((checkpoint) =>
          checkpoint.id === checkpointId ? { ...checkpoint, done: !checkpoint.done } : checkpoint
        );
        const doneCount = updatedCheckpoints.filter((checkpoint) => checkpoint.done).length;
        const newProgress = Math.round((doneCount / updatedCheckpoints.length) * 100);
        return { ...goal, checkpoints: updatedCheckpoints, progress: newProgress };
      })
    );
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Your Learning Goals</h2>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Goal
          </button>
        </div>

        {learningGoals.length > 0 ? (
          <div className="space-y-6">
            {learningGoals.map((goal) => {
              const dueDate = new Date(goal.dueDate);
              const today = new Date();
              const daysLeft = Math.max(0, Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24)));

              return (
                <div key={goal.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-lg">{goal.title}</h3>
                    <div className="flex items-center">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          daysLeft < 7
                            ? "bg-red-100 text-red-800"
                            : daysLeft < 14
                            ? "bg-amber-100 text-amber-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        Due: {dueDate.toLocaleDateString()} ({daysLeft} days)
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${
                          goal.progress < 30 ? "bg-red-500" : goal.progress < 70 ? "bg-amber-500" : "bg-green-500"
                        }`}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Checkpoints</h4>
                    <ul className="space-y-2">
                      {goal.checkpoints.map((checkpoint) => (
                        <li key={checkpoint.id} className="flex items-start">
                          <input
                            type="checkbox"
                            checked={checkpoint.done}
                            onChange={() => toggleCheckpoint(goal.id, checkpoint.id)}
                            className="mt-1 h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          <div className="ml-3">
                            <span className={checkpoint.done ? "line-through text-gray-500" : "text-gray-800"}>
                              {checkpoint.task}
                            </span>
                            {checkpoint.link && (
                              <a
                                href={checkpoint.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-indigo-600 hover:underline text-sm flex items-center"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                </svg>
                                Resource
                              </a>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-600">Track the skills you want to develop by adding new learning goals.</p>
        )}
      </div>

      {resources.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recommended Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {resources.map((resource) => {
              const accentClasses = {
                indigo: "bg-indigo-100",
                amber: "bg-amber-100",
                green: "bg-green-100"
              };
              const accentClass = accentClasses[resource.accent] || "bg-gray-100";
              return (
                <div key={resource.title} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className={`rounded-lg p-3 mb-3 ${accentClass}`}>
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="font-semibold mb-1">{resource.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{resource.description}</p>
                  <button className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
                    {resource.cta} →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const buildSkillDataset = (team, currentUser) => {
  if (!team) {
    return {
      members: [],
      skills: [],
      levels: {},
      experts: [],
      userSkills: [],
      learningGoals: [],
      topExperts: [],
      recentEndorsements: [],
      resources: []
    };
  }

  const normalizedMembers = team.users.map((member, index) => {
    const identifier = (member.name || member.email || "").toLowerCase();
    const profile = SAMPLE_SKILL_PROFILES[identifier];
    return {
      id: member.id || `member-${index}`,
      name: member.name || member.email || "Member",
      role: member.role || profile?.role || "Member",
      email: member.email,
      profile,
      availability: profile?.availability,
      projects: profile?.projects ?? null,
      skillLevels: profile?.skillLevels || {},
      endorsements: profile?.endorsements || {},
      userSkills: profile?.userSkills || [],
      learningGoals: profile?.learningGoals || []
    };
  });

  const skillsSet = new Set();
  normalizedMembers.forEach((member) => {
    Object.entries(member.skillLevels).forEach(([skill, level]) => {
      if (level) {
        skillsSet.add(skill);
      }
    });
  });
  const skills = Array.from(skillsSet);

  const levels = {};
  normalizedMembers.forEach((member) => {
    levels[member.id] = {};
    skills.forEach((skill) => {
      levels[member.id][skill] = member.skillLevels?.[skill] || null;
    });
  });

  const experts = normalizedMembers
    .filter((member) => skills.some((skill) => member.skillLevels?.[skill]))
    .map((member) => ({
      id: member.id,
      name: member.name,
      role: member.role,
      skills: Object.entries(member.skillLevels)
        .filter(([, level]) => level)
        .map(([skill]) => skill),
      endorsements: member.endorsements,
      availability: member.availability,
      projects: member.projects
    }));

  const currentIdentifier = (currentUser?.name || currentUser?.email || "").toLowerCase();
  const currentProfile = normalizedMembers.find((member) => {
    const normalizedName = (member.name || "").toLowerCase();
    const normalizedEmail = (member.email || "").toLowerCase();
    return normalizedName === currentIdentifier || normalizedEmail === currentIdentifier;
  });

  const topExperts = normalizedMembers
    .map((member) => {
      const expertSkill = Object.entries(member.skillLevels || {}).find(([, level]) => level === "Expert");
      if (!expertSkill) return null;
      const [skill] = expertSkill;
      const endorsements = Object.values(member.endorsements || {}).reduce((acc, value) => acc + value, 0);
      return {
        name: member.name,
        role: member.role,
        skill,
        endorsements
      };
    })
    .filter(Boolean)
    .slice(0, 3);

  return {
    members: normalizedMembers,
    skills,
    levels,
    experts,
    userSkills: currentProfile?.userSkills || [],
    learningGoals: currentProfile?.learningGoals || [],
    topExperts,
    recentEndorsements: SAMPLE_RECENT_ENDORSEMENTS,
    resources: SAMPLE_RECOMMENDED_RESOURCES
  };
};

const TeamSkillInsights = ({ team, currentUser }) => {
  const [activeTab, setActiveTab] = useState("matrix");

  const dataset = useMemo(() => buildSkillDataset(team, currentUser), [team, currentUser]);

  if (!team) {
    return null;
  }

  const hasSkillData = dataset.skills.length > 0;

  return (
    <section className="mt-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Skill Insights</h2>
          <p className="text-gray-600">Explore skill coverage, endorsements, and growth plans for this team.</p>
        </div>
        <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium">
          {dataset.members.length} profile{dataset.members.length === 1 ? "" : "s"} mapped to skill data
        </div>
      </div>

      {!hasSkillData ? (
        <div className="mt-6 bg-white border border-dashed border-indigo-200 rounded-xl p-8 text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Skill profiles not configured</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We could not find skill information for the members of this team. Add skill levels to user profiles to unlock the
            matrix, expert search, and learning goal experiences.
          </p>
        </div>
      ) : (
        <>
          <nav className="mt-8 border-b border-gray-200 flex flex-wrap">
            <InsightTab label="Skill Matrix" value="matrix" activeTab={activeTab} onSelect={setActiveTab} />
            <InsightTab label="Find Experts" value="search" activeTab={activeTab} onSelect={setActiveTab} />
            <InsightTab label="Endorsements" value="endorsements" activeTab={activeTab} onSelect={setActiveTab} />
            <InsightTab label="Learning Goals" value="goals" activeTab={activeTab} onSelect={setActiveTab} />
          </nav>

          <div className="mt-8 space-y-8">
            {activeTab === "matrix" && (
              <TeamSkillMatrix members={dataset.members} skills={dataset.skills} levels={dataset.levels} />
            )}
            {activeTab === "search" && (
              <SkillSearch
                skills={dataset.skills}
                experts={dataset.experts}
                recentEndorsements={dataset.recentEndorsements}
              />
            )}
            {activeTab === "endorsements" && (
              <SkillEndorsements userSkills={dataset.userSkills} topExperts={dataset.topExperts} />
            )}
            {activeTab === "goals" && (
              <LearningGoals goals={dataset.learningGoals} resources={dataset.resources} />
            )}
          </div>
        </>
      )}
    </section>
  );
};

const InsightTab = ({ label, value, activeTab, onSelect }) => {
  const isActive = activeTab === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
        isActive
          ? "border-indigo-600 text-indigo-600"
          : "border-transparent text-gray-500 hover:text-indigo-600 hover:border-indigo-200"
      }`}
    >
      {label}
    </button>
  );
};

export default TeamSkillInsights;
