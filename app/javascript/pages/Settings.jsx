import React, { useContext, useState, useEffect } from "react";
import api from "../components/api";
import { AuthContext } from "../context/AuthContext";
import { COLOR_MAP } from "/utils/theme";

const Settings = () => {
  const { user, setUser } = useContext(AuthContext);
  const initialColor = COLOR_MAP[user?.color_theme] || user?.color_theme || "#3b82f6";
  const [color, setColor] = useState(initialColor);
  const [darkMode, setDarkMode] = useState(user?.dark_mode || false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDarkMode(user?.dark_mode || false);
  }, [user?.dark_mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/update_profile", { auth: { color_theme: color, dark_mode: darkMode } });
      setUser((prev) => ({ ...prev, color_theme: color, dark_mode: darkMode }));
    } catch (err) {
      console.error("Failed to update color theme", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Theme Color
          </label>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-16 h-10 p-0 border-0 bg-transparent cursor-pointer rounded-lg overflow-hidden"
            />
            <div className="flex gap-2">
              {Object.entries(COLOR_MAP).map(([name, value]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setColor(value)}
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: value }}
                  aria-label={name}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="dark-mode"
            type="checkbox"
            checked={darkMode}
            onChange={(e) => setDarkMode(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="dark-mode" className="text-sm font-medium text-gray-700">
            Dark Mode
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg text-white bg-[var(--theme-color)] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
};

export default Settings;
