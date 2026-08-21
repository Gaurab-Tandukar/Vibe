const userService = require("../services/userService");
const asyncHandler = require("../middleware/asyncHandler");

// @desc   Register User
// @route  POST /api/users/register
const registerUser = asyncHandler(async (req, res) => {
  const result = await userService.register(req.body);
  res.status(201).json(result);
});

// @desc   Login user
// @route  POST /api/users/login
const loginUser = asyncHandler(async (req, res) => {
  const result = await userService.login(req.body);
  res.status(200).json(result);
});

// @desc   Get authenticated user profile
// @route  GET /api/users/profile
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user._id);
  res.status(200).json(user);
});

// @desc   Get user by username
// @route  GET /api/users/profile/:username
const getUserByUsername = asyncHandler(async (req, res) => {
  const user = await userService.getByUsername(req.params.username);
  res.status(200).json(user);
});

// @desc   Get all users
// @route  GET /api/users/all
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers();
  res.status(200).json(users);
});

// @desc   Update User Profile
// @route  PUT /api/users/profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateProfile(req.user._id, req.body, req.files);
  res.status(200).json(updatedUser);
});

// @desc   Update User Password
// @route  PUT /api/users/profile/password
const updateUserPassword = asyncHandler(async (req, res) => {
  const result = await userService.updatePassword(req.user._id, req.body);
  res.status(200).json(result);
});

// @desc   Verify/unverify a user (admin only)
// @route  PATCH /api/users/:id/verify
const setUserVerified = asyncHandler(async (req, res) => {
  const user = await userService.setVerified(req.params.id, req.body.isVerified);
  res.status(200).json(user);
});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
  getUserByUsername,
  updateUserProfile,
  updateUserPassword,
  setUserVerified,
};