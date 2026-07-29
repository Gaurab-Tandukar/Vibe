const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  addReaction,
  getReactions,
} = require("../controllers/reactionController");

router.post("/:messageId", protect, addReaction);
router.get("/:messageId", protect, getReactions);

module.exports = router;
