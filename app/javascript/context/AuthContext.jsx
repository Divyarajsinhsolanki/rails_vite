import React, { createContext, useState, useEffect } from "react";
import { login, signup, logout } from "../components/api";
import { useNavigate, useLocation } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // useEffect(() => {
  //   const token = localStorage.getItem("token");
  //   if (token) {
  //     setUser(token);
  //   } else if (!["/login", "/signup"].includes(location.pathname)) {
  //     navigate("/login");
  //   }
  // }, [location.pathname]);

  // useEffect(() => {
  //   const token = localStorage.getItem("token");
  //   console.log("Stored Token:", token); // ✅ Log the token before decoding
  
  //   if (token) {
  //     try {
  //       setUser(token);
  //     } catch (error) {
  //       console.error("Invalid token:", error);
  //       localStorage.removeItem("token"); // ✅ Clear invalid token
  //     }
  //   }
  // }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        setUser(token);
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem("token"); // ✅ Remove invalid token
      }
    }
  }, []);


  const handleSignup = async (formData) => {
    const res = await signup(formData);
    localStorage.setItem("token", res.data.token);
    setUser(res.data.token);
  };

  const handleLogin = async (formData) => {
    const res = await login(formData);
    localStorage.setItem("token", res.data.token);
    setUser(res.data.token);
  };

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, handleSignup, handleLogin, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};
