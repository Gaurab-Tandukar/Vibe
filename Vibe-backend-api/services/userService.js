const User = require("../model/userModel");
const passHash = require("../util/password");
const generateToken = require("../util/jwtToken");
const ApiError = require("../util/ApiError");

/**
 * Enterprise Service Layer for User Operations
 */
class UserService {
  async register({ firstName, lastName, username, email, phoneNumber, password }) {
    if (!firstName || !lastName || !username || !email || !phoneNumber || !password) {
      throw ApiError.badRequest("Please provide all required fields");
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.trim();

    const userExists = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }, { phoneNumber }],
    });

    if (userExists) {
      if (userExists.email === normalizedEmail) {
        throw ApiError.conflict("An account with this email already exists");
      }
      if (userExists.username === normalizedUsername) {
        throw ApiError.conflict("This username is already taken");
      }
      if (userExists.phoneNumber === phoneNumber) {
        throw ApiError.conflict("An account with this phone number already exists");
      }
      throw ApiError.conflict("User already exists");
    }

    const hashedPassword = await passHash.hashpass(password);

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      phoneNumber: phoneNumber.trim(),
      passwordHash: hashedPassword,
    });

    return {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    };
  }

  async login({ username, password }) {
    if (!username || !password) {
      throw ApiError.badRequest("Username and password are required");
    }

    const cleanInput = username.trim();
    const user = await User.findOne({
      $or: [{ username: cleanInput }, { email: cleanInput.toLowerCase() }],
    });

    if (!user || !(await passHash.hashpass(password, user.passwordHash))) {
      throw ApiError.unauthorized("Invalid credentials");
    }

    return {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
      token: generateToken(user._id),
    };
  }

  async getProfile(userId) {
    const user = await User.findById(userId).select("-passwordHash");
    if (!user) throw ApiError.notFound("User not found");
    return user;
  }

  async getByUsername(username) {
    const cleanUsername = username.trim();
    const user = await User.findOne({ username: cleanUsername }).select("-passwordHash");
    if (!user) throw ApiError.notFound("User not found");
    return user;
  }

  async getAllUsers() {
    return User.find().select("-passwordHash").sort({ createdAt: -1 });
  }

  async updateProfile(userId, body, files) {
    const updates = {};
    const { firstName, lastName, email, bio, aboutMe, connections, tags, selectedBadges } = body;

    if (firstName !== undefined) updates.firstName = firstName.trim();
    if (lastName !== undefined) updates.lastName = lastName.trim();
    if (email !== undefined) updates.email = email.toLowerCase().trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (aboutMe !== undefined) updates.aboutMe = aboutMe.trim();

    if (connections !== undefined) {
      try {
        updates.connections = typeof connections === "string" ? JSON.parse(connections) : connections;
      } catch (err) {
        throw ApiError.badRequest("Connections must be valid JSON");
      }
    }

    if (tags !== undefined) {
      try {
        updates.tags = typeof tags === "string" ? JSON.parse(tags) : tags;
      } catch (err) {
        throw ApiError.badRequest("Tags must be valid JSON");
      }
    }

    if (selectedBadges !== undefined) {
      let parsed;
      try {
        parsed = typeof selectedBadges === "string" ? JSON.parse(selectedBadges) : selectedBadges;
      } catch (err) {
        throw ApiError.badRequest("SelectedBadges must be valid JSON");
      }

      if (!Array.isArray(parsed)) {
        throw ApiError.badRequest("SelectedBadges must be an array");
      }

      if (parsed.length > 3) {
        throw ApiError.badRequest("You can only select up to 3 badges");
      }

      updates.selectedBadges = parsed;
    }

    if (files?.avatar?.[0]) {
      updates.avatarUrl = `/uploads/avatars/${files.avatar[0].filename}`;
    }
    if (files?.banner?.[0]) {
      updates.bannerUrl = `/uploads/banners/${files.banner[0].filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      returnDocument: "after",
      runValidators: true,
    }).select("-passwordHash");

    if (!updatedUser) throw ApiError.notFound("User not found");
    return updatedUser;
  }

  async updatePassword(userId, { oldPassword, newPassword }) {
    if (!oldPassword || !newPassword) {
      throw ApiError.badRequest("Both old and new password are required");
    }

    if (newPassword.length < 6) {
      throw ApiError.badRequest("New password must be at least 6 characters");
    }

    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound("User not found");

    if (!(await passHash.hashpass(oldPassword, user.passwordHash))) {
      throw ApiError.unauthorized("Old password is incorrect");
    }

    user.passwordHash = await passHash.hashpass(newPassword);
    await user.save();

    return { message: "Password updated successfully" };
  }

  async setVerified(userId, isVerified) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isVerified: Boolean(isVerified) },
      { new: true, runValidators: true },
    ).select("-passwordHash");

    if (!user) throw ApiError.notFound("User not found");
    return user;
  }
}

module.exports = new UserService();
