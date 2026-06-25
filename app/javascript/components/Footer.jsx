import React from "react";
import { Link } from "react-router-dom";
import { portfolioEnabled } from "../config/features";

const Footer = () => {
  return (
    <footer className="mt-auto w-full border-t border-shell-border bg-surface-elevated shadow-shell-sm">
      <div className="container mx-auto flex flex-col items-center justify-between px-6 py-3 text-sm text-shell-muted md:flex-row">
        <p className="text-center md:text-left">
          &copy; {new Date().getFullYear()} <span className="font-medium text-theme">Nexus Hub</span>. Built by Divyarajsinh Solanki.
        </p>
        <div className="flex mt-2 md:mt-0 space-x-4">
          <Link to="/legal" className="transition hover:text-theme">
            Privacy & Terms
          </Link>
          {portfolioEnabled ? (
            <Link to="/" className="transition hover:text-theme">
              Portfolio
            </Link>
          ) : null}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
