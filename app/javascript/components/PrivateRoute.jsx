import React, { useContext } from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import AuthPage from "../pages/AuthPage";

const PrivateRoute = ({ children, ownerOnly = false }) => {
  const { isAuthenticated, initializing, user } = useContext(AuthContext);
  const location = useLocation();
  const mode = location.state?.mode || "login";

  if (initializing) return <div>Loading…</div>;
  if (!isAuthenticated) return <AuthPage mode={mode} />;
  if (ownerOnly && !user?.roles?.some((r) => r.name === "owner")) {
    return <div className="p-4">Unauthorized</div>;
  }
  return children;
};

export default PrivateRoute;
