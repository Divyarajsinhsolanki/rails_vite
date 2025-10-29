import React from "react";
import { FaRegStar, FaStar } from "react-icons/fa";

export default function BookmarkToggle({
  isBookmarked,
  onToggle,
  collectionName,
  disabled = false,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        if (disabled) return;
        onToggle?.();
      }}
      className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
        isBookmarked
          ? "bg-yellow-100 border-yellow-400 text-yellow-700 hover:bg-yellow-200"
          : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      aria-pressed={isBookmarked}
    >
      {isBookmarked ? (
        <FaStar className="mr-2 text-yellow-500" />
      ) : (
        <FaRegStar className="mr-2" />
      )}
      {isBookmarked ? collectionName || "Saved" : "Save"}
    </button>
  );
}
