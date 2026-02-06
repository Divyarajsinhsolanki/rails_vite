import React, { createContext, useState, useEffect, useCallback, useRef } from "react";
import api from "../components/api";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import { toast } from "react-hot-toast";
import { COLOR_MAP, toRgb, lightenColor, darkenColor } from '/utils/theme';
import PageLoader from "../components/ui/PageLoader";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const navigate = useNavigate();
  const refreshTimer = useRef();

  useEffect(() => {
    const raw = user?.color_theme;
    const color = COLOR_MAP[raw] || raw || '#3b82f6';
    document.documentElement.style.setProperty('--theme-color', color);
    document.documentElement.style.setProperty('--theme-color-rgb', toRgb(color));
    document.documentElement.style.setProperty('--theme-color-light', lightenColor(color));
    document.documentElement.style.setProperty('--theme-color-dark', darkenColor(color));

    if (user?.dark_mode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.color_theme, user?.dark_mode]);

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
    navigate(data.user.landing_page ? `/${data.user.landing_page}` : "/");
    toast.success("Logged in successfully");
  };

  const handleSignup = async (payload) => {
    const { data } = await api.post("/signup", payload);
    setUser(data.user);
    scheduleRefresh(data.exp);
    navigate(data.user.landing_page ? `/${data.user.landing_page}` : "/");
    toast.success("Logged in successfully");
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
      navigate(data.user.landing_page ? `/${data.user.landing_page}` : "/");
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
    setUser,
    initializing,
    isAuthenticated: !!user,
    handleLogin,
    handleSignup,
    handleGoogleLogin,
    handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {initializing ? <PageLoader title="Authenticating" message="Checking your session…" /> : children}
    </AuthContext.Provider>
  );
}
