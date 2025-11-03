import React from "react";
import { FaBell, FaBookmark, FaRegBell, FaRegBookmark } from "react-icons/fa";

export default function KnowledgeCardQuickActions({
  isBookmarked = false,
  onToggleBookmark,
  hasReminder = false,
  reminderDue = false,
  onOpenReminder,
}) {
  if (!onToggleBookmark && !onOpenReminder) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
      {onToggleBookmark && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleBookmark?.();
          }}
          className={`pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            isBookmarked
              ? "border-yellow-400 bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
              : "border-gray-200 bg-white text-gray-500 hover:bg-gray-100"
          }`}
          aria-pressed={isBookmarked}
          title={isBookmarked ? "Remove bookmark" : "Save bookmark"}
        >
          {isBookmarked ? <FaBookmark aria-hidden="true" /> : <FaRegBookmark aria-hidden="true" />}
        </button>
      )}

      {onOpenReminder && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenReminder?.();
          }}
          className={`pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            reminderDue
              ? "border-red-400 bg-red-50 text-red-600 hover:bg-red-100"
              : hasReminder
              ? "border-emerald-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
              : "border-gray-200 bg-white text-gray-500 hover:bg-gray-100"
          }`}
          title={hasReminder ? "Edit reminder" : "Add reminder"}
        >
          {hasReminder ? <FaBell aria-hidden="true" /> : <FaRegBell aria-hidden="true" />}
        </button>
      )}
    </div>
  );
}
