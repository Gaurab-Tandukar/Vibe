import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import GuestRoute from "../components/GuestRoute";
import HomePage from "../pages/home/HomePage";
import LoginPage from "../pages/login/LoginPage";
import RegisterPage from "../pages/register/RegisterPage";
import ProfilePage from "../pages/profile/ProfilePage";
import AboutPage from "../pages/about/AboutPage";
import ContactPage from "../pages/contact/ContactPage";
import EditProfilePage from "../pages/profile/EditProfilePage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<EditProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
