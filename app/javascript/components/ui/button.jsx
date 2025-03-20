import React from "react";

export const Button = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm"
  >
    {children}
  </button>
);