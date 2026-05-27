import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";

import { AuthProvider } from "../context/AuthContext";
import PrivateRoute from "../components/PrivateRoute";
import ProjectMemberRoute from "../components/ProjectMemberRoute";

import Navbar from "../components/Navbar";
import Footer from "./Footer";
import PageTitle from "./PageTitle";
import PageLoader from "./ui/PageLoader";
import ChatLauncher from "./ChatLauncher";

const Admin = lazy(() => import("../components/Admin/Admin"));
const AdminImpersonation = lazy(() => import("../pages/AdminImpersonation"));
const Calendar = lazy(() => import("../pages/Calendar"));
const Chat = lazy(() => import("../pages/Chat"));
const Contact = lazy(() => import("../pages/Contact"));
const DailyMomentumHub = lazy(() => import("../pages/DailyMomentumHub"));
const DepartmentDetails = lazy(() => import("../pages/DepartmentDetails"));
const Departments = lazy(() => import("../pages/Departments"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const IssueTracker = lazy(() => import("../pages/IssueTracker"));
const KnowledgeDashboard = lazy(() => import("../pages/KnowledgeDashboard"));
const Legal = lazy(() => import("../pages/Legal"));
const MetaverseLanding = lazy(() => import("../pages/MetaverseLanding"));
const Notifications = lazy(() => import("../pages/Notifications"));
const ObjectGallery = lazy(() => import("../pages/ObjectGallery"));
const PdfPage = lazy(() => import("./PdfPage"));
const PostPage = lazy(() => import("../pages/PostPage"));
const Profile = lazy(() => import("../components/Profile"));
const ProjectMetaverse = lazy(() => import("../pages/ProjectMetaverse"));
const Projects = lazy(() => import("../pages/Projects"));
const ResetPassword = lazy(() => import("../pages/ResetPassword"));
const Settings = lazy(() => import("../pages/Settings"));
const SprintDashboard = lazy(() => import("../pages/SprintDashboard"));
const Teams = lazy(() => import("../pages/Teams"));
const Users = lazy(() => import("../pages/Users"));
const Vault = lazy(() => import("../pages/Vault"));
const WorkLog = lazy(() => import("../pages/WorkLog"));

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
  const startTimeRef = useRef(Date.now());
  const hideTimerRef = useRef(null);

  useEffect(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    setIsRouteLoading(true);
    startTimeRef.current = Date.now();

    hideTimerRef.current = setTimeout(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const minDelay = Math.max(150 - elapsed, 0);

      if (minDelay === 0) {
        setIsRouteLoading(false);
        return;
      }

      hideTimerRef.current = setTimeout(() => setIsRouteLoading(false), minDelay);
    }, 0);

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
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
        <Suspense fallback={<PageLoader title="Loading view" message="Preparing this screen..." />}>
          <Routes location={location}>
            <Route path="/contact" element={<Contact />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/3d-objects" element={<ObjectGallery />} />
            <Route path="/metaverse-landing" element={<MetaverseLanding />} />
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
                  <PostPage />
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
              path="/projects/:projectId/metaverse"
              element={
                <ProjectMemberRoute>
                  <ProjectMetaverse />
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
        </Suspense>
      </motion.div>
    </RouteTransitionLoader>
  );
};

const AppShell = () => {
  const location = useLocation();
  const isProjectMetaverseRoute = /^\/projects\/[^/]+\/metaverse$/.test(location.pathname);
  const isImmersiveRoute = location.pathname.startsWith("/knowledge") || isProjectMetaverseRoute;
  const isChatRoute = location.pathname.startsWith("/chat");

  return (
    <div className={`shell-app flex min-h-screen flex-col ${isImmersiveRoute ? "shell-app-immersive" : ""} ${isChatRoute ? "shell-app-chat" : ""}`}>
      <div className="shell-backdrop" aria-hidden="true">
        <div className="shell-orb shell-orb-one" />
        <div className="shell-orb shell-orb-two" />
        <div className="shell-orb shell-orb-three" />
        <div className="shell-rings" />
      </div>

      {isProjectMetaverseRoute ? null : <Navbar />}

      <main className={`shell-main ${isImmersiveRoute ? "shell-main-immersive" : ""} ${isChatRoute ? "shell-main-chat" : ""}`}>
        <div className={`shell-main-stage ${isImmersiveRoute ? "shell-main-stage-immersive" : ""} ${isChatRoute ? "shell-main-stage-chat" : ""}`}>
          <AppRoutes />
        </div>
      </main>

      {isProjectMetaverseRoute ? null : <ChatLauncher />}
      {isImmersiveRoute || isChatRoute ? null : <Footer />}
    </div>
  );
};

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
