const mongoose = require("mongoose");
const Notification = require("../model/notificationModel");

const GROUP_THRESHOLD = 4;

// @desc   get my notifications, grouped by conversation with a 4+ collapse
// @route  GET /api/notifications?limit=50
const getNotifications = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { limit = 50 } = req.query;

    const notifications = await Notification.find({ user: currentUserId })
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit), 100))
      .populate({
        path: "message",
        select: "content sender conversation isDeleted createdAt",
        populate: [
          { path: "sender", select: "username firstName lastName avatarUrl" },
          { path: "conversation", select: "name isGroup participants" },
        ],
      });

    // ✅ group notifications by conversation
    const groupedMap = new Map();

    for (const notif of notifications) {
      // skip orphaned notifications (message or conversation deleted at DB level)
      if (!notif.message || !notif.message.conversation) continue;

      const convoId = notif.message.conversation._id.toString();

      if (!groupedMap.has(convoId)) {
        groupedMap.set(convoId, {
          conversationId: convoId,
          conversationName: notif.message.conversation.isGroup
            ? notif.message.conversation.name
            : notif.message.sender.username, // private chat → sender's name
          isGroup: notif.message.conversation.isGroup,
          notifications: [],
        });
      }

      groupedMap.get(convoId).notifications.push(notif);
    }

    // ✅ build final response: individual items up to threshold, collapsed beyond
    const result = [];

    for (const group of groupedMap.values()) {
      const {
        notifications: notifList,
        conversationName,
        conversationId,
        isGroup,
      } = group;

      if (notifList.length <= GROUP_THRESHOLD) {
        // show each individually
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
        // collapse into one grouped summary
        const unreadCount = notifList.filter((n) => !n.isRead).length;
        result.push({
          type: "group",
          conversationId,
          conversationName,
          count: notifList.length,
          unreadCount,
          isRead: unreadCount === 0,
          latestCreatedAt: notifList[0].createdAt, // already sorted desc
          notificationIds: notifList.map((n) => n._id), // so frontend can mark all as read
          preview: isGroup
            ? `${notifList.length}+ messages from ${conversationName}`
            : `${notifList.length}+ messages from ${conversationName}`,
        });
      }
    }

    // sort combined result by most recent activity
    result.sort((a, b) => {
      const dateA = a.type === "group" ? a.latestCreatedAt : a.createdAt;
      const dateB = b.type === "group" ? b.latestCreatedAt : b.createdAt;
      return new Date(dateB) - new Date(dateA);
    });

    res.status(200).json({ notifications: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   get count of unread notifications (for a badge/bell icon)
// @route  GET /api/notifications/unread-count
const getUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const count = await Notification.countDocuments({
      user: currentUserId,
      isRead: false,
    });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   mark a single notification as read
// @route  PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }

    const notification = await Notification.findOne({
      _id: id,
      user: currentUserId,
    });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   mark multiple notifications as read (used for collapsed groups)
// @route  PUT /api/notifications/read-batch
const markBatchAsRead = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res
        .status(400)
        .json({ message: "notificationIds array is required" });
    }

    const invalidId = notificationIds.find(
      (id) => !mongoose.Types.ObjectId.isValid(id),
    );
    if (invalidId) {
      return res
        .status(400)
        .json({ message: `Invalid notification id: ${invalidId}` });
    }

    await Notification.updateMany(
      { _id: { $in: notificationIds }, user: currentUserId },
      { $set: { isRead: true } },
    );

    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   mark all notifications as read
// @route  PUT /api/notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    await Notification.updateMany(
      { user: currentUserId, isRead: false },
      { $set: { isRead: true } },
    );

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markBatchAsRead,
  markAllAsRead,
};
