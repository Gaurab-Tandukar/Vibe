import axiosInstance from "./axiosInstance";

const ENDPOINTS = {
  chats: "/chats",
  userAll: "/users/all",
};

export const getMyConversations = async () => {
  const response = await axiosInstance.get(ENDPOINTS.chats);
  return response.data;
};

export const createConversation = async (data) => {
  const response = await axiosInstance.post(ENDPOINTS.chats, data);
  return response.data;
};

export const getAllUsers = async () => {
  const response = await axiosInstance.get(ENDPOINTS.userAll);
  return response.data;
};
