import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth, getRedirectResult } from "../firebaseConfig";
import { Toaster, toast } from "react-hot-toast";
import SpinnerOverlay from "../components/ui/SpinnerOverlay";
import WorkspaceOrb from "../components/landing/WorkspaceOrb";

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

  return (
    <div className="min-h-full">
      <Toaster position="top-right" />
      {loading && <SpinnerOverlay />}
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 py-8 lg:flex-row lg:items-center lg:gap-10 xl:gap-14">
        <div className="lg:w-[58%]">
          <WorkspaceOrb />
        </div>

        <div className="lg:w-[42%]">
          <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/95 p-8 shadow-2xl shadow-slate-900/10 transition-transform duration-200 hover:-translate-y-1">
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
