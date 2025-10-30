import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import { AuthProvider, AuthContext } from "../context/AuthContext";
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
import WorkLog from "../pages/WorkLog";
import Settings from "../pages/Settings";
import PageTitle from "./PageTitle";

const LandingHero = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const location = useLocation();

  if (isAuthenticated || location.pathname !== "/") {
    return null;
  }

  return (
    <section className="bg-slate-950 py-24 sm:py-32 text-white">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Welcome to My Rails + Vite + React App
        </h1>
        <p className="text-lg text-slate-200 sm:text-xl">
          Build, collaborate, and ship faster with our integrated toolkit for modern product teams.
        </p>
        <div>
          <a
            href="/posts"
            className="inline-flex items-center rounded-full bg-blue-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </section>
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

          <LandingHero />

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
            <Route path="/worklog" element={<PrivateRoute><WorkLog /></PrivateRoute>} />
            <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
            <Route path="/teams" element={<PrivateRoute><Teams /></PrivateRoute>} />
            <Route path="/projects/:projectId/dashboard" element={<ProjectMemberRoute><SprintDashboard /></ProjectMemberRoute>} />
            <Route path="/users" element={<PrivateRoute ownerOnly><Users /></PrivateRoute>} />
            <Route path="/admin" element={<PrivateRoute ownerOnly><Admin /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          </Routes>

          {/* ✅ Footer */}
          <Footer />

        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
