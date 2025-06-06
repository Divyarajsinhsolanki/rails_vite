import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { AuthProvider } from "../context/AuthContext";
import PrivateRoute from "../components/PrivateRoute";

import Navbar from "../components/Navbar";
import Footer from "./Footer";
import PdfPage from "./PdfPage";
import Signup from "../pages/Signup";
import Login from "../pages/Login";
import PostPage from "../pages/PostPage";
import Profile from "../components/Profile";
import TodoBoard from "../pages/TodoBoard";
import PdfEditor from '../pages/PdfEditor';
import KnowledgeDashboard from "../pages/KnowledgeDashboard";
import Scheduler from '../components/Scheduler/Scheduler';


function AuthLayout({ children }) {
  return <main className="flex-grow">{children}</main>;
}

function MainLayout({ children }) {
  return <main className="pt-20 pb-16 p-6 flex-grow">{children}</main>;
}
const App = () => {
  return (
    <Router>
      <AuthProvider> {/* ✅ Wrap the entire app with AuthProvider */}
        <div className="flex flex-col min-h-screen">

          {/* ✅ Navbar */}
          <Navbar />

          {/* ✅ Page Content */}
            <Routes>
              <Route path="/signup" element={<AuthLayout><Signup /></AuthLayout>} />
              <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />

              {/* 🔐 Protected */}
              <Route path="/" element={<PrivateRoute><MainLayout><PdfPage /></MainLayout></PrivateRoute>} />
              <Route path="/posts" element={<PrivateRoute><MainLayout><PostPage /></MainLayout></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><MainLayout><Profile /></MainLayout></PrivateRoute>} />
              <Route path="/todo" element={<PrivateRoute><MainLayout><TodoBoard /></MainLayout></PrivateRoute>} />
              <Route path="/pdf_editor" element={<PrivateRoute><MainLayout><PdfEditor /></MainLayout></PrivateRoute>} />
              <Route path="/knowledge" element={<PrivateRoute><MainLayout><KnowledgeDashboard /></MainLayout></PrivateRoute>} />
              <Route path="/scheduler" element={<PrivateRoute><MainLayout><Scheduler /></MainLayout></PrivateRoute>} />
            </Routes>

          {/* ✅ Footer */}
          <Footer />

        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
