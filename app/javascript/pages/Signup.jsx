import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import submitForm from "../utils/formSubmit";

const Signup = () => {
  const { handleSignup } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: "", password: "", profile_picture: null });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Efficient input handler
  const handleChange = (e) => {
    const { name, type, files, value } = e.target;
    if (type === "file") {
      setFormData((prev) => ({ ...prev, [name]: files[0] })); // Handle file input
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Ensures `auth` wrapper for API request
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const submissionData = new FormData();
    submissionData.append("auth[email]", formData.email);
    submissionData.append("auth[password]", formData.password);
    submissionData.append("auth[profile_picture]", formData.profile_picture);

    try {
      await submitForm("/api/signup", "POST", submissionData);
      navigate("/login"); // Redirect to login after successful signup
    } catch (err) {
      setError(err.response?.data?.errors?.join(", ") || "Signup failed. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Sign Up</h2>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400"
            value={formData.email}
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400"
            value={formData.password}
            onChange={handleChange}
          />
          <input
            type="file"
            name="profile_picture"
            accept="image/*"
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            Sign Up
          </button>
        </form>

        {/* Error Message */}
        {error && <p className="mt-3 text-center text-red-500">{error}</p>}

        {/* Login Link */}
        <p className="mt-4 text-center text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
