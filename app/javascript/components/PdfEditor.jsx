import React, { useState } from "react";
import {
  FaPlus, FaTrash, FaFont, FaSignature, FaTint, FaStamp,
  FaUndo, FaRedo, FaCompress, FaExpand, FaLock, FaUnlock
} from "react-icons/fa";

const PdfEditor = ({ setPdfUpdated }) => {
  const [pdf_path, setPdfPath] = useState('');
  const [formData, setFormData] = useState({ text: "", x: "", y: "", page: "" });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [popup, setPopup] = useState(null);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 1000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    handleAction("/add_text", "Text added!", "Failed to add text", formData);
    setPopup(null);
  };

  const handleAction = async (endpoint, successMessage, errorMessage, body = {}) => {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error(errorMessage);

      showMessage(successMessage, "success");
      setPdfUpdated((prev) => !prev);
    } catch (error) {
      showMessage(errorMessage, "error");
    }
  };

  const actions = [
    { label: "Add Page", icon: <FaPlus />, action: () => handleAction("/add_page", "Page added!", "Failed to add page") },
    { label: "Remove Page", icon: <FaTrash />, action: () => handleAction("/remove_page", "Page removed!", "Failed to remove page") },
    { label: "Add Text", icon: <FaFont />, action: () => setPopup("addText") },
    { label: "Sign", icon: <FaSignature />, action: () => handleAction("/add_signature", "Signature added!", "Failed to add signature") },
    { label: "Add Watermark", icon: <FaTint />, action: () => handleAction("/add_watermark", "Watermark added!", "Failed to add watermark") },
    { label: "Add Stamp", icon: <FaStamp />, action: () => handleAction("/add_stamp", "Stamp added!", "Failed to add stamp") },
    { label: "Rotate Left", icon: <FaUndo />, action: () => handleAction("/rotate_left", "Rotated left!", "Failed to rotate") },
    { label: "Rotate Right", icon: <FaRedo />, action: () => handleAction("/rotate_right", "Rotated right!", "Failed to rotate") },
    { label: "Merge PDFs", icon: <FaCompress />, action: () => handleAction("/merge_pdf", "PDFs merged!", "Failed to merge") },
    { label: "Split PDF", icon: <FaExpand />, action: () => handleAction("/split_pdf", "PDF split!", "Failed to split") },
    { label: "Encrypt PDF", icon: <FaLock />, action: () => handleAction("/encrypt_pdf", "PDF encrypted!", "Failed to encrypt") },
    { label: "Decrypt PDF", icon: <FaUnlock />, action: () => handleAction("/decrypt_pdf", "PDF decrypted!", "Failed to decrypt") },
  ];

  return (
    <div className="flex flex-col items-center p-4">
      {message.text && (
        <div className={`p-2 text-white text-center rounded ${message.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-100 rounded-lg">
        {actions.map((btn, index) => (
          <button
            key={index}
            onClick={btn.action}
            className="flex items-center justify-center gap-2 p-3 bg-white shadow-md rounded-lg hover:bg-gray-200 transition"
          >
            {btn.icon} {btn.label}
          </button>
        ))}
      </div>

      {popup === "addText" && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-lg font-bold mb-2">Add Text</h2>
            <form onSubmit={handleSubmit} className="space-y-2">
              <input type="text" name="text" placeholder="Text" value={formData.text} onChange={handleChange} className="w-full p-2 border rounded" />
              <input type="number" name="x" placeholder="X Position" value={formData.x} onChange={handleChange} className="w-full p-2 border rounded" />
              <input type="number" name="y" placeholder="Y Position" value={formData.y} onChange={handleChange} className="w-full p-2 border rounded" />
              <input type="number" name="page" placeholder="Page Number" value={formData.page} onChange={handleChange} className="w-full p-2 border rounded" />
              <div className="flex justify-between">
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Submit</button>
                <button onClick={() => setPopup(null)} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfEditor;
