import axios from "axios";

const getCsrfToken = () => document.querySelector('meta[name="csrf-token"]')?.content;

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-CSRF-Token": getCsrfToken(),
  },
});

// Attach CSRF token before each request
api.interceptors.request.use((config) => {
  const csrfToken = getCsrfToken();
  if (csrfToken) config.headers["X-CSRF-Token"] = csrfToken;
  return config;
});

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      toast.error("Please log in to continue");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => response,
  async error => {
    const { config, response } = error;

    // NEW GUARD CLAUSE
    if (config?.skipAuthRetry || config?.url.includes("/refresh")) {
      return Promise.reject(error);
    }

    if (response?.status === 401 && !config._retry) {
      config._retry = true;
      try {
        await api.post("/refresh");
        return api(config);
      } catch {
        // silent
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Exported endpoints
export const signup        = (u) => api.post("/signup", u);
export const login         = (u) => api.post("/login", u);
export const logout        = ()   => api.delete("/logout");

export const fetchUserInfo   = () => api.get("/view_profile");
export const updateUserInfo  = (d) => api.post("/update_profile", d);

export const fetchPosts      = (id) => api.get(id ? `/posts?user_id=${id}`: "/posts");
export const createPost      = (d) => api.post("/posts", d);
export const updatePost      = (i, d) => api.put(`/posts/${i}`, d);
export const deletePost      = (i) => api.delete(`/posts/${i}`);
