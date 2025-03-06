import React, { useState } from "react";
import PdfEditor from "./PdfEditor";
import PdfViewer from "./PdfViewer";

const PdfPage = () => {
  const [pdfUrl, setPdfUrl] = useState("/sample.pdf"); // Set default PDF path
  const [pdfUpdated, setPdfUpdated] = useState(false); // State to track PDF updates

  return (
    <div className="flex h-screen">
      {/* Left side - PDF Editor */}
      <div className="w-1/2 p-4 bg-gray-100">
        <h2 className="text-xl font-bold mb-4">Edit PDF</h2>
        <PdfEditor setPdfUpdated={setPdfUpdated} />
      </div>

      {/* Right side - PDF Viewer */}
      <div className="w-1/2 p-4">
        <PdfViewer /* pdfUrl={pdfUrl} */  pdfUrl={`/sample.pdf?updated=${pdfUpdated}`} />
      </div>
    </div>
  );
};

export default PdfPage;
