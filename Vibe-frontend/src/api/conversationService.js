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

export const blockUser = async (conversationId) => {
  const response = await axiosInstance.patch(
    `${ENDPOINTS.chats}/${conversationId}/block`,
  );
  return response.data;
};

export const unblockUser = async (conversationId) => {
  const response = await axiosInstance.patch(
    `${ENDPOINTS.chats}/${conversationId}/unblock`,
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

export const getBlockedUsers = async () => {
  const response = await axiosInstance.get(ENDPOINTS.chats + "/blocked/users");
  return response.data;
};

export const getGroupMembers = async (conversationId) => {
  const response = await axiosInstance.get(
    `${ENDPOINTS.chats}/${conversationId}/members`,
  );
  return response.data;
};

export const addGroupMember = async (conversationId, userId) => {
  const response = await axiosInstance.post(
    `${ENDPOINTS.chats}/${conversationId}/members`,
    { userId },
  );
  return response.data;
};

export const removeGroupMember = async (conversationId, userId) => {
  const response = await axiosInstance.delete(
    `${ENDPOINTS.chats}/${conversationId}/members/${userId}`,
  );
  return response.data;
};

export const leaveGroup = async (conversationId) => {
  const response = await axiosInstance.delete(
    `${ENDPOINTS.chats}/${conversationId}/leave`,
  );
  return response.data;
};

export const transferAdmin = async (conversationId, newAdminUserId) => {
  const response = await axiosInstance.put(
    `${ENDPOINTS.chats}/${conversationId}/transfer-admin`,
    { newAdminUserId },
  );
  return response.data;
};

export const updateGroup = async (
  conversationId,
  { name, avatarFile } = {},
) => {
  const formData = new FormData();
  if (name !== undefined) formData.append("name", name);
  if (avatarFile) formData.append("avatar", avatarFile);

  const response = await axiosInstance.put(
    `${ENDPOINTS.chats}/${conversationId}`,
    formData,
  );
  return response.data;
};

export const setMemberNickname = async (conversationId, userId, nickname) => {
  const response = await axiosInstance.patch(
    `${ENDPOINTS.chats}/${conversationId}/members/${userId}/nickname`,
    { nickname },
  );
  return response.data;
};
