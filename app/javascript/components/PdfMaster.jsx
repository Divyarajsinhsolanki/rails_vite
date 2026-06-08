import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Document, Page, pdfjs } from "react-pdf";
import pdfWorkerUrl from "react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs?url";
import PdfEditor from "./PdfEditor";
import PdfViewer from "./PdfViewer";
import SidebarToolbar from "./SidebarToolbar";
import { AnimatePresence, motion } from "framer-motion";
import { fetchWithTimeout, PDF_UPLOAD_TIMEOUT_MS } from "../utils/request";

import {
  FileText,
  Upload,
  X,
  Loader2,
  Check,
  Download,
  Undo2,
  Redo2,
} from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const getCsrfHeaders = () => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  return csrfToken ? { "X-CSRF-Token": csrfToken } : {};
};

const MAX_PDF_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;
const PDF_LIBRARY_STORAGE_KEY = "pdfLibrary";
const MAX_PDF_LIBRARY_ITEMS = 12;
const PDF_HISTORY_ACTION_TIMEOUT_MS = 30000;

const normalizePdfUrl = (url) => (url || "").split("?")[0];

const getPdfFileName = (url) => {
  const fileName = normalizePdfUrl(url).split("/").pop();
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

const readJsonStorage = (key, fallbackValue) => {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallbackValue;
  } catch (error) {
    console.warn(`localStorage JSON read failed for ${key}:`, error);
    return fallbackValue;
  }
};

const writeJsonStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`localStorage JSON write failed for ${key}:`, error);
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
  if (fallbackError?.name === "RequestTimeoutError") return "Upload timed out. Please try again with a smaller PDF or check your connection.";
  return data?.error || fallbackError?.message || "Upload failed.";
};

const validatePdfFile = (file) => {
  if (!file) return "Choose a PDF file to upload.";
  if (file.size > MAX_PDF_UPLOAD_SIZE_BYTES) return "File too large. Maximum upload size is 50MB.";

  const hasPdfType = file.type === "application/pdf";
  const hasPdfExtension = file.name?.toLowerCase().endsWith(".pdf");
  if (!hasPdfType && !hasPdfExtension) return "Invalid file type. Only PDF files are allowed.";

  return "";
};

const normalizePlacementCoordinates = (coordinates, previous) => {
  const next = { ...(previous || {}) };

  if (coordinates.x !== undefined) {
    const x = Number(coordinates.x);
    if (Number.isFinite(x)) next.x = Math.max(0, Math.round(x));
  }

  if (coordinates.y !== undefined) {
    const y = Number(coordinates.y);
    if (Number.isFinite(y)) next.y = Math.max(0, Math.round(y));
  }

  if (coordinates.pageNumber !== undefined) {
    const pageNumber = Number(coordinates.pageNumber);
    if (Number.isFinite(pageNumber)) next.pageNumber = Math.max(1, Math.round(pageNumber));
  } else if (!next.pageNumber) {
    next.pageNumber = 1;
  }

  if (coordinates.scale !== undefined) {
    const scale = Number(coordinates.scale);
    if (Number.isFinite(scale) && scale > 0) next.scale = scale;
  }

  return next;
};

const normalizePdfLibraryItems = (items) => {
  const seen = new Set();
  const normalizedItems = [];

  for (const item of Array.isArray(items) ? items : []) {
    const url = normalizePdfUrl(item?.url);
    if (!url || seen.has(url)) continue;

    seen.add(url);
    normalizedItems.push({
      ...item,
      url,
      name: item?.name || getPdfFileName(url),
    });
  }

  return normalizedItems.slice(0, MAX_PDF_LIBRARY_ITEMS);
};

const PdfPreviewCard = ({ item, isActive, onOpen }) => (
  <button
    type="button"
    onClick={() => onOpen(item)}
    className={`group flex min-w-36 flex-col overflow-hidden rounded-lg border bg-white text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md ${isActive ? "border-indigo-400 ring-2 ring-indigo-100" : "border-slate-200"}`}
    title={item.name}
  >
    <div className="flex h-28 w-full items-center justify-center overflow-hidden bg-slate-100">
      <Document
        file={item.url}
        loading={<FileText className="h-8 w-8 text-slate-300" />}
        error={<FileText className="h-8 w-8 text-slate-300" />}
        noData={<FileText className="h-8 w-8 text-slate-300" />}
      >
        <Page pageNumber={1} width={128} renderTextLayer={false} renderAnnotationLayer={false} />
      </Document>
    </div>
    <div className="w-full px-2.5 py-2">
      <p className="truncate text-xs font-bold text-slate-700 group-hover:text-indigo-700">{item.name}</p>
    </div>
  </button>
);

const PdfMaster = () => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfUpdated, setPdfUpdated] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showUploadMessage, setShowUploadMessage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [activeForm, setActiveForm] = useState(null);
  const [placementCoordinates, setPlacementCoordinates] = useState(null);
  const [textDraft, setTextDraft] = useState({ text: "", fontSize: 14, color: "#111827" });
  const [downloadName, setDownloadName] = useState("document.pdf");
  const [pdfLibrary, setPdfLibrary] = useState([]);

  useEffect(() => {
    const storedPdf = readStorage("pdfUrl");
    if (storedPdf) setPdfUrl(storedPdf);
    const storedDownloadName = readStorage("pdfDownloadName");
    if (storedDownloadName) setDownloadName(storedDownloadName);
    const storedLibrary = normalizePdfLibraryItems(readJsonStorage(PDF_LIBRARY_STORAGE_KEY, []));
    if (storedLibrary.length) setPdfLibrary(storedLibrary);

    const handlePdfUpdate = (event) => {
      const newUrl = event.detail;
      if (!newUrl) return;
      setPdfUrl(newUrl);
      writeStorage("pdfUrl", newUrl);
      addPdfToLibrary({ url: newUrl, name: getPdfFileName(newUrl) });
      setPdfUpdated(prev => prev + 1);
    };

    window.addEventListener("pdf-updated", handlePdfUpdate);
    return () => window.removeEventListener("pdf-updated", handlePdfUpdate);
  }, []);

  useEffect(() => {
    setPlacementCoordinates(null);
    if (activeForm !== "addText") {
      setTextDraft({ text: "", fontSize: 14, color: "#111827" });
    }
  }, [activeForm]);

  const addPdfToLibrary = useCallback((item) => {
    const normalizedUrl = normalizePdfUrl(item?.url);
    if (!normalizedUrl) return;

    setPdfLibrary((previous) => {
      const withoutDuplicate = previous.filter((existing) => normalizePdfUrl(existing.url) !== normalizedUrl);
      const next = [
        { url: normalizedUrl, name: item.name || getPdfFileName(normalizedUrl), addedAt: Date.now() },
        ...withoutDuplicate,
      ].slice(0, MAX_PDF_LIBRARY_ITEMS);
      writeJsonStorage(PDF_LIBRARY_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const openLibraryPdf = useCallback((item) => {
    const normalizedUrl = normalizePdfUrl(item?.url);
    if (!normalizedUrl) return;

    setPdfUrl(normalizedUrl);
    setDownloadName(item.name || getPdfFileName(normalizedUrl));
    setActiveForm(null);
    setPlacementCoordinates(null);
    writeStorage("pdfUrl", normalizedUrl);
    writeStorage("pdfDownloadName", item.name || getPdfFileName(normalizedUrl));
  }, []);

  const uploadSinglePdf = async (file) => {
    const validationMessage = validatePdfFile(file);
    if (validationMessage) throw new Error(validationMessage);

    const formData = new FormData();
    formData.append("pdf", file);

    const response = await fetchWithTimeout("/upload_pdf", {
      method: "POST",
      body: formData,
      headers: getCsrfHeaders(),
    }, PDF_UPLOAD_TIMEOUT_MS);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(uploadErrorMessage(response.status, data));
    if (!data.pdf_url) throw new Error("Upload finished without a PDF URL.");

    return {
      url: data.pdf_url,
      name: data.download_filename || data.original_filename || file.name || "document.pdf",
    };
  };

  const applyUploadedPdf = (item) => {
    const normalizedUrl = normalizePdfUrl(item.url);
    setPdfUrl(normalizedUrl);
    writeStorage("pdfUrl", normalizedUrl);
    setDownloadName(item.name);
    writeStorage("pdfDownloadName", item.name);
    addPdfToLibrary({ ...item, url: normalizedUrl });
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    setUploading(true);
    setShowUploadMessage(false);
    setIsError(false);
    try {
      const item = await uploadSinglePdf(file);
      applyUploadedPdf(item);
      setUploadMessage("Document ready in PDF Master.");
      setIsError(false);
      setShowUploadMessage(true);
    } catch (error) {
      console.error("PDF upload failed:", error);
      setUploadMessage(error.message || "Upload failed.");
      setIsError(true);
      setShowUploadMessage(true);
    } finally {
      setUploading(false);
    }
  };

  const handleMultipleFiles = async (files) => {
    const pdfFiles = Array.from(files || []);
    if (!pdfFiles.length) return;

    setUploading(true);
    setShowUploadMessage(false);
    setIsError(false);

    try {
      const results = await Promise.allSettled(pdfFiles.map((file) => uploadSinglePdf(file)));
      const successful = [];
      const failed = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successful.push(result.value);
        } else {
          failed.push({
            file: pdfFiles[index]?.name || `PDF ${index + 1}`,
            error: result.reason?.message || "Upload failed.",
          });
        }
      });

      successful.forEach(addPdfToLibrary);
      if (successful.length) applyUploadedPdf(successful[0]);

      if (failed.length) {
        const firstFailure = failed[0];
        setUploadMessage(`${successful.length} uploaded, ${failed.length} failed. ${firstFailure.file}: ${firstFailure.error}`);
        setIsError(true);
      } else {
        setUploadMessage(`${successful.length} PDF${successful.length === 1 ? "" : "s"} uploaded. Open any file from the preview grid.`);
        setIsError(false);
      }
      setShowUploadMessage(true);
    } catch (error) {
      console.error("Batch PDF upload failed:", error);
      setUploadMessage(error.message || "Batch upload failed.");
      setIsError(true);
      setShowUploadMessage(true);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => handleMultipleFiles(files),
    onDropRejected: (rejections) => {
      const firstError = rejections?.[0]?.errors?.[0];
      const message = firstError?.code === "file-too-large"
        ? "File too large. Maximum upload size is 50MB."
        : "Invalid file type. Only PDF files are allowed.";
      setUploadMessage(message);
      setIsError(true);
      setShowUploadMessage(true);
    },
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: MAX_PDF_UPLOAD_SIZE_BYTES,
    multiple: true,
    disabled: uploading,
  });

  const handlePlacementChange = useCallback((coordinates) => {
    setPlacementCoordinates((previous) => normalizePlacementCoordinates(coordinates, previous));
  }, []);

  const handleConfirmPosition = useCallback((coordinates) => {
    handlePlacementChange(coordinates);
  }, [handlePlacementChange]);

  const handleHistoryAction = async (endpoint) => {
    setShowUploadMessage(false);
    setIsError(false);

    try {
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: getCsrfHeaders(),
      }, PDF_HISTORY_ACTION_TIMEOUT_MS);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "History action failed.");
      if (!data.pdf_url) throw new Error("History action did not return a PDF.");

      const nextName = downloadName || getPdfFileName(data.pdf_url);
      setPdfUrl(data.pdf_url);
      writeStorage("pdfUrl", data.pdf_url);
      addPdfToLibrary({ url: data.pdf_url, name: nextName });
      setPdfUpdated((prev) => prev + 1);
      setUploadMessage(data.message || "PDF history updated.");
      setIsError(false);
      setShowUploadMessage(true);
    } catch (error) {
      console.error("PDF history action failed:", error);
      setUploadMessage(error.message || "History action failed.");
      setIsError(true);
      setShowUploadMessage(true);
    }
  };

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
                <p className="font-bold text-slate-800">{isDragActive ? 'Release to upload' : 'Drop PDFs here'}</p>
                <p className="mt-2 text-sm text-slate-500">or click to choose one or more PDFs up to 50MB each</p>
              </>
            )}
          </div>

          {pdfLibrary.length > 0 && (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wide text-slate-500">Recent PDFs</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {pdfLibrary.slice(0, 6).map((item) => (
                  <PdfPreviewCard key={normalizePdfUrl(item.url)} item={item} isActive={false} onOpen={openLibraryPdf} />
                ))}
              </div>
            </div>
          )}

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
          <div className="flex items-center rounded-lg border border-gray-200 bg-white p-1">
            <button
              onClick={() => handleHistoryAction("/undo_pdf")}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-50 hover:text-indigo-600"
              title="Undo"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleHistoryAction("/redo_pdf")}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-50 hover:text-indigo-600"
              title="Redo"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>
          <button onClick={closePdf} className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors">Close</button>
          <button 
            onClick={() => {
              const url = new URL("/download_pdf", window.location.origin);
              const cleanPath = normalizePdfUrl(pdfUrl);
              const requestedName = downloadName?.trim();
              if (cleanPath) url.searchParams.set("pdf_path", cleanPath);
              if (requestedName) url.searchParams.set("download_name", requestedName);
              window.open(`${url.pathname}${url.search}`, "_blank");
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
          {pdfLibrary.length > 1 && (
            <div className="shrink-0 border-b border-gray-100 bg-white/80 px-4 py-3">
              <div className="flex gap-3 overflow-x-auto pb-1">
                {pdfLibrary.map((item) => (
                  <PdfPreviewCard
                    key={normalizePdfUrl(item.url)}
                    item={item}
                    isActive={normalizePdfUrl(pdfUrl) === normalizePdfUrl(item.url)}
                    onOpen={openLibraryPdf}
                  />
                ))}
              </div>
            </div>
          )}

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
                        textDraft={textDraft}
                        setTextDraft={setTextDraft}
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
              textDraft={textDraft}
              setTextDraft={setTextDraft}
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
