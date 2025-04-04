import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import submitForm from "../utils/formSubmit";

const Signup = () => {
  const { handleSignup, handleGoogleSignup } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: "", password: "", profile_picture: null });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, type, files, value } = e.target;
    if (type === "file") {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const submissionData = new FormData();
    submissionData.append("auth[email]", formData.email);
    submissionData.append("auth[password]", formData.password);
    submissionData.append("auth[profile_picture]", formData.profile_picture);

    try {
      await submitForm("/api/signup", "POST", submissionData);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.errors?.join(", ") || "Signup failed. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-2xl transition-transform transform hover:scale-[1.01] border border-gray-100">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Create Account</h2>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-5" encType="multipart/form-data">
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

          <div className="relative">
            <input
              type="file"
              name="profile_picture"
              accept="image/*"
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-all transform hover:scale-[1.01] shadow-md"
          >
            Sign Up
          </button>
        </form>

        {/* Error Message */}
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

        {/* Google Signup Button */}
        <button 
          onClick={handleGoogleSignup}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-md"
        >
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.835 0 3.456.705 4.691 1.942l3.099-3.101A10.113 10.113 0 0012.545 2C7.021 2 2.545 6.477 2.545 12s4.476 10 10 10c5.523 0 10-4.477 10-10a10.1 10.1 0 00-.167-1.785l-9.833-.006z"/>
          </svg>
          Sign up with Google
        </button>

        <p className="mt-6 text-center text-gray-600">
          Already have an account?{" "}
          <Link 
            to="/login" 
            className="text-blue-500 hover:text-blue-600 font-medium transition-colors"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;