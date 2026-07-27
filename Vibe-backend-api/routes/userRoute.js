const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
  getUserByUsername,
  updateUserProfile,
  updateUserPassword,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.get("/profile", protect, getUserProfile);
router.get("/profile/:username", protect, getUserByUsername);
router.get("/all", protect, getAllUsers);
router.put("/profile/:username", protect, updateUserProfile);
router.put("/profile/password/:username", protect, updateUserPassword);

// Admin only route
router.get("/all", protect, authorize("ADMIN"), getAllUsers);

module.exports = router;
