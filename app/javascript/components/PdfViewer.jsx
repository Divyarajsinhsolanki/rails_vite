import React from "react";

const PdfViewer = ({ pdfUrl }) => {
  if (!pdfUrl) return null;

  return (
    <div className="flex-1 h-[90vh] border rounded-lg shadow-md bg-white p-4 flex flex-col">
      <div className="border rounded-lg overflow-hidden shadow-md flex-grow w-full">
        <embed src={pdfUrl} type="application/pdf" width="100%" height="100%" className="w-full h-full" />
      </div>
    </div>
  );
};

export default PdfViewer;
