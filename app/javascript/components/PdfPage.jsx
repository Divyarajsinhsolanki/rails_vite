import React, { useState, useEffect } from "react";
import PdfEditor from "./PdfEditor";
import PdfViewer from "./PdfViewer";

const PdfPage = () => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfUpdated, setPdfUpdated] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Load PDF from LocalStorage on mount
  useEffect(() => {
    const storedPdf = localStorage.getItem("pdfUrl");
    if (storedPdf) {
      setPdfUrl(storedPdf);
    }
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
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
      localStorage.setItem("pdfUrl", data.pdf_url); // Store in LocalStorage

    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  // Remove PDF and allow new selection
  const handleRemovePdf = () => {
    setPdfUrl(null);
    localStorage.removeItem("pdfUrl");
  };

  return (
    <div className="flex flex-col min-h-screen items-center bg-gray-100 p-6">
      {/* Upload Section */}
      {!pdfUrl && (
        <>
          <div className="flex gap-4">
            <label className="bg-blue-500 text-white px-6 py-2 rounded shadow hover:bg-blue-600 cursor-pointer">
              {uploading ? "Uploading..." : "Upload PDF"}
              <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} />
            </label>

            <button
              className="bg-green-500 text-white px-6 py-2 rounded shadow hover:bg-green-600"
              onClick={() => {
                setPdfUrl("/documents/sample.pdf");
                localStorage.setItem("pdfUrl", "/documents/sample.pdf");
              }}
            >
              Use Sample PDF
            </button>
          </div>
          {/* Feature Grid (Restored) */}
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
              { name: "Sign on Page", icon: "✒️" }
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
        <div className="flex w-full mx-auto mt-6 flex-grow gap-6">
          {/* Left: Editor */}
          <div className="w-2/5">
            <PdfEditor setPdfUpdated={setPdfUpdated} />
          </div>

          {/* Right: PDF Viewer */}
          <div className="w-3/5">
            <PdfViewer pdfUrl={`${pdfUrl}?updated=${pdfUpdated}`} />

            {/* Remove PDF Button */}
            <button
              className="bg-red-500 text-white px-6 py-2 mt-4 rounded shadow hover:bg-red-600 w-full"
              onClick={handleRemovePdf}
            >
              Remove PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfPage;
