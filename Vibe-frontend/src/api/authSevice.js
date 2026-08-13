import axiosInstance from "./axiosInstance";

const ENDPOINTS = {
  login: "/users/login",
  register: "/users/register",
};

export async function loginUser(credentials) {
  const { data } = await axiosInstance.post(ENDPOINTS.login, credentials);
  return data;
}

export async function registerUser(formData) {
  console.log(formData);
  const { data } = await axiosInstance.post(ENDPOINTS.register, formData);
  return data;
}

export async function logoutUser() {
  localStorage.removeItem("vibe_token");
  localStorage.removeItem("vibe_user");
  window.location.href = "/login";
}
