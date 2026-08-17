import axiosInstance from "./axiosInstance";

const ENDPOINTS = {
  messages: "/messages",
};

export const getMessages = async (
  conversationId,
  { before, limit = 20 } = {},
) => {
  const params = {};
  if (before) params.before = before;
  if (limit) params.limit = limit;

  const response = await axiosInstance.get(
    `${ENDPOINTS.messages}/${conversationId}`,
    { params },
  );
  return response.data; // { messages, hasMore, nextCursor }
};

export const sendMessage = async ({
  conversationId,
  content,
  type = "text",
  replyTo,
  attachments,
}) => {
  const response = await axiosInstance.post(ENDPOINTS.messages, {
    conversationId,
    content,
    type,
    replyTo,
    attachments,
  });
  return response.data; // fully populated message
};

export const editMessage = async (messageId, content) => {
  const response = await axiosInstance.put(
    `${ENDPOINTS.messages}/${messageId}`,
    { content },
  );
  return response.data;
};

export const deleteMessage = async (messageId) => {
  const response = await axiosInstance.delete(
    `${ENDPOINTS.messages}/${messageId}`,
  );
  return response.data;
};

export const markMessagesRead = async (conversationId) => {
  const response = await axiosInstance.put(
    `${ENDPOINTS.messages}/${conversationId}/read`,
  );
  return response.data;
};
