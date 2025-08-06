// src/components/SkillSearch.js
import React, { useState } from 'react';

const SkillSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [roleFilter, setRoleFilter] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState('All');
  
  const skills = ["JavaScript", "React", "TypeScript", "Node.js", "Docker", "AWS", "Python", "GraphQL"];
  
  const users = [
    {
      id: 1,
      name: "Sarah Williams",
      role: "Senior Developer",
      skills: ["JavaScript", "React", "TypeScript", "Docker", "AWS"],
      endorsements: { JavaScript: 12, React: 15, TypeScript: 10, Docker: 12, AWS: 8 },
      availability: "Available Now",
      projects: 2
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Frontend Developer",
      skills: ["JavaScript", "React", "TypeScript", "GraphQL"],
      endorsements: { JavaScript: 8, React: 10, TypeScript: 9, GraphQL: 7 },
      availability: "Available in 2 weeks",
      projects: 3
    },
    {
      id: 3,
      name: "Emma Rodriguez",
      role: "Backend Developer",
      skills: ["JavaScript", "Node.js", "Python", "Docker", "AWS"],
      endorsements: { JavaScript: 9, Nodejs: 12, Python: 7, Docker: 9, AWS: 10 },
      availability: "Available Now",
      projects: 1
    },
    {
      id: 4,
      name: "James Wilson",
      role: "DevOps Engineer",
      skills: ["Docker", "AWS", "Node.js", "Python"],
      endorsements: { Docker: 14, AWS: 15, Nodejs: 8, Python: 6 },
      availability: "Fully Booked",
      projects: 4
    },
  ];
  
  const roles = ['All', 'Senior Developer', 'Frontend Developer', 'Backend Developer', 'DevOps Engineer'];
  const availabilityOptions = ['All', 'Available Now', 'Available in 2 weeks', 'Fully Booked'];
  
  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };
  
  const filteredUsers = users.filter(user => {
    // Filter by search term
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by selected skills
    const matchesSkills = selectedSkills.length === 0 || 
      selectedSkills.every(skill => user.skills.includes(skill));
    
    // Filter by role
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    
    // Filter by availability
    const matchesAvailability = availabilityFilter === 'All' || user.availability === availabilityFilter;
    
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
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
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
              {availabilityOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Skills</label>
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedSkills.includes(skill)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {skill}
                {selectedSkills.includes(skill) && (
                  <span className="ml-1">×</span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'expert found' : 'experts found'}
          </p>
          <div className="text-sm text-gray-500">
            {selectedSkills.length > 0 && `Filtering by: ${selectedSkills.join(', ')}`}
          </div>
        </div>
        
        <div className="space-y-4">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <div key={user.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex items-center mb-4 md:mb-0">
                    <div className="bg-indigo-100 rounded-full p-1 mr-4">
                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <p className="text-gray-600">{user.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      user.availability === "Available Now" 
                        ? "bg-green-100 text-green-800" 
                        : user.availability === "Available in 2 weeks" 
                          ? "bg-amber-100 text-amber-800" 
                          : "bg-red-100 text-red-800"
                    }`}>
                      {user.availability}
                    </div>
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {user.projects} project{user.projects !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Top Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map(skill => (
                      <div key={skill} className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
                        <span className="font-medium">{skill}</span>
                        {user.endorsements[skill] && (
                          <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full">
                            {user.endorsements[skill]} endorsements
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
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No experts found</h3>
              <p className="text-gray-500">
                Try adjusting your filters to find the right expert
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Skill Endorsements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { from: "Alex Johnson", to: "Sarah Williams", skill: "Docker", date: "2 days ago" },
            { from: "Emma Rodriguez", to: "Michael Chen", skill: "TypeScript", date: "3 days ago" },
            { from: "James Wilson", to: "Alex Johnson", skill: "AWS", date: "4 days ago" },
          ].map((endorsement, index) => (
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
    </div>
  );
};

export default SkillSearch;