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
export const getUsers = () => api.get('/users.json');
export const deleteUser = (id) => api.delete(`/users/${id}.json`);
export const updateUser = (id, data) =>
  api.patch(`/users/${id}.json`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// POST ENDPOINTS (existing)
export const fetchPosts = (id) => api.get(id ? `/posts?user_id=${id}` : "/posts");
export const createPost = (d) => api.post("/posts", d);
export const updatePost = (i, d) => api.put(`/posts/${i}`, d);
export const deletePost = (i) => api.delete(`/posts/${i}`);


// ITEM ENDPOINTS
export const fetchItems = (q) => api.get('/items.json', { params: q ? { q } : {} });
export const createItem = (d) => api.post('/items.json', { item: d });
export const updateItem = (id, d) => api.patch(`/items/${id}.json`, { item: d });
export const deleteItem = (id) => api.delete(`/items/${id}.json`);

export const getTables = () => api.get('/admin/tables');
export const getMeta = (table) => api.get(`/admin_meta/${table}`);
export const getRecords = (table) => api.get(`/admin/${table}`);
export const createRecord = (table, data) => api.post(`/admin/${table}`, { record: data });
export const updateRecord = (table, id, data) => api.patch(`/admin/${table}/${id}`, { record: data });
export const deleteRecord = (table, id) => api.delete(`/admin/${table}/${id}`);
export const bookEvent = () => api.post('/event/book');
export const fetchTicket = (sessionId) => api.get(`/ticket`, { params: { session_id: sessionId } });

export const sendContact = (data) => api.post('/contacts', { contact: data });

export const getWeather = (params) => api.get('/weather', { params });
export default api;
