import axiosInstance from "./axiosInstance";
import { STORAGE_KEYS } from "../constants/config";

const ENDPOINTS = {
  login: "/users/login",
  register: "/users/register",
};

export async function loginUser(credentials) {
  const { data } = await axiosInstance.post(ENDPOINTS.login, credentials);
  return data;
}

export async function registerUser(formData) {
  const { data } = await axiosInstance.post(ENDPOINTS.register, formData);
  return data;
}

export async function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  window.location.href = "/login";
}
