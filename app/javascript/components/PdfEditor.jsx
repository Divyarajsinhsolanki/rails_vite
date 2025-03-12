import React, { useState } from "react";

const PdfEditor = ({setPdfUpdated}) => {
  const [formData, setFormData] = useState({ text: "", x: "", y: "", page: "" });
  const [message, setMessage] = useState({ text: "", type: "" });

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 1000);
  };

  const handleChange = (e) => {
     setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch("/modify_pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({ pdf_data: formData }),
      });

      if (!response.ok) throw new Error("Failed to update PDF");

      showMessage("PDF updated successfully!", "success");
      setFormData({ text: "", x: "", y: "", page: "" }); // Clear form after submission
      setPdfUpdated((prev) => !prev); // Trigger PDF reload

    } catch (error) {
      showMessage("Error updating PDF", "error");
    }
  };

  const handleAddPage = async () => {
    try {
      const response = await fetch("/add_page", {
        method: "POST",
        headers: {
          "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content,
        },
      });

      if (!response.ok) throw new Error("Failed to add page");

      showMessage("Page added successfully!", "success");
      setPdfUpdated((prev) => !prev);

    } catch (error) {
      showMessage("Error adding page", "error");
    }
  };

  const handleRemovePage = async () => {
    try {
      const response = await fetch("/remove_page", {
        method: "POST",
        headers: {
          "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content,
        },
      });

      if (!response.ok) throw new Error("Failed to remove page");

      showMessage("Page removed successfully!", "success");
      setPdfUpdated((prev) => !prev);

    } catch (error) {
      showMessage("Error removing page", "error");
    }
  };

  return (
    <div className="flex">
      <div className="w-1/2 p-4">
        {/* Message Display */}
        {message.text && (
          <div className={`p-2 text-white text-center rounded ${message.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="text" placeholder="Text to add" value={formData.text} onChange={handleChange} className="w-full p-2 border rounded"/>
          <input type="number" name="x" placeholder="X Position" value={formData.x} onChange={handleChange} className="w-full p-2 border rounded"/>
          <input type="number" name="y" placeholder="Y Position" value={formData.y} onChange={handleChange} className="w-full p-2 border rounded"/>
          <input type="number" name="page" placeholder="Page Number" value={formData.page} onChange={handleChange} className="w-full p-2 border rounded"/>

          <button type="submit" className="!bg-blue-500 !text-white !px-4 !py-2 !rounded !shadow-md">
            Submit
          </button>
        </form>

        <div className="mt-4">
          <button onClick={handleAddPage} className="bg-green-500 text-white px-4 py-2 rounded mr-2">
            Add Page
          </button>
          <button onClick={handleRemovePage} className="bg-red-500 text-white px-4 py-2 rounded">
            Remove Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfEditor;
