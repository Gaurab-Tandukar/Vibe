const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.get("/profile", protect, getUserProfile);

// Admin only route
router.get("/all", protect, authorize("ADMIN"), getAllUsers);

module.exports = router;
