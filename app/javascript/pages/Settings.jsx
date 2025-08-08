import React, { useContext, useState, useEffect } from "react";
import api from "../components/api";
import { AuthContext } from "../context/AuthContext";
import { COLOR_MAP } from "/utils/theme";
import { Switch } from "@headlessui/react";
import { FiHome, FiSun, FiMoon } from "react-icons/fi";
import { FaPalette } from "react-icons/fa";

const landingPageOptions = [
  { value: "posts", label: "Posts" },
  { value: "profile", label: "Profile" },
  { value: "vault", label: "Vault" },
  { value: "knowledge", label: "Knowledge" },
  { value: "worklog", label: "Work Log" },
  { value: "projects", label: "Projects" },
  { value: "teams", label: "Teams" },
];

const Settings = () => {
  const { user, setUser } = useContext(AuthContext);
  const initialColor =
    COLOR_MAP[user?.color_theme] || user?.color_theme || "#3b82f6";
  const [color, setColor] = useState(initialColor);
  const [darkMode, setDarkMode] = useState(user?.dark_mode || false);
  const [landingPage, setLandingPage] = useState(
    user?.landing_page || "posts"
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDarkMode(user?.dark_mode || false);
    setLandingPage(user?.landing_page || "posts");
  }, [user?.dark_mode, user?.landing_page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/update_profile", {
        auth: { color_theme: color, dark_mode: darkMode, landing_page: landingPage },
      });
      setUser((prev) => ({
        ...prev,
        color_theme: color,
        dark_mode: darkMode,
        landing_page: landingPage,
      }));
    } catch (err) {
      console.error("Failed to update color theme", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-8">Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="flex items-center text-lg font-medium gap-2">
            <FaPalette className="text-[var(--theme-color)]" /> Appearance
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Theme Color
            </label>
            <div className="flex items-center gap-4 flex-wrap">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-16 h-10 p-0 border-0 bg-transparent cursor-pointer rounded-lg overflow-hidden"
              />
              <div className="flex gap-2 flex-wrap">
                {Object.entries(COLOR_MAP).map(([name, value]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setColor(value)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      color === value
                        ? "border-[var(--theme-color)]"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: value }}
                    aria-label={name}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
              {darkMode ? <FiMoon /> : <FiSun />}
              Dark Mode
            </span>
            <Switch
              checked={darkMode}
              onChange={setDarkMode}
              className={`${
                darkMode ? "bg-[var(--theme-color)]" : "bg-gray-200"
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
            >
              <span className="sr-only">Enable dark mode</span>
              <span
                className={`${
                  darkMode ? "translate-x-6" : "translate-x-1"
                } inline-block h-4 w-4 transform rounded-full bg-white transition`}
              />
            </Switch>
          </div>
        </section>
        <section className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="flex items-center text-lg font-medium gap-2">
            <FiHome className="text-[var(--theme-color)]" /> Preferences
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Landing Page
            </label>
            <select
              value={landingPage}
              onChange={(e) => setLandingPage(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-[var(--theme-color)] focus:ring-[var(--theme-color)]"
            >
              {landingPageOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </section>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 rounded-lg text-white bg-[var(--theme-color)] hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
