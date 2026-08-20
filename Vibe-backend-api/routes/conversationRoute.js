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
  setMemberNickname,
  getGroupMembers,
  hideConversation,
  togglePinConversation,
  toggleMuteConversation,
  markAsUnread,
  markAsRead,
  blockUser,
  unblockUser,
  getBlockedUsers,
} = require("../controllers/conversationController");
const { protect } = require("../middleware/authMiddleware");
const createUploadMiddleware = require("../middleware/uploadMiddleware");

const groupAvatarUpload = createUploadMiddleware("groupAvatars"); // uploads/groupAvatars/

router.post("/", protect, createConversation);
router.get("/", protect, getMyConversations);
router.get("/blocked/users", protect, getBlockedUsers);
router.get("/:id", protect, getConversationById);
router.get("/:id/members", protect, getGroupMembers);
router.post("/:id/members", protect, addMember);
router.delete("/:id/members/:userId", protect, removeMember);
router.patch("/:id/members/:userId/nickname", protect, setMemberNickname);
router.delete("/:id/leave", protect, leaveConversation);
router.put("/:id/transfer-admin", protect, transferAdmin);
router.put(
  "/:id",
  protect,
  groupAvatarUpload.single("avatar"),
  renameConversation,
);
router.patch("/:conversationId/hide", protect, hideConversation);
router.patch("/:conversationId/pin", protect, togglePinConversation);
router.patch("/:conversationId/mute", protect, toggleMuteConversation);
router.patch("/:conversationId/unread", protect, markAsUnread);
router.patch("/:conversationId/read", protect, markAsRead);
router.patch("/:conversationId/block", protect, blockUser);
router.patch("/:conversationId/unblock", protect, unblockUser);

module.exports = router;
