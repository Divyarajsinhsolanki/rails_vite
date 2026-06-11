import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiArrowLeft, FiArrowRight, FiMap } from "react-icons/fi";
import { fetchDemoManifest } from "./api";

const routeMatches = (pathname, route) => {
  const routePath = route?.split(/[?#]/)[0];
  if (!routePath || routePath === "/demo") return pathname === "/demo";
  return pathname === routePath || pathname.startsWith(`${routePath}/`);
};

const DemoTourNavigator = () => {
  const location = useLocation();
  const [manifest, setManifest] = useState(null);

  useEffect(() => {
    fetchDemoManifest().then(({ data }) => setManifest(data)).catch(() => setManifest(null));
  }, []);

  const activeStep = useMemo(
    () => manifest?.groups?.find((group) => routeMatches(location.pathname, group.route)),
    [location.pathname, manifest]
  );

  if (!manifest || location.pathname === "/demo") return null;

  return (
    <div className="relative z-40 border-b border-slate-200 bg-slate-950 px-4 py-2 text-white">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/demo" className="inline-flex items-center gap-2 font-semibold text-cyan-200">
            <FiMap aria-hidden="true" /> Tour map
          </Link>
          <span className="hidden text-slate-600 sm:inline">|</span>
          <span className="truncate text-slate-300">
            {activeStep ? `Step ${activeStep.step} of ${manifest.total_steps}: ${activeStep.title}` : "Explore this live product screen"}
          </span>
        </div>
        {activeStep ? (
          <div className="flex items-center gap-2">
            <Link to={activeStep.previous_route} className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 font-semibold">
              <FiArrowLeft /> Previous
            </Link>
            <Link to={activeStep.next_route} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 font-semibold text-slate-950">
              Next <FiArrowRight />
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default DemoTourNavigator;
