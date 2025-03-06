import React, { createContext, useState, useEffect } from "react";
import { login, signup, logout } from "../components/api";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      setUser(decoded);
    }
  }, []);

  const handleSignup = async (formData) => {
    const res = await signup(formData);
    localStorage.setItem("token", res.data.token);
    setUser(jwtDecode(res.data.token));
  };

  const handleLogin = async (formData) => {
    const res = await login(formData);
    localStorage.setItem("token", res.data.token);
    setUser(jwtDecode(res.data.token));
  };

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, handleSignup, handleLogin, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};
