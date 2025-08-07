import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import PdfEditor from "./PdfEditor";
import PdfViewer from "./PdfViewer";

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

  useEffect(() => {
    const storedPdf = localStorage.getItem("pdfUrl");
    if (storedPdf) setPdfUrl(storedPdf);
  }, []);

  const pdfTools = [
    { name: "Add Page", icon: Plus },
    { name: "Remove Page", icon: Minus },
    { name: "Merge PDFs", icon: Link },
    { name: "Extract Pages", icon: FileSliders },
    { name: "Rotate Page", icon: RotateCw },
    { name: "Add Watermark", icon: Droplet },
    { name: "Add Blank Page", icon: FilePlus },
    { name: "Add Text", icon: Type },
    { name: "Count Pages", icon: Hash },
    { name: "Sign on Page", icon: Signature },
  ];

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
        // Increment the counter to force the viewer to reload the PDF
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

  return (
    <div className="font-inter flex flex-col min-h-screen items-center bg-[rgb(var(--theme-color-rgb)/0.1)] p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-6xl text-center mb-8">
        <h1 className="text-4xl font-bold text-[var(--theme-color)] mb-2">PDF Modifier</h1>
        <p className="text-lg text-gray-600">Your all-in-one online PDF editor. Upload, edit, and manage your documents with ease.</p>
      </header>

      {!pdfUrl && (
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10 flex flex-col items-center border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Start Editing Your PDF</h2>

          <div
            {...getRootProps()}
            className={`
              w-full p-10 rounded-xl border-4 transition-all duration-300 ease-in-out
              flex flex-col items-center justify-center text-center cursor-pointer
              ${isDragActive ? "border-[var(--theme-color)] bg-[rgb(var(--theme-color-rgb)/0.1)] text-[var(--theme-color)] shadow-lg" : "border-gray-300 bg-gray-50 text-gray-600 hover:border-[var(--theme-color)] hover:bg-[rgb(var(--theme-color-rgb)/0.05)]"}
            `}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <Loader2 className="h-12 w-12 text-[var(--theme-color)] animate-spin mb-4" />
            ) : (
              <Upload className="h-12 w-12 text-gray-500 mb-4" />
            )}
            {isDragActive ? (
              <p className="text-xl font-semibold">Drop your PDF here!</p>
            ) : (
              <p className="text-lg">Drag & drop a PDF file or <span className="font-semibold text-[var(--theme-color)] underline">click to browse</span></p>
            )}
            <p className="text-sm text-gray-500 mt-2">Only .pdf files are accepted (Max 25MB)</p>
          </div>

          {showUploadMessage && (
            <div className={`mt-4 p-3 rounded-lg w-full text-center text-sm font-medium ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{uploadMessage}</div>
          )}

          <div className="flex items-center justify-center w-full my-6">
            <div className="border-t border-gray-300 flex-grow"></div>
            <span className="px-4 text-gray-500 text-sm font-medium">OR</span>
            <div className="border-t border-gray-300 flex-grow"></div>
          </div>

          <button
            className="group relative inline-flex items-center justify-center px-8 py-3 text-lg font-medium tracking-wide text-white transition-all duration-300 ease-out bg-[var(--theme-color)] rounded-lg shadow-lg hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[rgb(var(--theme-color-rgb)/0.5)] active:scale-95"
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
            <FileText className="h-6 w-6 mr-3 transition-transform duration-300 group-hover:rotate-6" />
            {uploading ? "Loading Sample..." : "Use Sample PDF"}
          </button>

          <div className="w-full mt-12">
            <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Powerful PDF Tools at Your Fingertips</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {pdfTools.map((tool, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg shadow-sm hover:shadow-md hover:bg-[rgb(var(--theme-color-rgb)/0.05)] transition-all duration-200 ease-in-out cursor-pointer border border-gray-200"
                >
                  <tool.icon className="h-8 w-8 text-[var(--theme-color)] mb-2" />
                  <span className="text-sm font-medium text-gray-700 text-center">{tool.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {pdfUrl && (
        <div className="w-full max-w-8xl flex flex-col lg:flex-row gap-6 mt-8">
          <div className="w-full lg:w-2/5 bg-white rounded-2xl shadow-xl p-6 border border-gray-200 flex flex-col">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">PDF Editor</h2>
            <div className="flex-grow border border-gray-300 rounded-lg overflow-hidden text-gray-500 p-4 bg-gray-50">
              <PdfEditor setPdfUpdated={setPdfUpdated} pdfPath={pdfUrl} />
            </div>
          </div>

          <div className="w-full lg:w-3/5 bg-white rounded-2xl shadow-xl p-6 border border-gray-200 flex flex-col">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">PDF Viewer</h2>
            <div className="flex-grow relative">
              <div className="w-full h-full border border-gray-300 rounded-lg overflow-hidden">
                <PdfViewer pdfUrl={`${pdfUrl}?updated=${pdfUpdated}`} />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-6 justify-center">
              <button
                className="group relative inline-flex items-center justify-center px-6 py-3 text-base font-medium tracking-wide text-white transition-all duration-300 ease-out bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg shadow-md hover:from-yellow-600 hover:to-orange-600 focus:outline-none focus:ring-4 focus:ring-yellow-300 active:scale-95"
                onClick={handleResetPdf}
              >
                <RefreshCcw className="h-5 w-5 mr-2 transition-transform duration-300 group-hover:rotate-180" />
                Reset PDF
              </button>
              <button
                className="group relative inline-flex items-center justify-center px-6 py-3 text-base font-medium tracking-wide text-white transition-all duration-300 ease-out bg-[var(--theme-color)] rounded-lg shadow-md hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[rgb(var(--theme-color-rgb)/0.5)] active:scale-95"
                onClick={handleDownloadPdf}
              >
                <Download className="h-5 w-5 mr-2 transition-transform duration-300 group-hover:translate-y-1" />
                Download PDF
              </button>
              <button
                className="group relative inline-flex items-center justify-center px-6 py-3 text-base font-medium tracking-wide text-white transition-all duration-300 ease-out bg-gradient-to-br from-red-600 to-pink-500 rounded-lg shadow-md hover:from-red-700 hover:to-pink-600 focus:outline-none focus:ring-4 focus:ring-red-300 active:scale-95"
                onClick={handleRemovePdf}
              >
                <Trash2 className="h-5 w-5 mr-2 transition-transform duration-300 group-hover:scale-110" />
                Remove PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadMessage && (
        <div className={`fixed bottom-6 right-6 p-4 rounded-lg shadow-lg text-white z-50 transition-all duration-300 ease-in-out transform ${isError ? 'bg-red-500' : 'bg-green-500'} ${showUploadMessage ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}> 
          <div className="flex items-center">
            {isError ? <X className="h-5 w-5 mr-2" /> : <Check className="h-5 w-5 mr-2" />} 
            <span>{uploadMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfPage;
