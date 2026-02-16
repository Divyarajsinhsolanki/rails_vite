import React, { useContext, useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { fetchProjects } from "./api";
import AuthPage from "../pages/AuthPage";
import PageLoader from "./ui/PageLoader";
import AccessDeniedRedirect from "./AccessDeniedRedirect";

const ProjectMemberRoute = ({ children }) => {
  const { projectId } = useParams();
  const location = useLocation();
  const mode = location.state?.mode || "login";
  const { isAuthenticated, initializing, user } = useContext(AuthContext);
  const [isMember, setIsMember] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !projectId) return;
    let mounted = true;
    fetchProjects()
      .then(({ data }) => {
        const projects = Array.isArray(data) ? data : [];
        const project = projects.find((p) => p.id === Number(projectId));
        const member = project?.users?.some((u) => u.id === user?.id);
        if (mounted) setIsMember(!!member);
      })
      .catch(() => mounted && setIsMember(false));
    return () => {
      mounted = false;
    };
  }, [projectId, isAuthenticated, user]);

  if (initializing || isMember === null) return <PageLoader title="Project access" message="Verifying project permissions…" />;
  if (!isAuthenticated) return <AuthPage mode={mode} />;
  if (!isMember) return <AccessDeniedRedirect />;
  return children;
};

export default ProjectMemberRoute;
