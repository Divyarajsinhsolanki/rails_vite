// src/components/LearningGoals.js
import React, { useState } from 'react';

const LearningGoals = () => {
  const [learningGoals, setLearningGoals] = useState([
    {
      id: 1,
      title: "Master Docker",
      dueDate: "2025-08-30",
      progress: 50,
      checkpoints: [
        { id: 1, task: "Complete Docker Basics course", done: true, link: "https://internal.courses/docker101" },
        { id: 2, task: "Containerize a sample app", done: false, link: "https://github.com/org/project/issues/123" },
        { id: 3, task: "Deploy multi-container application", done: false, link: "" },
        { id: 4, task: "Optimize Docker images", done: false, link: "" },
      ]
    },
    {
      id: 2,
      title: "Become proficient in React Performance",
      dueDate: "2025-09-15",
      progress: 30,
      checkpoints: [
        { id: 1, task: "Complete React Performance course", done: true, link: "https://internal.courses/react-perf" },
        { id: 2, task: "Implement memoization in project", done: true, link: "" },
        { id: 3, task: "Analyze bundle size and optimize", done: false, link: "" },
      ]
    },
    {
      id: 3,
      title: "Learn TypeScript Advanced Patterns",
      dueDate: "2025-10-10",
      progress: 10,
      checkpoints: [
        { id: 1, task: "Read Advanced TypeScript book", done: false, link: "" },
        { id: 2, task: "Complete type challenges", done: false, link: "https://github.com/type-challenges/type-challenges" },
      ]
    }
  ]);

  const toggleCheckpoint = (goalId, checkpointId) => {
    const updatedGoals = learningGoals.map(goal => {
      if (goal.id === goalId) {
        const updatedCheckpoints = goal.checkpoints.map(checkpoint => {
          if (checkpoint.id === checkpointId) {
            return { ...checkpoint, done: !checkpoint.done };
          }
          return checkpoint;
        });
        
        // Calculate new progress
        const doneCount = updatedCheckpoints.filter(cp => cp.done).length;
        const newProgress = Math.round((doneCount / updatedCheckpoints.length) * 100);
        
        return { 
          ...goal, 
          checkpoints: updatedCheckpoints, 
          progress: newProgress 
        };
      }
      return goal;
    });
    
    setLearningGoals(updatedGoals);
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
        
        <div className="space-y-6">
          {learningGoals.map(goal => {
            const dueDate = new Date(goal.dueDate);
            const today = new Date();
            const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            
            return (
              <div key={goal.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-lg">{goal.title}</h3>
                  <div className="flex items-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      daysLeft < 7 
                        ? 'bg-red-100 text-red-800' 
                        : daysLeft < 14 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-green-100 text-green-800'
                    }`}>
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
                        goal.progress < 30 
                          ? 'bg-red-500' 
                          : goal.progress < 70 
                            ? 'bg-amber-500' 
                            : 'bg-green-500'
                      }`} 
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Checkpoints</h4>
                  <ul className="space-y-2">
                    {goal.checkpoints.map(checkpoint => (
                      <li key={checkpoint.id} className="flex items-start">
                        <input
                          type="checkbox"
                          checked={checkpoint.done}
                          onChange={() => toggleCheckpoint(goal.id, checkpoint.id)}
                          className="mt-1 h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <div className="ml-3">
                          <span className={`${checkpoint.done ? 'line-through text-gray-500' : 'text-gray-800'}`}>
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
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recommended Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="bg-indigo-100 rounded-lg p-3 mb-3">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto" />
            </div>
            <h3 className="font-semibold mb-1">Docker Deep Dive</h3>
            <p className="text-gray-600 text-sm mb-3">Advanced containerization techniques and best practices</p>
            <button className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
              Explore Course →
            </button>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="bg-amber-100 rounded-lg p-3 mb-3">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto" />
            </div>
            <h3 className="font-semibold mb-1">React Performance Mastery</h3>
            <p className="text-gray-600 text-sm mb-3">Optimize your React apps for maximum speed and efficiency</p>
            <button className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
              Explore Course →
            </button>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="bg-green-100 rounded-lg p-3 mb-3">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto" />
            </div>
            <h3 className="font-semibold mb-1">TypeScript Patterns</h3>
            <p className="text-gray-600 text-sm mb-3">Advanced type patterns and real-world applications</p>
            <button className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
              Explore Course →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningGoals;