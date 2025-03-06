import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { NavLink } from "react-router-dom";
import Home from "./Home";
import About from "./About";
import Footer from "./Footer";
import PdfViewer from "./PdfViewer";
import PdfEditor from "./PdfEditor";
import PdfPage from "./PdfPage";
import { AuthProvider } from "../context/AuthContext";
import Signup from "../pages/Signup";
import Login from "../pages/Login";

import "../stylesheets/application.css";

const App = () => {
  return (
    <AuthProvider> {/* ✅ Wrap the entire app with AuthProvider */}
      <Router>
        <div className="flex flex-col min-h-screen">
          {/* ✅ Navbar */}
          <header className="bg-gray-900 text-white shadow-lg fixed top-0 w-full z-50">
            <div className="container mx-auto flex justify-between items-center p-4">
              <h1 className="text-xl font-bold">MyApp</h1>
              <nav className="flex space-x-6">
                <NavLink 
                  to="/" 
                  className={({ isActive }) => 
                    `px-3 py-2 rounded-md text-lg ${isActive ? "bg-gray-700" : "hover:bg-gray-800"}`
                  }
                >
                  Home
                </NavLink>
                <NavLink 
                  to="/about" 
                  className={({ isActive }) => 
                    `px-3 py-2 rounded-md text-lg ${isActive ? "bg-gray-700" : "hover:bg-gray-800"}`
                  }
                >
                  About
                </NavLink>
                <NavLink to="/view_pdf" className="px-3 py-2 rounded-md text-lg hover:bg-gray-800">
                  View PDF
                </NavLink>
              </nav>
            </div>
          </header>

          {/* ✅ Page Content */}
          <main className="pt-20 p-6 flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/view_pdf" element={<PdfPage />} />
              <Route path="/pdf-editor" element={<PdfEditor />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </main>

          {/* ✅ Footer */}
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};


// ✅ Mount React App
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
} else {
  console.error("❌ Root element #root not found");
}

export default App;
