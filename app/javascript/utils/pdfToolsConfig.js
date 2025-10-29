import {
  Plus,
  Trash2,
  Copy,
  Replace,
  RotateCcw,
  RotateCw,
  Type,
  Signature,
  Droplet,
  Stamp,
  Combine,
  Split,
  Lock,
  Unlock,
} from "lucide-react";

export const pdfToolsConfig = {
  addPage: {
    id: "addPage",
    label: "Add Page",
    title: "Add a new page",
    description: "Insert a blank page exactly where you need it to expand your document.",
    endpoint: "/add_page",
    icon: Plus,
    formFields: [
      {
        name: "position",
        type: "number",
        label: "Page position",
        placeholder: "e.g., 2 to insert after page 1",
      },
    ],
  },
  removePage: {
    id: "removePage",
    label: "Remove Page",
    title: "Remove an existing page",
    description: "Delete a page you no longer need without affecting the rest of the file.",
    endpoint: "/remove_page",
    icon: Trash2,
    formFields: [
      {
        name: "position",
        type: "number",
        label: "Page number",
        placeholder: "Select the page to remove",
      },
    ],
  },
  duplicatePage: {
    id: "duplicatePage",
    label: "Duplicate Page",
    title: "Duplicate a page",
    description: "Create a copy of an existing page to reuse layouts or information.",
    endpoint: "/duplicate_page",
    icon: Copy,
    formFields: [
      {
        name: "page_number",
        type: "number",
        label: "Page number",
        placeholder: "Page to duplicate",
      },
    ],
  },
  replaceText: {
    id: "replaceText",
    label: "Replace Text",
    title: "Replace text",
    description: "Swap outdated wording with fresh copy in seconds.",
    endpoint: "/replace_text",
    icon: Replace,
    formFields: [
      {
        name: "old_text",
        type: "text",
        label: "Existing text",
        placeholder: "Text to replace",
      },
      {
        name: "new_text",
        type: "text",
        label: "New text",
        placeholder: "Replacement text",
      },
      {
        name: "page_number",
        type: "number",
        label: "Page number (optional)",
        placeholder: "Target a specific page",
      },
    ],
  },
  rotateLeft: {
    id: "rotateLeft",
    label: "Rotate Left",
    title: "Rotate page left",
    description: "Rotate any page 90° counterclockwise for the perfect orientation.",
    endpoint: "/rotate_left",
    icon: RotateCcw,
    formFields: [
      {
        name: "page_number",
        type: "number",
        label: "Page number",
        placeholder: "Page to rotate",
      },
    ],
  },
  rotateRight: {
    id: "rotateRight",
    label: "Rotate Right",
    title: "Rotate page right",
    description: "Rotate any page 90° clockwise for easy reading.",
    endpoint: "/rotate_right",
    icon: RotateCw,
    formFields: [
      {
        name: "page_number",
        type: "number",
        label: "Page number",
        placeholder: "Page to rotate",
      },
    ],
  },
  addText: {
    id: "addText",
    label: "Add Text",
    title: "Add custom text",
    description: "Drop in new annotations, notes, or labels anywhere in your PDF.",
    endpoint: "/add_text",
    icon: Type,
    formFields: [
      {
        name: "text",
        type: "text",
        label: "Text",
        placeholder: "What would you like to add?",
      },
      {
        name: "x",
        type: "number",
        label: "X position",
        placeholder: "Horizontal placement",
      },
      {
        name: "y",
        type: "number",
        label: "Y position",
        placeholder: "Vertical placement",
      },
      {
        name: "page_number",
        type: "number",
        label: "Page number",
        placeholder: "Choose the page",
      },
    ],
  },
  addSignature: {
    id: "addSignature",
    label: "Sign",
    title: "Add a signature",
    description: "Place a stored signature image at the exact spot you need.",
    endpoint: "/add_signature",
    icon: Signature,
    formFields: [
      {
        name: "signature",
        type: "file",
        label: "Signature image",
      },
      {
        name: "x",
        type: "number",
        label: "X position",
        placeholder: "Horizontal placement",
      },
      {
        name: "y",
        type: "number",
        label: "Y position",
        placeholder: "Vertical placement",
      },
      {
        name: "page_number",
        type: "number",
        label: "Page number",
        placeholder: "Choose the page",
      },
    ],
  },
  addWatermark: {
    id: "addWatermark",
    label: "Add Watermark",
    title: "Add a watermark",
    description: "Brand your document with custom watermark text and opacity.",
    endpoint: "/add_watermark",
    icon: Droplet,
    formFields: [
      {
        name: "text",
        type: "text",
        label: "Watermark text",
        placeholder: "Your watermark",
      },
      {
        name: "opacity",
        type: "number",
        label: "Opacity (0-1)",
        placeholder: "e.g., 0.4",
      },
    ],
  },
  addStamp: {
    id: "addStamp",
    label: "Add Stamp",
    title: "Add an approval stamp",
    description: "Drop in approved, paid, or custom stamp artwork.",
    endpoint: "/add_stamp",
    icon: Stamp,
    formFields: [
      {
        name: "stamp",
        type: "file",
        label: "Stamp image",
      },
      {
        name: "x",
        type: "number",
        label: "X position",
        placeholder: "Horizontal placement",
      },
      {
        name: "y",
        type: "number",
        label: "Y position",
        placeholder: "Vertical placement",
      },
      {
        name: "page_number",
        type: "number",
        label: "Page number",
        placeholder: "Choose the page",
      },
    ],
  },
  mergePdf: {
    id: "mergePdf",
    label: "Merge PDFs",
    title: "Merge multiple PDFs",
    description: "Combine several PDFs into one organized document.",
    endpoint: "/merge_pdf",
    icon: Combine,
    formFields: [
      {
        name: "pdf1",
        type: "file",
        label: "First PDF",
      },
      {
        name: "pdf2",
        type: "file",
        label: "Second PDF",
      },
    ],
  },
  splitPdf: {
    id: "splitPdf",
    label: "Split PDF",
    title: "Split your PDF",
    description: "Extract a range of pages into a brand-new document.",
    endpoint: "/split_pdf",
    icon: Split,
    formFields: [
      {
        name: "start_page",
        type: "number",
        label: "Start page",
        placeholder: "Beginning of the range",
      },
      {
        name: "end_page",
        type: "number",
        label: "End page",
        placeholder: "End of the range",
      },
    ],
  },
  encryptPdf: {
    id: "encryptPdf",
    label: "Encrypt PDF",
    title: "Protect your PDF",
    description: "Lock the document with a secure password before sharing.",
    endpoint: "/encrypt_pdf",
    icon: Lock,
    formFields: [
      {
        name: "password",
        type: "password",
        label: "Password",
        placeholder: "Create a strong password",
      },
    ],
  },
  decryptPdf: {
    id: "decryptPdf",
    label: "Decrypt PDF",
    title: "Unlock a PDF",
    description: "Remove password protection so the file is easy to open.",
    endpoint: "/decrypt_pdf",
    icon: Unlock,
    formFields: [
      {
        name: "password",
        type: "password",
        label: "Password",
        placeholder: "Enter the unlock password",
      },
    ],
  },
};

export const pdfToolSections = [
  {
    id: "page-management",
    title: "Page management",
    description: "Reorder, rotate, and organize every page in your document.",
    tools: ["addPage", "removePage", "duplicatePage", "rotateLeft", "rotateRight"],
  },
  {
    id: "content-enhancements",
    title: "Content enhancements",
    description: "Add new information, signatures, or branded visuals.",
    tools: ["addText", "addSignature", "addWatermark", "addStamp", "replaceText"],
  },
  {
    id: "document-workflows",
    title: "Document workflows",
    description: "Split, merge, and secure PDFs for easy collaboration.",
    tools: ["mergePdf", "splitPdf", "encryptPdf", "decryptPdf"],
  },
];

export const getToolById = (toolId) => pdfToolsConfig[toolId];

