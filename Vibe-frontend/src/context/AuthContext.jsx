import { createContext, useState } from "react";
import { loginUser, registerUser } from "../api/authSevice";
import { fetchProfile } from "../api/profileService";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("vibe_user");
    const storedToken = localStorage.getItem("vibe_token");
    return storedUser && storedToken ? JSON.parse(storedUser) : null;
  });

  const [error, setError] = useState(null);

  async function login(credentials) {
    setError(null);
    try {
      const data = await loginUser(credentials);
      const { token, ...userData } = data;

      localStorage.setItem("vibe_token", token);
      localStorage.setItem("vibe_user", JSON.stringify(userData));
      setUser(userData);

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
      localStorage.setItem("vibe_token", regResult.token);

      // register's response is missing firstName/lastName, so fetch the full profile
      const fullUser = await fetchProfile();
      localStorage.setItem("vibe_user", JSON.stringify(fullUser));
      setUser(fullUser);

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed.";
      setError(message);
      return { success: false, message };
    }
  }

  function logout() {
    localStorage.removeItem("vibe_token");
    localStorage.removeItem("vibe_user");
    setUser(null);
  }

  const value = {
    user,
    isAuthenticated: !!user,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
