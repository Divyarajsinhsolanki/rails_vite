import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { requestPasswordReset } from "../components/api";
import SpinnerOverlay from "../components/ui/SpinnerOverlay";

const statCards = [
  { label: "Delivery rate", value: "99.7%", sub: "Emails land in inbox" },
  { label: "Response time", value: "< 2 min", sub: "Reset link sent fast" },
  { label: "Support", value: "24/7", sub: "We are here to help" },
];

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
      toast.success("If that account exists, a reset link is on the way.");
    } catch (error) {
      toast.error("Something went wrong. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 text-slate-900">
      <Toaster position="top-right" />
      {loading && <SpinnerOverlay />}
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-14 lg:flex-row lg:items-center">
        <div className="relative w-full overflow-hidden rounded-3xl border border-slate-100 bg-white p-10 shadow-2xl lg:w-1/2">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-16 top-10 h-40 w-40 rounded-full bg-blue-400/15 blur-3xl" />
            <div className="absolute -right-10 bottom-0 h-32 w-32 rounded-full bg-indigo-300/20 blur-3xl" />
          </div>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
            🔒 Security first
          </p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Forgot your password?</h1>
          <p className="mt-4 text-base text-slate-600">
            We will send a reset link to your inbox. Use it within the next few minutes to set a new password and get back in.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {statCards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{card.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
                <p className="text-xs text-slate-500">{card.sub}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3 text-sm text-slate-600">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">✓</span>
            We will never share your address or send unwanted messages.
          </div>
        </div>

        <div className="w-full lg:w-1/2">
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-2xl">
            <h2 className="mb-2 text-center text-2xl font-bold text-slate-900">Send reset link</h2>
            <p className="mb-8 text-center text-sm text-slate-600">
              Enter the email you use to sign in. We will email a secure link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 required-label" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                Send reset email
              </button>
            </form>

            {sent && (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                Check your inbox for the reset link. If it is not there, look in Spam or try again.
              </div>
            )}

            <p className="mt-6 text-center text-sm text-slate-600">
              Remembered it?{" "}
              <button
                type="button"
                onClick={() => navigate("/", { state: { mode: "login" } })}
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Go back to sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
