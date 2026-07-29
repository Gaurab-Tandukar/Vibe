const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createMessage,
  getMessages,
  deleteMessage,
  editMessage,
} = require("../controllers/messageController");

router.post("/", protect, createMessage);
router.get("/:conversationId", protect, getMessages);
router.put("/:messageId", protect, editMessage);
router.delete("/:messageId", protect, deleteMessage);

module.exports = router;
