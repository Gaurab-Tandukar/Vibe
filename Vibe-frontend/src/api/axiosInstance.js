import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: baseURL,
  headers: { "Content-Type": "application/json" },
});

// Runs before every request leaves the app.
// If we have a saved token, attach it so the backend knows who's asking.
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("vibe_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Runs after every response comes back.
// If the backend says 401 (token invalid/expired), clear it and send user to login.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("vibe_token");
      localStorage.removeItem("vibe_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
