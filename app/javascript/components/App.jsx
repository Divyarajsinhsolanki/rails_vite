import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Home from "./Home";
import About from "./About";
import Footer from "./Footer";
import PdfPage from "./PdfPage";
import Signup from "../pages/Signup";
import Login from "../pages/Login";
import ProtectedRoute from "../components/ProtectedRoute";
import PostPage from "../pages/PostPage";
import Profile from "../components/Profile";

import "../stylesheets/application.css";

const App = () => {
  return (
    <Router>
      <AuthProvider> {/* ✅ Wrap the entire app with AuthProvider */}
        <div className="flex flex-col min-h-screen">

          {/* ✅ Navbar */}
          <Navbar />

          {/* ✅ Page Content */}
          <main className="pt-20 p-6 flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/view_pdf" element={<PdfPage />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/posts" element={<PostPage />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>

          {/* ✅ Footer */}
          <Footer />

        </div>
      </AuthProvider>
    </Router>
  );
};


// ✅ Mount React App
// const root = document.getElementById("root");
// if (root) {
//   createRoot(root).render(<App />);
// } else {
//   console.error("❌ Root element #root not found");
// }

export default App;
