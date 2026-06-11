import React from "react";
import { Link } from "react-router-dom";
import { FiEye, FiMap } from "react-icons/fi";

const DemoBanner = () => (
  <div className="relative z-40 border-b border-amber-200 bg-amber-50 px-4 py-2 text-amber-950">
    <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
      <span className="inline-flex items-center gap-2 font-semibold">
        <FiEye aria-hidden="true" />
        Read-only portfolio demo
      </span>
      <span className="text-amber-800">All records are synthetic. Changes and external integrations are disabled.</span>
      <Link to="/demo" className="inline-flex items-center gap-1 font-semibold underline underline-offset-4">
        <FiMap aria-hidden="true" />
        Open tour map
      </Link>
    </div>
  </div>
);

export default DemoBanner;
