import React, { useState, useEffect, useRef } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiCalendar, FiChevronLeft, FiChevronRight, FiAlertTriangle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function SprintManager({ onSprintChange, projectId }) {
  const [sprints, setSprints] = useState([]);
  const [currentSprint, setCurrentSprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', start_date: '', end_date: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const timelineRef = useRef(null);

  // Load all sprints when component mounts or project changes
  useEffect(() => {
    const query = projectId ? `?project_id=${projectId}` : '';
    fetch(`/api/sprints.json${query}`)
      .then(res => res.json())
      .then(data => {
        const sortedData = data?.sort((a, b) => new Date(a.start_date) - new Date(b.start_date)) || [];
        const today = new Date();
        const activeSprint = sortedData.find(sprint => {
          const startDate = new Date(sprint.start_date);
          const endDate = new Date(sprint.end_date);
          endDate.setHours(23, 59, 59, 999);
          return today >= startDate && today <= endDate;
        });

        setSprints(sortedData);
        const sprintToSelect = activeSprint || (sortedData.length > 0 ? sortedData[0] : null);
        setCurrentSprint(sprintToSelect);
        if (sprintToSelect && onSprintChange) onSprintChange(sprintToSelect);
      })
      .catch(err => console.error("Error fetching sprints:", err))
      .finally(() => setLoading(false));
  }, [projectId]);

  // Scroll to active sprint on load or change
  useEffect(() => {
    if (currentSprint && timelineRef.current) {
      const sprintElement = timelineRef.current.querySelector(`#sprint-${currentSprint.id}`);
      if (sprintElement) {
        sprintElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentSprint]);

  // --- API & FORM HANDLERS ---
  const handleChange = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = e => {
    e.preventDefault();
    setIsSubmitting(true);
    const method = formData.id ? 'PATCH' : 'POST';
    const url = formData.id ? `/api/sprints/${formData.id}.json` : '/api/sprints.json';
    const payload = { sprint: { name: formData.name, start_date: formData.start_date, end_date: formData.end_date, project_id: projectId } };

    fetch(url, {
      method,
      headers: {
        'X-CSRF-Token': document.querySelector("meta[name='csrf-token']").content,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(res => res.ok ? res.json() : Promise.reject('Network response was not ok'))
    .then(saved => {
      setSprints(prev => {
        const exists = prev.find(s => s.id === saved.id);
        const updated = exists ? prev.map(s => (s.id === saved.id ? saved : s)) : [...prev, saved];
        return updated.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
      });
      setCurrentSprint(saved);
      if (onSprintChange) onSprintChange(saved);
      setFormVisible(false);
    })
    .catch(err => console.error("Error saving sprint:", err))
    .finally(() => setIsSubmitting(false));
  };

  const handleDelete = (id) => {
    setIsSubmitting(true);
    fetch(`/api/sprints/${id}.json`, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': document.querySelector("meta[name='csrf-token']").content, 'Accept': 'application/json' }
    })
    .then(() => {
      const remaining = sprints.filter(s => s.id !== id);
      setSprints(remaining);
      const next = remaining.length > 0 ? remaining[0] : null;
      setCurrentSprint(next);
      if (onSprintChange) onSprintChange(next);
      setDeleteCandidate(null);
    })
    .catch(err => console.error("Error deleting sprint:", err))
    .finally(() => setIsSubmitting(false));
  };

  // Select a sprint when its card is clicked
  const handleSelectSprint = (s) => {
    setCurrentSprint(s);
    if (onSprintChange) onSprintChange(s);
  };

  const openForm = (sprint = null) => {
    const formatDate = iso => iso ? new Date(iso).toISOString().slice(0, 10) : '';
    setFormData(sprint ? {
      id: sprint.id,
      name: sprint.name,
      start_date: formatDate(sprint.start_date),
      end_date: formatDate(sprint.end_date)
    } : { id: null, name: '', start_date: '', end_date: '' });
    setFormVisible(true);
  };
  
  const scrollTimeline = (direction) => {
    if (timelineRef.current) {
      const scrollAmount = direction === 'left' ? -timelineRef.current.offsetWidth / 2 : timelineRef.current.offsetWidth / 2;
      timelineRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // --- HELPER FUNCTIONS ---
  const formatDate = (dateString, options = { month: 'short', day: 'numeric' }) => 
    new Date(dateString).toLocaleDateString('en-US', options);

  const calculateWorkingDays = (startDate, endDate) => {
    let start = new Date(startDate);
    let end = new Date(endDate);
    let workingDays = 0;
    
    while (start <= end) {
      const dayOfWeek = start.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday and Not Saturday
        workingDays++;
      }
      start.setDate(start.getDate() + 1);
    }
    return workingDays;
  };

  // --- RENDER LOGIC ---
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 text-slate-800 p-4 sm:p-6 rounded-2xl font-sans border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">MyForms Timeline</h2>
          <p className="text-slate-500 mt-1">Select a sprint to view its details and tasks.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => openForm()}
          className="mt-3 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-sm hover:bg-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 focus:ring-blue-500"
        >
          <FiPlus /><span>New Sprint</span>
        </motion.button>
      </div>

      {/* Timeline View */}
      <div className="relative">
        <button onClick={() => scrollTimeline('left')} className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white/60 rounded-full text-slate-500 hover:bg-white/90 border border-slate-200 shadow-sm transition-all backdrop-blur-sm"><FiChevronLeft size={20}/></button>
        <div ref={timelineRef} className="flex items-center space-x-4 overflow-x-auto pb-4 scrollbar-hide">
          {sprints.map((s, index) => {
            const isActive = s.id === currentSprint?.id;
            const workingDays = calculateWorkingDays(s.start_date, s.end_date);
            return (
              <motion.div
                layout
                id={`sprint-${s.id}`}
                key={s.id}
                onClick={() => handleSelectSprint(s)}
                className={`relative flex-shrink-0 w-56 h-32 p-4 rounded-xl cursor-pointer transition-all duration-300 border flex flex-col justify-between
                  ${isActive 
                    ? 'bg-blue-500 border-blue-500 shadow-lg shadow-blue-500/20 text-white' 
                    : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:shadow-md'
                  }`}
              >
                <div>
                  <span className="font-bold text-lg truncate block">{s.name}</span>
                  <div className={`text-xs mt-1 ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                    <FiCalendar className="inline mr-1.5 mb-0.5" />
                    <span>{formatDate(s.start_date)} - {formatDate(s.end_date)}</span>
                  </div>
                  <div className={`text-xs mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                    <span>Working Days: {workingDays}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <motion.button 
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} 
                    onClick={(e) => { e.stopPropagation(); openForm(s); }} 
                    className={`p-1 rounded-md ${isActive ? 'text-blue-100 hover:bg-blue-400' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    <FiEdit2 size={16} />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} 
                    onClick={(e) => { e.stopPropagation(); setDeleteCandidate(s); }} 
                    className={`p-1 rounded-md ${isActive ? 'text-blue-100 hover:bg-blue-400' : 'text-slate-500 hover:bg-red-100 hover:text-red-600'}`}
                  >
                    <FiTrash2 size={16} />
                  </motion.button>
                </div>
                {index < sprints.length - 1 && <div className="absolute left-full top-1/2 w-4 h-px bg-slate-300"></div>}
              </motion.div>
            );
          })}
        </div>
        <button onClick={() => scrollTimeline('right')} className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white/60 rounded-full text-slate-500 hover:bg-white/90 border border-slate-200 shadow-sm transition-all backdrop-blur-sm"><FiChevronRight size={20}/></button>
      </div>

      {/* --- MODALS --- */}
      <AnimatePresence>
        {formVisible && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            onClick={() => setFormVisible(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <form onSubmit={handleSubmit}>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">{formData.id ? 'Edit Sprint' : 'Create New Sprint'}</h3>
                    <button type="button" onClick={() => setFormVisible(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"><FiX size={20} /></button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Sprint Name</label>
                      <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Summer Release" required className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Start Date</label>
                        <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"/>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">End Date</label>
                        <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} required className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"/>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 rounded-b-xl border-t border-slate-200">
                  <motion.button type="button" onClick={() => setFormVisible(false)} className="px-4 py-2 bg-white text-slate-700 rounded-md border border-slate-300 hover:bg-slate-100 transition" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Cancel</motion.button>
                  <motion.button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-500 text-white rounded-md shadow-sm hover:bg-blue-600 transition disabled:bg-blue-300" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    {isSubmitting ? 'Saving...' : (formData.id ? 'Update Sprint' : 'Create Sprint')}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {deleteCandidate && (
           <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            onClick={() => setDeleteCandidate(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <FiAlertTriangle size={24} className="text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mt-4">Delete Sprint</h3>
                <p className="text-sm text-slate-500 mt-2">Are you sure you want to delete <strong className="text-slate-700">"{deleteCandidate.name}"</strong>? This action is permanent.</p>
              </div>
              <div className="bg-slate-50 px-6 py-4 flex justify-center gap-3 rounded-b-xl border-t border-slate-200">
                <motion.button onClick={() => setDeleteCandidate(null)} className="w-full px-4 py-2 bg-white text-slate-700 rounded-md border border-slate-300 hover:bg-slate-100 transition" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Cancel</motion.button>
                <motion.button onClick={() => handleDelete(deleteCandidate.id)} disabled={isSubmitting} className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition disabled:bg-red-300" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}