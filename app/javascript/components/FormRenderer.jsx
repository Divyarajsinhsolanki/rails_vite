import React from "react";
import FormComponent from "./FormComponent";

const FormRenderer = ({ activeForm, setActiveForm, setPdfUpdated, pdfPath }) => {
  const formConfigs = {
    addText: {
      title: "Add Text",
      endpoint: "/add_text",
      formFields: [
        { name: "text", type: "text", placeholder: "Text" },
        { name: "x", type: "number", placeholder: "X Position" },
        { name: "y", type: "number", placeholder: "Y Position" },
        { name: "page_number", type: "number", placeholder: "Page Number" },
      ],
    },
    addPage: {
      title: "Add Page",
      endpoint: "/add_page",
      formFields: [{ name: "position", type: "number", placeholder: "Page Position" }],
    },
    removePage: {
      title: "Remove Page",
      endpoint: "/remove_page",
      formFields: [{ name: "position", type: "number", placeholder: "Page Number" }],
    },
    duplicatePage: {
      title: "Duplicate Page",
      endpoint: "/duplicate_page",
      formFields: [{ name: "page_number", type: "number", placeholder: "Page Number to Duplicate" }],
    },
    replaceText: {
      title: "Replace Text",
      endpoint: "/replace_text",
      formFields: [
        { name: "old_text", type: "text", placeholder: "Text to Replace" },
        { name: "new_text", type: "text", placeholder: "New Text" },
        { name: "page_number", type: "number", placeholder: "Page Number (Optional)" },
      ],
    },
    uploadPdf: {
      title: "Upload PDF",
      endpoint: "/upload_pdf",
      formFields: [{ name: "file", type: "file", placeholder: "Select PDF" }],
    },
    addSignature: {
      title: "Add Signature",
      endpoint: "/add_signature",
      formFields: [
        { name: "signature", type: "file", placeholder: "Upload Signature" },
        { name: "x", type: "number", placeholder: "X Position" },
        { name: "y", type: "number", placeholder: "Y Position" },
        { name: "page_number", type: "number", placeholder: "Page Number" },
      ],
    },
    addWatermark: {
      title: "Add Watermark",
      endpoint: "/add_watermark",
      formFields: [
        { name: "text", type: "text", placeholder: "Watermark Text" },
        { name: "opacity", type: "number", placeholder: "Opacity (0-1)" },
      ],
    },
    addStamp: {
      title: "Add Stamp",
      endpoint: "/add_stamp",
      formFields: [
        { name: "stamp", type: "file", placeholder: "Upload Stamp" },
        { name: "x", type: "number", placeholder: "X Position" },
        { name: "y", type: "number", placeholder: "Y Position" },
        { name: "page_number", type: "number", placeholder: "Page Number" },
      ],
    },
    rotateLeft: {
      title: "Rotate Left",
      endpoint: "/rotate_left",
      formFields: [{ name: "page_number", type: "number", placeholder: "Page Number" }],
    },
    rotateRight: {
      title: "Rotate Right",
      endpoint: "/rotate_right",
      formFields: [{ name: "page_number", type: "number", placeholder: "Page Number" }],
    },
    mergePdf: {
      title: "Merge PDFs",
      endpoint: "/merge_pdf",
      formFields: [
        { name: "pdf1", type: "file", placeholder: "Upload PDF 1" },
        { name: "pdf2", type: "file", placeholder: "Upload PDF 2" },
      ],
    },
    splitPdf: {
      title: "Split PDF",
      endpoint: "/split_pdf",
      formFields: [
        { name: "start_page", type: "number", placeholder: "Start Page" },
        { name: "end_page", type: "number", placeholder: "End Page" },
      ],
    },
    encryptPdf: {
      title: "Encrypt PDF",
      endpoint: "/encrypt_pdf",
      formFields: [{ name: "password", type: "password", placeholder: "Enter Password" }],
    },
    decryptPdf: {
      title: "Decrypt PDF",
      endpoint: "/decrypt_pdf",
      formFields: [{ name: "password", type: "password", placeholder: "Enter Password" }],
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
