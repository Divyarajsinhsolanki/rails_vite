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
      <button onClick={() => setActiveForm(null)} className="mb-4 flex items-center bg-gray-300 px-3 py-2 rounded shadow">
        <FaArrowLeft className="mr-2" /> Back
      </button>

      <h2 className="text-lg font-bold mb-4">{title}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {formFields.map((field, index) => (
          <input
            key={index}
            type={field.type}
            name={field.name}
            placeholder={field.placeholder}
            value={formData[field.name] || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ))}
        <input type="hidden" name="pdf_path" value={pdfPath} />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700">Submit</button>
      </form>
    </motion.div>
  );
};

export default FormComponent;
