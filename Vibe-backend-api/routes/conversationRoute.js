const express = require("express");
const router = express.Router();

const {
  createConversation,
  getMyConversations,
  getConversationById,
  addMember,
  removeMember,
} = require("../controllers/conversationController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createConversation);
router.get("/", protect, getMyConversations);
router.get("/:id", protect, getConversationById);
router.post("/:id/members", protect, addMember);
router.delete("/:id/members/:userId", protect, removeMember);

module.exports = router;
