import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const placementFieldNames = new Set(["x", "y", "page_number"]);

const getCsrfHeaders = () => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  return csrfToken ? { "X-CSRF-Token": csrfToken } : {};
};

const writeStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`localStorage write failed for ${key}:`, error);
  }
};

const FormComponent = ({
  setActiveForm,
  setPdfUpdated,
  setPdfUrl,
  formFields = [],
  endpoint,
  title,
  pdfPath,
  placementCoordinates,
  setPlacementCoordinates,
}) => {
  const initialFormData = useMemo(
    () => formFields.reduce((acc, field) => ({ ...acc, [field.name]: "" }), { pdf_path: pdfPath }),
    [formFields, pdfPath]
  );
  const [formData, setFormData] = useState(initialFormData);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const hasPlacementFields = formFields.some((field) => placementFieldNames.has(field.name));

  useEffect(() => {
    setFormData((prev) => ({ ...initialFormData, ...prev, pdf_path: pdfPath }));
  }, [initialFormData, pdfPath]);

  useEffect(() => {
    if (!placementCoordinates) return;

    setFormData((prev) => {
      const next = { ...prev };

      if (placementCoordinates.x !== undefined && "x" in next) {
        next.x = Math.round(placementCoordinates.x);
      }

      if (placementCoordinates.y !== undefined && "y" in next) {
        next.y = Math.round(placementCoordinates.y);
      }

      if (placementCoordinates.pageNumber !== undefined && "page_number" in next) {
        next.page_number = placementCoordinates.pageNumber;
      }

      return next;
    });
  }, [placementCoordinates]);

  const updatePlacementFromForm = (name, value) => {
    if (!placementFieldNames.has(name) || !setPlacementCoordinates) return;

    const numericValue = Number(value);
    if (value === "" || Number.isNaN(numericValue)) return;

    setPlacementCoordinates((previous) => ({
      ...(previous || {}),
      [name === "page_number" ? "pageNumber" : name]: numericValue,
    }));
  };

  const handleChange = (e) => {
    const { name, type, files, value } = e.target;
    const nextValue = type === "file" ? files?.[0] || null : value;

    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    updatePlacementFromForm(name, value);
  };

  const buildRequest = () => {
    const hasFile = formFields.some((field) => field.type === "file" && formData[field.name]);

    if (hasFile) {
      const multipart = new FormData();
      Object.entries({ ...formData, pdf_path: pdfPath }).forEach(([key, value]) => {
        if (value !== undefined && value !== null) multipart.append(key, value);
      });

      return { body: multipart };
    }

    return {
      body: JSON.stringify({ ...formData, pdf_path: pdfPath }),
      headers: { "Content-Type": "application/json" },
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSubmitting(true);

    try {
      const request = buildRequest();
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          ...(request.headers || {}),
          ...getCsrfHeaders(),
        },
        body: request.body,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Request failed");

      if (data.pdf_url && setPdfUrl) {
        setPdfUrl(data.pdf_url);
        writeStorage("pdfUrl", data.pdf_url);
      }

      setPdfUpdated((prev) => prev + 1);
      setActiveForm(null);
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="w-full bg-white p-6 rounded shadow-lg"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          {hasPlacementFields && (
            <p className="text-xs text-gray-500">
              Drag the marker on the PDF or type X/Y/page values here. Both controls stay in sync.
            </p>
          )}
        </div>

        {formFields.map((field, index) => (
          <div key={index} className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              {field.label || field.placeholder}
            </label>
            <input
              type={field.type}
              name={field.name}
              min={field.min}
              max={field.max}
              step={field.step || (field.type === "number" ? "1" : undefined)}
              placeholder={field.placeholder}
              value={field.type === "file" ? undefined : formData[field.name] || ""}
              onChange={handleChange}
              disabled={submitting}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}

        {errorMessage && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
        )}

        <input type="hidden" name="pdf_path" value={pdfPath} />
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Applying...
            </>
          ) : (
            "Apply"
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default FormComponent;
