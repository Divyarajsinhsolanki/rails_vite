import React, { useState, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { AuthProvider } from "../context/AuthContext";
import PrivateRoute from "../components/PrivateRoute";

import Navbar from "../components/Navbar";
import Footer from "./Footer";
import PdfPage from "./PdfPage";
import Signup from "../pages/Signup";
import Login from "../pages/Login";
import PostPage from "../pages/PostPage";
import Profile from "../components/Profile";
import PdfEditor from '../pages/PdfEditor';
import KnowledgeDashboard from "../pages/KnowledgeDashboard";
import Admin from '../components/Admin/Admin';
import Users from "../pages/Users";
import Event from "../pages/Event";
import Ticket from "../pages/Ticket";
import Contact from "../pages/Contact";
import Weather from "../pages/Weather";
const Vault = lazy(() => import("../pages/Vault"));
import Legal from "../pages/Legal";
import SprintDashboard from "../pages/SprintDashboard";


function AuthLayout({ children }) {
  return <main className="flex-grow">{children}</main>;
}

function MainLayout({ children }) {
  return <main className="pt-20 pb-16 p-6 flex-grow">{children}</main>;
}
const App = () => {
  const [showVault, setShowVault] = useState(false);

  return (
    <Router>
      <AuthProvider> {/* ✅ Wrap the entire app with AuthProvider */}
        <div className="flex flex-col min-h-screen">

          {/* ✅ Navbar */}
          <Navbar toggleVault={() => setShowVault(v => !v)} />

          {/* ✅ Page Content */}
            <Routes>
              <Route path="/signup" element={<AuthLayout><Signup /></AuthLayout>} />
              <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
              <Route path="/event" element={<MainLayout><Event /></MainLayout>} />
              <Route path="/contact" element={<MainLayout><Contact /></MainLayout>} />
              <Route path="/weather" element={<MainLayout><Weather /></MainLayout>} />
              <Route path="/ticket" element={<MainLayout><Ticket /></MainLayout>} />
              <Route path="/legal" element={<MainLayout><Legal /></MainLayout>} />

              {/* 🔐 Protected */}
              <Route path="/" element={<PrivateRoute><MainLayout><PdfPage /></MainLayout></PrivateRoute>} />
              <Route path="/posts" element={<PrivateRoute><MainLayout><PostPage /></MainLayout></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><MainLayout><Profile /></MainLayout></PrivateRoute>} />
              <Route path="/pdf_editor" element={<PrivateRoute><MainLayout><PdfEditor /></MainLayout></PrivateRoute>} />
              <Route path="/knowledge" element={<PrivateRoute><MainLayout><KnowledgeDashboard /></MainLayout></PrivateRoute>} />
              <Route path="/sprint_dashboard" element={<PrivateRoute><MainLayout><SprintDashboard /></MainLayout></PrivateRoute>} />
              <Route path="/users" element={<PrivateRoute><MainLayout><Users /></MainLayout></PrivateRoute>} />
              <Route path="/admin" element={<PrivateRoute><MainLayout><Admin /></MainLayout></PrivateRoute>} />
              </Routes>

          {showVault && (
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-start pt-20 z-50 overflow-auto">
              <div className="bg-white w-full max-w-4xl mx-4 my-8 rounded shadow-lg relative">
                <button
                  onClick={() => setShowVault(false)}
                  className="absolute top-2 right-2 text-gray-500"
                >
                  &times;
                </button>
                <Suspense fallback={<div className='p-4'>Loading...</div>}>
                  <Vault />
                </Suspense>
              </div>
            </div>
          )}

          {/* ✅ Footer */}
          <Footer />

        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
