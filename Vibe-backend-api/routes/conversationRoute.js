const express = require("express");
const router = express.Router();

const { createConversation } = require("../controllers/conversationController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createConversation);

module.exports = router;
