const notificationService = require("../services/notificationService");
const asyncHandler = require("../middleware/asyncHandler");

// @desc   Get my notifications (grouped by conversation with collapse)
// @route  GET /api/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getNotifications(req.user._id, req.query.limit);
  res.status(200).json({ notifications: result });
});

// @desc   Get count of unread notifications
// @route  GET /api/notifications/unread-count
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user._id);
  res.status(200).json({ count });
});

// @desc   Mark a single notification as read
// @route  PUT /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user._id);
  res.status(200).json(notification);
});

// @desc   Mark multiple notifications as read (batch)
// @route  PUT /api/notifications/read-batch
const markBatchAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markBatchAsRead(req.user._id, req.body.notificationIds);
  res.status(200).json(result);
});

// @desc   Mark all notifications as read
// @route  PUT /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user._id);
  res.status(200).json(result);
});

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markBatchAsRead,
  markAllAsRead,
};
