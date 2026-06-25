import React from "react";

export const Button = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="app-primary-button"
  >
    {children}
  </button>
);
