import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";

import { AuthProvider } from "../context/AuthContext";
import PrivateRoute from "../components/PrivateRoute";
import ProjectMemberRoute from "../components/ProjectMemberRoute";

import Navbar from "../components/Navbar";
import Footer from "./Footer";
import PdfPage from "./PdfPage";
import PostPage from "../pages/PostPage";
import Profile from "../components/Profile";
import KnowledgeDashboard from "../pages/KnowledgeDashboard";
import Admin from "../components/Admin/Admin";
import Users from "../pages/Users";
import Teams from "../pages/Teams";
import Projects from "../pages/Projects";
import Contact from "../pages/Contact";
import Vault from "../pages/Vault";
import Legal from "../pages/Legal";
import SprintDashboard from "../pages/SprintDashboard";
import IssueTracker from "../pages/IssueTracker";
import DailyMomentumHub from "../pages/DailyMomentumHub";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import WorkLog from "../pages/WorkLog";
import Settings from "../pages/Settings";
import PageTitle from "./PageTitle";
import Calendar from "../pages/Calendar";
import AdminImpersonation from "../pages/AdminImpersonation";
import Departments from "../pages/Departments";
import DepartmentDetails from "../pages/DepartmentDetails";
import PageLoader from "./ui/PageLoader";
import Chat from "../pages/Chat";
import Notifications from "../pages/Notifications";
import ChatLauncher from "./ChatLauncher";

const routeTransitionProps = {
  initial: { opacity: 0, y: 18, scale: 0.992, filter: "blur(12px)" },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.48,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const RouteTransitionLoader = ({ children }) => {
  const location = useLocation();
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  useEffect(() => {
    setIsRouteLoading(true);
    const timer = setTimeout(() => setIsRouteLoading(false), 420);
    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  return (
    <>
      <AnimatePresence>
        {isRouteLoading ? (
          <motion.div
            key={`route-loader-${location.pathname}${location.search}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <PageLoader
              title="Switching Views"
              message="Rebuilding the workspace for this screen..."
              overlay
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
      {children}
    </>
  );
};

const AppRoutes = () => {
  const location = useLocation();
  const routeKey = `${location.pathname}${location.search}`;

  return (
    <RouteTransitionLoader>
      <motion.div key={routeKey} className="shell-route-frame" {...routeTransitionProps}>
        <Routes location={location}>
          <Route path="/contact" element={<Contact />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/projects/:projectId/issues"
            element={
              <ProjectMemberRoute>
                <IssueTracker standalone />
              </ProjectMemberRoute>
            }
          />

          <Route
            path="/"
            element={
              <PrivateRoute>
                <Calendar />
              </PrivateRoute>
            }
          />
          <Route
            path="/momentum"
            element={
              <PrivateRoute>
                <DailyMomentumHub />
              </PrivateRoute>
            }
          />
          <Route
            path="/pdf"
            element={
              <PrivateRoute>
                <PdfPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/posts"
            element={
              <PrivateRoute>
                <PostPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/vault"
            element={
              <PrivateRoute>
                <Vault />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile/:userId"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/knowledge"
            element={
              <PrivateRoute>
                <KnowledgeDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/worklog"
            element={
              <PrivateRoute>
                <WorkLog />
              </PrivateRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <PrivateRoute>
                <Calendar />
              </PrivateRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <PrivateRoute>
                <Projects />
              </PrivateRoute>
            }
          />
          <Route
            path="/teams"
            element={
              <PrivateRoute>
                <Teams />
              </PrivateRoute>
            }
          />
          <Route
            path="/projects/:projectId/dashboard"
            element={
              <ProjectMemberRoute>
                <SprintDashboard />
              </ProjectMemberRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <Users />
              </PrivateRoute>
            }
          />
          <Route
            path="/departments"
            element={
              <PrivateRoute>
                <Departments />
              </PrivateRoute>
            }
          />
          <Route
            path="/departments/:id"
            element={
              <PrivateRoute>
                <DepartmentDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute ownerOnly>
                <Admin />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/login-as-user"
            element={
              <PrivateRoute ownerOnly>
                <AdminImpersonation />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            }
          />
          <Route
            path="/chat/:conversationId"
            element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <PrivateRoute>
                <Notifications />
              </PrivateRoute>
            }
          />
        </Routes>
      </motion.div>
    </RouteTransitionLoader>
  );
};

const AppShell = () => (
  <div className="shell-app flex min-h-screen flex-col">
    <div className="shell-backdrop" aria-hidden="true">
      <div className="shell-orb shell-orb-one" />
      <div className="shell-orb shell-orb-two" />
      <div className="shell-orb shell-orb-three" />
      <div className="shell-rings" />
    </div>

    <Navbar />

    <main className="shell-main">
      <div className="shell-main-stage">
        <AppRoutes />
      </div>
    </main>

    <ChatLauncher />
    <Footer />
  </div>
);

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3200,
            style: {
              border: "1px solid rgba(255, 255, 255, 0.75)",
              borderRadius: "20px",
              background: "rgba(15, 23, 42, 0.92)",
              color: "#f8fbff",
              boxShadow: "0 24px 64px rgba(15, 23, 42, 0.24)",
              backdropFilter: "blur(18px)",
            },
            success: {
              iconTheme: {
                primary: "#67e8f9",
                secondary: "#0f172a",
              },
            },
            error: {
              iconTheme: {
                primary: "#fb7185",
                secondary: "#ffffff",
              },
            },
          }}
        />
        <PageTitle />
        <AppShell />
      </AuthProvider>
    </Router>
  );
};

export default App;
