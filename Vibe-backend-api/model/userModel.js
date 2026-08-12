const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
    },

    phoneNumber: {
      type: String,
      unique: true,
      trim: true,
      maxlength: 10,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    avatarUrl: {
      type: String,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: ["online", "offline", "away"],
      default: "offline",
    },

    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },

    isOnline: {
      type: Boolean,
      default: false,
    },

    socketId: {
      type: String,
      default: null,
    },

    lastSeen: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

const User = mongoose.model("User", userSchema);

module.exports = User;
