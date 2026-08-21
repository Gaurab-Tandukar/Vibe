const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markBatchAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

router.get("/", protect, getNotifications);
router.get("/unread-count", protect, getUnreadCount);
router.put("/:id/read", protect, markAsRead);
router.put("/read-batch", protect, markBatchAsRead);
router.put("/read-all", protect, markAllAsRead);
router.delete("/:id", protect, deleteNotification);

module.exports = router;
