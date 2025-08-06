import React, { useState } from "react";

// Dashboard showcasing endorsements, learning goals, skill matrix, and search
const TeamSkillsDashboard = () => {
  // sample endorsements for a single user
  const [endorsements, setEndorsements] = useState([
    { name: "JavaScript", endorsements: 5 },
    { name: "React", endorsements: 3 },
    { name: "Docker", endorsements: 2 },
  ]);

  const handleEndorse = (skillName) => {
    setEndorsements((prev) =>
      prev.map((s) =>
        s.name === skillName ? { ...s, endorsements: s.endorsements + 1 } : s
      )
    );
  };

  // learning goals with checkpoints
  const [goals, setGoals] = useState([
    {
      title: "Master Docker",
      dueDate: "2025-08-30",
      progress: 50,
      checkpoints: [
        {
          task: "Complete Docker 101 course",
          done: true,
          link: "https://example.com/docker-course",
        },
        {
          task: "Containerize a sample app",
          done: false,
          link: "https://github.com/org/project/issues/123",
        },
      ],
    },
  ]);

  const toggleCheckpoint = (goalIdx, cpIdx) => {
    setGoals((prev) =>
      prev.map((g, gi) => {
        if (gi !== goalIdx) return g;
        const checkpoints = g.checkpoints.map((cp, ci) =>
          ci === cpIdx ? { ...cp, done: !cp.done } : cp
        );
        const completed = checkpoints.filter((cp) => cp.done).length;
        const progress = Math.round((completed / checkpoints.length) * 100);
        return { ...g, checkpoints, progress };
      })
    );
  };

  // team skill matrix data
  const matrix = {
    members: ["Alice", "Bob", "Carol"],
    skills: ["Docker", "React", "Python"],
    levels: {
      Alice: { Docker: "Expert", React: "Beginner", Python: "Intermediate" },
      Bob: { Docker: null, React: "Expert", Python: "Intermediate" },
      Carol: { Docker: "Intermediate", React: "Intermediate", Python: "Expert" },
    },
  };

  // skill search data
  const people = [
    {
      name: "Alice",
      role: "Backend Developer",
      skills: ["Ruby", "PostgreSQL", "Docker"],
      endorsements: { Ruby: 4 },
    },
    {
      name: "David",
      role: "Backend Developer",
      skills: ["Ruby", "AWS"],
      endorsements: { Ruby: 2 },
    },
    {
      name: "Carol",
      role: "Frontend Developer",
      skills: ["React", "JavaScript"],
      endorsements: { React: 3 },
    },
  ];

  const [skillFilter, setSkillFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const filteredPeople = people.filter((p) => {
    const skillMatch = skillFilter ? p.skills.includes(skillFilter) : true;
    const roleMatch = roleFilter ? p.role === roleFilter : true;
    return skillMatch && roleMatch;
  });

  return (
    <div className="space-y-8 mt-8">
      {/* Endorsements */}
      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Skills &amp; Endorsements</h2>
        {endorsements.map((skill) => (
          <div
            key={skill.name}
            className="flex justify-between items-center py-2 border-b last:border-b-0"
          >
            <span>
              {skill.name}
              <span className="text-sm text-gray-600 ml-1">
                ({skill.endorsements} endorsements)
              </span>
            </span>
            <button
              onClick={() => handleEndorse(skill.name)}
              className="text-blue-600 hover:text-blue-800"
            >
              + Endorse
            </button>
          </div>
        ))}
      </section>

      {/* Learning Goals */}
      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Learning Goals</h2>
        {goals.map((goal, gi) => (
          <div key={goal.title} className="border rounded-md p-4 mb-4">
            <div className="flex justify-between mb-2">
              <div>
                <h3 className="font-medium">{goal.title}</h3>
                <p className="text-sm text-gray-600">Due: {goal.dueDate}</p>
              </div>
              <span className="text-sm">{goal.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded h-2 mb-3">
              <div
                className="bg-blue-500 h-2 rounded"
                style={{ width: goal.progress + "%" }}
              />
            </div>
            <ul className="ml-5 list-disc text-sm space-y-1">
              {goal.checkpoints.map((cp, ci) => (
                <li key={cp.task} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={cp.done}
                    onChange={() => toggleCheckpoint(gi, ci)}
                    className="mr-2"
                  />
                  <span className={cp.done ? "line-through text-gray-500" : ""}>
                    {cp.task}
                  </span>
                  {cp.link && (
                    <a
                      href={cp.link}
                      className="ml-2 text-blue-600 underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      resource
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Skill Matrix */}
      <section className="bg-white p-6 rounded shadow overflow-auto">
        <h2 className="text-xl font-semibold mb-4">Team Skill Matrix</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="w-1/6 p-2 text-left">Team Member</th>
                {matrix.skills.map((skill) => (
                  <th key={skill} className="p-2 text-left">
                    {skill}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.members.map((member) => (
                <tr key={member} className="border-b">
                  <td className="p-2 font-medium">{member}</td>
                  {matrix.skills.map((skill) => {
                    const level = matrix.levels[member][skill];
                    let classes =
                      "px-2 py-0.5 text-xs font-semibold rounded";
                    if (level === "Expert")
                      classes += " bg-green-100 text-green-800";
                    else if (level === "Intermediate")
                      classes += " bg-yellow-100 text-yellow-800";
                    else if (level === "Beginner")
                      classes += " bg-gray-100 text-gray-800";
                    return (
                      <td key={skill} className="p-2">
                        {level ? (
                          <span className={classes}>{level}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Skill Search */}
      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Skill Search</h2>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <input
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            placeholder="Skill..."
            className="p-2 border rounded"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Any Role</option>
            <option>Backend Developer</option>
            <option>Frontend Developer</option>
          </select>
        </div>
        {filteredPeople.map((p) => (
          <div
            key={p.name}
            className="bg-gray-50 p-3 mb-2 rounded border"
          >
            <h4 className="font-medium">
              {p.name} —
              <span className="text-sm text-gray-700"> {p.role}</span>
            </h4>
            <p className="text-sm">Skills: {p.skills.join(", ")}</p>
            {skillFilter && (
              <p className="text-sm text-gray-600">
                {skillFilter} endorsements: {p.endorsements[skillFilter] || 0}
              </p>
            )}
          </div>
        ))}
        {filteredPeople.length === 0 && (
          <p className="text-sm text-gray-500">No matching users.</p>
        )}
      </section>
    </div>
  );
};

export default TeamSkillsDashboard;
