import React, { useMemo, useState } from "react";

const SkillDirectory = ({
  members = [],
  skills = [],
  roles = [],
  availabilityOptions = [],
  onToggleEndorse,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [roleFilter, setRoleFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("All");
  const [pendingSkillId, setPendingSkillId] = useState(null);

  const skillNames = useMemo(() => skills.map((skill) => skill.name), [skills]);

  const toggleSkill = (skillName) => {
    setSelectedSkills((prev) =>
      prev.includes(skillName)
        ? prev.filter((name) => name !== skillName)
        : [...prev, skillName]
    );
  };

  const normalizedMembers = useMemo(() => (
    members.map((member) => ({
      ...member,
      searchable: `${member.name} ${member.job_title}`.toLowerCase(),
      skillNames: member.skills.map((skill) => skill.name),
    }))
  ), [members]);

  const filteredMembers = useMemo(() => normalizedMembers.filter((member) => {
    const matchesSearch =
      searchTerm.trim() === "" ||
      member.searchable.includes(searchTerm.toLowerCase());

    const matchesSkills =
      selectedSkills.length === 0 ||
      selectedSkills.every((skill) => member.skillNames.includes(skill));

    const matchesRole = roleFilter === "All" || member.job_title === roleFilter;

    const matchesAvailability =
      availabilityFilter === "All" || member.availability_status === availabilityFilter;

    return matchesSearch && matchesSkills && matchesRole && matchesAvailability;
  }), [normalizedMembers, searchTerm, selectedSkills, roleFilter, availabilityFilter]);

  const handleEndorse = async (skill) => {
    if (!onToggleEndorse) return;
    setPendingSkillId(skill.id);
    try {
      await onToggleEndorse({
        userSkillId: skill.id,
        endorsed: skill.endorsed_by_current_user,
        endorsementId: skill.current_user_endorsement_id,
      });
    } finally {
      setPendingSkillId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Find Team Experts</h2>
        <p className="text-gray-500 text-sm mt-1">Search by name, role, skill or availability to find the right collaborator.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search by name or role</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search team members..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {["All", ...roles].map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
          <select
            value={availabilityFilter}
            onChange={(event) => setAvailabilityFilter(event.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {[{ value: "All", label: "All" }, ...availabilityOptions].map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Skills</label>
        <div className="flex flex-wrap gap-2">
          {skillNames.map((skillName) => {
            const isSelected = selectedSkills.includes(skillName);
            return (
              <button
                key={skillName}
                onClick={() => toggleSkill(skillName)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  isSelected ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {skillName}
                {isSelected && <span className="ml-1">×</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-gray-600 text-sm">
          {filteredMembers.length} {filteredMembers.length === 1 ? "expert found" : "experts found"}
        </p>
        {selectedSkills.length > 0 && (
          <p className="text-sm text-gray-500">Filtering by: {selectedSkills.join(", ")}</p>
        )}
      </div>

      <div className="space-y-4">
        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No experts found</h3>
            <p className="text-gray-500">Try adjusting your filters to discover more team members.</p>
          </div>
        )}
        {filteredMembers.map((member) => (
          <div key={member.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-indigo-100 rounded-full p-1 mr-4">
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{member.name}</h3>
                  <p className="text-gray-600">{member.job_title}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${availabilityBadgeClass(member.availability_status)}`}>
                  {member.availability_label}
                </span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {member.current_projects_count} project{member.current_projects_count === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-medium text-gray-700 mb-2">Top Skills</h4>
              <div className="flex flex-wrap gap-2">
                {member.skills.map((skill) => {
                  const endorsed = skill.endorsed_by_current_user;
                  return (
                    <div
                      key={`${member.id}-${skill.id}`}
                      className="flex items-center bg-gray-50 px-3 py-1 rounded-full space-x-2"
                    >
                      <div>
                        <span className="font-medium mr-1">{skill.name}</span>
                        <span className="text-xs text-gray-500">{skill.endorsements_count} endorsement{skill.endorsements_count === 1 ? "" : "s"}</span>
                      </div>
                      {onToggleEndorse && (
                        <button
                          type="button"
                          onClick={() => handleEndorse(skill)}
                          disabled={pendingSkillId === skill.id}
                          className={`text-xs font-medium px-2 py-0.5 rounded-full border transition-colors ${
                            endorsed
                              ? "border-green-500 text-green-600 bg-green-50"
                              : "border-indigo-500 text-indigo-600 hover:bg-indigo-50"
                          }`}
                        >
                          {pendingSkillId === skill.id
                            ? "Saving..."
                            : endorsed ? "Endorsed" : "Endorse"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
                View Full Profile
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const availabilityBadgeClass = (status) => {
  switch (status) {
    case "available_now":
      return "bg-green-100 text-green-800";
    case "available_soon":
      return "bg-amber-100 text-amber-800";
    case "fully_booked":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export default SkillDirectory;
