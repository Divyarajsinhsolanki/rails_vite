import React from "react";
import {
  FileText,
  Plus,
  Minus,
  Link,
  FileSliders,
  RotateCw,
  Droplet,
  FilePlus,
  Type,
  Hash,
  Signature,
  Stamp,
  Lock,
  Unlock,
  Split,
  Combine,
  X,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { motion } from "framer-motion";

const SidebarToolbar = ({ activeTool, setActiveTool }) => {
  const tools = [
    {
      category: "Edit",
      items: [
        { id: "addText", label: "Add Text", icon: Type },
        { id: "replaceText", label: "Replace Text", icon: FileText }, // Changed icon slightly
        { id: "rotateRight", label: "Rotate", icon: RotateCw },
      ],
    },
    {
      category: "Insert",
      items: [
        { id: "addSignature", label: "Signature", icon: Signature },
        { id: "addStamp", label: "Stamp", icon: Stamp },
        { id: "addWatermark", label: "Watermark", icon: Droplet },
      ],
    },
    {
      category: "Pages",
      items: [
        { id: "addPage", label: "Add Page", icon: Plus },
        { id: "removePage", label: "Remove Page", icon: Minus },
        { id: "duplicatePage", label: "Duplicate", icon: FilePlus }, // Changed icon
        { id: "extractPages", label: "Extract", icon: FileSliders },
      ],
    },
    {
      category: "File",
      items: [
        { id: "mergePdf", label: "Merge", icon: Combine },
        { id: "splitPdf", label: "Split", icon: Split },
        { id: "encryptPdf", label: "Encrypt", icon: Lock },
        //   { id: "decryptPdf", label: "Decrypt", icon: Unlock }, 
      ],
    },
  ];

  return (
    <motion.div
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-20 lg:w-64 bg-white/80 backdrop-blur-md border-r border-gray-200 h-full flex flex-col shadow-xl z-20"
    >
      <div className="p-6 flex items-center justify-center lg:justify-start border-b border-gray-100">
        <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg shadow-lg flex items-center justify-center text-white font-bold text-xl">
          P
        </div>
        <span className="hidden lg:block ml-3 font-bold text-xl text-gray-800 tracking-tight">PDF Mod</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-200">
        {tools.map((section) => (
          <div key={section.category} className="mb-6 px-4">
            <h3 className="hidden lg:block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
              {section.category}
            </h3>
            <div className="space-y-1">
              {section.items.map((tool) => {
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(isActive ? null : tool.id)}
                    className={`
                      w-full flex items-center p-3 rounded-xl transition-all duration-200 group relative
                      ${isActive
                        ? "bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-600 shadow-sm border border-indigo-100"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                      }
                    `}
                  >
                    <tool.icon
                      className={`h-5 w-5 ${isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"}`}
                    />
                    <span className="hidden lg:block ml-3 text-sm font-medium">{tool.label}</span>

                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full"
                      />
                    )}

                    {/* Tooltip for collapsed mode */}
                    <div className="lg:hidden absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                      {tool.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
          <div className="h-8 w-8 rounded-full bg-gray-300 flex-shrink-0" />
          <div className="hidden lg:block ml-3 overflow-hidden">
            <p className="text-sm font-medium text-gray-700 truncate">User Workspace</p>
            <p className="text-xs text-gray-500 truncate">Free Plan</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SidebarToolbar;
