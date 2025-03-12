import axios from "axios";

const API = axios.create({
  baseURL: "/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content; // CSRF Token

  config.headers = {
    ...config.headers, // Keep existing headers
    "Content-Type": "multipart/form-data",
  };

  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  if (csrfToken) {
    config.headers["X-CSRF-Token"] = csrfToken;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const signup = (userData) => API.post("/signup", userData);
export const login = (userData) => API.post("/login", userData);
export const logout = () => API.delete("/logout");
export const fetchUserInfo = () => API.get("/view_profile");
export const updateUserInfo = (userData) => API.post("/update_profile", userData);

export const fetchPosts = (userId) => {
  const url = userId ? `/posts?user_id=${userId}` : '/posts';
  return API.get(url);
};
export const createPost = (data) => API.post("/posts", data, { headers: { "Content-Type": "multipart/form-data" } });
export const updatePost = (id, data) => API.put(`/posts/${id}`, data);
export const deletePost = (id) => API.delete(`/posts/${id}`);
