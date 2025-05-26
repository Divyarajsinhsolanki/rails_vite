import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "./Footer";
import PdfPage from "./PdfPage";
import Signup from "../pages/Signup";
import Login from "../pages/Login";
import PostPage from "../pages/PostPage";
import Profile from "../components/Profile";
import TodoBoard from "../pages/TodoBoard";
import PdfEditor from '../pages/PdfEditor';
import KnowledgeDashboard from "../pages/KnowledgeDashboard";
import Scheduler from '../components/Scheduler/Scheduler';

import "../stylesheets/application.css";

function AuthLayout({ children }) {
  return <main className="flex-grow">{children}</main>;
}

function MainLayout({ children }) {
  return <main className="pt-20 pb-16 p-6 flex-grow">{children}</main>;
}
const App = () => {
  return (
    <Router>
      <AuthProvider> {/* ✅ Wrap the entire app with AuthProvider */}
        <div className="flex flex-col min-h-screen">

          {/* ✅ Navbar */}
          <Navbar />

          {/* ✅ Page Content */}
            <Routes>
              <Route path="/signup" element={<AuthLayout><Signup /></AuthLayout>} />
              <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
              <Route path="/" element={<MainLayout><PdfPage /></MainLayout>} />
              <Route path="/posts" element={<MainLayout><PostPage /></MainLayout>} />
              <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
              <Route path="/todo" element={<MainLayout><TodoBoard /></MainLayout>} />
              <Route path="/pdf_editor" element={<MainLayout><PdfEditor /></MainLayout>} />
              <Route path="/knowledge" element={<KnowledgeDashboard />} />
              <Route path="/scheduler" element={<Scheduler />} />
            </Routes>

          {/* ✅ Footer */}
          <Footer />

        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
