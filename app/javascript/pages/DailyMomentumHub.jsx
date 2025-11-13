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
  blocked: "bg-rose-500/20 text-rose-200 border border-rose-400/40",
  in_progress: "bg-amber-500/20 text-amber-100 border border-amber-400/40",
  doing: "bg-amber-500/20 text-amber-100 border border-amber-400/40",
  todo: "bg-slate-500/20 text-slate-100 border border-slate-400/40",
  reviewing: "bg-sky-500/20 text-sky-100 border border-sky-400/40",
  qa: "bg-sky-500/20 text-sky-100 border border-sky-400/40",
  backlog: "bg-slate-500/20 text-slate-100 border border-slate-400/40",
  done: "bg-emerald-500/20 text-emerald-100 border border-emerald-400/40",
  completed: "bg-emerald-500/20 text-emerald-100 border border-emerald-400/40"
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
  <div className="rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-xl shadow-xl shadow-slate-950/30">
    <div className="flex items-center justify-between gap-6 border-b border-white/10 px-6 py-5">
      <div className="flex items-center gap-4">
        {Icon && (
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sky-200">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description && (
            <p className="text-sm text-slate-300/80">{description}</p>
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
  <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
    <div className="flex items-center gap-3">
      {Icon && (
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/5 text-sky-200">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-widest text-white/80">{title}</h3>
        {subtitle && (
          <p className="text-sm text-slate-300/70">{subtitle}</p>
        )}
      </div>
    </div>

    <div className="mt-4 space-y-3">
      {tasks.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-slate-400">
          {emptyMessage}
        </p>
      )}
      {tasks.map((task) => (
        <div
          key={task.id || task.title}
          className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-transparent px-4 py-3 shadow-lg shadow-slate-950/20"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white/95">{task.title || "Untitled task"}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-300/80">
                {task.project_name && (
                  <span className="rounded-full bg-white/5 px-3 py-1 text-[0.7rem] text-slate-200">
                    {task.project_name}
                  </span>
                )}
                {task.sprint_name && (
                  <span className="rounded-full bg-white/5 px-3 py-1 text-[0.7rem] text-slate-200">
                    Sprint: {task.sprint_name}
                  </span>
                )}
                {task.end_date && (
                  <span className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-[0.7rem] text-slate-200">
                    <FiCalendar className="h-3 w-3" />
                    {relativeDueText(task.end_date)}
                  </span>
                )}
              </div>
            </div>
            <TaskBadge status={task.status} />
          </div>
          {highlight && (
            <div className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              {highlight}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

const QuickMetric = ({ label, value, caption, icon: Icon }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 shadow-lg shadow-slate-950/20">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-widest text-slate-300/70">{label}</span>
      {Icon && <Icon className="h-4 w-4 text-sky-200" />}
    </div>
    <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    {caption && <p className="mt-1 text-xs text-slate-300/70">{caption}</p>}
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
    <div className="min-h-screen bg-slate-950 pb-16 text-white">
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_rgba(15,23,42,0.95))]" />
        <div className="absolute inset-x-0 top-0 h-60 bg-[radial-gradient(ellipse_at_top,_rgba(14,165,233,0.3),_transparent)] blur-3xl" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 pt-16">
          <header className="rounded-3xl border border-white/10 bg-white/[0.08] p-8 shadow-2xl shadow-slate-950/30">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-200">Daily Momentum Hub</p>
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {user?.first_name ? `Good day, ${user.first_name}!` : "Welcome back!"}
                </h1>
                <p className="mt-2 text-sm text-slate-200/80">{headerDate}</p>
                <p className="mt-4 max-w-2xl text-base text-slate-200/80">
                  Review yesterday, focus today, and keep your learning streak alive.
                  Everything you need to build momentum lives here.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/80 p-5 text-sm text-slate-200 shadow-lg shadow-slate-950/30 sm:w-auto">
                <div className="flex items-center justify-between text-xs uppercase tracking-widest text-slate-400">
                  <span>Snapshot</span>
                  <span>{data?.generated_at ? formatTime(data.generated_at) : "--"}</span>
                </div>
                <div className="flex items-center gap-3 text-2xl font-semibold text-white">
                  <FiTarget className="h-6 w-6 text-sky-200" />
                  {reflection?.blockers?.length ? `${reflection.blockers.length} blocker${reflection.blockers.length > 1 ? "s" : ""}` : "Clear runway"}
                </div>
                <p className="text-xs text-slate-400/90">
                  {totalMinutes > 0
                    ? `Yesterday logged ${hours > 0 ? `${hours}h` : ""}${hours > 0 && minutesRemainder > 0 ? " " : ""}${minutesRemainder > 0 ? `${minutesRemainder}m` : ""}.`
                    : "No time logged yesterday yet."}
                </p>
                <button
                  type="button"
                  onClick={() => loadMomentum({ refreshing: true })}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500/90 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
                >
                  <FiRefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh snapshot
                </button>
              </div>
            </div>
            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                <FiAlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}
          </header>

          {loading ? (
            <div className="grid gap-6 pb-16 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-72 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />
              ))}
            </div>
          ) : (
            <div className="grid gap-8 pb-16 xl:grid-cols-3">
              <div className="space-y-8 xl:col-span-2">
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
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/5 text-sky-200">
                          <FiClock className="h-4 w-4" />
                        </span>
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-widest text-white/80">Today's Meetings</h3>
                          <p className="text-sm text-slate-300/70">Auto-sourced from your work logs tagged as meetings.</p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-3">
                        {(data?.morning_briefing?.meetings || []).length === 0 ? (
                          <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-slate-400">
                            No meetings logged for today—enjoy the deep work window.
                          </p>
                        ) : (
                          data.morning_briefing.meetings.map((meeting) => (
                            <div
                              key={meeting.id}
                              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-slate-100"
                            >
                              <div>
                                <p className="font-semibold text-white">{meeting.title}</p>
                                {meeting.category && (
                                  <p className="text-xs text-slate-300/70">{meeting.category}</p>
                                )}
                              </div>
                              <div className="text-right text-xs text-slate-300/80">
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
                    <div className="flex flex-col gap-2 text-xs text-slate-300/70">
                      <span className="font-semibold uppercase tracking-widest text-slate-200">Smart defaults</span>
                      <div className="flex flex-wrap items-center gap-3 text-slate-200">
                        {data.rapid_logging.quick_log_template.default_start_time && (
                          <span className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1">
                            <FiClock className="h-3.5 w-3.5" />
                            {formatTime(data.rapid_logging.quick_log_template.default_start_time)}
                          </span>
                        )}
                        {data.rapid_logging.quick_log_template.default_category_id && (
                          <span className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1">
                            <FiTag className="h-3.5 w-3.5" />
                            Favorite category ready
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-white/80">Top Categories</h3>
                      <div className="mt-4 space-y-3">
                        {(data?.rapid_logging?.top_categories || []).length === 0 ? (
                          <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-slate-400">
                            Start logging work to see your go-to categories.
                          </p>
                        ) : (
                          data.rapid_logging.top_categories.map((category) => (
                            <div
                              key={category.id || category.name}
                              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3"
                            >
                              <div>
                                <p className="text-sm font-semibold text-white">{category.name}</p>
                                <p className="text-xs text-slate-300/70">{category.count} logs in the last 30 days</p>
                              </div>
                              <span className="text-lg font-semibold text-slate-200">#{category.count}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-white/80">Top Tags</h3>
                      <div className="mt-4 space-y-3">
                        {(data?.rapid_logging?.top_tags || []).length === 0 ? (
                          <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-slate-400">
                            Tag your work to unlock quick filters.
                          </p>
                        ) : (
                          data.rapid_logging.top_tags.map((tag) => (
                            <div
                              key={tag.id || tag.name}
                              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3"
                            >
                              <div className="flex items-center gap-2 text-sm text-white">
                                <FiTag className="h-4 w-4 text-sky-200" />
                                {tag.name}
                              </div>
                              <span className="text-xs uppercase tracking-widest text-slate-300/70">{tag.count} uses</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  {data?.rapid_logging?.suggestions?.recent_log_titles?.length > 0 && (
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                      <span className="text-xs font-semibold uppercase tracking-widest text-slate-300/70">Recent sessions</span>
                      <ul className="mt-3 space-y-2 text-sm text-slate-200">
                        {data.rapid_logging.suggestions.recent_log_titles.map((title) => (
                          <li key={title} className="flex items-center gap-2">
                            <FiArrowRightCircle className="h-4 w-4 text-sky-200" />
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
                    <div className="rounded-xl bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-sky-100">
                      {data.learning_nudge.total_due} due today
                    </div>
                  ) : null}
                >
                  {data?.learning_nudge?.due_card ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-300/70">{data.learning_nudge.due_card.collection_name || data.learning_nudge.due_card.card_type}</p>
                        <h3 className="mt-3 text-lg font-semibold text-white">
                          {data.learning_nudge.due_card.title || "Review this card"}
                        </h3>
                        {data.learning_nudge.due_card.prompt && (
                          <p className="mt-3 text-sm text-slate-200/80">{data.learning_nudge.due_card.prompt}</p>
                        )}
                        {data.learning_nudge.due_card.answer && (
                          <p className="mt-4 rounded-xl bg-slate-950/60 px-4 py-3 text-sm text-slate-200/90">
                            {data.learning_nudge.due_card.answer}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleMarkReviewed(data.learning_nudge.due_card.id)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                      >
                        <FiCheckCircle className="h-4 w-4" />
                        Mark reviewed and reschedule
                      </button>
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-slate-400">
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
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-200">
                      <span className="text-xs font-semibold uppercase tracking-widest text-slate-300/70">Yesterday's note</span>
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
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/5 text-sky-200">
                          <FiRefreshCcw className="h-4 w-4" />
                        </span>
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-widest text-white/80">Open Logs</h3>
                          <p className="text-sm text-slate-300/70">Finish these entries by adding outcomes or time spent.</p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-3">
                        {(reflection?.unfinished_logs || []).length === 0 ? (
                          <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-slate-400">
                            All caught up—no unfinished logs for today.
                          </p>
                        ) : (
                          reflection.unfinished_logs.map((log) => (
                            <div
                              key={log.id || log.title}
                              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-slate-200"
                            >
                              <div>
                                <p className="font-semibold text-white">{log.title}</p>
                                <p className="text-xs text-slate-300/70">{formatTime(log.start_time)} – {formatTime(log.end_time)}</p>
                              </div>
                              <span className="text-xs uppercase tracking-widest text-amber-200">Needs wrap-up</span>
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
    </div>
  );
};

export default DailyMomentumHub;
