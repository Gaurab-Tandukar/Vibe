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
      minlength: 5,
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
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

// Remove these lines if they exist — we don't need them anymore
// userSchema.index({ username: 1 });
// userSchema.index({ email: 1 });

const User = mongoose.model("User", userSchema);

module.exports = User;
