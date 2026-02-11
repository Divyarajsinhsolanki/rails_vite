import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

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
import IssueTracker from "../pages/IssueTracker";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import WorkLog from "../pages/WorkLog";
import Settings from "../pages/Settings";
import PageTitle from "./PageTitle";
import Calendar from "../pages/Calendar";
import PageLoader from "./ui/PageLoader";

const RouteTransitionLoader = ({ children }) => {
  const location = useLocation();
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  useEffect(() => {
    setIsRouteLoading(true);
    const timer = setTimeout(() => setIsRouteLoading(false), 350);
    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  return (
    <>
      {isRouteLoading ? <PageLoader title="Opening page" message="Just a moment while we load everything…" overlay /> : null}
      {children}
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider> {/* ✅ Wrap the entire app with AuthProvider */}
        <PageTitle />
        <div className="flex flex-col min-h-screen">

          {/* ✅ Navbar */}
          <Navbar />

          {/* ✅ Page Content */}
          <RouteTransitionLoader>
            <Routes>
              <Route path="/contact" element={<Contact />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/projects/:projectId/issues" element={<ProjectMemberRoute><IssueTracker standalone /></ProjectMemberRoute>} />

              {/* 🔐 Protected */}
              <Route path="/" element={<PrivateRoute><Calendar /></PrivateRoute>} />
              <Route path="/momentum" element={<Navigate to="/calendar" replace />} />
              <Route path="/pdf" element={<PrivateRoute><PdfPage /></PrivateRoute>} />
              <Route path="/posts" element={<PrivateRoute><PostPage /></PrivateRoute>} />
              <Route path="/vault" element={<PrivateRoute><Vault /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/knowledge" element={<PrivateRoute><KnowledgeDashboard /></PrivateRoute>} />
              <Route path="/worklog" element={<PrivateRoute><WorkLog /></PrivateRoute>} />
              <Route path="/calendar" element={<PrivateRoute><Calendar /></PrivateRoute>} />
              <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
              <Route path="/teams" element={<PrivateRoute><Teams /></PrivateRoute>} />
              <Route path="/projects/:projectId/dashboard" element={<ProjectMemberRoute><SprintDashboard /></ProjectMemberRoute>} />
              <Route path="/users" element={<PrivateRoute ownerOnly><Users /></PrivateRoute>} />
              <Route path="/admin" element={<PrivateRoute ownerOnly><Admin /></PrivateRoute>} />
              <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            </Routes>
          </RouteTransitionLoader>

          {/* ✅ Footer */}
          <Footer />

        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
