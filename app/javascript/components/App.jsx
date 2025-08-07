// src/App.js
import React, { useState } from 'react';
import SkillEndorsements from '../components/SkillEndorsements';
import LearningGoals from '../components/LearningGoals';
import TeamSkillMatrix from '../components/TeamSkillMatrix';
import SkillSearch from '../components/SkillSearch';

function App() {
  const [activeTab, setActiveTab] = useState('endorsements');
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">SkillFlow</h1>
              <p className="text-indigo-200">Team Skills Management Platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-indigo-600 rounded-full p-1">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
              </div>
              <div>
                <p className="font-medium">Alex Johnson</p>
                <p className="text-sm text-indigo-200">Engineering Manager</p>
              </div>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="mt-6">
            <div className="flex space-x-1 border-b border-indigo-500">
              <button 
                className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                  activeTab === 'endorsements' 
                    ? 'bg-white text-indigo-700' 
                    : 'text-indigo-200 hover:text-white hover:bg-indigo-600'
                }`}
                onClick={() => setActiveTab('endorsements')}
              >
                Skill Endorsements
              </button>
              <button 
                className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                  activeTab === 'goals' 
                    ? 'bg-white text-indigo-700' 
                    : 'text-indigo-200 hover:text-white hover:bg-indigo-600'
                }`}
                onClick={() => setActiveTab('goals')}
              >
                Learning Goals
              </button>
              <button 
                className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                  activeTab === 'matrix' 
                    ? 'bg-white text-indigo-700' 
                    : 'text-indigo-200 hover:text-white hover:bg-indigo-600'
                }`}
                onClick={() => setActiveTab('matrix')}
              >
                Team Skill Matrix
              </button>
              <button 
                className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                  activeTab === 'search' 
                    ? 'bg-white text-indigo-700' 
                    : 'text-indigo-200 hover:text-white hover:bg-indigo-600'
                }`}
                onClick={() => setActiveTab('search')}
              >
                Find Experts
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {activeTab === 'endorsements' && <SkillEndorsements />}
        {activeTab === 'goals' && <LearningGoals />}
        {activeTab === 'matrix' && <TeamSkillMatrix />}
        {activeTab === 'search' && <SkillSearch />}
      </main>
      
      <footer className="bg-gray-100 border-t py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>SkillFlow - Team Skills Management Platform</p>
          <p className="text-sm mt-2">© 2025 All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}

export default App;