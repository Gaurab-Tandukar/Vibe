import axiosInstance from "./axiosInstance";

export const toggleReaction = async (messageId, emoji) => {
  const response = await axiosInstance.post(`/reactions/${messageId}`, {
    emoji,
  });
  return response.data; // { reactions }
};

export const getReactions = async (messageId) => {
  const response = await axiosInstance.get(`/reactions/${messageId}`);
  return response.data; // Reaction[]
};
