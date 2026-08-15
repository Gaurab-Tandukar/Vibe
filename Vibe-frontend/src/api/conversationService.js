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

export const hideConversation = async (conversationId) => {
  const response = await axiosInstance.patch(
    ENDPOINTS.chats + `/${conversationId}/hide`,
  );
  return response.data;
};

export const togglePinConversation = async (conversationId) => {
  const response = await axiosInstance.patch(
    ENDPOINTS.chats + `/${conversationId}/pin`,
  );
  return response.data;
};

export const toggleMuteConversation = async (conversationId) => {
  const response = await axiosInstance.patch(
    ENDPOINTS.chats + `/${conversationId}/mute`,
  );
  return response.data;
};

export const markAsUnread = async (conversationId) => {
  const response = await axiosInstance.patch(
    ENDPOINTS.chats + `/${conversationId}/unread`,
  );
  return response.data;
};

export const markAsRead = async (conversationId) => {
  const response = await axiosInstance.patch(
    ENDPOINTS.chats + `/${conversationId}/read`,
  );
  return response.data;
};
