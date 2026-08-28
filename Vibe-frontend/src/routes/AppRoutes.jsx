import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/ui/ProtectedRoute";
import GuestRoute from "./GuestRoute";
import HomePage from "../pages/home/HomePage";
import LoginPage from "../pages/login/LoginPage";
import RegisterPage from "../pages/register/RegisterPage";
import ProfilePage from "../pages/profile/ProfilePage";
import AboutPage from "../pages/about/AboutPage";
import ContactPage from "../pages/contact/ContactPage";
import EditProfilePage from "../pages/profile/EditProfilePage";
import ChatHome from "../pages/chat/ChatHome";
import PrivacyPage from "../pages/legal/PrivacyPage";
import TermsPage from "../pages/legal/TermsPage";
import ErrorPage from "../pages/error/ErrorPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/chat" element={<ChatHome />} />
        <Route path="/Chat" element={<ChatHome />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<EditProfilePage />} />
      </Route>

      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
}
