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
import Vault from "../pages/Vault";
import Legal from "../pages/Legal";
import SprintDashboard from "../pages/SprintDashboard";

const App = () => {
  return (
    <Router>
      <AuthProvider> {/* ✅ Wrap the entire app with AuthProvider */}
        <div className="flex flex-col min-h-screen">

          {/* ✅ Navbar */}
          <Navbar />

          {/* ✅ Page Content */}
            <Routes>
              <Route path="/contact" element={<Contact />} />
              <Route path="/legal" element={<Legal />} />

              {/* 🔐 Protected */}
              <Route path="/" element={<PrivateRoute><PostPage /></PrivateRoute>} />
              <Route path="/pdf" element={<PrivateRoute><PdfPage /></PrivateRoute>} />
              <Route path="/posts" element={<PrivateRoute><PostPage /></PrivateRoute>} />
              <Route path="/vault" element={<PrivateRoute><Vault /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/knowledge" element={<PrivateRoute><KnowledgeDashboard /></PrivateRoute>} />
              <Route path="/projects" element={<PrivateRoute allowedRoles={["owner","project_manager"]}><Projects /></PrivateRoute>} />
              <Route path="/teams" element={<PrivateRoute allowedRoles={["owner","team_leader"]}><Teams /></PrivateRoute>} />
              <Route path="/projects/:projectId/dashboard" element={<ProjectMemberRoute><SprintDashboard /></ProjectMemberRoute>} />
              <Route path="/users" element={<PrivateRoute ownerOnly><Users /></PrivateRoute>} />
              <Route path="/admin" element={<PrivateRoute ownerOnly><Admin /></PrivateRoute>} />
              </Routes>

          {/* ✅ Footer */}
          <Footer />

        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
