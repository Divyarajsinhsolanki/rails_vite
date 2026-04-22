import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import PdfEditor from "./PdfEditor";
import PdfViewer from "./PdfViewer";
import SidebarToolbar from "./SidebarToolbar";
import { AnimatePresence, motion } from "framer-motion";

import {
  Upload,
  X,
  Loader2,
  Check,
  Download,
  Plus
} from "lucide-react";

const PdfPage = () => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfUpdated, setPdfUpdated] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showUploadMessage, setShowUploadMessage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [activeForm, setActiveForm] = useState(null);
  const [droppedCoordinates, setDroppedCoordinates] = useState(null);

  useEffect(() => {
    const storedPdf = localStorage.getItem("pdfUrl");
    if (storedPdf) setPdfUrl(storedPdf);

    const handlePdfUpdate = (event) => {
      const newUrl = event.detail;
      setPdfUrl(newUrl);
      localStorage.setItem("pdfUrl", newUrl);
      setPdfUpdated(prev => prev + 1);
    };

    window.addEventListener("pdf-updated", handlePdfUpdate);
    return () => window.removeEventListener("pdf-updated", handlePdfUpdate);
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("pdf", file);
    setUploading(true);
    setShowUploadMessage(false);
    try {
      const response = await fetch("/upload_pdf", {
        method: "POST",
        body: formData,
        headers: { "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content },
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setPdfUrl(data.pdf_url);
      localStorage.setItem("pdfUrl", data.pdf_url);
    } catch (error) {
      console.error(error);
      setUploadMessage("Upload failed.");
      setIsError(true);
      setShowUploadMessage(true);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => handleFileUpload(files[0]),
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  });

  const handleConfirmPosition = (coordinates) => {
    setDroppedCoordinates(coordinates);
  };

  if (!pdfUrl) {
    return (
      <div className="h-screen bg-gray-50 flex flex-col items-center justify-center p-8 font-inter">
        <div className="w-full max-w-2xl bg-white p-12 rounded-[40px] shadow-2xl border border-gray-100 flex flex-col items-center">
          <h1 className="text-3xl font-black text-gray-900 mb-2">PDF Modifier</h1>
          <p className="text-gray-400 mb-8 text-center">Drag and drop your file to enter the workspace.</p>
          <div {...getRootProps()} className={`w-full p-12 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center ${isDragActive ? 'border-indigo-500 bg-indigo-50 drop-shadow-xl' : 'border-gray-200 hover:border-indigo-300 bg-gray-50'}`}>
            <input {...getInputProps()} />
            {uploading ? <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" /> : <Upload className="h-10 w-10 text-indigo-600 mb-4" />}
            <p className="font-bold text-gray-700">{uploading ? 'Processing Document...' : 'Drop PDF Here'}</p>
          </div>
          <button onClick={() => setPdfUrl("/documents/sample.pdf")} className="mt-8 text-sm font-bold text-gray-400 hover:text-indigo-600 hover:underline">Or start with a sample PDF</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden font-inter select-none">
      {/* 🚀 Header */}
      <header className="h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0 z-50">
        <div className="flex items-center space-x-4">
          <div className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-lg shadow-indigo-200">
            <Plus className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-bold text-gray-800 truncate max-w-xs">{pdfUrl.split('/').pop()}</h2>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => { setPdfUrl(null); localStorage.removeItem("pdfUrl"); }} className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors">Close</button>
          <button 
            onClick={() => window.open("/download_pdf", "_blank")} 
            className="flex items-center px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-100 active:scale-95"
          >
            <Download className="h-3.5 w-3.5 mr-2" />
            Download
          </button>
        </div>
      </header>

      {/* 🍱 Main Layout Container */}
      <div className="flex flex-1 overflow-hidden relative">
        <SidebarToolbar activeTool={activeForm} setActiveTool={setActiveForm} />
        
        <main className="flex-1 flex flex-col bg-gray-50/50 overflow-hidden relative">
          {/* Component Action Bar (Add Text Inputs etc) */}
          <AnimatePresence>
            {activeForm && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-white border-b border-gray-100 overflow-hidden shadow-sm z-20"
              >
                <div className="p-4 max-w-4xl mx-auto">
                    <PdfEditor
                        setPdfUpdated={setPdfUpdated}
                        setPdfUrl={setPdfUrl}
                        pdfPath={pdfUrl}
                        activeForm={activeForm}
                        setActiveForm={setActiveForm}
                        droppedCoordinates={droppedCoordinates}
                    />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 📽️ PDF Cockpit Viewport */}
          <div className="flex-1 overflow-hidden relative">
            <PdfViewer
              pdfUrl={`${pdfUrl}?updated=${pdfUpdated}`}
              activeTool={activeForm}
              onConfirmPosition={handleConfirmPosition}
              onCancelTool={() => setActiveForm(null)}
              setPdfUpdated={setPdfUpdated}
            />
          </div>
        </main>
      </div>

      {/* 🔔 Floating Toast Feedback */}
      <AnimatePresence>
        {showUploadMessage && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl text-white font-bold text-xs z-[100] flex items-center gap-3 ${isError ? 'bg-red-500' : 'bg-gray-900'}`}
          >
            {isError ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            {uploadMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PdfPage;
