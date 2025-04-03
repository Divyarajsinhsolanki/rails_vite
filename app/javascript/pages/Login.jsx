import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { auth, getRedirectResult } from "../firebaseConfig";

const Login = () => {
  const { handleLogin, handleGoogleLogin } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await handleLogin({ auth: formData });
      navigate("/posts");
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    }
  };

  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        console.log("Redirect Login Success:", result.user);
      }
    }).catch(console.error);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login</h2>

        {/* 📝 Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" name="email" placeholder="Email" required className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400" value={formData.email} onChange={handleChange}/>
          <input type="password" name="password" placeholder="Password" required className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400" value={formData.password} onChange={handleChange}/>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition">
            Log In
          </button>
        </form>

        {/* 🚨 Error Message */}
        {error && <p className="mt-3 text-center text-red-500">{error}</p>}

        {/* Google Login Button */}
        <button onClick={handleGoogleLogin} className="w-full bg-red-500 text-white py-2 rounded-md mt-3 hover:bg-red-600 transition">
          Sign in with Google
        </button>

        <p className="mt-4 text-center text-gray-600">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-500 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
