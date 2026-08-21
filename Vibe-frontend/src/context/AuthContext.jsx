import { createContext, useState, useEffect } from "react";
import { loginUser, registerUser } from "../api/authService";
import { fetchProfile } from "../api/profileService";
import { STORAGE_KEYS } from "../constants/config";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    return storedUser && storedToken ? JSON.parse(storedUser) : null;
  });

  const [error, setError] = useState(null);

  // Hydrate user profile on fresh page load if token exists
  useEffect(() => {
    async function hydrateUser() {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (!token) return;

      try {
        const fullUser = await fetchProfile();
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(fullUser));
        setUser(fullUser);
      } catch (err) {
        console.error("Failed to sync profile data:", err);
      }
    }

    hydrateUser();
  }, []);

  async function login(credentials) {
    setError(null);
    try {
      const data = await loginUser(credentials);
      const { token } = data;

      localStorage.setItem(STORAGE_KEYS.TOKEN, token);

      const fullUser = await fetchProfile();
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(fullUser));
      setUser(fullUser);

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Login failed.";
      setError(message);
      return { success: false, message };
    }
  }

  async function register(formData) {
    setError(null);
    try {
      const regResult = await registerUser(formData);
      localStorage.setItem(STORAGE_KEYS.TOKEN, regResult.token);

      const fullUser = await fetchProfile();
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(fullUser));
      setUser(fullUser);

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed.";
      setError(message);
      return { success: false, message };
    }
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setUser(null);
  }

  function updateUser(updatedFields) {
    setUser((prev) => {
      const newUser = { ...prev, ...updatedFields };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
      return newUser;
    });
  }

  const value = {
    user,
    isAuthenticated: !!user,
    error,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
