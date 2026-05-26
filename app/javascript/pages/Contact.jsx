import React, { useState, useEffect } from "react";
import { sendContact } from "../components/api";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const Contact = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState(null);
  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) {
      return;
    }

    if (window.grecaptcha?.ready) {
      setIsRecaptchaReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsRecaptchaReady(true);
    script.onerror = () => {
      setStatus({ type: "error", text: "Failed to load reCAPTCHA. Please try again." });
    };

    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getRecaptchaToken = async () => {
    if (!RECAPTCHA_SITE_KEY) {
      throw new Error("reCAPTCHA site key is not configured.");
    }

    if (!window.grecaptcha?.execute) {
      throw new Error("reCAPTCHA is not available yet.");
    }

    return window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: "contact_form_submit" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    try {
      const recaptchaToken = await getRecaptchaToken();
      await sendContact({
        ...formData,
        recaptcha_token: recaptchaToken,
      });

      setFormData({ name: "", email: "", message: "" });
      setStatus({ type: "success", text: "Message sent successfully." });
    } catch (err) {
      setStatus({
        type: "error",
        text: err.response?.data?.errors?.join(", ") || err.message || "Failed to send message.",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-2xl border border-gray-100">
        <h2 className="text-3xl font-bold text-center mb-6">Contact Us</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <textarea
            name="message"
            placeholder="Message"
            rows="4"
            required
            value={formData.message}
            onChange={handleChange}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!RECAPTCHA_SITE_KEY || !isRecaptchaReady}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            Send Message
          </button>
          {!RECAPTCHA_SITE_KEY && (
            <p className="text-sm text-red-600">Contact form is unavailable until reCAPTCHA is configured.</p>
          )}
        </form>
        {status && (
          <div className={`mt-4 p-3 rounded-lg ${status.type === "success" ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}> {status.text} </div>
        )}
      </div>
    </div>
  );
};

export default Contact;
