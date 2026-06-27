import React, { useMemo, useState } from "react";
import { FiBookOpen, FiCalendar, FiLock, FiMessageSquare, FiTrello } from "react-icons/fi";

const defaultOrbitItems = [
  { label: "Calendar", icon: FiCalendar, angle: 8, tone: "from-sky-300 to-cyan-200" },
  { label: "Vault", icon: FiLock, angle: 78, tone: "from-amber-300 to-orange-200" },
  { label: "Chat", icon: FiMessageSquare, angle: 148, tone: "from-fuchsia-300 to-pink-200" },
  { label: "Knowledge", icon: FiBookOpen, angle: 218, tone: "from-emerald-300 to-teal-200" },
  { label: "Projects", icon: FiTrello, angle: 292, tone: "from-violet-300 to-indigo-200" },
];

const defaultFeatureCards = [
  {
    title: "Daily Sync",
    metric: "09:30",
    copy: "A cinematic command brief for blockers, handoffs, and today’s focus.",
  },
  {
    title: "Insight Hub",
    metric: "AI",
    copy: "Surface retros, coding tips, news, and learning prompts in one glow card.",
  },
  {
    title: "Collaboration",
    metric: "Live",
    copy: "Chat, endorse skills, assign tasks, and keep everyone in the same orbit.",
  },
  {
    title: "Security First",
    metric: "Vault",
    copy: "Protected assets, role controls, and credentials with a premium lock feel.",
  },
];

const defaultMetrics = [
  ["5", "Core modules"],
  ["360°", "Workspace view"],
  ["Live", "Team signal"],
];

const FloatingParticles = () => (
  <div className="landing-particles" aria-hidden="true">
    {Array.from({ length: 28 }).map((_, index) => (
      <span
        key={index}
        style={{
          "--particle-left": `${(index * 37) % 100}%`,
          "--particle-top": `${(index * 53) % 100}%`,
          "--particle-delay": `${(index % 9) * 0.45}s`,
          "--particle-size": `${3 + (index % 5)}px`,
        }}
      />
    ))}
  </div>
);

const WorkspaceOrb = ({
  eyebrow = "Nexus Command Deck",
  title = "Plan sprints inside a living 3D workspace.",
  description = "Flow through projects, calendar, chat, knowledge, and vault tools from one immersive hub built for modern product teams.",
  metrics = defaultMetrics,
  featureCards = defaultFeatureCards,
  orbitItems = defaultOrbitItems,
  className = "",
}) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const normalizedMetrics = useMemo(
    () => (Array.isArray(metrics) && metrics.length > 0 ? metrics : defaultMetrics),
    [metrics]
  );
  const normalizedFeatures = useMemo(
    () => (Array.isArray(featureCards) && featureCards.length > 0 ? featureCards : defaultFeatureCards),
    [featureCards]
  );
  const normalizedOrbitItems = useMemo(
    () => (Array.isArray(orbitItems) && orbitItems.length > 0 ? orbitItems : defaultOrbitItems),
    [orbitItems]
  );

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 18;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * -18;
    setTilt({ x, y });
  };

  const resetTilt = () => setTilt({ x: 0, y: 0 });

  return (
    <section
      className={`landing-hero-3d group relative isolate overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 p-4 text-slate-900 shadow-xl shadow-slate-900/10 backdrop-blur-xl sm:p-5 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      style={{ "--tilt-x": `${tilt.y}deg`, "--tilt-y": `${tilt.x}deg` }}
      aria-label="NexusHub 3D workspace preview"
    >
      <FloatingParticles />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_82%_24%,rgba(147,197,253,0.2),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(239,246,255,0.84))]" />
      <div className="absolute inset-x-10 top-6 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
      <div className="absolute -bottom-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-200/35 blur-3xl" />

      <div className="relative z-10 grid gap-5 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div className="space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/70 bg-white/80 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-cyan-700 shadow-lg shadow-cyan-100/70">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" />
            {eyebrow}
          </span>

          <div>
            <h1 className="max-w-xl text-3xl font-extrabold leading-tight text-slate-950 sm:text-4xl xl:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              {description}
            </p>
          </div>

          <div className={`grid gap-3 ${normalizedMetrics.length >= 4 ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-3"}`}>
            {normalizedMetrics.map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-slate-200/80 bg-white/75 p-3 shadow-inner shadow-cyan-50/80">
                <p className="text-xl font-black text-cyan-700">{value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="landing-orb-stage mx-auto aspect-square w-full max-w-[360px]">
          <div className="landing-orb-perspective">
            <div className="landing-timeline-ring landing-timeline-ring-one" aria-hidden="true" />
            <div className="landing-timeline-ring landing-timeline-ring-two" aria-hidden="true" />
            <div className="landing-timeline-ring landing-timeline-ring-three" aria-hidden="true" />

            <div className="landing-network-lines" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>

            <div className="landing-core-orb" aria-hidden="true">
              <div className="landing-core-cube">
                <span className="landing-cube-face landing-cube-front" />
                <span className="landing-cube-face landing-cube-back" />
                <span className="landing-cube-face landing-cube-right" />
                <span className="landing-cube-face landing-cube-left" />
                <span className="landing-cube-face landing-cube-top" />
                <span className="landing-cube-face landing-cube-bottom" />
              </div>
            </div>

            <div className="landing-orbit-icons">
              {normalizedOrbitItems.map(({ label, icon: Icon, angle, tone }) => (
                <div
                  key={label}
                  className="landing-orbit-node"
                  style={{ "--node-angle": `${angle}deg` }}
                >
                  <div className={`landing-node-face bg-gradient-to-br ${tone}`}>
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-5 grid gap-3 md:grid-cols-2">
        {normalizedFeatures.map((feature, index) => (
          <article
            key={feature.title}
            className="landing-feature-card min-w-0 rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-lg shadow-slate-900/10 backdrop-blur-md"
            style={{ "--card-delay": `${index * 0.08}s` }}
          >
            <div className="flex min-w-0 items-center justify-between gap-4">
              <h2 className="min-w-0 break-words text-sm font-bold uppercase tracking-[0.16em] text-slate-600">{feature.title}</h2>
              <span className="shrink-0 rounded-full border border-cyan-200/80 bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">
                {feature.metric}
              </span>
            </div>
            <p className="mt-3 break-words text-sm leading-6 text-slate-600">{feature.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default WorkspaceOrb;
