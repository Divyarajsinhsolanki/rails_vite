import React, { useEffect, useMemo, useState } from "react";
import {
  FiBell,
  FiCalendar,
  FiClock,
  FiFilter,
  FiFlag,
  FiLayers,
  FiMapPin,
  FiRefreshCw,
  FiSearch,
  FiStar,
} from "react-icons/fi";
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

const RANGE_OPTIONS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
];

const QUICK_TEMPLATES = [
  {
    label: "Daily Standup",
    event_type: "meeting",
    durationMinutes: 15,
    reminder_minutes: "10",
    title: "Daily standup",
  },
  {
    label: "Focus Session",
    event_type: "focus",
    durationMinutes: 60,
    reminder_minutes: "",
    title: "Deep focus block",
  },
  {
    label: "Sprint Review",
    event_type: "sprint_ceremony",
    durationMinutes: 60,
    reminder_minutes: "30",
    title: "Sprint review",
  },
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
    project_id: "",
    location_or_meet_link: "",
    reminder_minutes: "10",
    email_reminder_enabled: true,
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
        project_id: form.visibility === "project" ? Number(form.project_id) : undefined,
        location_or_meet_link: form.location_or_meet_link || undefined,
      };

      const { data: createdEvent } = await createCalendarEvent(payload);

      if (form.reminder_minutes) {
        const minutesBefore = Number(form.reminder_minutes);

        await createEventReminder(createdEvent.id, {
          channel: "in_app",
          minutes_before: minutesBefore,
        });

        if (form.email_reminder_enabled) {
          await createEventReminder(createdEvent.id, {
            channel: "email",
            minutes_before: minutesBefore,
          });
        }
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

  const applyTemplate = (template) => {
    const start = new Date();
    start.setMinutes(0);
    start.setHours(start.getHours() + 1);
    const end = new Date(start.getTime() + template.durationMinutes * 60000);

    setForm((prev) => ({
      ...prev,
      title: template.title,
      event_type: template.event_type,
      reminder_minutes: template.reminder_minutes,
      start_at: toInputDateTime(start),
      end_at: toInputDateTime(end),
    }));
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
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Plan meetings, protect focus time, and keep reminders visible for your team.</p>
          </div>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-800/90 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-white"
          >
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
          <p className="text-xs text-zinc-500 mt-1">Use templates for quick planning.</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_TEMPLATES.map((template) => (
              <button
                key={template.label}
                type="button"
                onClick={() => applyTemplate(template)}
                className="rounded-full border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:border-blue-400 hover:text-blue-600"
              >
                {template.label}
              </button>
            ))}
          </div>

          <form className="mt-4 space-y-3" onSubmit={handleCreate}>
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

            <label className="flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200">
              <input
                type="checkbox"
                checked={form.email_reminder_enabled}
                onChange={(e) => setForm((f) => ({ ...f, email_reminder_enabled: e.target.checked }))}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              Send email notification too
            </label>

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
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Agenda</h2>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <FiStar />
              Smarter filters and timeline view
            </div>
          </div>

          <div className="mt-4 space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50/70 dark:bg-zinc-800/30">
            <div className="flex items-center gap-2">
              <FiSearch className="text-zinc-400" />
              <input
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Search title, notes, or location"
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => applyRange(option.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium border ${filters.range === option.value
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
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

              <select
                value={filters.eventType}
                onChange={(e) => setFilters((f) => ({ ...f, eventType: e.target.value }))}
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              >
                <option value="">All event types</option>
                {EVENT_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setFilters((f) => ({ ...f, visibility: "", projectId: "", eventType: "", search: "" }))}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200"
              >
                <FiFilter />
                Clear
              </button>
            </div>
          </div>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

          {loading ? (
            <p className="mt-4 text-sm text-zinc-500">Loading events...</p>
          ) : grouped.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center">
              <FiCalendar className="mx-auto text-zinc-400" size={20} />
              <p className="mt-2 text-sm text-zinc-500">No events in this view. Try widening the range or create your next event.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              {grouped.map((group) => (
                <div key={group.date}>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{group.date}</h3>
                  <div className="mt-2 space-y-2">
                    {group.events.map((event) => (
                      <article key={event.id} className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3 bg-zinc-50/70 dark:bg-zinc-800/50">
                        <div className="flex flex-wrap justify-between gap-3">
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{event.title}</p>
                            <p className="text-xs text-zinc-500 mt-1 flex flex-wrap items-center gap-3">
                              <span className="inline-flex items-center gap-1"><FiClock />{toReadableTime(event.start_at)} - {toReadableTime(event.end_at)}</span>
                              <span className="inline-flex items-center gap-1"><FiLayers />{event.visibility}</span>
                              {event.location_or_meet_link ? <span className="inline-flex items-center gap-1"><FiMapPin />Location set</span> : null}
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
    </div>
  );
};

export default Calendar;
