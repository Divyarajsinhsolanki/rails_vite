import React from "react";
import FormComponent from "./FormComponent";

const FormRenderer = ({ activeForm, setActiveForm, setPdfUpdated, pdfPath }) => {
  const formConfigs = {
    addText: {
      title: "Add Text",
      endpoint: "/add_text",
      formFields: [
        { name: "text", type: "text", label: "Text" },
        { name: "x", type: "number", label: "X Position" },
        { name: "y", type: "number", label: "Y Position" },
        { name: "page_number", type: "number", label: "Page Number" },
      ],
    },
    addPage: {
      title: "Add Page",
      endpoint: "/add_page",
      formFields: [{ name: "position", type: "number", label: "Page Position" }],
    },
    removePage: {
      title: "Remove Page",
      endpoint: "/remove_page",
      formFields: [{ name: "position", type: "number", label: "Page Number" }],
    },
    duplicatePage: {
      title: "Duplicate Page",
      endpoint: "/duplicate_page",
      formFields: [
        { name: "page_number", type: "number", label: "Page Number to Duplicate" },
      ],
    },
    replaceText: {
      title: "Replace Text",
      endpoint: "/replace_text",
      formFields: [
        { name: "old_text", type: "text", label: "Text to Replace" },
        { name: "new_text", type: "text", label: "New Text" },
        { name: "page_number", type: "number", label: "Page Number (Optional)" },
      ],
    },
    uploadPdf: {
      title: "Upload PDF",
      endpoint: "/upload_pdf",
      formFields: [{ name: "file", type: "file", label: "Select PDF" }],
    },
    addSignature: {
      title: "Add Signature",
      endpoint: "/add_signature",
      formFields: [
        { name: "signature", type: "file", label: "Upload Signature" },
        { name: "x", type: "number", label: "X Position" },
        { name: "y", type: "number", label: "Y Position" },
        { name: "page_number", type: "number", label: "Page Number" },
      ],
    },
    addWatermark: {
      title: "Add Watermark",
      endpoint: "/add_watermark",
      formFields: [
        { name: "text", type: "text", label: "Watermark Text" },
        { name: "opacity", type: "number", label: "Opacity (0-1)" },
      ],
    },
    addStamp: {
      title: "Add Stamp",
      endpoint: "/add_stamp",
      formFields: [
        { name: "stamp", type: "file", label: "Upload Stamp" },
        { name: "x", type: "number", label: "X Position" },
        { name: "y", type: "number", label: "Y Position" },
        { name: "page_number", type: "number", label: "Page Number" },
      ],
    },
    rotateLeft: {
      title: "Rotate Left",
      endpoint: "/rotate_left",
      formFields: [{ name: "page_number", type: "number", label: "Page Number" }],
    },
    rotateRight: {
      title: "Rotate Right",
      endpoint: "/rotate_right",
      formFields: [{ name: "page_number", type: "number", label: "Page Number" }],
    },
    mergePdf: {
      title: "Merge PDFs",
      endpoint: "/merge_pdf",
      formFields: [
        { name: "pdf1", type: "file", label: "Upload PDF 1" },
        { name: "pdf2", type: "file", label: "Upload PDF 2" },
      ],
    },
    splitPdf: {
      title: "Split PDF",
      endpoint: "/split_pdf",
      formFields: [
        { name: "start_page", type: "number", label: "Start Page" },
        { name: "end_page", type: "number", label: "End Page" },
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
      pdfPath={pdfPath}
      {...config}
    />
  );
};

export default FormRenderer;
