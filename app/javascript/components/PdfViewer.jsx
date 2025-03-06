import React, { useEffect, useState } from "react";

const PdfViewer = ({ pdfUrl, pdfUpdated }) => {
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey((prev) => prev + 1); // ✅ Force re-render on PDF update
  }, [pdfUpdated]);
  
  console.log(key);
  return (
    <div className="w-full h-full border rounded-lg shadow-md">
      <embed key={key} src={pdfUrl + "?t=" + Date.now()} type="application/pdf" width="100%" height="100%" className="border rounded-lg shadow-md" />
    </div>
  );
};

export default PdfViewer;
