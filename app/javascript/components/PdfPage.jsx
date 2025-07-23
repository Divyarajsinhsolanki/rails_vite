import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import PdfEditor from "./PdfEditor";
import PdfViewer from "./PdfViewer";

const PdfPage = () => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfUpdated, setPdfUpdated] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Load PDF from LocalStorage on mount
  useEffect(() => {
    const storedPdf = localStorage.getItem("pdfUrl");
    if (storedPdf) setPdfUrl(storedPdf);
  }, []);

  // File Upload Handler (Drag & Drop or Manual Upload)
  const handleFileUpload = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("pdf", file);

    setUploading(true);
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
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  // Drag & Drop Handler
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) handleFileUpload(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: "application/pdf",
    multiple: false,
  });

  // Remove PDF
  const handleRemovePdf = () => {
    setPdfUrl(null);
    localStorage.removeItem("pdfUrl");
  };

  const handleResetPdf = async () => {
    try {
      const response = await fetch("/reset_pdf", {
        method: "POST",
        headers: {
          "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content,
        },
      });
      if (response.ok) setPdfUpdated((prev) => !prev);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadPdf = () => {
    window.open("/download_pdf", "_blank");
  };

  return (
    <div className="flex flex-col min-h-screen items-center bg-gray-100 p-6">
      {/* Upload Section */}
      {!pdfUrl && (
        <>
          <div className="flex flex-col items-center">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed p-6 rounded-lg text-center w-96 cursor-pointer transition ${
                isDragActive ? "border-blue-500 bg-blue-100" : "border-gray-300"
              }`}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p className="text-blue-600">Drop the PDF here...</p>
              ) : (
                <p>Drag & Drop a PDF or <span className="text-blue-600 underline">click to upload</span></p>
              )}
            </div>

            {/* <label className="bg-blue-500 text-white px-6 py-2 rounded shadow hover:bg-blue-600 cursor-pointer mt-4">
              {uploading ? "Uploading..." : "Upload PDF Manually"}
              <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0])} />
            </label> */}

            <button
              className="bg-green-500 text-white px-6 py-2 rounded shadow hover:bg-green-600 mt-4"
              onClick={() => {
                setPdfUrl("/documents/sample.pdf");
                localStorage.setItem("pdfUrl", "/documents/sample.pdf");
              }}
            >
              Use Sample PDF
            </button>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 bg-white p-6 rounded-lg shadow-md w-full max-w-5xl mx-auto mt-4">
            {[
              { name: "Add Page", icon: "➕" },
              { name: "Remove Page", icon: "❌" },
              { name: "Merge PDFs", icon: "🔗" },
              { name: "Extract Pages", icon: "📄" },
              { name: "Rotate Page", icon: "🔄" },
              { name: "Add Watermark", icon: "💧" },
              { name: "Add Blank Page", icon: "📑" },
              { name: "Add Text", icon: "✍️" },
              { name: "Count Pages", icon: "🔢" },
              { name: "Sign on Page", icon: "✒️" },
            ].map((tool, index) => (
              <div key={index} className="flex flex-col items-center bg-gray-200 p-4 rounded shadow hover:bg-gray-300 transition">
                <span className="text-2xl">{tool.icon}</span>
                <span className="text-sm mt-2">{tool.name}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Main Layout */}
      {pdfUrl && (
        <div className="flex w-full h-[80vh] mx-auto gap-6">
          {/* Left: Editor */}
          <div className="w-2/5">
            <PdfEditor setPdfUpdated={setPdfUpdated} pdfPath={pdfUrl} />
          </div>

          {/* Right: PDF Viewer */}
          <div className="w-3/5 items-center">
            <PdfViewer pdfUrl={`${pdfUrl}?updated=${pdfUpdated}`} />

            <div className="flex gap-4 mt-4">
              <button
                className="bg-yellow-500 text-white px-4 py-2 rounded shadow hover:bg-yellow-600 flex-1"
                onClick={handleResetPdf}
              >
                Reset
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600 flex-1"
                onClick={handleDownloadPdf}
              >
                Download
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600 flex-1"
                onClick={handleRemovePdf}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfPage;
