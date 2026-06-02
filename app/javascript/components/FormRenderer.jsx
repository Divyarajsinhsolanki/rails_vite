import React from "react";
import FormComponent from "./FormComponent";

const FormRenderer = ({ activeForm, setActiveForm, setPdfUpdated, setPdfUrl, pdfPath, placementCoordinates, setPlacementCoordinates }) => {
  // ... (formConfigs remains unchanged) ...

  const formConfigs = {
    addText: {
      title: "Add Text",
      endpoint: "/add_text",
      formFields: [
        { name: "text", type: "textarea", label: "Text", placeholder: "Text to place on the PDF" },
        { name: "x", type: "number", label: "X Position", min: "0" },
        { name: "y", type: "number", label: "Y Position", min: "0" },
        { name: "page_number", type: "number", label: "Page Number", min: "1", defaultValue: "1" },
        { name: "font_size", type: "number", label: "Font Size", min: "8", max: "72", defaultValue: "14" },
        { name: "color", type: "color", label: "Color", defaultValue: "#111827" },
      ],
    },
    // ... (rest of configs) ...
    addPage: {
      title: "Add Page",
      endpoint: "/add_page",
      formFields: [{ name: "position", type: "number", label: "Page Position", min: "1" }],
    },
    removePage: {
      title: "Remove Page",
      endpoint: "/remove_page",
      formFields: [{ name: "position", type: "number", label: "Page Number", min: "1" }],
    },
    duplicatePage: {
      title: "Duplicate Page",
      endpoint: "/duplicate_page",
      formFields: [
        { name: "page_number", type: "number", label: "Page Number to Duplicate", min: "1" },
      ],
    },
    replaceText: {
      title: "Replace Text",
      endpoint: "/replace_text",
      formFields: [
        { name: "old_text", type: "text", label: "Text to Replace" },
        { name: "new_text", type: "text", label: "New Text" },
        { name: "page_number", type: "number", label: "Page Number (Optional)", min: "1", required: false },
      ],
    },
    uploadPdf: {
      title: "Upload PDF",
      endpoint: "/upload_pdf",
      formFields: [{ name: "pdf", type: "file", label: "Select PDF", accept: "application/pdf,.pdf" }],
    },
    addSignature: {
      title: "Add Signature",
      endpoint: "/add_signature",
      formFields: [
        { name: "signature", type: "file", label: "Upload Signature", accept: "image/png,image/jpeg,.jpg,.jpeg,.png" },
        { name: "x", type: "number", label: "X Position", min: "0" },
        { name: "y", type: "number", label: "Y Position", min: "0" },
        { name: "page_number", type: "number", label: "Page Number", min: "1", defaultValue: "1" },
        { name: "width", type: "number", label: "Width", min: "24", max: "420", defaultValue: "160" },
      ],
    },
    addWatermark: {
      title: "Add Watermark",
      endpoint: "/add_watermark",
      formFields: [
        { name: "watermark_text", type: "textarea", label: "Watermark Text", placeholder: "CONFIDENTIAL" },
        { name: "x", type: "number", label: "X Position", min: "0" },
        { name: "y", type: "number", label: "Y Position", min: "0" },
        { name: "page_number", type: "number", label: "Page Number", min: "1", defaultValue: "1" },
        { name: "font_size", type: "number", label: "Font Size", min: "16", max: "96", defaultValue: "48" },
        { name: "opacity", type: "number", label: "Opacity", min: "0.05", max: "1", step: "0.05", defaultValue: "0.25" },
        { name: "rotate", type: "number", label: "Rotation", min: "-90", max: "90", defaultValue: "35" },
        { name: "color", type: "color", label: "Color", defaultValue: "#9CA3AF" },
      ],
    },
    addStamp: {
      title: "Add Stamp",
      endpoint: "/add_stamp",
      formFields: [
        { name: "stamp", type: "file", label: "Upload Stamp", accept: "image/png,image/jpeg,.jpg,.jpeg,.png" },
        { name: "x", type: "number", label: "X Position", min: "0" },
        { name: "y", type: "number", label: "Y Position", min: "0" },
        { name: "page_number", type: "number", label: "Page Number", min: "1", defaultValue: "1" },
        { name: "width", type: "number", label: "Width", min: "24", max: "420", defaultValue: "120" },
      ],
    },
    rotateLeft: {
      title: "Rotate Left",
      endpoint: "/rotate_left",
      formFields: [{ name: "page_number", type: "number", label: "Page Number", min: "1" }],
    },
    rotateRight: {
      title: "Rotate Right",
      endpoint: "/rotate_right",
      formFields: [{ name: "page_number", type: "number", label: "Page Number", min: "1" }],
    },
    mergePdf: {
      title: "Merge PDFs",
      endpoint: "/merge_pdf",
      formFields: [
        { name: "pdf1", type: "file", label: "Upload PDF 1", accept: "application/pdf,.pdf" },
        { name: "pdf2", type: "file", label: "Upload PDF 2", accept: "application/pdf,.pdf" },
      ],
    },
    splitPdf: {
      title: "Split PDF",
      endpoint: "/split_pdf",
      formFields: [
        { name: "start_page", type: "number", label: "Start Page", min: "1" },
        { name: "end_page", type: "number", label: "End Page", min: "1" },
      ],
    },
    extractPages: {
      title: "Extract Pages",
      endpoint: "/split_pdf",
      formFields: [
        { name: "start_page", type: "number", label: "Start Page", min: "1" },
        { name: "end_page", type: "number", label: "End Page", min: "1" },
      ],
    },
    encryptPdf: {
      title: "Encrypt PDF",
      endpoint: "/encrypt_pdf",
      formFields: [{ name: "password", type: "password", label: "Enter Password" }],
    },
    decryptPdf: {
      title: "Decrypt PDF",
      endpoint: "/decrypt_pdf",
      formFields: [{ name: "password", type: "password", label: "Enter Password" }],
    },
  };

  const config = formConfigs[activeForm];

  if (!config) return null;

  return (
    <FormComponent
      setActiveForm={setActiveForm}
      setPdfUpdated={setPdfUpdated}
      setPdfUrl={setPdfUrl} // Pass down
      pdfPath={pdfPath}
      placementCoordinates={placementCoordinates}
      setPlacementCoordinates={setPlacementCoordinates}
      {...config}
    />
  );
};

export default FormRenderer;
