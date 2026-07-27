const User = require("../model/userModel");
const passHash = require("../util/password");
const generateToken = require("../util/jwtToken");

// @desc   Register User
// @route  POST /api/users/register
const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;

    // Validation
    if (!firstName || !lastName || !username || !email || !password) {
      return res.status(400).json({ message: "Please add all fields" });
    }

    const userExists = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await passHash.hashpass(password);

    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      passwordHash: hashedPassword,
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Login user
// @route  POST /api/users/login
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ username });

    if (user && (await passHash.hashpass(password, user.passwordHash))) {
      res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   get user profile
// @route  GET /api/users/profile
const getUserProfile = async (req, res) => {
  res.status(200).json(req.user);
};

// @desc   get user by username
// @route  GET /api/profile/:username
const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params; // Get from URL params

    const user = await User.findOne({ username }).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   get all users
// @route  GET /api/users/all
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   update User Proflie
// @route  PUT /api/users/profile/:username
const updateUserProfile = async (req, res) => {
  try {
    const { username } = req.params; // Get from URL params
    const { firstName, lastName, email, avatarUrl } = req.body;

    const user = await User.findOneAndUpdate(
      { username },
      { firstName, lastName, email, avatarUrl },
      { new: true },
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   update User Password
// @route  PUT /api/users/profile/password/:username
const updateUserPassword = async (req, res) => {
  try {
    const { username } = req.params;
    const { oldPassword, newPassword } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!(await passHash.hashpass(oldPassword, user.passwordHash))) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    const hashedNewPassword = await passHash.hashpass(newPassword);
    user.passwordHash = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
  getUserByUsername,
  updateUserProfile,
  updateUserPassword,
};
