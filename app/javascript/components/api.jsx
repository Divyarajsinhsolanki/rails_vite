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

// SCHEDULER ENDPOINTS
export const SchedulerAPI = {
  // Sprints
  getLastSprint: () => api.get("/sprints/last.json"),
  createSprint: (data) => api.post("/sprints.json", { sprint: data }),
  updateSprint: (id, data) => api.put(`/sprints/${id}.json`, { sprint: data }),

  // Developers
  getDevelopers: () => api.get("/developers.json"),
  createDeveloper: (data) => api.post("/developers.json", { developer: data }),

  // Tasks
  getTasks: () => api.get("/tasks.json"),
  createTask: (data) => api.post("/tasks.json", { task: data }),
  updateTask: (id, data) => api.patch(`/tasks/${id}.json`, { task: data }),
  deleteTask: (id) => api.delete(`/tasks/${id}.json`),
  moveTask: (id, newData) => api.patch(`/tasks/${id}.json`, newData),
  toggleTaskStatus: (id, status) => api.patch(`/tasks/${id}.json`, { is_struck: status })
};

// USER ENDPOINTS (existing)
export const signup = (u) => api.post("/signup", u);
export const login = (u) => api.post("/login", u);
export const logout = () => api.delete("/logout");
export const fetchUserInfo = () => api.get("/view_profile");
export const updateUserInfo = (d) => api.post("/update_profile", d);

// POST ENDPOINTS (existing)
export const fetchPosts = (id) => api.get(id ? `/posts?user_id=${id}` : "/posts");
export const createPost = (d) => api.post("/posts", d);
export const updatePost = (i, d) => api.put(`/posts/${i}`, d);
export const deletePost = (i) => api.delete(`/posts/${i}`);

export default api;