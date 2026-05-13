import React, { Suspense, lazy } from "react";

import Navbar from "./Navbar";
import Footer from "./Footer";
import ChatLauncher from "./ChatLauncher";

const Ambient3DBackground = lazy(() => import("./Ambient3DBackground"));

const AppShell = ({ children }) => {
  return (
    <div className="premium-app-shell flex min-h-screen flex-col overflow-hidden">
      <Suspense fallback={null}>
        <Ambient3DBackground />
      </Suspense>

      <div className="premium-shell-content flex min-h-screen flex-col">
        <Navbar />

        <main className="relative z-10 flex min-h-0 flex-1 flex-col">
          {children}
        </main>

        <ChatLauncher />
        <Footer />
      </div>
    </div>
  );
};

export default AppShell;
