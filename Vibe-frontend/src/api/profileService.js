import axiosInstance from "./axiosInstance";

const ENDPOINTS = {
  profile: "/users/profile",
  password: "/users/profile/password",
};

export async function fetchProfile() {
  const { data } = await axiosInstance.get(ENDPOINTS.profile);
  return data;
}

export const updateProfile = async (formData) => {
  const res = await axiosInstance.put(ENDPOINTS.profile, formData);
  return res.data;
};

export const updatePassword = async (passwordData) => {
  const res = await axiosInstance.put(ENDPOINTS.password, passwordData);
  return res.data;
};

export const getUserByUsername = async (username) => {
  const res = await axiosInstance.get(ENDPOINTS.profile + `/${username}`);
  return res.data;
};
