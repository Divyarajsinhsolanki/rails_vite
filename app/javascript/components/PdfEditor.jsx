import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import FormRenderer from "./FormRenderer";
import { getToolById, pdfToolSections } from "../utils/pdfToolsConfig";

const PdfEditor = ({ setPdfUpdated, pdfPath }) => {
  const [activeForm, setActiveForm] = useState(null);
  const activeTool = activeForm ? getToolById(activeForm) : null;

  // Variants for Framer Motion transitions
  const containerVariants = {
    hidden: { opacity: 0, x: 50, scale: 0.95 },
    visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, x: -50, scale: 0.95, transition: { duration: 0.2, ease: "easeIn" } },
  };

  return (
    <div className="flex flex-col w-full h-full bg-white rounded-3xl shadow-xl p-6 border border-gray-200">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">PDF Editor Tools</h2>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Discover focused mini-tools that handle common PDF tasks like reordering pages, adding
          signatures, or securing files. Choose a workflow below to get started.
        </p>
      </div>

      <div className="relative w-full flex-grow">
        <AnimatePresence mode="wait">
          {!activeForm ? (
            <motion.div
              key="buttons-grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col gap-8"
            >
              {pdfToolSections.map((section) => (
                <div
                  key={section.id}
                  className="rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-50 via-white to-white p-6 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{section.title}</h3>
                      <p className="text-sm text-gray-500 max-w-2xl">{section.description}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
                      {section.tools.length} tools
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {section.tools.map((toolId) => {
                      const tool = getToolById(toolId);
                      if (!tool) return null;
                      const Icon = tool.icon;

                      return (
                        <button
                          type="button"
                          key={tool.id}
                          onClick={() => setActiveForm(tool.id)}
                          className="group flex h-full flex-col justify-between rounded-2xl border border-transparent bg-white/70 p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <div className="flex items-start gap-4">
                            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform duration-200 group-hover:scale-105">
                              <Icon className="h-6 w-6" />
                            </span>
                            <div>
                              <p className="text-base font-semibold text-gray-900">{tool.label}</p>
                              <p className="mt-1 text-sm text-gray-500">{tool.description}</p>
                            </div>
                          </div>
                          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600">
                            Open tool
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="form-renderer"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full h-full flex flex-col"
            >
              <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  {activeTool?.icon ? (
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                      <activeTool.icon className="h-6 w-6" />
                    </span>
                  ) : null}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {activeTool?.label || "PDF action"}
                    </h3>
                    {activeTool?.description ? (
                      <p className="mt-1 text-sm text-gray-600 max-w-2xl">{activeTool.description}</p>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveForm(null)}
                  className="inline-flex items-center gap-2 self-start rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-blue-200 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="Go back to tools"
                  title="Go back to tools"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to tools
                </button>
              </div>
              <div className="flex-grow rounded-2xl border border-gray-100 bg-gray-50/70 p-4 sm:p-6 overflow-y-auto">
                <FormRenderer
                  activeForm={activeForm}
                  setActiveForm={setActiveForm}
                  setPdfUpdated={setPdfUpdated}
                  pdfPath={pdfPath}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PdfEditor;