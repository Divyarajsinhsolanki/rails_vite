import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiCalendar, FiInfo } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function SprintManager({ onSprintChange }) {
  const [sprints, setSprints] = useState([]);
  const [currentSprint, setCurrentSprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState({ name: '', start_date: '', end_date: '', description: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Load all sprints when component mounts
  useEffect(() => {
    fetch('/api/sprints.json')
      .then(res => res.json())
      .then(data => {
        const today = new Date();
        const filteredSprint = data?.find(sprint => {
          const startDate = new Date(sprint.start_date);
          const endDate = new Date(sprint.end_date);
          return today >= startDate && today <= endDate;
        });
  
        setSprints(data || []);
        setCurrentSprint(filteredSprint || null);
        if (filteredSprint && onSprintChange) onSprintChange(filteredSprint);
      })
      .finally(() => setLoading(false));
  }, []);

  // Handle changes in the form inputs
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Submit either a new sprint (POST) or an edit (PATCH)
  const handleSubmit = e => {
    e.preventDefault();
    const method = formData.id ? 'PATCH' : 'POST';
    const url = formData.id ? `/api/sprints/${formData.id}.json` : '/api/sprints.json';

    const payload = {
      sprint: {
        name:        formData.name,
        start_date:  formData.start_date,
        end_date:    formData.end_date,
        description: formData.description || ""
      }
    };

    fetch(url, {
      method,
      headers: {
        'X-CSRF-Token': document.querySelector("meta[name='csrf-token']").content,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(saved => {
        setSprints(prev => {
          const exists = prev.find(s => s.id === saved.id);
          return exists
            ? prev.map(s => (s.id === saved.id ? saved : s))
            : [...prev, saved];
        });
        setCurrentSprint(saved);
        if (onSprintChange) onSprintChange(saved);
        setFormVisible(false);
        setFormData({ name: '', start_date: '', end_date: '', description: '' });
      })
      .catch(err => console.error("Error saving sprint:", err));
  };

  // Delete a sprint by id
  const handleDelete = (id) => {
    setIsDeleting(true);
    fetch(`/api/sprints/${id}.json`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': document.querySelector("meta[name='csrf-token']").content,
        'Accept': 'application/json'
      }
    })
      .then(() => {
        const remaining = sprints.filter(s => s.id !== id);
        setSprints(remaining);
        const next = remaining[remaining.length - 1] || null;
        setCurrentSprint(next);
        if (onSprintChange) onSprintChange(next);
      })
      .catch(err => console.error("Error deleting sprint:", err))
      .finally(() => setIsDeleting(false));
  };

  // Select a sprint when its card is clicked
  const handleSelectSprint = (s) => {
    setCurrentSprint(s);
    if (onSprintChange) onSprintChange(s);
  };

  // Calculate progress percentage for a sprint
  const calculateProgress = (sprint) => {
    if (!sprint) return 0;
    
    const start = new Date(sprint.start_date);
    const end = new Date(sprint.end_date);
    const today = new Date();
    
    if (today < start) return 0;
    if (today > end) return 100;
    
    const total = end - start;
    const elapsed = today - start;
    return Math.round((elapsed / total) * 100);
  };

  // Format date to "MMM d" format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl shadow-xl border border-gray-200">
      {/* Sprint Cards */}
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sprints.map((s) => {
            const isActive = s.id === currentSprint?.id;
            const progress = calculateProgress(s);
            
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => handleSelectSprint(s)}
                className={`
                  relative 
                  p-5
                  rounded-xl 
                  cursor-pointer 
                  transition-all
                  transform
                  duration-300
                  ${isActive 
                    ? 'bg-gradient-to-br from-white to-gray-50 ring-2 ring-blue-500 shadow-lg scale-[1.02]' 
                    : 'bg-white hover:bg-gray-50 hover:shadow-md'}
                `}
              >
                {/* Progress bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-200 rounded-t-xl">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-t-xl transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                {/* Sprint Info */}
                <div className="flex flex-col h-full">
                  <div className="flex items-start">
                    <h3 className={`font-bold text-lg ${isActive ? 'text-blue-600' : 'text-gray-800'}`}>
                      {s.name}
                    </h3>
                    {progress === 100 && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Completed
                      </span>
                    )}
                    {progress > 0 && progress < 100 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        In Progress
                      </span>
                    )}
                    {progress === 0 && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                        Upcoming
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3 text-gray-600">
                    <FiCalendar className="text-gray-500" />
                    <span className="text-sm font-medium">
                      {formatDate(s.start_date)} - {formatDate(s.end_date)}
                    </span>
                  </div>
                  
                  {/*
                  {s.description && (
                    <div className="mt-3 text-gray-600 text-sm flex items-start">
                      <FiInfo className="mt-0.5 mr-2 text-gray-400 flex-shrink-0" />
                      <span className="line-clamp-2">{s.description}</span>
                    </div>
                  )}
                  */}
                  
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-700"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Edit & Delete icons */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const formatDate = iso => iso.slice(0, 10);
                      setFormVisible(true);
                      setFormData({
                        id:          s.id,
                        name:        s.name,
                        start_date:  formatDate(s.start_date),
                        end_date:    formatDate(s.end_date),
                        description: s.description || ""
                      });
                    }}
                    className={`
                      p-2 
                      rounded-lg 
                      transition-colors
                      ${isActive 
                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                    `}
                    title="Edit Sprint"
                  >
                    <FiEdit2 size={18} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to delete the sprint "${s.name}"?`)) {
                        handleDelete(s.id);
                      }
                    }}
                    className={`
                      p-2 
                      rounded-lg 
                      transition-colors
                      ${isActive 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                    `}
                    title="Delete Sprint"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-600"></div>
                    ) : (
                      <FiTrash2 size={18} />
                    )}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}

          {sprints.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-3 py-12 text-center"
            >
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-700">No sprints available</h3>
              <p className="text-gray-500 mt-2">Create your first sprint to get started</p>
            </motion.div>
          )}

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setFormVisible(true);
                setFormData({ name: '', start_date: '', end_date: '', description: '' });
              }}
              className="mt-4 md:mt-0 px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <FiPlus className="text-lg" />
              <span>New Sprint</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Modal for Adding/Editing Sprints */}
      <AnimatePresence>
        {formVisible && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setFormVisible(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-xl font-bold text-gray-800">
                    {formData.id ? 'Edit Sprint' : 'Create New Sprint'}
                  </h3>
                  <button 
                    onClick={() => setFormVisible(false)}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                  >
                    <FiX size={20} />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sprint Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Q3 Release Sprint"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Add details about this sprint..."
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    ></textarea>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setFormVisible(false)}
                      className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow hover:shadow-md transition"
                    >
                      {formData.id ? 'Update Sprint' : 'Create Sprint'}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}