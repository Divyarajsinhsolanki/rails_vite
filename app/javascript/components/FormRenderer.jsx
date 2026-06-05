import React from "react";
import FormComponent from "./FormComponent";

const pageNumberPositions = [
  { value: "bottom_right", label: "Bottom right" },
  { value: "bottom_center", label: "Bottom center" },
  { value: "bottom_left", label: "Bottom left" },
  { value: "top_right", label: "Top right" },
  { value: "top_center", label: "Top center" },
  { value: "top_left", label: "Top left" },
];

const mergePdfFields = Array.from({ length: 10 }, (_, index) => ({
  name: `pdf${index + 1}`,
  type: "file",
  label: `Upload PDF ${index + 1}`,
  accept: "application/pdf,.pdf",
  required: index < 2,
}));

const imageExportFormats = [
  { value: "png", label: "PNG" },
  { value: "jpg", label: "JPG" },
];

const protectionLevels = [
  { value: "standard", label: "Standard" },
  { value: "low", label: "Low" },
  { value: "high", label: "High" },
];

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
        { name: "watermark_text", type: "textarea", label: "Watermark Text", placeholder: "CONFIDENTIAL", maxLength: "100" },
        { name: "x", type: "number", label: "X Position", min: "0" },
        { name: "y", type: "number", label: "Y Position", min: "0" },
        { name: "page_number", type: "number", label: "Page Number", min: "1", defaultValue: "1" },
        { name: "font_size", type: "number", label: "Font Size", min: "16", max: "96", defaultValue: "48" },
        { name: "opacity", type: "number", label: "Opacity", min: "0", max: "1", step: "0.05", defaultValue: "0.25" },
        { name: "rotate", type: "number", label: "Rotation", min: "-180", max: "180", defaultValue: "35" },
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
      formFields: mergePdfFields,
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
    splitBySize: {
      title: "Split by Size",
      endpoint: "/split_by_size",
      formFields: [
        { name: "max_size", type: "number", label: "Maximum Size (MB)", min: "1", max: "50", defaultValue: "10" },
      ],
    },
    compressPdf: {
      title: "Compress PDF",
      endpoint: "/compress_pdf",
      formFields: [
        { name: "level", type: "number", label: "Compression Level", min: "1", max: "9", defaultValue: "6" },
      ],
    },
    updateMetadata: {
      title: "Edit Metadata",
      endpoint: "/update_metadata",
      formFields: [
        { name: "title", type: "text", label: "Title", required: false, maxLength: "200" },
        { name: "author", type: "text", label: "Author", required: false, maxLength: "200" },
        { name: "subject", type: "text", label: "Subject", required: false, maxLength: "200" },
        { name: "creator", type: "text", label: "Creator", required: false, maxLength: "200" },
      ],
    },
    addPageNumbers: {
      title: "Page Numbers",
      endpoint: "/add_page_numbers",
      formFields: [
        { name: "position", type: "select", label: "Position", defaultValue: "bottom_right", options: pageNumberPositions },
        { name: "start", type: "number", label: "Start Number", min: "0", max: "999999", defaultValue: "1" },
        { name: "font_size", type: "number", label: "Font Size", min: "8", max: "36", defaultValue: "10" },
        { name: "color", type: "color", label: "Color", defaultValue: "#111827" },
      ],
    },
    exportImages: {
      title: "Export Images",
      endpoint: "/export_to_images",
      formFields: [
        { name: "image_format", type: "select", label: "Image Format", defaultValue: "png", options: imageExportFormats },
        { name: "dpi", type: "number", label: "DPI", min: "72", max: "200", defaultValue: "144" },
      ],
    },
    extractText: {
      title: "Extract Text",
      endpoint: "/extract_text",
      formFields: [],
    },
    protectPdf: {
      title: "Protect PDF",
      endpoint: "/protect_pdf",
      formFields: [
        { name: "password", type: "password", label: "Password", minLength: "8" },
        { name: "level", type: "select", label: "Protection Level", defaultValue: "standard", options: protectionLevels },
      ],
    },
    encryptPdf: {
      title: "Encrypt PDF",
      endpoint: "/encrypt_pdf",
      formFields: [{ name: "password", type: "password", label: "Enter Password", minLength: "8" }],
    },
    decryptPdf: {
      title: "Decrypt PDF",
      endpoint: "/decrypt_pdf",
      formFields: [{ name: "password", type: "password", label: "Enter Password" }],
    },
};

const FormRenderer = ({ activeForm, setActiveForm, setPdfUpdated, setPdfUrl, pdfPath, placementCoordinates, setPlacementCoordinates }) => {
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
