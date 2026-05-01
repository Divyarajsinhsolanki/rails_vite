import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

const APP_NAME = "My Rails + Vite + React App";

const routeTitles = {
  "/": "Calendar",
  "/calendar": "Calendar",
  "/contact": "Contact",
  "/legal": "Legal",
  "/pdf": "PDF",
  "/momentum": "Daily Momentum Hub",
  "/posts": "Posts",
  "/vault": "Vault",
  "/profile": "Profile",
  "/knowledge": "Knowledge Dashboard",
  "/worklog": "Work Log",
  "/projects": "Projects",
  "/teams": "Teams",
  "/users": "Users",
  "/departments": "Departments",
  "/admin": "Admin",
  "/admin/login-as-user": "Admin Impersonation",
  "/settings": "Settings",
  "/chat": "Chat",
  "/notifications": "Notifications",
  "/forgot-password": "Forgot Password",
  "/reset-password": "Reset Password",
};

const pageTitleForPath = (pathname) => {
  if (routeTitles[pathname]) return routeTitles[pathname];

  if (/^\/projects\/[^/]+\/dashboard$/.test(pathname)) return "Sprint Dashboard";
  if (/^\/projects\/[^/]+\/issues$/.test(pathname)) return "Issue Tracker";
  if (/^\/departments\/[^/]+$/.test(pathname)) return "Department Details";
  if (/^\/profile\/[^/]+$/.test(pathname)) return "Profile";
  if (/^\/chat\/[^/]+$/.test(pathname)) return "Chat";

  return null;
};

const PageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const title = pageTitleForPath(location.pathname);
    document.title = title ? `${title} | ${APP_NAME}` : APP_NAME;
  }, [location.pathname]);

  return null;
};

export default PageTitle;
