import axios from "axios";

const API = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

export const signup = (userData) => API.post("/signup", userData);
export const login = (userData) => API.post("/login", userData);
export const logout = () => API.delete("/logout");
