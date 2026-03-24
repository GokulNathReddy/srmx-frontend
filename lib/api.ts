import axios from "axios";

const API = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || "https://srmx.onrender.com" });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("srmx_token");
  if (token) config.headers["x-session-token"] = token;
  return config;
});

export const authAPI = {
  login: (email: string, password: string) =>
    API.post("/api/login", { email, password }).then(r => r.data),
  logout: () => API.post("/api/logout").then(r => r.data),
};

export const dataAPI = {
  getAll: () => API.get("/api/all").then(r => r.data),
  getAttendance: () => API.get("/api/attendance").then(r => r.data),
  getMarks: () => API.get("/api/marks").then(r => r.data),
  getTimetable: (batch: number = 1) => API.get(`/api/timetable?batch=${batch}`).then(r => r.data),
};
