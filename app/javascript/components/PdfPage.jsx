import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import PdfEditor from "./PdfEditor";
import PdfViewer from "./PdfViewer";
import SidebarToolbar from "./SidebarToolbar";
import { AnimatePresence, motion } from "framer-motion";

import {
  Upload,
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
  Download,
  Trash2,
  RefreshCcw,
  X,
  Loader2,
  Check,
} from "lucide-react";

const PdfPage = () => {
  const [pdfUrl, setPdfUrl] = useState(null);
  // Use a numeric counter to bust the cache after each modification.
  const [pdfUpdated, setPdfUpdated] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showUploadMessage, setShowUploadMessage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // Lifted state for Interactive Editor
  const [activeForm, setActiveForm] = useState(null);
  const [droppedCoordinates, setDroppedCoordinates] = useState(null);

  useEffect(() => {
    const storedPdf = localStorage.getItem("pdfUrl");
    if (storedPdf) setPdfUrl(storedPdf);
  }, []);



  const handleFileUpload = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("pdf", file);

    setUploading(true);
    setShowUploadMessage(false);
    setUploadMessage("");
    setIsError(false);

    try {
      const response = await fetch("/upload_pdf", {
        method: "POST",
        body: formData,
        headers: {
          "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content,
        },
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setPdfUrl(data.pdf_url);
      localStorage.setItem("pdfUrl", data.pdf_url);
      setUploadMessage("PDF uploaded successfully!");
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadMessage("Error uploading PDF. Please try again.");
      setIsError(true);
    } finally {
      setUploading(false);
      setShowUploadMessage(true);
      setTimeout(() => setShowUploadMessage(false), 5000);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) handleFileUpload(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  });

  const handleRemovePdf = () => {
    setPdfUrl(null);
    localStorage.removeItem("pdfUrl");
    // Reset the version counter when removing the PDF
    setPdfUpdated(0);
    setShowUploadMessage(false);
  };

  const handleResetPdf = async () => {
    try {
      const response = await fetch("/reset_pdf", {
        method: "POST",
        headers: {
          "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content,
        },
      });
      if (response.ok) {
        setPdfUpdated((prev) => prev + 1);
        setUploadMessage("PDF reset to original state!");
        setIsError(false);
        setShowUploadMessage(true);
        setTimeout(() => setShowUploadMessage(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadPdf = () => {
    if (pdfUrl) {
      window.open("/download_pdf", "_blank");
      setUploadMessage("Downloading PDF...");
      setIsError(false);
    } else {
      setUploadMessage("No PDF to download.");
      setIsError(true);
    }
    setShowUploadMessage(true);
    setTimeout(() => setShowUploadMessage(false), 3000);
  };

  const handleConfirmPosition = (coordinates) => {
    setDroppedCoordinates(coordinates);
    setUploadMessage(`Position set: X=${Math.round(coordinates.x)}, Y=${Math.round(coordinates.y)}`);
    setShowUploadMessage(true);
    setTimeout(() => setShowUploadMessage(false), 2000);
  };

  const handleCancelTool = () => {
    setActiveForm(null);
  };

  // If no PDF is uploaded, show the upload screen
  if (!pdfUrl) {
    return (
      <div className="font-inter flex flex-col min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl p-8 sm:p-12 flex flex-col items-center border border-gray-100">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">PDF Modifier</h1>
          <p className="text-lg text-gray-500 mb-10 text-center">Upload your document to start editing in a powerful new workspace.</p>

          <div
            {...getRootProps()}
            className={`
              w-full p-16 rounded-2xl border-4 border-dashed transition-all duration-300 ease-in-out
              flex flex-col items-center justify-center text-center cursor-pointer group
              ${isDragActive
                ? "border-indigo-500 bg-indigo-50/50 scale-105"
                : "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-gray-100"
              }
            `}
          >
            <input {...getInputProps()} />
            <div className={`
              p-6 rounded-full bg-white shadow-lg mb-6 transition-transform duration-300
              ${isDragActive ? "scale-110" : "group-hover:scale-110"}
            `}>
              {uploading ? (
                <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
              ) : (
                <Upload className="h-10 w-10 text-indigo-600" />
              )}
            </div>
            {isDragActive ? (
              <p className="text-2xl font-bold text-indigo-700">Drop your PDF here!</p>
            ) : (
              <div>
                <p className="text-xl font-semibold text-gray-900">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-400 mt-2">PDF files up to 25MB</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center w-full my-8 text-gray-300">
            <div className="h-px bg-gray-200 flex-grow"></div>
            <span className="px-4 text-sm font-medium uppercase tracking-widest text-gray-400">or try it out</span>
            <div className="h-px bg-gray-200 flex-grow"></div>
          </div>

          <button
            className="px-8 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all focus:ring-4 focus:ring-gray-100"
            onClick={() => {
              setPdfUrl("/documents/sample.pdf");
              localStorage.setItem("pdfUrl", "/documents/sample.pdf");
              setUploadMessage("Sample PDF loaded!");
              setIsError(false);
              setShowUploadMessage(true);
              setTimeout(() => setShowUploadMessage(false), 3000);
            }}
            disabled={uploading}
          >
            Use Sample PDF
          </button>
        </div>
      </div>
    );
  }

  // Workspace Layout
  return (
    <div className="flex h-screen w-screen bg-gray-100 overflow-hidden font-inter">
      {/* Sidebar Toolbar */}
      <SidebarToolbar activeTool={activeForm} setActiveTool={setActiveForm} />

      {/* Main Content Area (Viewer) */}
      <div className="flex-1 flex flex-col h-full active:cursor-grabbing relative">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 shadow-sm">
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 text-sm">Editing:</span>
            <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded">document.pdf</span>
          </div>

          <div className="flex items-center space-x-3">
            <button onClick={handleResetPdf} className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors" title="Reset">
              <RefreshCcw className="h-5 w-5" />
            </button>
            <button onClick={handleRemovePdf} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Remove">
              <Trash2 className="h-5 w-5" />
            </button>
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-md transition-all active:scale-95"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </button>
          </div>
        </header>

        {/* PDF Canvas Wrapper */}
        <div className="flex-1 overflow-auto bg-gray-50/50 p-8 flex justify-center">
          <div className="relative shadow-2xl rounded rounded-md">
            <PdfViewer
              pdfUrl={`${pdfUrl}?updated=${pdfUpdated}`}
              activeTool={activeForm}
              onConfirmPosition={handleConfirmPosition}
              onCancelTool={handleCancelTool}
            />
          </div>
        </div>

        {/* Message Toast */}
        {showUploadMessage && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl text-white font-medium z-50 flex items-center gap-3 ${isError ? 'bg-red-500' : 'bg-gray-900'}`}
          >
            {isError ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            {uploadMessage}
          </motion.div>
        )}
      </div>

      {/* Right Panel (Tool Properties / Forms) */}
      <AnimatePresence>
        {activeForm && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-80 h-full bg-white border-l border-gray-200 shadow-2xl z-30 flex flex-col"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-semibold text-gray-700">Properties</h3>
              <button onClick={() => setActiveForm(null)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 content-container">
              <PdfEditor
                setPdfUpdated={setPdfUpdated}
                pdfPath={pdfUrl}
                activeForm={activeForm}
                setActiveForm={setActiveForm}
                droppedCoordinates={droppedCoordinates}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PdfPage;
