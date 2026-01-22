import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiCalendar,
  FiClock,
  FiRefreshCcw,
  FiCheckCircle,
  FiTag,
  FiBookOpen,
  FiChevronRight,
  FiTarget,
  FiZap,
  FiPlay,
  FiArrowRightCircle
} from "react-icons/fi";
import api, { fetchDailyMomentum } from "../components/api";
import { AuthContext } from "../context/AuthContext";

const statusColors = {
  blocked: "bg-rose-100 text-rose-700 border border-rose-200",
  in_progress: "bg-amber-100 text-amber-700 border border-amber-200",
  doing: "bg-amber-100 text-amber-700 border border-amber-200",
  todo: "bg-slate-100 text-slate-700 border border-slate-200",
  reviewing: "bg-sky-100 text-sky-700 border border-sky-200",
  qa: "bg-sky-100 text-sky-700 border border-sky-200",
  backlog: "bg-slate-100 text-slate-700 border border-slate-200",
  done: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  completed: "bg-emerald-100 text-emerald-700 border border-emerald-200"
};

const relativeDueText = (value) => {
  if (!value) return "No due date";
  const today = new Date();
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return "No due date";

  const diffDays = Math.floor((due.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)) / 86_400_000);

  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays === -1) return "Overdue by 1 day";
  if (diffDays < -1) return `Overdue by ${Math.abs(diffDays)} days`;
  return `Due in ${diffDays} days`;
};

const formatTime = (value) => {
  if (!value) return "--";
  const time = new Date(value);
  if (Number.isNaN(time.getTime())) return "--";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(time);
};

const SectionCard = ({ icon: Icon, title, description, action, children }) => (
  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        {Icon && (
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
      {action}
    </div>
    <div className="space-y-4 px-6 py-5">{children}</div>
  </div>
);

const TaskBadge = ({ status }) => {
  if (!status) return null;
  const key = status.toLowerCase();
  const color = statusColors[key] || statusColors.todo;
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${color}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
};

const TaskList = ({ icon: Icon, title, subtitle, tasks = [], emptyMessage, highlight }) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
    <div className="flex items-center gap-3">
      {Icon && (
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-700">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
    </div>

    <div className="mt-4 space-y-3">
      {tasks.length === 0 && (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-500">
          {emptyMessage}
        </p>
      )}
      {tasks.map((task) => (
        <div
          key={task.id || task.title}
          className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{task.title || "Untitled task"}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                {task.project_name && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-[0.7rem] text-gray-700">
                    {task.project_name}
                  </span>
                )}
                {task.sprint_name && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-[0.7rem] text-gray-700">
                    Sprint: {task.sprint_name}
                  </span>
                )}
                {task.end_date && (
                  <span className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-[0.7rem] text-gray-700">
                    <FiCalendar className="h-3 w-3" />
                    {relativeDueText(task.end_date)}
                  </span>
                )}
              </div>
            </div>
            <TaskBadge status={task.status} />
          </div>
          {highlight && (
            <div className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-700">
              {highlight}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

const QuickMetric = ({ label, value, caption, icon: Icon }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">{label}</span>
      {Icon && <Icon className="h-4 w-4 text-blue-600" />}
    </div>
    <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    {caption && <p className="mt-1 text-xs text-gray-500">{caption}</p>}
  </div>
);

const DailyMomentumHub = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadMomentum = async (opts = { refreshing: false }) => {
    try {
      if (opts.refreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await fetchDailyMomentum();
      setData(response.data);
      setError(null);
    } catch (err) {
      setError("We couldn't refresh your momentum data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMomentum();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headerDate = useMemo(() => {
    if (!data?.date) return new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(new Date());
    const parsed = new Date(data.date);
    if (Number.isNaN(parsed.getTime())) return new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(new Date());
    return new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(parsed);
  }, [data?.date]);

  const reflection = data?.reflection;
  const totalMinutes = reflection?.yesterday?.total_minutes || 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutesRemainder = totalMinutes % 60;

  const handleMarkReviewed = async (bookmarkId) => {
    if (!bookmarkId) return;
    try {
      await api.post(`/knowledge_bookmarks/${bookmarkId}/mark_reviewed`);
      await loadMomentum({ refreshing: true });
    } catch (err) {
      setError("Unable to mark this card as reviewed. Please retry.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 text-gray-900">
      <div className="mx-auto max-w-[98%] px-4 pt-6 sm:px-6 lg:px-8">

        <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-600">Daily Momentum Hub</p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {user?.first_name ? `Good day, ${user.first_name}!` : "Welcome back!"}
              </h1>
              <p className="mt-1 text-sm text-gray-500">{headerDate}</p>
              <p className="mt-2 max-w-2xl text-base text-gray-600">

                Review yesterday, focus today, and keep your learning streak alive. Everything you need to build momentum lives here.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-900 shadow-sm sm:w-auto">
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-blue-600">
                <span>Snapshot</span>
                <span>{data?.generated_at ? formatTime(data.generated_at) : "--"}</span>
              </div>
              <div className="flex items-center gap-3 text-2xl font-semibold text-blue-900">
                <FiTarget className="h-6 w-6 text-blue-500" />
                {reflection?.blockers?.length ? `${reflection.blockers.length} blocker${reflection.blockers.length > 1 ? "s" : ""}` : "Clear runway"}
              </div>
              <p className="text-xs text-blue-700">
                {totalMinutes > 0
                  ? `Yesterday logged ${hours > 0 ? `${hours}h` : ""}${hours > 0 && minutesRemainder > 0 ? " " : ""}${minutesRemainder > 0 ? `${minutesRemainder}m` : ""}.`
                  : "No time logged yesterday yet."}
              </p>
              <button
                type="button"
                onClick={() => loadMomentum({ refreshing: true })}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                <FiRefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh snapshot
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <FiAlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}
        </header>

        {loading ? (
          <div className="grid gap-6 py-12 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white" />
            ))}
          </div>
        ) : (
          <div className="grid gap-8 py-12 lg:grid-cols-[minmax(0,_2fr)_minmax(0,_1fr)]">
            <div className="space-y-8">
              <SectionCard
                icon={FiTarget}
                title="Morning Briefing"
                description="Clear the decks, rally your focus, and spot meetings at a glance."
              >
                <div className="grid gap-5 lg:grid-cols-2">
                  <TaskList
                    icon={FiAlertTriangle}
                    title="Overdue"
                    subtitle="Resolve blockers or renegotiate commitments."
                    tasks={data?.morning_briefing?.overdue_tasks}
                    emptyMessage="Nothing overdue—keep the streak going!"
                  />
                  <TaskList
                    icon={FiPlay}
                    title="Today's Focus"
                    subtitle="Your active commitments across sprints."
                    tasks={data?.morning_briefing?.focus_tasks}
                    emptyMessage="No active work today. Consider planning or learning time."
                  />
                </div>
                <div className="grid gap-5 lg:grid-cols-2">
                  <TaskList
                    icon={FiChevronRight}
                    title="Needs Triage"
                    subtitle="Assign owners or slot into a sprint before they stall."
                    tasks={data?.morning_briefing?.needs_triage}
                    emptyMessage="Every task is assigned and scheduled."
                  />
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <FiClock className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-700">Today's Meetings</h3>
                        <p className="text-sm text-gray-500">Auto-sourced from your work logs tagged as meetings.</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {(data?.morning_briefing?.meetings || []).length === 0 ? (
                        <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                          No meetings logged for today—enjoy the deep work window.
                        </p>
                      ) : (
                        data.morning_briefing.meetings.map((meeting) => (
                          <div
                            key={meeting.id}
                            className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700"
                          >
                            <div>
                              <p className="font-semibold text-gray-900">{meeting.title}</p>
                              {meeting.category && (
                                <p className="text-xs text-gray-500">{meeting.category}</p>
                              )}
                            </div>
                            <div className="text-right text-xs text-gray-500">
                              <p>{formatTime(meeting.start_time)} – {formatTime(meeting.end_time)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                icon={FiZap}
                title="Rapid Work Logging"
                description="Spin up a new entry in seconds with your most used categories and tags."
                action={data?.rapid_logging?.quick_log_template && (
                  <div className="flex flex-col gap-2 text-xs text-gray-500">
                    <span className="font-semibold uppercase tracking-widest text-gray-700">Smart defaults</span>
                    <div className="flex flex-wrap items-center gap-3 text-gray-600">
                      {data.rapid_logging.quick_log_template.default_start_time && (
                        <span className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1 text-blue-700">
                          <FiClock className="h-3.5 w-3.5" />
                          {formatTime(data.rapid_logging.quick_log_template.default_start_time)}
                        </span>
                      )}
                      {data.rapid_logging.quick_log_template.default_category_id && (
                        <span className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1 text-blue-700">
                          <FiTag className="h-3.5 w-3.5" />
                          Favorite category ready
                        </span>
                      )}
                    </div>
                  </div>
                )}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-700">Top Categories</h3>
                    <div className="mt-4 space-y-3">
                      {(data?.rapid_logging?.top_categories || []).length === 0 ? (
                        <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                          Start logging work to see your go-to categories.
                        </p>
                      ) : (
                        data.rapid_logging.top_categories.map((category) => (
                          <div
                            key={category.id || category.name}
                            className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{category.name}</p>
                              <p className="text-xs text-gray-500">{category.count} logs in the last 30 days</p>
                            </div>
                            <span className="text-lg font-semibold text-gray-700">#{category.count}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-700">Top Tags</h3>
                    <div className="mt-4 space-y-3">
                      {(data?.rapid_logging?.top_tags || []).length === 0 ? (
                        <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                          Tag your work to unlock quick filters.
                        </p>
                      ) : (
                        data.rapid_logging.top_tags.map((tag) => (
                          <div
                            key={tag.id || tag.name}
                            className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                          >
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <FiTag className="h-4 w-4 text-blue-500" />
                              {tag.name}
                            </div>
                            <span className="text-xs uppercase tracking-widest text-gray-500">{tag.count} uses</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                {data?.rapid_logging?.suggestions?.recent_log_titles?.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-600">Recent sessions</span>
                    <ul className="mt-3 space-y-2 text-sm text-gray-700">
                      {data.rapid_logging.suggestions.recent_log_titles.map((title) => (
                        <li key={title} className="flex items-center gap-2">
                          <FiArrowRightCircle className="h-4 w-4 text-blue-500" />
                          {title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </SectionCard>
            </div>

            <div className="space-y-8">
              <SectionCard
                icon={FiBookOpen}
                title="Learning Nudge"
                description="Keep your spaced repetition alive with a single click."
                action={data?.learning_nudge?.total_due ? (
                  <div className="rounded-xl bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-700">
                    {data.learning_nudge.total_due} due today
                  </div>
                ) : null}
              >
                {data?.learning_nudge?.due_card ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{data.learning_nudge.due_card.collection_name || data.learning_nudge.due_card.card_type}</p>
                      <h3 className="mt-3 text-lg font-semibold text-gray-900">
                        {data.learning_nudge.due_card.title || "Review this card"}
                      </h3>
                      {data.learning_nudge.due_card.prompt && (
                        <p className="mt-3 text-sm text-gray-600">{data.learning_nudge.due_card.prompt}</p>
                      )}
                      {data.learning_nudge.due_card.answer && (
                        <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
                          {data.learning_nudge.due_card.answer}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMarkReviewed(data.learning_nudge.due_card.id)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
                    >
                      <FiCheckCircle className="h-4 w-4" />
                      Mark reviewed and reschedule
                    </button>
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                    You're all caught up! Add new knowledge bookmarks to keep the streak going.
                  </p>
                )}
              </SectionCard>

              <SectionCard
                icon={FiCalendar}
                title="End-of-Day Reflection"
                description="Close the loop on yesterday so tomorrow starts crisp."
              >
                <div className="grid gap-4">
                  <QuickMetric
                    label="Yesterday's entries"
                    value={reflection?.yesterday?.logs_count || 0}
                    caption="Work logs captured"
                    icon={FiClock}
                  />
                  <QuickMetric
                    label="Time logged"
                    value={totalMinutes > 0 ? `${hours}h ${minutesRemainder}m` : "0m"}
                    caption="Based on your work logs"
                    icon={FiZap}
                  />
                </div>

                {reflection?.yesterday?.note && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-600">Yesterday's note</span>
                    <p className="mt-2 whitespace-pre-line leading-relaxed">{reflection.yesterday.note}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <TaskList
                    icon={FiAlertTriangle}
                    title="Blockers"
                    subtitle="Resolve or escalate before tomorrow's standup."
                    tasks={reflection?.blockers}
                    emptyMessage="No blockers flagged—keep pushing forward."
                  />
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <FiRefreshCcw className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-700">Open Logs</h3>
                        <p className="text-sm text-gray-500">Finish these entries by adding outcomes or time spent.</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {(reflection?.unfinished_logs || []).length === 0 ? (
                        <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                          All caught up—no unfinished logs for today.
                        </p>
                      ) : (
                        reflection.unfinished_logs.map((log) => (
                          <div
                            key={log.id || log.title}
                            className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700"
                          >
                            <div>
                              <p className="font-semibold text-gray-900">{log.title}</p>
                              <p className="text-xs text-gray-500">{formatTime(log.start_time)} – {formatTime(log.end_time)}</p>
                            </div>
                            <span className="text-xs uppercase tracking-widest text-amber-600">Needs wrap-up</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyMomentumHub;
