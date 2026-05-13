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
  overlay = false,
}) {
  const containerClass = overlay
    ? "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-[3px]"
    : `relative flex items-center justify-center ${compact ? "py-10" : "min-h-[55vh] px-4"}`;

  return (
    <div className={containerClass}>
      <div className={`premium-loader-card w-full max-w-md rounded-[1.75rem] border border-white/70 bg-white/90 p-6 ${overlay ? "shadow-2xl" : "shadow-sm"}`}>
        <div className="mb-5 flex items-center gap-4">
          <span className="premium-loader-mark" aria-hidden="true">
            <span />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{title}</p>
            <p className="text-base font-semibold text-slate-800">{message}</p>
          </div>
        </div>
        <div className="premium-loader-track" aria-hidden="true">
          <div className="premium-loader-bar" />
        </div>
      </div>
    </div>
  );
}

export { MESSAGES };
