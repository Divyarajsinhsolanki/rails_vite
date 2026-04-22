import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import DraggableOverlay from "./DraggableOverlay";
import { 
  Plus,
  FilePlus, 
  FileMinus, 
  Copy, 
  RotateCcw, 
  RotateCw, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut
} from "lucide-react";

// Set worker URL to the specific version required by react-pdf 9.2.1
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;

const PdfViewer = ({ pdfUrl, activeTool, onConfirmPosition, onCancelTool, setPdfUpdated }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pageWidth, setPageWidth] = useState(null);
  const [pageHeight, setPageHeight] = useState(null);
  const [processing, setProcessing] = useState(false);
  const placementTools = new Set(["addText", "addSignature", "addStamp"]);
  const shouldShowOverlay = placementTools.has(activeTool);

  useEffect(() => {
    // Only reset to Page 1 if the actual FILE changed, not just a cache-bust update
    const currentPath = pdfUrl?.split("?")[0];
    if (window.lastPdfPath !== currentPath) {
      setPageNumber(1);
      window.lastPdfPath = currentPath;
    }
    setNumPages(null);
  }, [pdfUrl]);

  useEffect(() => {
    if (!numPages) return;
    setPageNumber((prev) => Math.min(prev, numPages));
  }, [numPages]);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  function onPageLoadSuccess({ width, height }) {
    setPageWidth(width);
    setPageHeight(height);
  }

  const handleQuickAction = async (endpoint, params = {}) => {
    setProcessing(true);
    const formData = new FormData();
    // Clean URL and map to public path for the backend
    const cleanPath = pdfUrl.split("?")[0].replace(/^\//, "public/");
    formData.append("pdf_path", cleanPath);
    
    Object.entries(params).forEach(([key, value]) => {
      formData.append(key, value);
    });

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        headers: {
          "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // If the server returned a specific new PDF URL, use it
        if (data.pdf_url) {
          // This will trigger the parent's update flow if we add a call here
          window.dispatchEvent(new CustomEvent("pdf-updated", { detail: data.pdf_url }));
        } else {
          setPdfUpdated(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setProcessing(false);
    }
  };

  if (!pdfUrl) return null;

  return (
    <div className="flex-1 h-full flex flex-col bg-gray-50/20 overflow-hidden relative">
      {/* 🧭 Top Navigation & Status Bar */}
      <div className="h-10 shrink-0 flex items-center justify-between px-6 bg-white/40 backdrop-blur-sm border-b border-gray-100/50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <button
              disabled={pageNumber <= 1 || processing}
              onClick={() => setPageNumber(prev => prev - 1)}
              className="p-1 hover:bg-white rounded transition-all disabled:opacity-20"
            >
              <ChevronLeft className="h-3.5 w-3.5 text-gray-500" />
            </button>
            <span className="text-[9px] font-black text-gray-400 tracking-widest uppercase px-2">
              Viewing {pageNumber} of {numPages || '--'}
            </span>
            <button
              disabled={pageNumber >= numPages || processing}
              onClick={() => setPageNumber(prev => prev + 1)}
              className="p-1 hover:bg-white rounded transition-all disabled:opacity-20"
            >
              <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-gray-100/60 p-0.5 rounded-md">
            <button onClick={() => setScale(s => Math.max(0.3, s - 0.1))} className="p-1 hover:text-indigo-600 transition-colors">
              <ZoomOut className="h-3 w-3" />
            </button>
            <span className="text-[9px] font-bold text-gray-500 min-w-[30px] text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(3.0, s + 0.1))} className="p-1 hover:text-indigo-600 transition-colors">
              <ZoomIn className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 📄 PDF Workspace */}
      <div className="flex-1 w-full flex justify-center items-start overflow-hidden p-6 gap-8 relative group">
        
        {/* Scrollable Container (The only scrollable part of the app) */}
        <div className="flex-1 h-full overflow-auto flex justify-center custom-scrollbar scroll-smooth">
          <div className="relative shadow-[0_35px_100px_-15px_rgba(0,0,0,0.15)] bg-white mb-12 self-start rounded-sm shrink-0">
            <Document
              key={pdfUrl}
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              className="flex justify-center"
            >
              <div className="relative">
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  onLoadSuccess={onPageLoadSuccess}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />

                {/* Draggable Overlay */}
                {shouldShowOverlay && (
                  <DraggableOverlay
                    activeTool={activeTool}
                    onConfirmPosition={(pos) => onConfirmPosition({ ...pos, pageNumber })}
                    onCancel={onCancelTool}
                    scale={scale}
                    pageWidth={pageWidth ? pageWidth * scale : 600}
                    pageHeight={pageHeight ? pageHeight * scale : 800}
                  />
                )}
              </div>
            </Document>
          </div>
        </div>

        {/* Floating Side Action Rail */}
        <div className="shrink-0 flex flex-col gap-1 p-1 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/40 mt-2 z-20">
          <button
            onClick={() => handleQuickAction("/add_page", { position: pageNumber + 1 })}
            disabled={processing}
            className="flex flex-col items-center justify-center w-12 h-12 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all group"
            title="Add Page After"
          >
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span className="text-[8px] font-black mt-1 uppercase">Add</span>
          </button>
          
          <button
            onClick={() => handleQuickAction("/duplicate_page", { page_number: pageNumber })}
            disabled={processing}
            className="flex flex-col items-center justify-center w-12 h-12 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all group"
            title="Duplicate Page"
          >
            <Copy className="h-4 w-4" />
            <span className="text-[8px] font-black mt-1 uppercase">Copy</span>
          </button>

          <div className="h-px bg-gray-100 mx-2 my-1"></div>

          <button
            onClick={() => handleQuickAction("/rotate_left", { page_number: pageNumber })}
            disabled={processing}
            className="flex flex-col items-center justify-center w-12 h-10 text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
            title="Rotate Left"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          
          <button
            onClick={() => handleQuickAction("/rotate_right", { page_number: pageNumber })}
            disabled={processing}
            className="flex flex-col items-center justify-center w-12 h-10 text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
            title="Rotate Right"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>

          <div className="h-px bg-gray-100 mx-2 my-1"></div>

          <button
            onClick={() => handleQuickAction("/remove_page", { position: pageNumber })}
            disabled={processing || numPages <= 1}
            className="flex flex-col items-center justify-center w-12 h-12 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all"
            title="Remove Page"
          >
            <FileMinus className="h-4 w-4" />
            <span className="text-[8px] font-black mt-1 uppercase">Del</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
