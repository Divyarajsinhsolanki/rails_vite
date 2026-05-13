import React, { useState } from "react";
import Login from "./Login";
import Signup from "./Signup";

function AuthPage({ mode = "login" }) {
  const [current, setCurrent] = useState(mode);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.22),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.18),transparent_28%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#111827_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-fuchsia-300/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-45"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>
      <div className="relative z-10 min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        {current === "signup" ? (
          <Signup switchToLogin={() => setCurrent("login")} />
        ) : (
          <Login switchToSignup={() => setCurrent("signup")} />
        )}
      </div>
    </div>
  );
}

export default AuthPage;
