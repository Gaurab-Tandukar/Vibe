const mongoose = require("mongoose");
const Notification = require("../model/notificationModel");
const ApiError = require("../util/ApiError");

const GROUP_THRESHOLD = 4;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;
const MAX_BATCH_SIZE = 200;

/**
 * Enterprise Service Layer for Notifications
 */
class NotificationService {
  async getNotifications(userId, limit = DEFAULT_LIMIT) {
    const parsedLimit = Number(limit);
    const safeLimit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(Math.trunc(parsedLimit), 1), MAX_LIMIT)
      : DEFAULT_LIMIT;

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .populate({
        path: "message",
        select: "content sender conversation isDeleted createdAt",
        populate: [
          { path: "sender", select: "username firstName lastName avatarUrl" },
          { path: "conversation", select: "name isGroup participants" },
        ],
      })
      .lean();

    const groupedMap = new Map();
    const orphaned = [];

    for (const notif of notifications) {
      if (!notif.message || !notif.message.conversation) {
        orphaned.push(notif);
        continue;
      }
      const convoId = notif.message.conversation._id.toString();

      if (!groupedMap.has(convoId)) {
        groupedMap.set(convoId, {
          conversationId: convoId,
          conversationName: this._resolveConversationName(notif.message),
          isGroup: notif.message.conversation.isGroup,
          notifications: [],
        });
      }

      groupedMap.get(convoId).notifications.push(notif);
    }

    const result = [];

    for (const group of groupedMap.values()) {
      const {
        notifications: notifList,
        conversationName,
        conversationId,
        isGroup,
      } = group;

      if (notifList.length <= GROUP_THRESHOLD) {
        notifList.forEach((n) => {
          result.push({
            type: "single",
            _id: n._id,
            conversationId,
            conversationName,
            isRead: n.isRead,
            createdAt: n.createdAt,
            preview: n.message.isDeleted
              ? "This message was deleted"
              : n.message.content,
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

    orphaned.forEach((n) => {
      result.push({
        type: "single",
        _id: n._id,
        conversationId: null,
        conversationName: "Unknown conversation",
        isRead: n.isRead,
        createdAt: n.createdAt,
        preview: "This message is no longer available",
        sender: null,
      });
    });

    result.sort((a, b) => {
      const dateA = a.type === "group" ? a.latestCreatedAt : a.createdAt;
      const dateB = b.type === "group" ? b.latestCreatedAt : b.createdAt;
      return new Date(dateB) - new Date(dateA);
    });

    return result;
  }

  _resolveConversationName(message) {
    if (message.conversation.isGroup) {
      return message.conversation.name || "Group chat";
    }
    return message.sender?.username || "Unknown user";
  }

  async getUnreadCount(userId) {
    return Notification.countDocuments({ user: userId, isRead: false });
  }

  async markAsRead(notificationId, userId) {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw ApiError.badRequest("Invalid notification ID");
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      user: userId,
    });
    if (!notification) throw ApiError.notFound("Notification not found");

    notification.isRead = true;
    await notification.save();
    return notification;
  }

  async markBatchAsRead(userId, notificationIds) {
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      throw ApiError.badRequest("notificationIds array is required");
    }

    if (notificationIds.length > MAX_BATCH_SIZE) {
      throw ApiError.badRequest(
        `Cannot process more than ${MAX_BATCH_SIZE} notifications at once`,
      );
    }

    const invalidId = notificationIds.find(
      (id) => !mongoose.Types.ObjectId.isValid(id),
    );
    if (invalidId)
      throw ApiError.badRequest(`Invalid notification ID: ${invalidId}`);

    await Notification.updateMany(
      { _id: { $in: notificationIds }, user: userId },
      { $set: { isRead: true } },
    );

    return { message: "Notifications marked as read" };
  }

  async markAllAsRead(userId) {
    await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } },
    );
    return { message: "All notifications marked as read" };
  }

  async deleteNotification(notificationId, userId) {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw ApiError.badRequest("Invalid notification ID");
    }
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user: userId,
    });
    if (!notification) throw ApiError.notFound("Notification not found");
    return { message: "Notification removed successfully" };
  }
}

module.exports = new NotificationService();
