import React, { useContext } from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import AuthPage from "../pages/AuthPage";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, initializing } = useContext(AuthContext);
  const location = useLocation();
  const mode = location.state?.mode || "login";

  if (initializing) return <div>Loading…</div>;
  return isAuthenticated ? children : <AuthPage mode={mode} />;
};

export default PrivateRoute;
