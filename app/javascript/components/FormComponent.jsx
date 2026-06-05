import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Download, ExternalLink, FileUp, Loader2, MapPin, X } from "lucide-react";
import { fetchWithTimeout } from "../utils/request";

const placementFieldNames = new Set(["x", "y", "page_number"]);
const MAX_PDF_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024;

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

const isBlank = (value) => value === undefined || value === null || String(value).trim() === "";

const withArtifactDownload = (url) => {
  if (!url) return "";

  try {
    const artifactUrl = new URL(url, window.location.origin);
    artifactUrl.searchParams.set("download", "1");
    return `${artifactUrl.pathname}${artifactUrl.search}`;
  } catch {
    return url.includes("?") ? `${url}&download=1` : `${url}?download=1`;
  }
};

const withPdfDownload = (url) => {
  if (!url) return "";

  try {
    const downloadUrl = new URL("/download_pdf", window.location.origin);
    downloadUrl.searchParams.set("pdf_path", url.split("?")[0]);
    return `${downloadUrl.pathname}${downloadUrl.search}`;
  } catch {
    return `/download_pdf?pdf_path=${encodeURIComponent(url.split("?")[0])}`;
  }
};

const normalizeArtifact = (artifact, index, fallbackType = "") => {
  const url = typeof artifact === "string" ? artifact : artifact?.url;
  if (!url) return null;

  const contentType = typeof artifact === "string" ? fallbackType : artifact.content_type || fallbackType;
  const downloadUrl = contentType === "application/pdf" ? withPdfDownload(url) : withArtifactDownload(url);
  const pageLabel = artifact?.page_number ? `Page ${artifact.page_number}` : `File ${index + 1}`;

  return {
    url,
    downloadUrl: artifact?.download_url || downloadUrl,
    filename: artifact?.filename || pageLabel,
    label: artifact?.label || pageLabel,
    contentType,
  };
};

const buildArtifacts = (data) => {
  if (Array.isArray(data.artifacts)) {
    return data.artifacts.map((artifact, index) => normalizeArtifact(artifact, index)).filter(Boolean);
  }

  const artifactUrls = Array.isArray(data.urls) ? data.urls : [];
  const fallbackArtifacts = artifactUrls.map((url, index) => normalizeArtifact(url, index)).filter(Boolean);

  if (data.url) {
    fallbackArtifacts.push(
      normalizeArtifact(
        {
          url: data.url,
          download_url: data.download_url,
          filename: data.filename,
          content_type: data.content_type,
          label: "Extracted text",
        },
        fallbackArtifacts.length,
        data.content_type || "text/plain"
      )
    );
  }

  return fallbackArtifacts;
};

const fieldDisplayName = (field) => field.label || field.placeholder || field.name;

const fileValidationError = (field, file) => {
  const accept = field.accept || "";
  const acceptsPdf = accept.includes("pdf");
  const maxSize = acceptsPdf ? MAX_PDF_FILE_SIZE_BYTES : MAX_IMAGE_FILE_SIZE_BYTES;
  const maxSizeLabel = acceptsPdf ? "50MB" : "10MB";

  if (file.size > maxSize) return `${fieldDisplayName(field)} must be ${maxSizeLabel} or smaller.`;

  if (acceptsPdf) {
    const validPdf = file.type === "application/pdf" || file.name?.toLowerCase().endsWith(".pdf");
    return validPdf ? "" : `${fieldDisplayName(field)} must be a PDF file.`;
  }

  if (accept.includes("image")) {
    const validImage = ["image/png", "image/jpeg"].includes(file.type) || /\.(png|jpe?g)$/i.test(file.name || "");
    return validImage ? "" : `${fieldDisplayName(field)} must be a PNG or JPG image.`;
  }

  return "";
};

const validateField = (field, value) => {
  const required = field.required !== false;
  const label = fieldDisplayName(field);

  if (field.type === "file") {
    if (!value) return required ? `${label} is required.` : "";
    return fileValidationError(field, value);
  }

  if (required && isBlank(value)) return `${label} is required.`;
  if (!required && isBlank(value)) return "";

  if (field.type === "number") {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return `${label} must be a valid number.`;

    if (field.min !== undefined && numericValue < Number(field.min)) {
      return `${label} must be at least ${field.min}.`;
    }

    if (field.max !== undefined && numericValue > Number(field.max)) {
      return `${label} must be ${field.max} or less.`;
    }
  }

  if (field.minLength !== undefined && String(value).length < Number(field.minLength)) {
    return `${label} must be at least ${field.minLength} characters.`;
  }

  if (field.maxLength !== undefined && String(value).length > Number(field.maxLength)) {
    return `${label} must be ${field.maxLength} characters or fewer.`;
  }

  return "";
};

const validateFormData = (formFields, formData) => {
  for (const field of formFields) {
    const error = validateField(field, formData[field.name]);
    if (error) return error;
  }

  if ("start_page" in formData && "end_page" in formData) {
    const startPage = Number(formData.start_page);
    const endPage = Number(formData.end_page);
    if (Number.isFinite(startPage) && Number.isFinite(endPage) && endPage < startPage) {
      return "End Page must be greater than or equal to Start Page.";
    }
  }

  return "";
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
    () => formFields.reduce((acc, field) => ({ ...acc, [field.name]: field.defaultValue ?? "" }), { pdf_path: pdfPath }),
    [formFields, pdfPath]
  );
  const [formData, setFormData] = useState(initialFormData);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resultArtifacts, setResultArtifacts] = useState([]);
  const [extractedText, setExtractedText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const hasPlacementFields = formFields.some((field) => placementFieldNames.has(field.name));

  useEffect(() => {
    setFormData(initialFormData);
    setErrorMessage("");
    setSuccessMessage("");
    setResultArtifacts([]);
    setExtractedText("");
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
    setSuccessMessage("");
    setResultArtifacts([]);
    setExtractedText("");

    const validationError = validateFormData(formFields, formData);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const request = buildRequest();
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          ...(request.headers || {}),
          ...getCsrfHeaders(),
        },
        body: request.body,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Request failed");

      const pdfUrls = Array.isArray(data.pdf_urls) ? data.pdf_urls : [];
      const artifactUrls = Array.isArray(data.urls) ? data.urls : [];
      const artifacts = buildArtifacts(data);
      const nextPdfUrl = data.pdf_url || pdfUrls[0];
      if (nextPdfUrl && setPdfUrl) {
        setPdfUrl(nextPdfUrl);
        writeStorage("pdfUrl", nextPdfUrl);
      }

      setPdfUpdated((prev) => prev + 1);
      if (typeof data.text === "string") {
        setSuccessMessage(data.message || "Text extracted successfully.");
        setExtractedText(data.text);
        setResultArtifacts(artifacts);
        return;
      }

      if (pdfUrls.length > 1 || artifactUrls.length || data.url || artifacts.length) {
        setSuccessMessage(data.message || "PDF action completed.");
        setResultArtifacts(
          pdfUrls.length > 1
            ? pdfUrls.map((url, index) => normalizeArtifact(url, index, "application/pdf")).filter(Boolean)
            : artifacts
        );
        return;
      }

      setActiveForm(null);
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field, index) => {
    const baseInputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";
    const value = formData[field.name] || "";

    return (
      <div key={index} className={`flex flex-col ${field.type === "textarea" ? "md:col-span-2" : ""}`}>
        <label className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
          {field.label || field.placeholder}
        </label>
        {field.type === "textarea" ? (
          <textarea
            name={field.name}
            rows={3}
            required={field.required !== false}
            placeholder={field.placeholder}
            minLength={field.minLength}
            maxLength={field.maxLength}
            value={value}
            onChange={handleChange}
            disabled={submitting}
            className={`${baseInputClass} resize-none`}
          />
        ) : field.type === "select" ? (
          <select
            name={field.name}
            required={field.required !== false}
            value={value}
            onChange={handleChange}
            disabled={submitting}
            className={baseInputClass}
          >
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={field.type}
            name={field.name}
            min={field.min}
            max={field.max}
            step={field.step || (field.type === "number" ? "1" : undefined)}
            minLength={field.minLength}
            maxLength={field.maxLength}
            accept={field.accept}
            required={field.required !== false}
            placeholder={field.placeholder}
            value={field.type === "file" ? undefined : value}
            onChange={handleChange}
            disabled={submitting}
            className={`${baseInputClass} ${field.type === "file" ? "cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-indigo-700 hover:file:bg-indigo-100" : ""} ${field.type === "color" ? "h-10 p-1" : ""}`}
          />
        )}
      </div>
    );
  };

  return (
    <motion.div
      className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              {hasPlacementFields ? <MapPin className="h-4 w-4" /> : <FileUp className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">
                {hasPlacementFields
                  ? "Drag the marker on the PDF or refine the placement values here."
                  : "Set the values for this PDF action and apply it to the current file."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveForm(null)}
            disabled={submitting}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {formFields.map(renderField)}
        </div>

        {errorMessage && (
          <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{errorMessage}</p>
        )}

        {successMessage && (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
            <p className="font-bold">{successMessage}</p>
            {extractedText && (
              <textarea
                readOnly
                value={extractedText}
                className="mt-3 h-44 w-full resize-y rounded-lg border border-emerald-200 bg-white p-3 font-mono text-xs leading-relaxed text-slate-700 outline-none"
              />
            )}
            {resultArtifacts.length > 0 && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {resultArtifacts.map((artifact, index) => {
                  const isImage = artifact.contentType?.startsWith("image/");
                  const label = artifact.label || artifact.filename || `File ${index + 1}`;

                  return (
                    <div key={`${artifact.url}-${index}`} className="rounded-lg border border-emerald-200 bg-white p-2">
                      {isImage && (
                        <a href={artifact.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border border-slate-100 bg-slate-50">
                          <img src={artifact.url} alt={artifact.filename || label} className="h-32 w-full object-contain" />
                        </a>
                      )}
                      <p className="mt-2 truncate text-xs font-bold text-slate-700" title={artifact.filename || label}>
                        {artifact.filename || label}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <a
                          href={artifact.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-md border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-bold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                        >
                          Open
                          <ExternalLink className="ml-1.5 h-3 w-3" />
                        </a>
                        <a
                          href={artifact.downloadUrl}
                          download={artifact.filename}
                          className="inline-flex items-center rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                        >
                          Download
                          <Download className="ml-1.5 h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <input type="hidden" name="pdf_path" value={pdfPath} />
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => setActiveForm(null)}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Apply {title}
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default FormComponent;
