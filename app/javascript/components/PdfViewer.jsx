import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import DraggableOverlay from "./DraggableOverlay";

// Set worker URL to the specific version required by react-pdf 9.2.1
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;

const PdfViewer = ({ pdfUrl, activeTool, onConfirmPosition, onCancelTool }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pageWidth, setPageWidth] = useState(null);
  const [pageHeight, setPageHeight] = useState(null);
  const placementTools = new Set(["addText", "addSignature", "addStamp"]);
  const shouldShowOverlay = placementTools.has(activeTool);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  function onPageLoadSuccess({ width, height }) {
    setPageWidth(width);
    setPageHeight(height);
  }

  if (!pdfUrl) return null;

  return (
    <div className="flex-1 h-[90vh] flex flex-col items-center bg-gray-100 p-4 border rounded-lg shadow-md overflow-hidden relative">
      <div className="w-full flex justify-between items-center mb-2 px-4 bg-white py-2 rounded shadow-sm z-10">
        <div className="flex items-center gap-2">
          <button
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber(prev => prev - 1)}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-gray-700 font-medium">
            Page {pageNumber} of {numPages || '--'}
          </span>
          <button
            disabled={pageNumber >= numPages}
            onClick={() => setPageNumber(prev => prev + 1)}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1 text-gray-600 hover:text-black">-</button>
          <span className="text-xs">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(2.5, s + 0.1))} className="p-1 text-gray-600 hover:text-black">+</button>
        </div>
      </div>

      <div className="relative border shadow-lg bg-white overflow-auto max-h-full max-w-full flex justify-center">
        <Document
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

            {/* Overlay for Drag and Drop */}
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
  );
};

export default PdfViewer;
