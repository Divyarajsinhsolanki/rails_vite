import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth, getRedirectResult } from "../firebaseConfig";
import { Toaster, toast } from "react-hot-toast";
import SpinnerOverlay from "../components/ui/SpinnerOverlay";

const Login = ({ switchToSignup }) => {
  const { handleLogin, handleGoogleLogin } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await handleLogin({ auth: formData });
    } catch (err) {
      const msg = "Invalid email or password. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get("confirmed")) {
      toast.success("Email confirmed. Please log in.");
    }

    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
        }
      })
      .catch(console.error);
  }, [searchParams]);

  const featureHighlights = [
    {
      title: "Unified Dashboard",
      description: "Track members, events, and communications in one streamlined view.",
    },
    {
      title: "Smart Automations",
      description: "Set reminders, confirmations, and follow-ups without manual work.",
    },
    {
      title: "Team Collaboration",
      description: "Share updates, assign tasks, and keep everyone aligned in real time.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Toaster position="top-right" />
      {loading && <SpinnerOverlay />}
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:flex-row lg:items-center lg:gap-14">
        <div className="relative isolate overflow-hidden rounded-3xl border border-blue-100 bg-white/80 p-10 shadow-xl backdrop-blur lg:w-1/2">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" aria-hidden />
          <div className="absolute -right-6 bottom-0 h-32 w-32 rounded-full bg-indigo-400/10 blur-2xl" aria-hidden />
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
            ✨ New to the platform?
          </p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">All your community tools in one place</h1>
          <p className="mt-3 text-base text-slate-600">
            Organize programs, automate updates, and keep members engaged with a workspace designed for modern teams.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {featureHighlights.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/90 to-indigo-500/80 text-white">
                  <span className="text-lg">★</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
              🔒 Secure by default
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
              ⏱️ Setup in minutes
            </span>
          </div>
        </div>

        <div className="lg:w-1/2">
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white/90 p-8 shadow-2xl backdrop-blur transition-transform duration-200 hover:scale-[1.01]">
            <h2 className="mb-1 text-center text-3xl font-bold text-slate-900">Welcome back</h2>
            <p className="mb-8 text-center text-sm text-slate-500">Sign in to continue where you left off.</p>

            {/* 📝 Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 required-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-slate-800 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-sm font-semibold text-slate-700 required-label" htmlFor="password">
                    Password
                  </label>
                  <div className="flex items-center gap-3 text-xs text-blue-600">
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="font-semibold text-blue-600 transition hover:text-blue-700"
                    >
                      Forgot?
                    </button>
                    <span className="text-[11px] text-blue-500/80">Secure login</span>
                  </div>
                </div>
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-slate-800 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                Log In
              </button>
            </form>

            {/* 🚨 Error Message */}
            {error && (
              <div className="mt-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-600">
                ⚠️ {error}
              </div>
            )}
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-slate-500">OR</span>
              </div>
            </div>

            {/* Google Login Button */}
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  await handleGoogleLogin();
                } finally {
                  setLoading(false);
                }
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.835 0 3.456.705 4.691 1.942l3.099-3.101A10.113 10.113 0 0012.545 2C7.021 2 2.545 6.477 2.545 12s4.476 10 10 10c5.523 0 10-4.477 10-10a10.1 10.1 0 00-.167-1.785l-9.833-.006z"
                />
              </svg>
              Sign in with Google
            </button>

            <p className="mt-6 text-center text-sm text-slate-600">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={switchToSignup}
                className="font-semibold text-blue-600 transition hover:text-blue-700"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
  
};

export default Login;
