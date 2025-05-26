import React, { useState, useEffect } from 'react';

export default function SprintManager({onSprintChange}) {
  const [sprint, setSprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState({ name: '', start_date: '', end_date: '', description: '' });

  // Fetch last created sprint on mount
  useEffect(() => {
    fetch('/sprints/last.json')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setSprint(data);
          setFormData({
            name: data.name,
            start_date: data.start_date,
            end_date: data.end_date,
            description: data.description || ''
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    const url = sprint ? `/sprints/${sprint.id}.json` : '/sprints.json';
    const method = sprint ? 'PATCH' : 'POST';

    fetch(url, {
      method,
      headers: {
        'X-CSRF-Token': document.querySelector("meta[name='csrf-token']").content,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ sprint: formData })
    })
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        setSprint(data);
        setFormData({ name: data.name, start_date: data.start_date, end_date: data.end_date, description: data.description || '' });
        setFormVisible(false);
        if (onSprintChange) onSprintChange(data);
      })
      .catch(err => console.error('Error saving sprint:', err));
  };

  if (loading) return <div>Loading sprint...</div>;

  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      {!formVisible && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {sprint ? `Current Sprint: ${sprint.name}` : 'No Sprint Defined'}
          </h2>
          <button
            onClick={() => setFormVisible(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {sprint ? 'Edit Sprint' : 'Add Sprint'}
          </button>
        </div>
      )}

      {formVisible && (
        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Sprint Name"
            required
            className="border px-3 py-2 rounded"
          />
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            required
            className="border px-3 py-2 rounded"
          />
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            required
            className="border px-3 py-2 rounded"
          />
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Description (optional)"
            className="border px-3 py-2 rounded"
          />
          <div className="col-span-1 md:col-span-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                if (sprint) {
                  setFormData({
                    name: sprint.name,
                    start_date: sprint.start_date,
                    end_date: sprint.end_date,
                    description: sprint.description || ''
                  });
                } else {
                  setFormData({ name: '', start_date: '', end_date: '', description: '' });
                }
                setFormVisible(false);
              }}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save Sprint
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
