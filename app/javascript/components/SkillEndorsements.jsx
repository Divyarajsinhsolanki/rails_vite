// src/components/SkillEndorsements.js
import React, { useState } from 'react';

const SkillEndorsements = () => {
  const [userSkills, setUserSkills] = useState([
    { name: "JavaScript", endorsements: 5, endorsed: false },
    { name: "React", endorsements: 3, endorsed: false },
    { name: "Docker", endorsements: 2, endorsed: false },
    { name: "TypeScript", endorsements: 4, endorsed: true },
    { name: "Node.js", endorsements: 3, endorsed: false },
    { name: "AWS", endorsements: 1, endorsed: false },
  ]);
  
  const [topSkills, setTopSkills] = useState([
    { name: "React", user: "Alex Johnson", endorsements: 15 },
    { name: "Docker", user: "Sarah Williams", endorsements: 12 },
    { name: "TypeScript", user: "Michael Chen", endorsements: 10 },
  ]);

  const handleEndorse = (index) => {
    const updatedSkills = [...userSkills];
    if (!updatedSkills[index].endorsed) {
      updatedSkills[index].endorsements += 1;
      updatedSkills[index].endorsed = true;
      setUserSkills(updatedSkills);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Your Skills & Endorsements</h2>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            Add Skill
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userSkills.map((skill, index) => (
            <div 
              key={index} 
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">{skill.name}</h3>
                  <p className="text-gray-600">
                    {skill.endorsements} endorsement{skill.endorsements !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleEndorse(index)}
                  disabled={skill.endorsed}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    skill.endorsed
                      ? 'bg-green-100 text-green-800 cursor-default'
                      : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                  }`}
                >
                  {skill.endorsed ? '✓ Endorsed' : '+ Endorse'}
                </button>
              </div>
              {skill.endorsed && (
                <p className="mt-2 text-sm text-gray-500">
                  You endorsed this skill
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Team Experts</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topSkills.map((skill, index) => (
            <div 
              key={index} 
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center mb-3">
                <div className="bg-indigo-100 rounded-full p-2 mr-3">
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                </div>
                <div>
                  <h3 className="font-semibold">{skill.user}</h3>
                  <p className="text-gray-600 text-sm">Senior Developer</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                  {skill.name}
                </span>
                <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Top Expert
                </span>
              </div>
              <p className="mt-3 text-gray-600 text-sm">
                {skill.endorsements} endorsements
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkillEndorsements;