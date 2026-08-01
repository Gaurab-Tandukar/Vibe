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

module.exports = router;
