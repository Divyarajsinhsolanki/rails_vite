import React, { useEffect, useMemo, useState } from "react";
import { FaChevronDown, FaChevronUp, FaFilter } from "react-icons/fa";

export default function KnowledgeFilterControls({ options, filters, onToggle }) {
  const activeOptions = useMemo(
    () => options.filter((option) => filters[option.key]),
    [options, filters]
  );
  const [expanded, setExpanded] = useState(() => activeOptions.length > 0);

  useEffect(() => {
    if (activeOptions.length > 0) {
      setExpanded(true);
    }
  }, [activeOptions.length]);

  const toggleExpanded = () => {
    setExpanded((prev) => !prev);
  };

  const summaryLabel = activeOptions.length
    ? `${activeOptions.length} active: ${activeOptions.map((option) => option.label).join(", ")}`
    : "No filters applied";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={toggleExpanded}
        className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
        aria-expanded={expanded}
      >
        <FaFilter aria-hidden="true" />
        {expanded ? "Hide filters" : "Show filters"}
        {expanded ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
      </button>

      {expanded ? (
        <div className="flex flex-wrap items-center gap-2">
          {options.map((option) => {
            const isActive = Boolean(filters[option.key]);
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onToggle(option.key)}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-2 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                  isActive
                    ? "border-[var(--theme-color)] bg-[var(--theme-color)] text-white"
                    : "border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
                }`}
                aria-pressed={isActive}
              >
                <span aria-hidden="true">{option.icon}</span>
                {option.label}
              </button>
            );
          })}
        </div>
      ) : (
        <button
          type="button"
          onClick={toggleExpanded}
          className="rounded-full border border-dashed border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-500 hover:border-gray-400"
        >
          {summaryLabel}
        </button>
      )}
    </div>
  );
}
