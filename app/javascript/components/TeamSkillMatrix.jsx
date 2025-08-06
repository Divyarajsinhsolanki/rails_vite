// src/components/TeamSkillMatrix.js
import React, { useState } from 'react';

const TeamSkillMatrix = () => {
  const [teamSkills] = useState({
    members: [
      { id: 1, name: "Alex Johnson", role: "Engineering Manager" },
      { id: 2, name: "Sarah Williams", role: "Senior Developer" },
      { id: 3, name: "Michael Chen", role: "Frontend Developer" },
      { id: 4, name: "Emma Rodriguez", role: "Backend Developer" },
      { id: 5, name: "James Wilson", role: "DevOps Engineer" },
    ],
    skills: ["JavaScript", "React", "TypeScript", "Node.js", "Docker", "AWS", "Python", "GraphQL"],
    levels: {
      1: { JavaScript: "Expert", React: "Expert", TypeScript: "Expert", Nodejs: "Advanced", Docker: "Intermediate", AWS: "Intermediate", Python: null, GraphQL: "Intermediate" },
      2: { JavaScript: "Expert", React: "Expert", TypeScript: "Advanced", Nodejs: "Advanced", Docker: "Expert", AWS: "Advanced", Python: "Intermediate", GraphQL: "Advanced" },
      3: { JavaScript: "Advanced", React: "Expert", TypeScript: "Advanced", Nodejs: "Intermediate", Docker: "Beginner", AWS: "Beginner", Python: null, GraphQL: "Intermediate" },
      4: { JavaScript: "Intermediate", React: "Intermediate", TypeScript: "Intermediate", Nodejs: "Expert", Docker: "Advanced", AWS: "Intermediate", Python: "Advanced", GraphQL: "Advanced" },
      5: { JavaScript: "Intermediate", React: "Beginner", TypeScript: null, Nodejs: "Advanced", Docker: "Expert", AWS: "Expert", Python: "Intermediate", GraphQL: "Beginner" },
    }
  });

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [filterRole, setFilterRole] = useState('All');
  
  const roles = ['All', 'Engineering Manager', 'Senior Developer', 'Frontend Developer', 'Backend Developer', 'DevOps Engineer'];
  
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Apply filtering and sorting
  const filteredMembers = teamSkills.members.filter(member => 
    filterRole === 'All' || member.role === filterRole
  );
  
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (sortConfig.key) {
      const aValue = teamSkills.levels[a.id][sortConfig.key] || '';
      const bValue = teamSkills.levels[b.id][sortConfig.key] || '';
      
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
    }
    return 0;
  });

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
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
              <span className="text-sm">Expert</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-amber-500 rounded mr-2"></div>
              <span className="text-sm">Advanced</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              <span className="text-sm">Intermediate</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-300 rounded mr-2"></div>
              <span className="text-sm">Beginner</span>
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
                {teamSkills.skills.map(skill => (
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
                          className={`h-4 w-4 ml-1 ${sortConfig.direction === 'ascending' ? '' : 'transform rotate-180'}`} 
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
              {sortedMembers.map(member => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-3 text-sm sticky left-0 bg-white z-10">
                    <div className="flex items-center">
                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8 mr-3" />
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-gray-500 text-xs">{member.role}</div>
                      </div>
                    </div>
                  </td>
                  {teamSkills.skills.map(skill => {
                    const level = teamSkills.levels[member.id][skill];
                    return (
                      <td 
                        key={`${member.id}-${skill}`} 
                        className="border border-gray-200 px-4 py-3 text-center"
                      >
                        {level ? (
                          <div className="flex justify-center">
                            <span className={`
                              px-3 py-1 rounded-full text-xs font-medium
                              ${level === "Expert" 
                                  ? "bg-green-100 text-green-800" 
                                  : level === "Advanced" 
                                    ? "bg-amber-100 text-amber-800" 
                                    : level === "Intermediate" 
                                      ? "bg-blue-100 text-blue-800" 
                                      : "bg-gray-100 text-gray-800"}
                            `}>
                              {level}
                            </span>
                          </div>
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
      
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Skill Gap Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Most Developed Skills</h3>
            <div className="space-y-3">
              {['React', 'JavaScript', 'Node.js'].map((skill, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{skill}</span>
                    <span>4 experts</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${80 - index*20}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Skills Needing Development</h3>
            <div className="space-y-3">
              {['GraphQL', 'Python', 'AWS'].map((skill, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{skill}</span>
                    <span>{index+1} expert{index+1 !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${30 - index*10}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamSkillMatrix;