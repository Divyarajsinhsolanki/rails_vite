import React from "react";

const PARTICLES = [
  { left: "8%", top: "14%", size: "10px", depth: "42px", delay: "-1.8s", duration: "14s" },
  { left: "18%", top: "72%", size: "7px", depth: "88px", delay: "-6.2s", duration: "18s" },
  { left: "31%", top: "28%", size: "12px", depth: "64px", delay: "-3.5s", duration: "16s" },
  { left: "47%", top: "82%", size: "8px", depth: "112px", delay: "-9.1s", duration: "20s" },
  { left: "62%", top: "18%", size: "9px", depth: "76px", delay: "-4.4s", duration: "15s" },
  { left: "74%", top: "62%", size: "13px", depth: "52px", delay: "-7.6s", duration: "19s" },
  { left: "88%", top: "34%", size: "7px", depth: "96px", delay: "-2.2s", duration: "17s" },
  { left: "93%", top: "79%", size: "11px", depth: "68px", delay: "-10.5s", duration: "21s" },
];

const Ambient3DBackground = () => {
  return (
    <div className="premium-ambient" aria-hidden="true">
      <div className="premium-gradient-mesh" />
      <div className="premium-grid-plane" />
      <div className="premium-particle-stage">
        {PARTICLES.map((particle, index) => (
          <span
            key={`${particle.left}-${particle.top}`}
            className="premium-particle"
            style={{
              "--particle-left": particle.left,
              "--particle-top": particle.top,
              "--particle-size": particle.size,
              "--particle-depth": particle.depth,
              "--particle-delay": particle.delay,
              "--particle-duration": particle.duration,
              "--particle-index": index,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Ambient3DBackground;
