// app/frontend/pages/PdfEditor.jsx
import React from 'react';
import PDFViewer from '../components/PDFViewer';

const PdfEditor = () => {
  return (
    <div className="p-4">
      {/* <h1 className="text-xl font-semibold mb-4">PDF Editor</h1> */}
      <PDFViewer pdfPath="/documents/sample.pdf" />
    </div>
  );
};

export default PdfEditor;
