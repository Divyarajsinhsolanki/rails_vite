import React, { useEffect, useMemo, useState } from "react";
import {
  createCalendarEvent,
  createEventReminder,
  fetchCalendarEvents,
  fetchProjects,
} from "../components/api";

const EVENT_TYPES = [
  { value: "meeting", label: "Meeting" },
  { value: "deadline", label: "Deadline" },
  { value: "reminder", label: "Reminder" },
  { value: "focus", label: "Focus Block" },
  { value: "sprint_ceremony", label: "Sprint Ceremony" },
];

const VISIBILITY_OPTIONS = [
  { value: "personal", label: "Personal" },
  { value: "project", label: "Project" },
];

const REMINDER_OPTIONS = [
  { value: "", label: "No reminder" },
  { value: "10", label: "10 min before" },
  { value: "30", label: "30 min before" },
  { value: "1440", label: "1 day before" },
];

const toInputDateTime = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const Calendar = () => {
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0);
  const defaultEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0);

  const [events, setEvents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    visibility: "",
    projectId: "",
    start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString(),
    end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30).toISOString(),
  });

  const [form, setForm] = useState({
    title: "",
    description: "",
    start_at: toInputDateTime(defaultStart),
    end_at: toInputDateTime(defaultEnd),
    event_type: "meeting",
    visibility: "personal",
    project_id: "",
    location_or_meet_link: "",
    reminder_minutes: "10",
  });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [eventsRes, projectsRes] = await Promise.all([
        fetchCalendarEvents({
          start: filters.start,
          end: filters.end,
          visibility: filters.visibility || undefined,
          project_id: filters.projectId || undefined,
        }),
        fetchProjects(),
      ]);

      setEvents(Array.isArray(eventsRes?.data) ? eventsRes.data : []);
      setProjects(Array.isArray(projectsRes?.data) ? projectsRes.data : []);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to load calendar data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.visibility, filters.projectId]);

  const grouped = useMemo(() => {
    const byDay = {};
    events.forEach((event) => {
      const key = new Date(event.start_at).toLocaleDateString();
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push(event);
    });

    return Object.entries(byDay)
      .sort((a, b) => new Date(a[1][0].start_at) - new Date(b[1][0].start_at))
      .map(([date, dayEvents]) => ({
        date,
        events: dayEvents.sort((a, b) => new Date(a.start_at) - new Date(b.start_at)),
      }));
  }, [events]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        start_at: new Date(form.start_at).toISOString(),
        end_at: new Date(form.end_at).toISOString(),
        event_type: form.event_type,
        visibility: form.visibility,
        project_id: form.visibility === "project" ? Number(form.project_id) : undefined,
        location_or_meet_link: form.location_or_meet_link || undefined,
      };

      const { data: createdEvent } = await createCalendarEvent(payload);

      if (form.reminder_minutes) {
        await createEventReminder(createdEvent.id, {
          channel: "in_app",
          minutes_before: Number(form.reminder_minutes),
        });
      }

      setForm((prev) => ({
        ...prev,
        title: "",
        description: "",
        location_or_meet_link: "",
      }));
      await load();
    } catch (err) {
      const apiErrors = err?.response?.data?.errors;
      setError(Array.isArray(apiErrors) ? apiErrors.join(", ") : "Failed to create calendar event.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid gap-6 lg:grid-cols-3">
      <section className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Calendar & Reminders</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Create personal or project meetings and auto-schedule reminders.</p>

        <form className="mt-5 space-y-3" onSubmit={handleCreate}>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Event title"
            required
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
          />

          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Description (optional)"
            rows={3}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="datetime-local"
              value={form.start_at}
              onChange={(e) => setForm((f) => ({ ...f, start_at: e.target.value }))}
              required
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            />
            <input
              type="datetime-local"
              value={form.end_at}
              onChange={(e) => setForm((f) => ({ ...f, end_at: e.target.value }))}
              required
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.event_type}
              onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value }))}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            >
              {EVENT_TYPES.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select
              value={form.visibility}
              onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value }))}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            >
              {VISIBILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {form.visibility === "project" && (
            <select
              value={form.project_id}
              onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))}
              required
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          )}

          <input
            value={form.location_or_meet_link}
            onChange={(e) => setForm((f) => ({ ...f, location_or_meet_link: e.target.value }))}
            placeholder="Meet link / location"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
          />

          <select
            value={form.reminder_minutes}
            onChange={(e) => setForm((f) => ({ ...f, reminder_minutes: e.target.value }))}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
          >
            {REMINDER_OPTIONS.map((option) => (
              <option key={option.value || "none"} value={option.value}>{option.label}</option>
            ))}
          </select>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {saving ? "Saving..." : "Create event"}
          </button>
        </form>
      </section>

      <section className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Upcoming agenda</h2>
          <div className="flex items-center gap-2">
            <select
              value={filters.visibility}
              onChange={(e) => setFilters((f) => ({ ...f, visibility: e.target.value }))}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            >
              <option value="">All visibility</option>
              <option value="personal">Personal</option>
              <option value="project">Project</option>
            </select>

            <select
              value={filters.projectId}
              onChange={(e) => setFilters((f) => ({ ...f, projectId: e.target.value }))}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            >
              <option value="">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        {loading ? (
          <p className="mt-4 text-sm text-zinc-500">Loading events...</p>
        ) : grouped.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No events in selected range.</p>
        ) : (
          <div className="mt-4 space-y-5">
            {grouped.map((group) => (
              <div key={group.date}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{group.date}</h3>
                <div className="mt-2 space-y-2">
                  {group.events.map((event) => (
                    <article key={event.id} className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3 bg-zinc-50/70 dark:bg-zinc-800/50">
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{event.title}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {new Date(event.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {" - "}
                            {new Date(event.end_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {` • ${event.visibility}`}
                          </p>
                        </div>
                        <span className="text-xs rounded-full px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 h-fit">
                          {event.event_type.replace("_", " ")}
                        </span>
                      </div>

                      {event.description ? <p className="text-sm mt-2 text-zinc-700 dark:text-zinc-300">{event.description}</p> : null}
                      {event.location_or_meet_link ? (
                        <a href={event.location_or_meet_link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 mt-2 inline-block underline break-all">
                          {event.location_or_meet_link}
                        </a>
                      ) : null}

                      {event.event_reminders?.length ? (
                        <p className="text-xs text-zinc-500 mt-2">
                          Reminders: {event.event_reminders.map((r) => `${r.minutes_before}m (${r.channel})`).join(", ")}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Calendar;
