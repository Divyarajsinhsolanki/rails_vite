import React, { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { motion } from "framer-motion";

const FormComponent = ({ setActiveForm, setPdfUpdated, formFields = [], endpoint, title, pdfPath }) => {
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

      setPdfUpdated((prev) => !prev);
      setActiveForm(null);
    } catch (error) {
      console.error(error);
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
        {formFields.map((field, index) => (
          <div key={index} className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              {field.label || field.placeholder}
            </label>
            <input
              type={field.type}
              name={field.name}
              placeholder={field.placeholder}
              value={field.type === "file" ? undefined : formData[field.name] || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
        <input type="hidden" name="pdf_path" value={pdfPath} />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700">Submit</button>
      </form>
    </motion.div>
  );
};

export default FormComponent;
