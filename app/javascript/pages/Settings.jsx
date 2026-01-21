import React, { useContext, useState, useEffect } from "react";
import api from "../components/api";
import { AuthContext } from "../context/AuthContext";
import { COLOR_MAP } from "/utils/theme";
import { Switch, Tab } from "@headlessui/react";
import {
  User,
  Palette,
  Bell,
  Shield,
  LogOut,
  Moon,
  Sun,
  Check,
  Laptop
} from "lucide-react";

const landingPageOptions = [
  { value: "posts", label: "Posts Feed" },
  { value: "profile", label: "My Profile" },
  { value: "vault", label: "Personal Vault" },
  { value: "knowledge", label: "Knowledge Base" },
  { value: "worklog", label: "Work Logs" },
  { value: "projects", label: "Projects Dashboard" },
  { value: "teams", label: "Teams Overview" },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const Settings = () => {
  const { user, setUser } = useContext(AuthContext);
  const initialColor = COLOR_MAP[user?.color_theme] || user?.color_theme || "#3b82f6";

  // State
  const [color, setColor] = useState(initialColor);
  const [darkMode, setDarkMode] = useState(user?.dark_mode || false);
  const [landingPage, setLandingPage] = useState(user?.landing_page || "posts");
  const [saving, setSaving] = useState(false);

  // Mock Notification Settings
  const [emailNotifs, setEmailNotifs] = useState({
    comments: true,
    tasks: true,
    digest: false
  });

  useEffect(() => {
    setDarkMode(user?.dark_mode || false);
    setLandingPage(user?.landing_page || "posts");
    setColor(COLOR_MAP[user?.color_theme] || user?.color_theme || "#3b82f6");
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post("/update_profile", {
        auth: {
          color_theme: color,
          dark_mode: darkMode,
          landing_page: landingPage
        },
      });
      setUser((prev) => ({
        ...prev,
        color_theme: color,
        dark_mode: darkMode,
        landing_page: landingPage,
      }));
      // In a real app, we'd save notification prefs here too
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { name: 'Profile', icon: User },
    { name: 'Appearance', icon: Palette },
    { name: 'Notifications', icon: Bell },
    { name: 'Security', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your account preferences and application settings.</p>
        </div>

        <Tab.Group as="div" className="lg:grid lg:grid-cols-12 lg:gap-x-8">
          {/* Sidebar Tabs */}
          <aside className="py-6 lg:col-span-3 lg:py-0">
            <Tab.List className="flex flex-col space-y-1">
              {tabs.map((tab) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    classNames(
                      selected
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                        : 'text-gray-900 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center px-3 py-2 text-sm font-medium rounded-r-md border-l-4 border-transparent outline-none transition-colors'
                    )
                  }
                >
                  <tab.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">{tab.name}</span>
                </Tab>
              ))}
            </Tab.List>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9 bg-white shadow rounded-xl border border-gray-200 min-h-[500px]">
            <Tab.Panels>
              {/* Profile Tab */}
              <Tab.Panel className="p-6 space-y-8 focus:outline-none">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Profile Information</h3>
                  <p className="mt-1 text-sm text-gray-500">Update your account's public information and landing preferences.</p>
                </div>

                <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-6 sm:gap-x-6">
                  <div className="sm:col-span-4">
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        @
                      </span>
                      <input
                        type="text"
                        disabled
                        value={user?.email || ''}
                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 bg-gray-100 text-gray-500 sm:text-sm cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-sm font-medium text-gray-700">Landing Page</label>
                    <p className="text-xs text-gray-500 mb-2">Choose which page you see when you first log in.</p>
                    <select
                      value={landingPage}
                      onChange={(e) => setLandingPage(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      {landingPageOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-100">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </Tab.Panel>

              {/* Appearance Tab */}
              <Tab.Panel className="p-6 space-y-8 focus:outline-none">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Appearance Details</h3>
                  <p className="mt-1 text-sm text-gray-500">Customize the look and feel of your workspace.</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-3">Theme Color</label>
                    <div className="flex items-center gap-3 flex-wrap">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-10 h-10 p-1 border border-gray-200 rounded-full cursor-pointer overflow-hidden"
                        title="Custom Color"
                      />
                      {Object.entries(COLOR_MAP).map(([name, value]) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setColor(value)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${color === value ? "ring-2 ring-offset-2 ring-blue-500 scale-110" : "hover:scale-105"
                            }`}
                          style={{ backgroundColor: value }}
                          title={name}
                        >
                          {color === value && <Check className="w-5 h-5 text-white drop-shadow-md" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <label className="text-sm font-medium text-gray-700 block mb-3">Display Mode</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <button
                        onClick={() => setDarkMode(false)}
                        className={`flex items-center justify-center gap-2 p-4 border rounded-xl transition-all ${!darkMode ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}
                      >
                        <Sun className="w-5 h-5" />
                        <span className="font-medium text-sm">Light Mode</span>
                      </button>
                      <button
                        onClick={() => setDarkMode(true)}
                        className={`flex items-center justify-center gap-2 p-4 border rounded-xl transition-all ${darkMode ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}
                      >
                        <Moon className="w-5 h-5" />
                        <span className="font-medium text-sm">Dark Mode</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-100">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Appearance'}
                  </button>
                </div>
              </Tab.Panel>

              {/* Notifications Tab */}
              <Tab.Panel className="p-6 space-y-8 focus:outline-none">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Notifications</h3>
                  <p className="mt-1 text-sm text-gray-500">Decide how and when you want to be notified.</p>
                </div>

                <div className="space-y-4">
                  <Switch.Group as="div" className="flex items-center justify-between py-3">
                    <span className="flex-grow flex flex-col">
                      <Switch.Label as="span" className="text-sm font-medium text-gray-900" passive>
                        Comments
                      </Switch.Label>
                      <Switch.Description as="span" className="text-sm text-gray-500">
                        Get notified when someone posts a comment on your task.
                      </Switch.Description>
                    </span>
                    <Switch
                      checked={emailNotifs.comments}
                      onChange={(val) => setEmailNotifs(p => ({ ...p, comments: val }))}
                      className={`${emailNotifs.comments ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      <span aria-hidden="true" className={`${emailNotifs.comments ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`} />
                    </Switch>
                  </Switch.Group>

                  <div className="border-t border-gray-100"></div>

                  <Switch.Group as="div" className="flex items-center justify-between py-3">
                    <span className="flex-grow flex flex-col">
                      <Switch.Label as="span" className="text-sm font-medium text-gray-900" passive>
                        Task Assignment
                      </Switch.Label>
                      <Switch.Description as="span" className="text-sm text-gray-500">
                        Get notified when a task is assigned to you.
                      </Switch.Description>
                    </span>
                    <Switch
                      checked={emailNotifs.tasks}
                      onChange={(val) => setEmailNotifs(p => ({ ...p, tasks: val }))}
                      className={`${emailNotifs.tasks ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      <span aria-hidden="true" className={`${emailNotifs.tasks ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`} />
                    </Switch>
                  </Switch.Group>

                  <div className="border-t border-gray-100"></div>

                  <Switch.Group as="div" className="flex items-center justify-between py-3">
                    <span className="flex-grow flex flex-col">
                      <Switch.Label as="span" className="text-sm font-medium text-gray-900" passive>
                        Weekly Digest
                      </Switch.Label>
                      <Switch.Description as="span" className="text-sm text-gray-500">
                        Receive a weekly summary of your team's activity.
                      </Switch.Description>
                    </span>
                    <Switch
                      checked={emailNotifs.digest}
                      onChange={(val) => setEmailNotifs(p => ({ ...p, digest: val }))}
                      className={`${emailNotifs.digest ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      <span aria-hidden="true" className={`${emailNotifs.digest ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`} />
                    </Switch>
                  </Switch.Group>
                </div>
              </Tab.Panel>

              {/* Security Tab */}
              <Tab.Panel className="p-6 space-y-8 focus:outline-none">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Security</h3>
                  <p className="mt-1 text-sm text-gray-500">Manage your password and security sessions.</p>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Shield className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Two-factor authentication is not yet enabled for this account.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900">Password</h4>
                  <div className="mt-4 max-w-xl text-sm text-gray-500">
                    <p>Ensure your account is using a long, random password to stay secure.</p>
                  </div>
                  <div className="mt-4">
                    <button type="button" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      Change Password
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-red-600">Danger Zone</h4>
                  <div className="mt-4 max-w-xl text-sm text-gray-500">
                    <p>Once you delete your account, there is no going back. Please be certain.</p>
                  </div>
                  <div className="mt-4">
                    <button type="button" className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                      Delete Account
                    </button>
                  </div>
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </main>
        </Tab.Group>
      </div>
    </div>
  );
};

export default Settings;
