import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import { auth, getRedirectResult } from "../firebaseConfig";
import { Toaster, toast } from "react-hot-toast";
import SpinnerOverlay from "../components/ui/SpinnerOverlay";

const Login = ({ switchToSignup }) => {
  const { handleLogin, handleGoogleLogin } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await handleLogin({ auth: formData });
    } catch (err) {
      const msg = "Invalid email or password. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get("confirmed")) {
      toast.success("Email confirmed. Please log in.");
    }

    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
        }
      })
      .catch(console.error);
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Toaster position="top-right" />
      {loading && <SpinnerOverlay />}
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-2xl transition-transform transform hover:scale-[1.01] border border-gray-100">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Welcome Back</h2>

        {/* 📝 Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <input 
            type="email" 
            name="email" 
            placeholder="Email" 
            required 
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-400"
            value={formData.email} 
            onChange={handleChange}
          />

          <div className="relative">
            <input 
              type="password" 
              name="password" 
              placeholder="Password" 
              required 
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-400"
              value={formData.password} 
              onChange={handleChange}
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-all transform hover:scale-[1.01] shadow-md"
          >
            Log In
          </button>
        </form>
  
        {/* 🚨 Error Message */}
        {error && (
          <div className="mt-5 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}
        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">OR</span>
          </div>
        </div>

        {/* Google Login Button */}
        <button
          onClick={async () => {
            setLoading(true);
            try {
              await handleGoogleLogin();
            } finally {
              setLoading(false);
            }
          }}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-md"
        >
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.835 0 3.456.705 4.691 1.942l3.099-3.101A10.113 10.113 0 0012.545 2C7.021 2 2.545 6.477 2.545 12s4.476 10 10 10c5.523 0 10-4.477 10-10a10.1 10.1 0 00-.167-1.785l-9.833-.006z"/>
          </svg>
          Sign in with Google
        </button>
  
        <p className="mt-6 text-center text-gray-600">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={switchToSignup}
            className="text-blue-500 hover:text-blue-600 font-medium transition-colors"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
  
};

export default Login;
