import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { AuthProvider } from "../context/AuthContext";
import PrivateRoute from "../components/PrivateRoute";
import ProjectMemberRoute from "../components/ProjectMemberRoute";

import Navbar from "../components/Navbar";
import Footer from "./Footer";
import PdfPage from "./PdfPage";
import PostPage from "../pages/PostPage";
import Profile from "../components/Profile";
import KnowledgeDashboard from "../pages/KnowledgeDashboard";
import Admin from '../components/Admin/Admin';
import Users from "../pages/Users";
import Teams from "../pages/Teams";
import Projects from "../pages/Projects";
import Contact from "../pages/Contact";
import Weather from "../pages/Weather";
import Vault from "../pages/Vault";
import Legal from "../pages/Legal";
import SprintDashboard from "../pages/SprintDashboard";


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
              <Route path="/contact" element={<MainLayout><Contact /></MainLayout>} />
              <Route path="/weather" element={<MainLayout><Weather /></MainLayout>} />
              <Route path="/legal" element={<MainLayout><Legal /></MainLayout>} />

              {/* 🔐 Protected */}
              <Route path="/" element={<PrivateRoute><MainLayout><PdfPage /></MainLayout></PrivateRoute>} />
              <Route path="/posts" element={<PrivateRoute><MainLayout><PostPage /></MainLayout></PrivateRoute>} />
              <Route path="/vault" element={<PrivateRoute><MainLayout><Vault /></MainLayout></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><MainLayout><Profile /></MainLayout></PrivateRoute>} />
              <Route path="/knowledge" element={<PrivateRoute><MainLayout><KnowledgeDashboard /></MainLayout></PrivateRoute>} />
              <Route path="/projects" element={<PrivateRoute><MainLayout><Projects /></MainLayout></PrivateRoute>} />
              <Route path="/teams" element={<PrivateRoute><MainLayout><Teams /></MainLayout></PrivateRoute>} />
              <Route path="/projects/:projectId/dashboard" element={<ProjectMemberRoute><MainLayout><SprintDashboard /></MainLayout></ProjectMemberRoute>} />
              <Route path="/users" element={<PrivateRoute ownerOnly><MainLayout><Users /></MainLayout></PrivateRoute>} />
              <Route path="/admin" element={<PrivateRoute ownerOnly><MainLayout><Admin /></MainLayout></PrivateRoute>} />
              </Routes>

          {/* ✅ Footer */}
          <Footer />

        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
