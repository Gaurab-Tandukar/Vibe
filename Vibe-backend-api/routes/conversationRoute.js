const express = require("express");
const router = express.Router();

const {
  createConversation,
  getMyConversations,
  getConversationById,
  addMember,
  removeMember,
  leaveConversation,
  transferAdmin,
  renameConversation,
  hideConversation,
  togglePinConversation,
  toggleMuteConversation,
  markAsUnread,
  markAsRead,
} = require("../controllers/conversationController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createConversation);
router.get("/", protect, getMyConversations);
router.get("/:id", protect, getConversationById);
router.post("/:id/members", protect, addMember);
router.delete("/:id/members/:userId", protect, removeMember);
router.delete("/:id/leave", protect, leaveConversation);
router.put("/:id/transfer-admin", protect, transferAdmin);
router.put("/:id", protect, renameConversation);
router.patch("/:conversationId/hide", protect, hideConversation);
router.patch("/:conversationId/pin", protect, togglePinConversation);
router.patch("/:conversationId/mute", protect, toggleMuteConversation);
router.patch("/:conversationId/unread", protect, markAsUnread);
router.patch("/:conversationId/read", protect, markAsRead);

module.exports = router;
