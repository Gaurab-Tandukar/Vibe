const mongoose = require("mongoose");
const Notification = require("../model/notificationModel");
const ApiError = require("../util/ApiError");

const GROUP_THRESHOLD = 4;

/**
 * Enterprise Service Layer for Notifications
 */
class NotificationService {
  async getNotifications(userId, limit = 50) {
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 50, 100))
      .populate({
        path: "message",
        select: "content sender conversation isDeleted createdAt",
        populate: [
          { path: "sender", select: "username firstName lastName avatarUrl" },
          { path: "conversation", select: "name isGroup participants" },
        ],
      });

    const groupedMap = new Map();

    for (const notif of notifications) {
      if (!notif.message || !notif.message.conversation) continue;
      const convoId = notif.message.conversation._id.toString();

      if (!groupedMap.has(convoId)) {
        groupedMap.set(convoId, {
          conversationId: convoId,
          conversationName: notif.message.conversation.isGroup
            ? notif.message.conversation.name
            : notif.message.sender.username,
          isGroup: notif.message.conversation.isGroup,
          notifications: [],
        });
      }

      groupedMap.get(convoId).notifications.push(notif);
    }

    const result = [];

    for (const group of groupedMap.values()) {
      const { notifications: notifList, conversationName, conversationId, isGroup } = group;

      if (notifList.length <= GROUP_THRESHOLD) {
        notifList.forEach((n) => {
          result.push({
            type: "single",
            _id: n._id,
            conversationId,
            conversationName,
            isRead: n.isRead,
            createdAt: n.createdAt,
            preview: n.message.isDeleted ? "This message was deleted" : n.message.content,
            sender: n.message.sender.username,
          });
        });
      } else {
        const unreadCount = notifList.filter((n) => !n.isRead).length;
        result.push({
          type: "group",
          conversationId,
          conversationName,
          count: notifList.length,
          unreadCount,
          isRead: unreadCount === 0,
          latestCreatedAt: notifList[0].createdAt,
          notificationIds: notifList.map((n) => n._id),
          preview: `${notifList.length}+ messages from ${conversationName}`,
        });
      }
    }

    result.sort((a, b) => {
      const dateA = a.type === "group" ? a.latestCreatedAt : a.createdAt;
      const dateB = b.type === "group" ? b.latestCreatedAt : b.createdAt;
      return new Date(dateB) - new Date(dateA);
    });

    return result;
  }

  async getUnreadCount(userId) {
    return Notification.countDocuments({ user: userId, isRead: false });
  }

  async markAsRead(notificationId, userId) {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw ApiError.badRequest("Invalid notification ID");
    }

    const notification = await Notification.findOne({ _id: notificationId, user: userId });
    if (!notification) throw ApiError.notFound("Notification not found");

    notification.isRead = true;
    await notification.save();
    return notification;
  }

  async markBatchAsRead(userId, notificationIds) {
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      throw ApiError.badRequest("notificationIds array is required");
    }

    const invalidId = notificationIds.find((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidId) throw ApiError.badRequest(`Invalid notification ID: ${invalidId}`);

    await Notification.updateMany(
      { _id: { $in: notificationIds }, user: userId },
      { $set: { isRead: true } },
    );

    return { message: "Notifications marked as read" };
  }

  async markAllAsRead(userId) {
    await Notification.updateMany({ user: userId, isRead: false }, { $set: { isRead: true } });
    return { message: "All notifications marked as read" };
  }
}

module.exports = new NotificationService();
