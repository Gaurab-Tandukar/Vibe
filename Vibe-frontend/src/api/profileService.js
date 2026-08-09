import axiosInstance from "./axiosInstance";

const ENDPOINTS = {
  profile: "/users/profile",
};

export async function fetchProfile() {
  const { data } = await axiosInstance.get(ENDPOINTS.profile);
  return data;
}
