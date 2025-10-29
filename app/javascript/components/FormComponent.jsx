import React, { useState } from "react";
import { motion } from "framer-motion";

const FormComponent = ({
  setActiveForm,
  setPdfUpdated,
  formFields = [],
  endpoint,
  title,
  pdfPath,
  description,
  icon: Icon,
}) => {
  const [formData, setFormData] = useState(
    formFields.reduce((acc, field) => ({ ...acc, [field.name]: "" }), { pdf_path: pdfPath })
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({ ...formData, pdf_path: pdfPath }),
      });

      if (!response.ok) throw new Error("Request failed");

      // Increment the counter so the viewer reloads the updated PDF
      setPdfUpdated((prev) => prev + 1);
      setActiveForm(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white p-6 shadow-lg shadow-blue-100/30">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        <div className="flex items-start gap-4">
          {Icon ? (
            <span className="mt-1 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Icon className="h-6 w-6" />
            </span>
          ) : null}
          <div>
            {title ? <h4 className="text-lg font-semibold text-gray-900">{title}</h4> : null}
            {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {formFields.map((field, index) => {
              const isFileField = field.type === "file";

              return (
                <label
                  key={index}
                  className={`group relative flex flex-col rounded-2xl border border-gray-200 bg-gray-50/60 p-4 text-sm transition-colors focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-md ${
                    isFileField ? "sm:col-span-2" : ""
                  }`}
                >
                  <span className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {field.label || field.placeholder}
                  </span>
                  <input
                    type={field.type}
                    name={field.name}
                    placeholder={field.placeholder}
                    value={isFileField ? undefined : formData[field.name] || ""}
                    onChange={handleChange}
                    className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                      isFileField ? "cursor-pointer file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white" : ""
                    }`}
                  />
                  {field.placeholder ? (
                    <span className="mt-2 text-xs text-gray-400">{field.placeholder}</span>
                  ) : null}
                </label>
              );
            })}
          </div>

          <input type="hidden" name="pdf_path" value={pdfPath} />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setActiveForm(null)}
              className="inline-flex items-center justify-center rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 transition hover:border-blue-200 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default FormComponent;
