import axios from "axios";
import { API_CONFIG, STORAGE_KEYS } from "../constants/config";

const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// Runs before every request leaves the app.
// Attach token if present.
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Runs after every response comes back.
// If 401, clear local storage and redirect to login.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
