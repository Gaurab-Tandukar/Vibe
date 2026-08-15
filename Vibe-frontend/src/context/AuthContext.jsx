import { createContext, useState, useEffect } from "react";
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

  // Hydrate user profile on fresh page load if token exists
  useEffect(() => {
    async function hydrateUser() {
      const token = localStorage.getItem("vibe_token");
      if (!token) return;

      try {
        const fullUser = await fetchProfile();
        localStorage.setItem("vibe_user", JSON.stringify(fullUser));
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

      // Save token first so fetchProfile authenticates properly
      localStorage.setItem("vibe_token", token);

      // Fetch full profile (includes avatarUrl, status, tags, etc.)
      const fullUser = await fetchProfile();
      localStorage.setItem("vibe_user", JSON.stringify(fullUser));
      setUser(fullUser);

      console.log("User logged in & profile saved:", fullUser);

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

  function updateUser(updatedFields) {
    setUser((prev) => {
      const newUser = { ...prev, ...updatedFields };
      localStorage.setItem("vibe_user", JSON.stringify(newUser));
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
