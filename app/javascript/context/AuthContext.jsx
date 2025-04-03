import React, { createContext, useState, useEffect } from "react";
import { login, signup, logout } from "../components/api";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider, signInWithPopup } from "../firebaseConfig";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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
    const res = await login(formData.auth);
    localStorage.setItem("token", res.data.token);
    setUser(res.data.token);
  };

  // Google Login
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
          "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        }),
      });
      const data = await response.json();

      localStorage.setItem("token", data.token);
      setUser(data.token);

      navigate("/posts");
      console.log("Backend Response:", data);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, handleSignup, handleLogin, handleLogout, handleGoogleLogin }}>
      {children}
    </AuthContext.Provider>
  );
};
