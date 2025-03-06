import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import submitForm from "../utils/formSubmit";
import { Link } from "react-router-dom";


const Signup = () => {
  const { handleSignup } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

     const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await submitForm("/api/signup", "POST", { user: formData });
            setMessage(response.message || "Signup successful!");
        } catch (error) {
            setMessage(error.response?.data?.errors?.join(", ") || "Signup failed.");
        }
    };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Sign Up</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            required
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            required
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <button
            type="submit"
            className="w-full !bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            Sign Up
          </button>
        </form>
        {message && <p className="mt-3 text-center text-red-500">{message}</p>}
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
