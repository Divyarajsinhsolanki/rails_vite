import React, { useState } from "react";
import Login from "./Login";
import Signup from "./Signup";

function AuthPage({ mode = "login" }) {
  const [current, setCurrent] = useState(mode);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-500/25 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.18) 1px, transparent 0)",
            backgroundSize: "26px 26px",
          }}
        />
      </div>
      <div className="relative z-10 min-h-screen px-4 py-10 sm:px-6 lg:px-8">
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
