const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema(
  {
    icon: { type: String, trim: true, maxlength: 100 }, // e.g. bootstrap-icons class
    label: { type: String, trim: true, maxlength: 50 },
  },
  { _id: false },
);

const connectionSchema = new mongoose.Schema(
  {
    platform: { type: String, trim: true, maxlength: 50 }, // e.g. "spotify", "github"
    name: { type: String, trim: true, maxlength: 100 }, // display name/handle
    url: { type: String, trim: true, maxlength: 500 },
    icon: { type: String, trim: true, maxlength: 100 },
  },
  { _id: false },
);

const activitySchema = new mongoose.Schema(
  {
    type: { type: String, trim: true, maxlength: 30 }, // e.g. "playing", "listening"
    label: { type: String, trim: true, maxlength: 100 }, // e.g. "Playing Valorant"
  },
  { _id: false },
);

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

    bannerUrl: {
      type: String,
      maxlength: 500,
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    aboutMe: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    badges: {
      type: [badgeSchema],
      default: [],
    },

    connections: {
      type: [connectionSchema],
      default: [],
    },

    tags: {
      type: [String],
      default: [],
    },

    activity: {
      type: activitySchema,
      default: null,
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
