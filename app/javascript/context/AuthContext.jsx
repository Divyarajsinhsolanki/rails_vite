import React, { createContext, useState, useEffect, useCallback, useRef } from "react";
import api from "../components/api";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import { toast } from "react-hot-toast";

const COLOR_MAP = {
  blue: '#3b82f6',
  purple: '#8b5cf6',
  green: '#10b981',
  red: '#ef4444',
};

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const navigate = useNavigate();
  const refreshTimer = useRef();

  const toRgb = (color) => {
    const temp = document.createElement('div');
    temp.style.color = color;
    document.body.appendChild(temp);
    const match = getComputedStyle(temp).color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    document.body.removeChild(temp);
    return match ? `${match[1]} ${match[2]} ${match[3]}` : '59 130 246';
  };

  useEffect(() => {
    const raw = user?.color_theme;
    const color = COLOR_MAP[raw] || raw || '#3b82f6';
    document.documentElement.style.setProperty('--theme-color', color);
    document.documentElement.style.setProperty('--theme-color-rgb', toRgb(color));
  }, [user]);

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
        navigate("/", { state: { mode: "login" } });
      }
    }, ms);
  }, [navigate]);

  // Normal login/signup + Google login: schedule refresh from exp
  const handleLogin = async (credentials) => {
    const { data } = await api.post("/login", credentials);
    setUser(data.user);
    scheduleRefresh(data.exp);
  };

  const handleSignup = async (payload) => {
    const { data } = await api.post("/signup", payload);
    setUser(data.user);
    scheduleRefresh(data.exp);
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
      navigate("/");
      toast.success("Logged in successfully");
    } catch (error) {
      console.error("Google login failed:", error);
    }
  };

  const handleLogout = async () => {
    await api.delete("/logout");
    setUser(null);
    clearTimeout(refreshTimer.current);
    navigate("/", { state: { mode: "login" } });
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
