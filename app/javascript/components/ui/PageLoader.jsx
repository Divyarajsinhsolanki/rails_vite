import React from "react";

const MESSAGES = {
  default: "Preparing your workspace…",
  auth: "Checking your session…",
  project: "Loading project dashboard…",
};

export default function PageLoader({
  message = MESSAGES.default,
  title = "Loading",
  compact = false,
}) {
  return (
    <div className={`flex items-center justify-center ${compact ? "py-10" : "min-h-[55vh] px-4"}`}>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--theme-color)]" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</p>
            <p className="text-base font-medium text-slate-700">{message}</p>
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--theme-color)]" />
        </div>
      </div>
    </div>
  );
}

export { MESSAGES };
