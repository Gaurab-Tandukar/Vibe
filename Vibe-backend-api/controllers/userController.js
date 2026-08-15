const User = require("../model/userModel");
const passHash = require("../util/password");
const generateToken = require("../util/jwtToken");

// @desc   Register User
// @route  POST /api/users/register
const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, username, email, phoneNumber, password } =
      req.body;
    console.log(req.body);
    // Validation
    if (
      !firstName ||
      !lastName ||
      !username ||
      !email ||
      !phoneNumber ||
      !password
    ) {
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
      phoneNumber,
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
    const { username } = req.params;

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
    res.status(500).json({ message: err.message });
  }
};

// @desc   update User Profile
// @route  PUT /api/users/profile
const updateUserProfile = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { firstName, lastName, email, bio, aboutMe, connections, tags } =
      req.body;

    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (email !== undefined) updates.email = email;
    if (bio !== undefined) updates.bio = bio;
    if (aboutMe !== undefined) updates.aboutMe = aboutMe;

    // connections/tags come through as JSON strings when sent via
    // multipart/form-data (FormData) alongside the avatar/banner files.
    // If they're already arrays (e.g. a plain JSON request), use as-is.
    if (connections !== undefined) {
      try {
        updates.connections =
          typeof connections === "string"
            ? JSON.parse(connections)
            : connections;
      } catch (err) {
        return res
          .status(400)
          .json({ message: "connections must be valid JSON" });
      }
    }

    if (tags !== undefined) {
      try {
        updates.tags = typeof tags === "string" ? JSON.parse(tags) : tags;
      } catch (err) {
        return res.status(400).json({ message: "tags must be valid JSON" });
      }
    }

    // req.files instead of req.file since we now accept multiple file fields
    if (req.files?.avatar) {
      updates.avatarUrl = `/uploads/avatars/${req.files.avatar[0].filename}`;
    }
    if (req.files?.banner) {
      updates.bannerUrl = `/uploads/banners/${req.files.banner[0].filename}`;
    }

    const user = await User.findByIdAndUpdate(currentUserId, updates, {
      returnDocument: "after",
      runValidators: true,
    }).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   update User Password
// @route  PUT /api/users/profile/password
const updateUserPassword = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both old and new password are required" });
    }

    const user = await User.findById(currentUserId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!(await passHash.hashpass(oldPassword, user.passwordHash))) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    user.passwordHash = await passHash.hashpass(newPassword);
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
