import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import submitForm from "../utils/formSubmit";
import { Toaster, toast } from "react-hot-toast";
import SpinnerOverlay from "../components/ui/SpinnerOverlay";
import WorkspaceOrb from "../components/landing/WorkspaceOrb";

const signupMetrics = [
  ["2 min", "Quick setup"],
  ["SSO", "Google ready"],
  ["Vault", "Secure profile"],
];

const signupFeatures = [
  {
    title: "Team Launch",
    metric: "Ready",
    copy: "Create your profile, join the workspace, and start planning from one premium command deck.",
  },
  {
    title: "Smart Flow",
    metric: "AI",
    copy: "Unlock momentum, knowledge prompts, chat, tasks, and vault access with a focused account.",
  },
];

const Signup = ({ switchToLogin }) => {
  const { handleGoogleLogin } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    profile_picture: null,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, type, files, value } = e.target;
    if (type === "file") {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const submissionData = new FormData();
    submissionData.append("auth[first_name]", formData.first_name);
    submissionData.append("auth[last_name]", formData.last_name);
    submissionData.append("auth[email]", formData.email);
    submissionData.append("auth[password]", formData.password);
    if (formData.profile_picture) {
      submissionData.append("auth[profile_picture]", formData.profile_picture);
    }

    try {
      await submitForm("/api/signup", "POST", submissionData);
      if (switchToLogin) switchToLogin();
      else navigate("/", { state: { mode: "login" } });
      toast.success("Account created. Please log in.");
    } catch (err) {
      const msg = err.response?.data?.errors?.join(", ") || "Signup failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full">
      <Toaster position="top-right" />
      {loading && <SpinnerOverlay />}
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 py-8 lg:flex-row lg:items-center lg:gap-10 xl:gap-14">
        <div className="lg:w-[58%]">
          <WorkspaceOrb
            eyebrow="Start NexusHub"
            title="Build your workspace identity in one polished flow."
            description="Create an account to unlock sprints, conversations, knowledge signals, secure vaults, and a calmer daily operating rhythm."
            metrics={signupMetrics}
            featureCards={signupFeatures}
          />
        </div>

        <div className="lg:w-[42%]">
          <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/95 p-8 shadow-2xl shadow-slate-900/10 transition-transform duration-200 hover:-translate-y-1">
            <h2 className="mb-1 text-center text-3xl font-bold text-slate-900">Create account</h2>
            <p className="mb-8 text-center text-sm text-slate-500">Join the workspace and start your command deck.</p>

            <form onSubmit={handleSubmit} className="space-y-5" encType="multipart/form-data">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700 required-label" htmlFor="first_name">
                    First name
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    name="first_name"
                    placeholder="Ada"
                    required
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-slate-800 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700 required-label" htmlFor="last_name">
                    Last name
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    name="last_name"
                    placeholder="Lovelace"
                    required
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-slate-800 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={formData.last_name}
                    onChange={handleChange}
                  />
                </div>
              </div>

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
                <label className="mb-1 block text-sm font-semibold text-slate-700 required-label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Create a strong password"
                  required
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-slate-800 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="profile_picture" className="mb-2 block text-sm font-semibold text-slate-700">
                  Profile picture <span className="font-normal text-slate-400">optional</span>
                </label>
                <input
                  type="file"
                  id="profile_picture"
                  name="profile_picture"
                  accept="image/*"
                  title="Profile Picture"
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm transition file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                Sign Up
              </button>
            </form>

            {error && (
              <div className="mt-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                ⚠️ {error}
              </div>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-slate-500">OR</span>
              </div>
            </div>

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
              Sign up with Google
            </button>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={switchToLogin}
                className="font-semibold text-blue-600 transition hover:text-blue-700"
              >
                Log in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
