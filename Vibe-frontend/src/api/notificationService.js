import axiosInstance from "./axiosInstance";

const ENDPOINTS = {
  notifications: "/notifications",
};

export const getNotifications = async (limit = 50) => {
  const response = await axiosInstance.get(ENDPOINTS.notifications, {
    params: { limit },
  });
  return response.data; // { notifications: [...] }
};  

export const getUnreadNotificationCount = async () => {
  const response = await axiosInstance.get(
    `${ENDPOINTS.notifications}/unread-count`,
  );
  return response.data; // { count }
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await axiosInstance.put(
    `${ENDPOINTS.notifications}/${notificationId}/read`,
  );
  return response.data;
};

export const markBatchNotificationsAsRead = async (notificationIds) => {
  const response = await axiosInstance.put(
    `${ENDPOINTS.notifications}/read-batch`,
    { notificationIds },
  );
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await axiosInstance.put(
    `${ENDPOINTS.notifications}/read-all`,
  );
  return response.data;
};

export const deleteNotification = async (notificationId) => {
  const response = await axiosInstance.delete(
    `${ENDPOINTS.notifications}/${notificationId}`,
  );
  return response.data;
};
