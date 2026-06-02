import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import PdfEditor from "./PdfEditor";
import PdfViewer from "./PdfViewer";
import SidebarToolbar from "./SidebarToolbar";
import { AnimatePresence, motion } from "framer-motion";

import {
  FileText,
  Upload,
  X,
  Loader2,
  Check,
  Download,
} from "lucide-react";

const getCsrfHeaders = () => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  return csrfToken ? { "X-CSRF-Token": csrfToken } : {};
};

const getPdfFileName = (url) => {
  const fileName = (url || "").split("?")[0].split("/").pop();
  if (!fileName) return "Untitled PDF";

  try {
    return decodeURIComponent(fileName);
  } catch {
    return fileName;
  }
};

const readStorage = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn(`localStorage read failed for ${key}:`, error);
    return null;
  }
};

const writeStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`localStorage write failed for ${key}:`, error);
  }
};

const removeStorage = (key) => {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn(`localStorage remove failed for ${key}:`, error);
  }
};

const uploadErrorMessage = (status, data, fallbackError) => {
  if (status === 413) return data?.error || "File too large. Maximum upload size is 50MB.";
  if (status === 415) return data?.error || "Invalid file type. Only PDF files are allowed.";
  if (status === 422) return data?.error || "PDF upload was rejected. Please choose a valid PDF.";
  if (status >= 500) return "PDF upload service is unavailable. Please try again.";
  return data?.error || fallbackError?.message || "Upload failed.";
};

const PdfMaster = () => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfUpdated, setPdfUpdated] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showUploadMessage, setShowUploadMessage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [activeForm, setActiveForm] = useState(null);
  const [placementCoordinates, setPlacementCoordinates] = useState(null);
  const [downloadName, setDownloadName] = useState("document.pdf");

  useEffect(() => {
    const storedPdf = readStorage("pdfUrl");
    if (storedPdf) setPdfUrl(storedPdf);
    const storedDownloadName = readStorage("pdfDownloadName");
    if (storedDownloadName) setDownloadName(storedDownloadName);

    const handlePdfUpdate = (event) => {
      const newUrl = event.detail;
      if (!newUrl) return;
      setPdfUrl(newUrl);
      writeStorage("pdfUrl", newUrl);
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
    setIsError(false);
    try {
      const response = await fetch("/upload_pdf", {
        method: "POST",
        body: formData,
        headers: getCsrfHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(uploadErrorMessage(response.status, data));
      if (!data.pdf_url) throw new Error("Upload finished without a PDF URL.");

      setPdfUrl(data.pdf_url);
      writeStorage("pdfUrl", data.pdf_url);
      const nextDownloadName = data.download_filename || data.original_filename || file.name || "document.pdf";
      setDownloadName(nextDownloadName);
      writeStorage("pdfDownloadName", nextDownloadName);
      setUploadMessage("Document ready in PDF Master.");
      setIsError(false);
      setShowUploadMessage(true);
    } catch (error) {
      console.error("PDF upload failed:", error);
      setUploadMessage(uploadErrorMessage(error.status, null, error));
      setIsError(true);
      setShowUploadMessage(true);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => handleFileUpload(files?.[0]),
    onDropRejected: () => {
      setUploadMessage("Invalid file type. Only PDF files are allowed.");
      setIsError(true);
      setShowUploadMessage(true);
    },
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: uploading,
  });

  const handlePlacementChange = useCallback((coordinates) => {
    setPlacementCoordinates((previous) => ({
      ...(previous || {}),
      ...coordinates,
      x: coordinates.x === undefined ? previous?.x : coordinates.x,
      y: coordinates.y === undefined ? previous?.y : coordinates.y,
      pageNumber: coordinates.pageNumber || previous?.pageNumber || 1,
    }));
  }, []);

  const handleConfirmPosition = useCallback((coordinates) => {
    handlePlacementChange(coordinates);
  }, [handlePlacementChange]);

  const closePdf = () => {
    setPdfUrl(null);
    setActiveForm(null);
    setPlacementCoordinates(null);
    removeStorage("pdfUrl");
    removeStorage("pdfDownloadName");
  };

  const startWithSample = () => {
    const sampleUrl = "/documents/sample.pdf";
    setPdfUrl(sampleUrl);
    setDownloadName("sample.pdf");
    writeStorage("pdfUrl", sampleUrl);
    writeStorage("pdfDownloadName", "sample.pdf");
  };

  const feedbackToast = (
    <AnimatePresence>
      {showUploadMessage && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className={`fixed bottom-8 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-full px-6 py-3 text-xs font-bold text-white shadow-2xl ${isError ? 'bg-red-500' : 'bg-gray-900'}`}
        >
          {isError ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          {uploadMessage}
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!pdfUrl) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-8 font-inter">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 shadow-2xl shadow-slate-200/70">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-950">PDF Master</h1>
              <p className="text-sm text-slate-500">Upload a PDF to edit pages, text, signatures, stamps, and downloads.</p>
            </div>
          </div>

          <div
            {...getRootProps()}
            aria-busy={uploading}
            className={`flex w-full cursor-pointer flex-col items-center rounded-3xl border-2 border-dashed p-12 text-center transition-all ${uploading ? 'cursor-wait border-indigo-200 bg-indigo-50/70' : isDragActive ? 'border-indigo-500 bg-indigo-50 shadow-xl shadow-indigo-100' : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-white'}`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <>
                <Loader2 className="mb-4 h-10 w-10 animate-spin text-indigo-600" />
                <p className="font-bold text-slate-800">Preparing PDF Master workspace...</p>
                <p className="mt-2 text-sm text-slate-500">Uploading and validating your document.</p>
              </>
            ) : (
              <>
                <Upload className="mb-4 h-10 w-10 text-indigo-600" />
                <p className="font-bold text-slate-800">{isDragActive ? 'Release to upload' : 'Drop PDF here'}</p>
                <p className="mt-2 text-sm text-slate-500">or click to choose a file</p>
              </>
            )}
          </div>

          <button
            onClick={startWithSample}
            disabled={uploading}
            className="mt-8 text-sm font-bold text-slate-400 transition-colors hover:text-indigo-600 hover:underline disabled:pointer-events-none disabled:opacity-50"
          >
            Start with a sample PDF
          </button>
        </div>
        {feedbackToast}
      </div>
    );
  }

  return (
    <div className="h-full w-full flex min-h-0 flex-col bg-white overflow-hidden font-inter select-none">
      {/* 🚀 Header */}
      <header className="h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0 z-30">
        <div className="flex items-center space-x-4">
          <div className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-lg shadow-indigo-200">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">PDF Master</p>
            <h2 className="max-w-xs truncate text-sm font-bold text-gray-800">{getPdfFileName(pdfUrl)}</h2>
          </div>
          <input
            type="text"
            value={downloadName}
            onChange={(event) => {
              setDownloadName(event.target.value);
              writeStorage("pdfDownloadName", event.target.value);
            }}
            placeholder="Rename download file"
            className="h-8 w-56 rounded-md border border-gray-200 px-2.5 text-xs text-gray-700 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={closePdf} className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors">Close</button>
          <button 
            onClick={() => {
              const cleanPath = (pdfUrl || "").split("?")[0].replace(/^\//, "");
              const requestedName = downloadName?.trim();
              const nameParam = requestedName ? `&download_name=${encodeURIComponent(requestedName)}` : "";
              const downloadUrl = cleanPath ? `/download_pdf?pdf_path=${encodeURIComponent(cleanPath)}${nameParam}` : `/download_pdf${nameParam ? `?${nameParam.slice(1)}` : ""}`;
              window.open(downloadUrl, "_blank");
            }}
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
                        placementCoordinates={placementCoordinates}
                        setPlacementCoordinates={setPlacementCoordinates}
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
              onPlacementChange={handlePlacementChange}
              placementCoordinates={placementCoordinates}
              onCancelTool={() => setActiveForm(null)}
              setPdfUpdated={setPdfUpdated}
            />
          </div>
        </main>
      </div>

      {feedbackToast}
    </div>
  );
};

export default PdfMaster;
