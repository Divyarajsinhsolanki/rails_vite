import React, { useMemo, useState } from "react";

const LearningGoalsPanel = ({
  goals = [],
  onCreateGoal,
  onDeleteGoal,
  onAddCheckpoint,
  onToggleCheckpoint,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", dueDate: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkpointDrafts, setCheckpointDrafts] = useState({});
  const [pendingCheckpointId, setPendingCheckpointId] = useState(null);

  const sortedGoals = useMemo(() => (
    [...goals].sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    })
  ), [goals]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateGoal = async (event) => {
    event.preventDefault();
    if (!onCreateGoal) return;
    setIsSubmitting(true);
    try {
      await onCreateGoal({
        title: form.title,
        due_date: form.dueDate,
        description: form.description,
      });
      setForm({ title: "", dueDate: "", description: "" });
      setShowModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCheckpoint = async (goalId) => {
    if (!onAddCheckpoint) return;
    const text = (checkpointDrafts[goalId] || "").trim();
    if (text.length === 0) return;

    setPendingCheckpointId(`add-${goalId}`);
    try {
      await onAddCheckpoint(goalId, { title: text });
      setCheckpointDrafts((prev) => ({ ...prev, [goalId]: "" }));
    } finally {
      setPendingCheckpointId(null);
    }
  };

  const toggleCheckpoint = async (checkpoint) => {
    if (!onToggleCheckpoint) return;
    setPendingCheckpointId(checkpoint.id);
    try {
      await onToggleCheckpoint(checkpoint.id, !checkpoint.completed);
    } finally {
      setPendingCheckpointId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Your Learning Goals</h2>
          <p className="text-gray-500 text-sm">Track progress toward the skills you want to level up.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Goal
        </button>
      </div>

      {sortedGoals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500 border border-dashed border-gray-300">
          <p className="font-medium">You haven&apos;t created any learning goals yet.</p>
          <p className="text-sm">Add a goal to stay accountable and celebrate progress.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedGoals.map((goal) => (
            <div key={goal.id} className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">{goal.title}</h3>
                  {goal.description && <p className="text-gray-600 text-sm mt-1 max-w-2xl">{goal.description}</p>}
                </div>
                <div className="flex items-center gap-3">
                  {goal.due_date && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${dueBadgeClass(goal.days_remaining)}`}>
                      Due: {new Date(goal.due_date).toLocaleDateString()} ({formatDays(goal.days_remaining)})
                    </span>
                  )}
                  {onDeleteGoal && (
                    <button
                      onClick={() => onDeleteGoal(goal.id)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${progressColor(goal.progress)}`}
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">Checkpoints</h4>
                <ul className="space-y-2">
                  {goal.checkpoints.map((checkpoint) => (
                    <li key={checkpoint.id} className="flex items-start">
                      <input
                        type="checkbox"
                        checked={checkpoint.completed}
                        onChange={() => toggleCheckpoint(checkpoint)}
                        disabled={pendingCheckpointId === checkpoint.id}
                        className="mt-1 h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <div className="ml-3 text-sm">
                        <span className={checkpoint.completed ? "line-through text-gray-500" : "text-gray-800"}>
                          {checkpoint.title}
                        </span>
                        {checkpoint.resource_url && (
                          <a
                            href={checkpoint.resource_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-indigo-600 hover:underline"
                          >
                            Resource
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                {onAddCheckpoint && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={checkpointDrafts[goal.id] || ""}
                      onChange={(event) => setCheckpointDrafts((prev) => ({ ...prev, [goal.id]: event.target.value }))}
                      placeholder="Add new checkpoint"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      onClick={() => handleAddCheckpoint(goal.id)}
                      disabled={pendingCheckpointId === `add-${goal.id}`}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                    >
                      {pendingCheckpointId === `add-${goal.id}` ? "Saving..." : "Add"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Create a learning goal</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form className="space-y-4" onSubmit={handleCreateGoal}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal title</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="e.g. Master Docker"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target completion date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Add a note about why this goal matters"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const progressColor = (progress) => {
  if (progress < 30) return "bg-red-500";
  if (progress < 70) return "bg-amber-500";
  return "bg-green-500";
};

const dueBadgeClass = (daysRemaining) => {
  if (daysRemaining == null) return "bg-gray-100 text-gray-700";
  if (daysRemaining < 0) return "bg-red-100 text-red-800";
  if (daysRemaining <= 7) return "bg-red-100 text-red-800";
  if (daysRemaining <= 14) return "bg-amber-100 text-amber-800";
  return "bg-green-100 text-green-800";
};

const formatDays = (days) => {
  if (days == null) return "No due date";
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  return `${days} day${days === 1 ? "" : "s"} left`;
};

export default LearningGoalsPanel;
