import React, { useState } from "react";
import {
  FaPlus, FaTrash, FaFont, FaSignature, FaTint, FaStamp, FaCopy,
  FaUndo, FaRedo, FaCompress, FaExpand, FaLock, FaUnlock, FaExchangeAlt 
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import FormRenderer from "./FormRenderer";


const PdfEditor = ({ setPdfUpdated, pdfPath }) => {
  const [activeForm, setActiveForm] = useState(null);

  const actions = [
    { label: "Add Page", icon: <FaPlus />, action: () => setActiveForm("addPage") },
    { label: "Remove Page", icon: <FaTrash />, action: () => setActiveForm("removePage") },
    { label: "Duplicate Page", icon: <FaCopy />, action: () => setActiveForm("duplicatePage") },
    { label: "Replace Text", icon: <FaExchangeAlt />, action: () => setActiveForm("replaceText") },
    { label: "Rotate Left", icon: <FaUndo />, action: () => setActiveForm("rotateLeft") },
    { label: "Rotate Right", icon: <FaRedo />, action: () => setActiveForm("rotateRight") },
    { label: "Add Text", icon: <FaFont />, action: () => setActiveForm("addText") },
    { label: "Sign", icon: <FaSignature />, action: () => setActiveForm("addSignature") },
    { label: "Add Watermark", icon: <FaTint />, action: () => setActiveForm("addWatermark") },
    { label: "Add Stamp", icon: <FaStamp />, action: () => setActiveForm("addStamp") },
    { label: "Merge PDFs", icon: <FaCompress />, action: () => setActiveForm("mergePdf") },
    { label: "Split PDF", icon: <FaExpand />, action: () => setActiveForm("splitPdf") },
    { label: "Encrypt PDF", icon: <FaLock />, action: () => setActiveForm("encryptPdf") },
    { label: "Decrypt PDF", icon: <FaUnlock />, action: () => setActiveForm("decryptPdf") },
  ];

  return (
    <div className="flex flex-col items-center p-4 w-full max-w-md mx-auto">
      <div className="relative w-full">
        <AnimatePresence mode="sync">
          {!activeForm && (
            <motion.div
              key="buttons"
              className="grid grid-cols-2 gap-4 bg-gray-100 p-4 rounded-lg shadow-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {actions.map((btn, index) => (
                <button
                  key={index}
                  onClick={btn.action}
                  className="flex items-center justify-center w-full h-[50px] px-4 bg-white rounded-lg shadow-lg transition hover:scale-105"
                >
                  <span className="text-lg">{btn.icon}</span> 
                  <span className="ml-3 text-base">{btn.label}</span>
                </button>
              ))}
            </motion.div>
          )}

          {/* Load Form Based on activeForm */}
          <FormRenderer activeForm={activeForm} setActiveForm={setActiveForm} setPdfUpdated={setPdfUpdated} pdfPath={pdfPath} />
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PdfEditor;
