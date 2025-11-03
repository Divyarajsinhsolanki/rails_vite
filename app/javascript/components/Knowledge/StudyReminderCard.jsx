import React, { useMemo, useState } from "react";
import { useKnowledgeBookmarks } from "../../context/KnowledgeBookmarksContext";

function formatRelativeTime(dateInput) {
  if (!dateInput) return "No reminder set";
  const target = new Date(dateInput);
  if (Number.isNaN(target.getTime())) return "Unknown date";

  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const absMinutes = Math.round(Math.abs(diffMs) / 60000);

  if (absMinutes === 0) {
    return diffMs >= 0 ? "due now" : "just overdue";
  }
  if (absMinutes < 60) {
    return diffMs >= 0 ? `due in ${absMinutes} min` : `${absMinutes} min overdue`;
  }

  const absHours = Math.round(absMinutes / 60);
  if (absHours < 24) {
    return diffMs >= 0 ? `due in ${absHours} hr` : `${absHours} hr overdue`;
  }

  const absDays = Math.round(absHours / 24);
  return diffMs >= 0 ? `due in ${absDays} day${absDays === 1 ? "" : "s"}` : `${absDays} day${absDays === 1 ? "" : "s"} overdue`;
}

function formatAbsoluteDate(dateInput) {
  if (!dateInput) return "";
  const target = new Date(dateInput);
  if (Number.isNaN(target.getTime())) return "";
  return target.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getBookmarkLabel(bookmark) {
  return (
    bookmark?.payload?.title ||
    bookmark?.payload?.word ||
    bookmark?.payload?.phrase ||
    bookmark?.payload?.tense ||
    bookmark?.payload?.headline ||
    (Array.isArray(bookmark?.payload?.facts) ? bookmark.payload.facts[0] : null) ||
    bookmark?.payload?.note ||
    bookmark?.card_type?.replace(/_/g, " ") ||
    "Saved item"
  );
}

export default function StudyReminderCard({ cardType = "study_reminder", bookmarkHelpers }) {
  const { dueBookmarks, upcomingReminders } = useKnowledgeBookmarks();
  const [processingId, setProcessingId] = useState(null);

  const duePreview = useMemo(() => dueBookmarks.slice(0, 3), [dueBookmarks]);
  const upcomingPreview = useMemo(() => upcomingReminders.slice(0, 3), [upcomingReminders]);

  const handleMarkReviewed = async (bookmark) => {
    if (!bookmark) return;
    setProcessingId(bookmark.id);
    try {
      await bookmarkHelpers?.markReviewed?.(bookmark);
    } catch (error) {
      console.error("StudyReminderCard: unable to mark reviewed", error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 flex flex-col min-h-[240px]">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">🔔 Study Reminders</h2>
          <p className="text-xs text-gray-500 mt-1">
            {dueBookmarks.length} due · {upcomingReminders.length} upcoming
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Stay on track</span>
      </div>

      <div className="space-y-5">
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Due now</h3>
            {dueBookmarks.length > 0 && <span className="text-xs text-red-500 font-medium">Action needed</span>}
          </div>
          {duePreview.length === 0 ? (
            <div className="text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
              You're all caught up! 🎉
            </div>
          ) : (
            <ul className="space-y-3">
              {duePreview.map((bookmark) => (
                <li key={bookmark.id} className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-800">{getBookmarkLabel(bookmark)}</p>
                    <p className="text-xs text-red-600">{formatRelativeTime(bookmark.next_reminder_at)}</p>
                    {bookmark.collection_name && (
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">{bookmark.collection_name}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMarkReviewed(bookmark)}
                    disabled={processingId === bookmark.id}
                    className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium hover:bg-emerald-200 transition disabled:opacity-50"
                  >
                    {processingId === bookmark.id ? "Updating…" : "Mark reviewed"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Coming up</h3>
          {upcomingPreview.length === 0 ? (
            <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
              No reminders scheduled in the next week.
            </div>
          ) : (
            <ul className="space-y-3">
              {upcomingPreview.map((bookmark) => (
                <li key={bookmark.id} className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-800">{getBookmarkLabel(bookmark)}</p>
                    <p className="text-xs text-gray-500">{formatRelativeTime(bookmark.next_reminder_at)}</p>
                    <p className="text-[10px] text-gray-400">{formatAbsoluteDate(bookmark.next_reminder_at)}</p>
                  </div>
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                    Every {bookmark.reminder_interval_days}d
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
