import React, { createContext, useState, useEffect, useCallback, useRef } from "react";
import api from "../components/api";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../firebaseConfig";
import { signInWithPopup } from "firebase/auth";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const navigate = useNavigate();
  const refreshTimer = useRef();

  // Clear timer on unmount
  useEffect(() => () => clearTimeout(refreshTimer.current), []);

  // Hydrate user + schedule refresh on mount
  useEffect(() => {
    const hydrate = async () => {
      try {
        const { data } = await api.post("/refresh", {}, { skipAuthRetry: true });
        setUser(data.user);
        scheduleRefresh(data.exp);
      } catch {
        setUser(null);
      } finally {
        setInitializing(false);
      }
    };
    hydrate();
  }, []);

  // Schedule silent refresh before token expires
  const scheduleRefresh = useCallback((exp) => {
    if (!exp) return;
    const ms = (exp * 1000 - Date.now()) * 0.75;
    clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(async () => {
      try {
        const { data } = await api.post("/refresh");
        setUser(data.user);
        scheduleRefresh(data.exp);
      } catch {
        setUser(null);
        navigate("/login");
      }
    }, ms);
  }, [navigate]);

  // Normal login/signup + Google login: schedule refresh from exp
  const handleLogin = async (credentials) => {
    const { data } = await api.post("/login", credentials);
    setUser(data.user);
    scheduleRefresh(data.exp);
    navigate("/posts");
  };

  const handleSignup = async (payload) => {
    const { data } = await api.post("/signup", payload);
    setUser(data.user);
    scheduleRefresh(data.exp);
    navigate("/posts");
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();
      const { data } = await api.post(
        "/login",
        { id_token: idToken, email: firebaseUser.email, display_name: firebaseUser.displayName }
      );
      setUser(data.user);
      scheduleRefresh(data.exp);
      navigate("/posts");
    } catch (error) {
      console.error("Google login failed:", error);
    }
  };

  const handleLogout = async () => {
    await api.delete("/logout");
    setUser(null);
    clearTimeout(refreshTimer.current);
    navigate("/login");
  };

  const value = {
    user,
    initializing,
    isAuthenticated: !!user,
    handleLogin,
    handleSignup,
    handleGoogleLogin,
    handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {initializing ? <div>Loading…</div> : children}
    </AuthContext.Provider>
  );
}
