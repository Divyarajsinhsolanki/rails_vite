import React, { useContext } from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import PageLoader from "./ui/PageLoader";
import AuthPage from "../pages/AuthPage";
import AccessDeniedRedirect from "./AccessDeniedRedirect";

const PrivateRoute = ({ children, ownerOnly = false, allowedRoles = [] }) => {
  const { isAuthenticated, initializing, user } = useContext(AuthContext);
  const location = useLocation();
  const mode = location.state?.mode || "login";

  if (initializing) return <PageLoader title="Authenticating" message="Checking your access…" />;
  if (!isAuthenticated) return <AuthPage mode={mode} />;
  if (ownerOnly && !user?.roles?.some((r) => r.name === "owner")) {
    return <AccessDeniedRedirect />;
  }
  if (allowedRoles.length > 0 && !user?.roles?.some((r) => allowedRoles.includes(r.name))) {
    return <AccessDeniedRedirect />;
  }
  return children;
};

export default PrivateRoute;
