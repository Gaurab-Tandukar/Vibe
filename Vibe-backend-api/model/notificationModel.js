const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },

    // References
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt & updatedAt
    collection: "notifications",
  },
);

// Indexes for better performance
notificationSchema.index({ user: 1, isRead: 1 }); // Get unread notifications
notificationSchema.index({ message: 1 }); // For message-related notifications
notificationSchema.index({ createdAt: -1 }); // Sort by newest

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
