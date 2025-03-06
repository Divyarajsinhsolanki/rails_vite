import axios from "axios";

// Get CSRF Token from Rails meta tag
const getCSRFToken = () => {
  return document.querySelector('meta[name="csrf-token"]')?.content;
};

// Universal form submission function
const submitForm = async (url, method = "POST", data = {}, extraHeaders = {}) => {
  try {
    const csrfToken = getCSRFToken(); // Get CSRF token
    const headers = {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken, // ✅ Automatically include CSRF token
      ...extraHeaders,
    };

    const response = await axios({
      url,
      method,
      headers,
      data,
    });

    return response.data; // Return response data
  } catch (error) {
    console.error("Form submission error:", error.response?.data || error);
    throw error;
  }
};

export default submitForm;
