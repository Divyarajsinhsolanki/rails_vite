import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-white shadow-t border-t border-gray-200 w-full mt-auto">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-6 py-3 text-sm text-gray-600">
        <p className="text-center md:text-left">
          &copy; {new Date().getFullYear()} <span className="text-indigo-700 font-medium">Work board</span>. All rights reserved.
        </p>
        <div className="flex mt-2 md:mt-0 space-x-4">
          <Link to="/legal" className="hover:text-indigo-600 transition">
            Privacy & Terms
          </Link>
          <Link to="/contact" className="hover:text-indigo-600 transition">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
