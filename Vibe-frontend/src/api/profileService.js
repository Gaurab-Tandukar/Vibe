import axiosInstance from "./axiosInstance";

const ENDPOINTS = {
  profile: "/users/profile",
};

export async function fetchProfile() {
  const { data } = await axiosInstance.get(ENDPOINTS.profile);
  return data;
}

export const updateProfile = async (formData) => {
  const res = await axiosInstance.put("/users/profile", formData);
  return res.data;
};

export const updatePassword = async (passwordData) => {
  const res = await axiosInstance.put("/users/profile/password", passwordData);
  return res.data;
};

export const getUserByUsername = async (username) => {
  const res = await axiosInstance.get(`/users/profile/${username}`);
  return res.data;
};
