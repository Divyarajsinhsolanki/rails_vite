import React from "react";

export default function SpinnerOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-shell-text-strong/50">
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-theme"></div>
    </div>
  );
}
