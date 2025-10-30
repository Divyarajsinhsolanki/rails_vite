import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPenTool,
  FiUploadCloud,
  FiFolderPlus,
  FiUsers,
} from "react-icons/fi";

const QuickActions = ({ onCreatePost }) => {
  const navigate = useNavigate();

  const actions = [
    {
      title: "New Post",
      description: "Share an update or ask a question.",
      icon: <FiPenTool className="text-lg" />, 
      onClick: () => {
        if (typeof onCreatePost === "function") {
          onCreatePost();
        }
      },
    },
    {
      title: "Upload Media",
      description: "Manage PDFs and shared resources.",
      icon: <FiUploadCloud className="text-lg" />,
      onClick: () => navigate("/pdf"),
    },
    {
      title: "New Project",
      description: "Kick off a collaboration space.",
      icon: <FiFolderPlus className="text-lg" />,
      onClick: () => navigate("/projects"),
    },
    {
      title: "Invite Teammates",
      description: "Grow your workspace community.",
      icon: <FiUsers className="text-lg" />,
      onClick: () => navigate("/teams"),
    },
  ];

  return (
    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 px-6 py-4">
        <h2 className="text-white text-lg font-semibold">Quick Actions</h2>
        <p className="text-white/80 text-sm mt-1">
          Jump straight into the work that matters most right now.
        </p>
      </div>
      <div className="p-4 space-y-3">
        {actions.map((action) => (
          <button
            key={action.title}
            type="button"
            onClick={action.onClick}
            className="group w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-left transition-all hover:border-blue-200 hover:bg-white hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                {action.icon}
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  {action.title}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {action.description}
                </span>
              </span>
            </div>
            <span className="hidden text-blue-500 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-blue-600 sm:inline text-sm font-semibold">
              Go
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default QuickActions;
