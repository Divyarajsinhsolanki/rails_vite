import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, initializing } = useContext(AuthContext);

  if (initializing) return <div>Loading…</div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
