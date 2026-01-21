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

const PdfEditor = ({ setPdfUpdated, pdfPath, activeForm, setActiveForm, droppedCoordinates }) => {
  // PdfEditor now acts solely as the container for the FormRenderer in the right panel.
  // The tool selection is handled by SidebarToolbar in the parent PdfPage.

  if (!activeForm) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
        <p>Select a tool from the sidebar to edit the PDF.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <FormRenderer
        activeForm={activeForm}
        setActiveForm={setActiveForm}
        setPdfUpdated={setPdfUpdated}
        pdfPath={pdfPath}
        droppedCoordinates={droppedCoordinates}
      />
    </div>
  );
};

export default PdfEditor;