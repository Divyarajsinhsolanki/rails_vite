import React, { useEffect, useMemo, useState } from "react";
import {
  FiBell,
  FiCalendar,
  FiClock,
  FiEdit2,
  FiExternalLink,
  FiFilter,
  FiFlag,
  FiLayers,
  FiMapPin,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiStar,
  FiTrash2,
} from "react-icons/fi";
import {
  createCalendarEvent,
  createEventReminder,
  deleteCalendarEvent,
  exportCalendarIcs,
  fetchCalendarEvents,
  fetchProjects,
  getCalendarGoogleLink,
  importCalendarIcs,
  rescheduleCalendarEvent,
  updateCalendarEvent,
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

const STATUS_OPTIONS = ["scheduled", "cancelled", "completed"];

const REMINDER_OPTIONS = [
  { value: "", label: "No reminder" },
  { value: "10", label: "10 min before" },
  { value: "30", label: "30 min before" },
  { value: "1440", label: "1 day before" },
];

const RANGE_OPTIONS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
];

const RECURRENCE_OPTIONS = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const toInputDateTime = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toReadableDate = (isoString) =>
  new Date(isoString).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const toReadableTime = (isoString) =>
  new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

const Calendar = () => {
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0);
  const defaultEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0);

  const [events, setEvents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingEventId, setEditingEventId] = useState(null);
  const [draggingEventId, setDraggingEventId] = useState(null);

  const [filters, setFilters] = useState({
    visibility: "",
    projectId: "",
    eventType: "",
    search: "",
    range: "30",
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
    status: "scheduled",
    project_id: "",
    location_or_meet_link: "",
    reminder_minutes: "10",
    reminder_channel: "in_app",
    recurrence_rule: "none",
    recurrence_count: "0",
  });

  const [editForm, setEditForm] = useState({});
  const [icsInput, setIcsInput] = useState("");

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
          include_insights: true,
        }),
        fetchProjects(),
      ]);

      setEvents(Array.isArray(eventsRes?.data?.data) ? eventsRes.data.data : []);
      setInsights(eventsRes?.data?.insights || null);
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
  }, [filters.visibility, filters.projectId, filters.start, filters.end]);

  const filteredEvents = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return events.filter((event) => {
      const matchesType = !filters.eventType || event.event_type === filters.eventType;
      const matchesSearch =
        !query ||
        event.title?.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location_or_meet_link?.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });
  }, [events, filters.eventType, filters.search]);

  const grouped = useMemo(() => {
    const byDay = {};
    filteredEvents.forEach((event) => {
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
  }, [filteredEvents]);

  const dragDays = useMemo(() => {
    const days = [];
    const start = new Date();
    for (let i = 0; i < 7; i += 1) {
      const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      days.push(day);
    }
    return days;
  }, []);

  const metrics = useMemo(() => {
    const todayDate = new Date().toDateString();
    return {
      total: filteredEvents.length,
      today: filteredEvents.filter((event) => new Date(event.start_at).toDateString() === todayDate).length,
      withReminders: filteredEvents.filter((event) => Array.isArray(event.event_reminders) && event.event_reminders.length > 0).length,
      meetings: filteredEvents.filter((event) => event.event_type === "meeting").length,
    };
  }, [filteredEvents]);

  const nextEvent = useMemo(() => {
    const current = new Date();
    return filteredEvents
      .filter((event) => new Date(event.start_at) >= current)
      .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))[0];
  }, [filteredEvents]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (new Date(form.end_at) <= new Date(form.start_at)) {
      setSaving(false);
      setError("End time must be after start time.");
      return;
    }

    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        start_at: new Date(form.start_at).toISOString(),
        end_at: new Date(form.end_at).toISOString(),
        event_type: form.event_type,
        visibility: form.visibility,
        status: form.status,
        project_id: form.visibility === "project" ? Number(form.project_id) : undefined,
        location_or_meet_link: form.location_or_meet_link || undefined,
        recurrence_rule: form.recurrence_rule,
        recurrence_count: Number(form.recurrence_count || 0),
      };

      const { data } = await createCalendarEvent(payload);
      const created = Array.isArray(data?.events) ? data.events : [];

      if (form.reminder_minutes && created[0]?.id) {
        await createEventReminder(created[0].id, {
          channel: form.reminder_channel,
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

  const openEdit = (event) => {
    setEditingEventId(event.id);
    setEditForm({
      title: event.title,
      description: event.description || "",
      start_at: toInputDateTime(new Date(event.start_at)),
      end_at: toInputDateTime(new Date(event.end_at)),
      status: event.status,
      event_type: event.event_type,
      location_or_meet_link: event.location_or_meet_link || "",
    });
  };

  const saveEdit = async (eventId) => {
    try {
      await updateCalendarEvent(eventId, {
        title: editForm.title,
        description: editForm.description,
        start_at: new Date(editForm.start_at).toISOString(),
        end_at: new Date(editForm.end_at).toISOString(),
        status: editForm.status,
        event_type: editForm.event_type,
        location_or_meet_link: editForm.location_or_meet_link,
      });
      setEditingEventId(null);
      await load();
    } catch {
      setError("Failed to update event.");
    }
  };

  const removeEvent = async (eventId) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await deleteCalendarEvent(eventId);
      await load();
    } catch {
      setError("Failed to delete event.");
    }
  };

  const applyRange = (days) => {
    const rangeDays = Number(days);
    const start = new Date();
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + rangeDays);

    setFilters((prev) => ({
      ...prev,
      range: String(days),
      start: start.toISOString(),
      end: end.toISOString(),
    }));
  };

  const handleDropOnDay = async (targetDay) => {
    if (!draggingEventId) return;
    const event = events.find((item) => item.id === draggingEventId);
    if (!event) return;

    const oldStart = new Date(event.start_at);
    const oldEnd = new Date(event.end_at);
    const durationMs = oldEnd.getTime() - oldStart.getTime();

    const newStart = new Date(targetDay);
    newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0);
    const newEnd = new Date(newStart.getTime() + durationMs);

    try {
      await rescheduleCalendarEvent(event.id, {
        start_at: newStart.toISOString(),
        end_at: newEnd.toISOString(),
      });
      await load();
    } catch {
      setError("Failed to reschedule event.");
    } finally {
      setDraggingEventId(null);
    }
  };

  const downloadIcs = async () => {
    const { data } = await exportCalendarIcs();
    const blob = new Blob([data], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "calendar-export.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  const uploadIcs = async () => {
    if (!icsInput.trim()) return;
    try {
      await importCalendarIcs(icsInput);
      setIcsInput("");
      await load();
    } catch {
      setError("Failed to import ICS data.");
    }
  };

  const openGoogle = async (eventId) => {
    const { data } = await getCalendarGoogleLink(eventId);
    if (data?.google_url) window.open(data.google_url, "_blank", "noopener,noreferrer");
  };

  const statCards = [
    { label: "Events in view", value: metrics.total, icon: FiCalendar },
    { label: "Today", value: metrics.today, icon: FiFlag },
    { label: "Meetings", value: metrics.meetings, icon: FiLayers },
    { label: "With reminders", value: metrics.withReminders, icon: FiBell },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-blue-600 dark:text-blue-400">Planner</p>
            <h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Calendar workspace</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Full CRUD, recurrence, drag reschedule, conflicts, and sync tools.</p>
          </div>

          <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-800/90 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-white">
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-zinc-200/80 dark:border-zinc-700 bg-white/85 dark:bg-zinc-900/70 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{card.label}</p>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{card.value}</p>
                <card.icon className="text-blue-500" />
              </div>
            </div>
          ))}
        </div>

        {insights ? (
          <div className="mt-4 text-xs text-zinc-700 dark:text-zinc-300">
            Workload: {insights.total_events} total events, {insights.overloaded_days} overloaded days.
          </div>
        ) : null}

        {nextEvent ? (
          <div className="mt-4 rounded-2xl bg-blue-600 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-blue-100">Next up</p>
              <p className="font-semibold">{nextEvent.title}</p>
              <p className="text-sm text-blue-100">{toReadableDate(nextEvent.start_at)} at {toReadableTime(nextEvent.start_at)}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs">
              <FiClock />
              {nextEvent.event_type.replace("_", " ")}
            </span>
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Create event</h2>

          <form className="mt-4 space-y-3" onSubmit={handleCreate}>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Event title" required className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm" />
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description" rows={2} className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm" />

            <div className="grid grid-cols-2 gap-2">
              <input type="datetime-local" value={form.start_at} onChange={(e) => setForm((f) => ({ ...f, start_at: e.target.value }))} className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm" />
              <input type="datetime-local" value={form.end_at} onChange={(e) => setForm((f) => ({ ...f, end_at: e.target.value }))} className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select value={form.event_type} onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value }))} className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm">
                {EVENT_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm">
                {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select value={form.visibility} onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value }))} className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm">
                {VISIBILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select value={form.recurrence_rule} onChange={(e) => setForm((f) => ({ ...f, recurrence_rule: e.target.value }))} className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm">
                {RECURRENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {form.recurrence_rule !== "none" ? (
              <input type="number" min="1" max="30" value={form.recurrence_count} onChange={(e) => setForm((f) => ({ ...f, recurrence_count: e.target.value }))} placeholder="Repeat count (max 30)" className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm" />
            ) : null}

            {form.visibility === "project" && (
              <select value={form.project_id} onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))} required className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm">
                <option value="">Select project</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            )}

            <input value={form.location_or_meet_link} onChange={(e) => setForm((f) => ({ ...f, location_or_meet_link: e.target.value }))} placeholder="Meet link / location" className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm" />

            <div className="grid grid-cols-2 gap-2">
              <select value={form.reminder_minutes} onChange={(e) => setForm((f) => ({ ...f, reminder_minutes: e.target.value }))} className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm">
                {REMINDER_OPTIONS.map((o) => <option key={o.value || "none"} value={o.value}>{o.label}</option>)}
              </select>
              <select value={form.reminder_channel} onChange={(e) => setForm((f) => ({ ...f, reminder_channel: e.target.value }))} className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm">
                <option value="in_app">In app</option>
                <option value="email">Email</option>
                <option value="slack">Slack</option>
              </select>
            </div>

            <button type="submit" disabled={saving} className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-sm font-semibold disabled:opacity-60">{saving ? "Saving..." : "Create event"}</button>
          </form>

          <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700 space-y-2">
            <button type="button" onClick={downloadIcs} className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 py-2 text-sm">Export ICS</button>
            <textarea value={icsInput} onChange={(e) => setIcsInput(e.target.value)} placeholder="Paste ICS content to import" rows={3} className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm" />
            <button type="button" onClick={uploadIcs} className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 py-2 text-sm">Import ICS</button>
          </div>
        </section>

        <section className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Agenda</h2>
            <div className="flex items-center gap-2 text-xs text-zinc-500"><FiStar />CRUD + Drag + Conflict-ready</div>
          </div>

          <div className="mt-4 space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50/70 dark:bg-zinc-800/30">
            <div className="flex items-center gap-2"><FiSearch className="text-zinc-400" /><input value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} placeholder="Search title, notes, or location" className="w-full bg-transparent outline-none text-sm" /></div>
            <div className="flex flex-wrap gap-2">
              {RANGE_OPTIONS.map((option) => (
                <button key={option.value} type="button" onClick={() => applyRange(option.value)} className={`rounded-full px-3 py-1.5 text-xs font-medium border ${filters.range === option.value ? "border-blue-500 bg-blue-500 text-white" : "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200"}`}>{option.label}</button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <select value={filters.visibility} onChange={(e) => setFilters((f) => ({ ...f, visibility: e.target.value }))} className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"><option value="">All visibility</option><option value="personal">Personal</option><option value="project">Project</option></select>
              <select value={filters.projectId} onChange={(e) => setFilters((f) => ({ ...f, projectId: e.target.value }))} className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"><option value="">All projects</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
              <select value={filters.eventType} onChange={(e) => setFilters((f) => ({ ...f, eventType: e.target.value }))} className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"><option value="">All event types</option>{EVENT_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
              <button type="button" onClick={() => setFilters((f) => ({ ...f, visibility: "", projectId: "", eventType: "", search: "" }))} className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200"><FiFilter />Clear</button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {dragDays.map((day) => (
              <div key={day.toDateString()} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDropOnDay(day)} className="min-h-20 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-2 text-xs">
                <p className="font-semibold">{day.toLocaleDateString([], { weekday: "short" })}</p>
                <p>{day.toLocaleDateString([], { month: "short", day: "numeric" })}</p>
                <p className="mt-1 text-zinc-500">Drop here</p>
              </div>
            ))}
          </div>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

          {loading ? (
            <p className="mt-4 text-sm text-zinc-500">Loading events...</p>
          ) : grouped.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center"><FiCalendar className="mx-auto text-zinc-400" size={20} /><p className="mt-2 text-sm text-zinc-500">No events in this view.</p></div>
          ) : (
            <div className="mt-4 space-y-5">
              {grouped.map((group) => (
                <div key={group.date}>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{group.date}</h3>
                  <div className="mt-2 space-y-2">
                    {group.events.map((event) => {
                      const isEditing = editingEventId === event.id;
                      return (
                        <article key={event.id} draggable onDragStart={() => setDraggingEventId(event.id)} className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3 bg-zinc-50/70 dark:bg-zinc-800/50">
                          {isEditing ? (
                            <div className="space-y-2">
                              <input value={editForm.title || ""} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded border px-2 py-1 text-sm" />
                              <textarea value={editForm.description || ""} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded border px-2 py-1 text-sm" rows={2} />
                              <div className="grid grid-cols-2 gap-2">
                                <input type="datetime-local" value={editForm.start_at || ""} onChange={(e) => setEditForm((f) => ({ ...f, start_at: e.target.value }))} className="rounded border px-2 py-1 text-sm" />
                                <input type="datetime-local" value={editForm.end_at || ""} onChange={(e) => setEditForm((f) => ({ ...f, end_at: e.target.value }))} className="rounded border px-2 py-1 text-sm" />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <select value={editForm.status || "scheduled"} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))} className="rounded border px-2 py-1 text-sm">{STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</select>
                                <select value={editForm.event_type || "meeting"} onChange={(e) => setEditForm((f) => ({ ...f, event_type: e.target.value }))} className="rounded border px-2 py-1 text-sm">{EVENT_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
                              </div>
                              <div className="flex gap-2">
                                <button type="button" onClick={() => saveEdit(event.id)} className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-xs text-white"><FiSave />Save</button>
                                <button type="button" onClick={() => setEditingEventId(null)} className="rounded border px-3 py-1.5 text-xs">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-wrap justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{event.title}</p>
                                  <p className="text-xs text-zinc-500 mt-1 flex flex-wrap items-center gap-3">
                                    <span className="inline-flex items-center gap-1"><FiClock />{toReadableTime(event.start_at)} - {toReadableTime(event.end_at)}</span>
                                    <span className="inline-flex items-center gap-1"><FiLayers />{event.visibility}</span>
                                    {event.location_or_meet_link ? <span className="inline-flex items-center gap-1"><FiMapPin />Location set</span> : null}
                                  </p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="text-xs rounded-full px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 h-fit">{event.event_type.replace("_", " ")}</span>
                                  <span className="text-xs rounded-full px-2 py-1 bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100 h-fit">{event.status}</span>
                                </div>
                              </div>

                              {event.description ? <p className="text-sm mt-2 text-zinc-700 dark:text-zinc-300">{event.description}</p> : null}
                              {event.location_or_meet_link ? <a href={event.location_or_meet_link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 mt-2 inline-block underline break-all">{event.location_or_meet_link}</a> : null}
                              {event.event_reminders?.length ? <p className="text-xs text-zinc-500 mt-2">Reminders: {event.event_reminders.map((r) => `${r.minutes_before}m (${r.channel})`).join(", ")}</p> : null}
                              {event.conflicts_count > 0 ? <p className="text-xs text-amber-600 mt-1">⚠️ {event.conflicts_count} potential overlap(s)</p> : null}

                              <div className="mt-3 flex flex-wrap gap-2">
                                <button type="button" onClick={() => openEdit(event)} className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs"><FiEdit2 />Edit</button>
                                <button type="button" onClick={() => removeEvent(event.id)} className="inline-flex items-center gap-1 rounded border border-red-300 text-red-600 px-2 py-1 text-xs"><FiTrash2 />Delete</button>
                                <button type="button" onClick={() => openGoogle(event.id)} className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs"><FiExternalLink />Google</button>
                                {dragDays.some((day) => sameDay(day, event.start_at)) ? <span className="text-xs text-zinc-500 self-center">Drag to reschedule</span> : null}
                              </div>
                            </>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Calendar;
