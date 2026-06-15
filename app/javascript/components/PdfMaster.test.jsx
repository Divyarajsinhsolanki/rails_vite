// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react-pdf", () => ({
  Document: ({ children }) => <div>{children}</div>,
  Page: () => <div>PDF page</div>,
  pdfjs: { GlobalWorkerOptions: {} },
}));

vi.mock("@hello-pangea/dnd", () => ({
  DragDropContext: ({ children }) => <div>{children}</div>,
  Droppable: ({ children }) => children({ innerRef: vi.fn(), droppableProps: {}, placeholder: null }),
  Draggable: ({ children }) => children({ innerRef: vi.fn(), draggableProps: {}, dragHandleProps: {} }, {}),
}));

vi.mock("react-dropzone", () => ({
  useDropzone: () => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
    isDragActive: false,
    open: vi.fn(),
  }),
}));

vi.mock("./api", () => ({
  fetchPdfDocuments: vi.fn(() => Promise.resolve({
    data: {
      documents: [],
      usage: {
        document_count: 0,
        document_limit: 25,
        storage_bytes: 0,
        storage_limit_bytes: 1073741824,
      },
    },
  })),
  createPdfDocumentOperation: vi.fn(),
  deletePdfDocument: vi.fn(),
  fetchPdfDocumentOperation: vi.fn(),
  redoPdfDocument: vi.fn(),
  renamePdfDocument: vi.fn(),
  restorePdfDocument: vi.fn(),
  undoPdfDocument: vi.fn(),
  uploadPdfDocument: vi.fn(),
}));

vi.mock("../context/AuthContext", async () => {
  const ReactModule = await import("react");
  return { AuthContext: ReactModule.createContext({ user: null }) };
});

import { AuthContext } from "../context/AuthContext";
import PdfMaster from "./PdfMaster";

describe("PdfMaster", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the persistent-library empty state", async () => {
    render(
      <AuthContext.Provider value={{ user: { id: 1, demo_account: false } }}>
        <PdfMaster />
      </AuthContext.Provider>
    );

    expect(await screen.findByText("Add your first PDF")).toBeTruthy();
    expect(screen.getByText("Documents stay in your personal library until you delete them.")).toBeTruthy();
  });
});
