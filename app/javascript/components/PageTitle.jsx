import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

const APP_NAME = "My Rails + Vite + React App";

const PageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const { pathname } = location;
    const titles = {
      "/contact": "Contact",
      "/legal": "Legal",
      "/pdf": "PDF",
      "/posts": "Posts",
      "/vault": "Vault",
      "/profile": "Profile",
      "/knowledge": "Knowledge Dashboard",
      "/worklog": "Work Log",
      "/projects": "Projects",
      "/teams": "Teams",
      "/users": "Users",
      "/admin": "Admin",
      "/settings": "Settings",
    };

    let title = APP_NAME;

    if (pathname === "/") {
      title = APP_NAME;
    } else if (/^\/projects\/[^/]+\/dashboard$/.test(pathname)) {
      title = `Sprint Dashboard | ${APP_NAME}`;
    } else if (titles[pathname]) {
      title = `${titles[pathname]} | ${APP_NAME}`;
    } else {
      title = APP_NAME;
    }

    document.title = title;
  }, [location]);

  return null;
};

export default PageTitle;
