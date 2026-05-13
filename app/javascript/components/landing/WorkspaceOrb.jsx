import React, { useState } from "react";
import { FiBookOpen, FiCalendar, FiLock, FiMessageSquare, FiTrello } from "react-icons/fi";

const orbitItems = [
  { label: "Calendar", icon: FiCalendar, angle: 8, tone: "from-sky-300 to-cyan-200" },
  { label: "Vault", icon: FiLock, angle: 78, tone: "from-amber-300 to-orange-200" },
  { label: "Chat", icon: FiMessageSquare, angle: 148, tone: "from-fuchsia-300 to-pink-200" },
  { label: "Knowledge", icon: FiBookOpen, angle: 218, tone: "from-emerald-300 to-teal-200" },
  { label: "Projects", icon: FiTrello, angle: 292, tone: "from-violet-300 to-indigo-200" },
];

const featureCards = [
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

const WorkspaceOrb = () => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 18;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * -18;
    setTilt({ x, y });
  };

  const resetTilt = () => setTilt({ x: 0, y: 0 });

  return (
    <section
      className="landing-hero-3d group relative isolate overflow-hidden rounded-[2rem] border border-white/15 bg-slate-950/70 p-5 text-white shadow-2xl shadow-cyan-950/40 backdrop-blur-xl sm:p-7"
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      style={{ "--tilt-x": `${tilt.y}deg`, "--tilt-y": `${tilt.x}deg` }}
      aria-label="NexusHub 3D workspace preview"
    >
      <FloatingParticles />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.32),transparent_30%),radial-gradient(circle_at_82%_24%,rgba(168,85,247,0.28),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(15,23,42,0.72))]" />
      <div className="absolute inset-x-10 top-6 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />
      <div className="absolute -bottom-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_0.95fr] lg:items-center">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-cyan-100 shadow-lg shadow-cyan-950/20">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" />
            Nexus Command Deck
          </span>

          <div>
            <h1 className="max-w-xl text-4xl font-black leading-[0.95] tracking-tight text-white sm:text-5xl xl:text-6xl">
              Plan sprints inside a living 3D workspace.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              Flow through projects, calendar, chat, knowledge, and vault tools from one immersive hub built for modern product teams.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["5", "Core modules"],
              ["360°", "Workspace view"],
              ["Live", "Team signal"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 shadow-inner shadow-white/5">
                <p className="text-2xl font-black text-cyan-100">{value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="landing-orb-stage mx-auto aspect-square w-full max-w-[440px]">
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
              {orbitItems.map(({ label, icon: Icon, angle, tone }) => (
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

      <div className="relative z-10 mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {featureCards.map((feature, index) => (
          <article
            key={feature.title}
            className="landing-feature-card rounded-3xl border border-white/12 bg-white/[0.08] p-5 shadow-xl shadow-slate-950/20 backdrop-blur-md"
            style={{ "--card-delay": `${index * 0.08}s` }}
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">{feature.title}</h2>
              <span className="rounded-full border border-cyan-200/25 bg-cyan-200/10 px-3 py-1 text-xs font-black text-cyan-100">
                {feature.metric}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">{feature.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default WorkspaceOrb;
