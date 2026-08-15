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
const createUploadMiddleware = require("../middleware/uploadMiddleware");
const avatarUpload = createUploadMiddleware("avatars"); // uploads/avatars/

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.get("/profile", protect, getUserProfile);
router.get("/profile/:username", protect, getUserByUsername);
router.get("/all", protect, getAllUsers);

const profileUpload = createUploadMiddleware({
  avatar: "avatars",
  banner: "banners",
});

router.put(
  "/profile",
  protect,
  profileUpload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  updateUserProfile,
);

router.put("/profile/password", protect, updateUserPassword);

// Admin only route
router.get("/all", protect, authorize("ADMIN"), getAllUsers);

module.exports = router;
