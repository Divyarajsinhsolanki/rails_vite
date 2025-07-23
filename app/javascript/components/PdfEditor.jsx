import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FormRenderer from "./FormRenderer"; // Assuming this component exists and handles form logic

// Import Lucide React icons for a modern look
import {
  Plus,          // For Add Page
  Trash2,        // For Remove Page
  Copy,          // For Duplicate Page
  Replace,       // For Replace Text (or use Shuffle if prefer a different visual)
  RotateCcw,     // For Rotate Left
  RotateCw,      // For Rotate Right
  Type,          // For Add Text
  Signature,     // For Sign
  Droplet,       // For Add Watermark
  Stamp,         // For Add Stamp
  Combine,       // For Merge PDFs (represents combining elements)
  Split,         // For Split PDF (represents dividing elements)
  Lock,          // For Encrypt PDF
  Unlock,        // For Decrypt PDF
  ArrowLeft,     // For the back button
} from "lucide-react";

const PdfEditor = ({ setPdfUpdated, pdfPath }) => {
  const [activeForm, setActiveForm] = useState(null);

  // Define actions as an object for easy lookup and cleaner mapping
  const actionsConfig = {
    addPage: { label: "Add Page", icon: Plus },
    removePage: { label: "Remove Page", icon: Trash2 },
    duplicatePage: { label: "Duplicate Page", icon: Copy },
    replaceText: { label: "Replace Text", icon: Replace },
    rotateLeft: { label: "Rotate Left", icon: RotateCcw },
    rotateRight: { label: "Rotate Right", icon: RotateCw },
    addText: { label: "Add Text", icon: Type },
    addSignature: { label: "Sign", icon: Signature },
    addWatermark: { label: "Add Watermark", icon: Droplet },
    addStamp: { label: "Add Stamp", icon: Stamp },
    mergePdf: { label: "Merge PDFs", icon: Combine },
    splitPdf: { label: "Split PDF", icon: Split },
    encryptPdf: { label: "Encrypt PDF", icon: Lock },
    decryptPdf: { label: "Decrypt PDF", icon: Unlock },
  };

  // Variants for Framer Motion transitions
  const containerVariants = {
    hidden: { opacity: 0, x: 50, scale: 0.95 },
    visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, x: -50, scale: 0.95, transition: { duration: 0.2, ease: "easeIn" } },
  };

  return (
    <div className="flex flex-col items-center w-full h-full bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">PDF Editor Tools</h2>

      <div className="relative w-full flex-grow">
        <AnimatePresence mode="wait">
          {!activeForm ? (
            <motion.div
              key="buttons-grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full"
            >
              {Object.entries(actionsConfig).map(([key, actionDetails]) => (
                <button
                  key={key}
                  onClick={() => setActiveForm(key)}
                  className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg shadow-sm
                             transition-all duration-200 ease-in-out hover:bg-blue-50 hover:shadow-md
                             group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  <actionDetails.icon className="h-6 w-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-gray-700 text-center">{actionDetails.label}</span>
                </button>
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
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-700">
                  {actionsConfig[activeForm]?.label || "PDF Action"}
                </h3>
                <button
                  onClick={() => setActiveForm(null)}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                  aria-label="Go back to tools"
                  title="Go back to tools"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              <div className="flex-grow bg-gray-50 p-4 rounded-lg border border-gray-100 overflow-y-auto">
                {/* FormRenderer will be mounted here for the active action */}
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